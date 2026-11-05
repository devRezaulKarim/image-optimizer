const fs = require("fs");
const os = require("os");
const path = require("path");
const chokidar = require("chokidar");
const sharp = require("sharp");

// Crucial for Windows: Disable Sharp internal file caching so it NEVER locks files on disk
sharp.cache(false);

// Target directory in Windows Pictures folder
const IMAGES_DIR =
  process.env.IMAGE_OPTIMIZER_DIR ||
  path.join(os.homedir(), "Pictures", "optimize");

// Target formats and compression settings
const TARGET_CONFIGS = {
  webp: {
    ext: ".webp",
    format: "webp",
    options: { quality: 80, effort: 4 },
  },
  jpg: {
    ext: ".jpg",
    format: "jpeg",
    options: { quality: 82, mozjpeg: true },
  },
  jpeg: {
    ext: ".jpg",
    format: "jpeg",
    options: { quality: 82, mozjpeg: true },
  },
  png: {
    ext: ".png",
    format: "png",
    options: { compressionLevel: 9, palette: true, quality: 85 },
  },
};

const SUPPORTED_INPUT_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif",
  ".avif",
  ".gif",
]);

const inProgress = new Set();
const processedSignatures = new Map();

function ensureDirectories() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  for (const folder of ["webp", "jpg", "png"]) {
    const dir = path.join(IMAGES_DIR, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function getFileSignature(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return `${stats.size}-${stats.mtimeMs}`;
  } catch {
    return null;
  }
}

// Find a unique filename if the target already exists (e.g., photo (1).webp, photo (2).webp)
function getNonConflictingPath(dir, baseName, ext) {
  let candidate = path.join(dir, `${baseName}${ext}`);
  if (!fs.existsSync(candidate)) {
    return candidate;
  }

  let index = 1;
  while (fs.existsSync(path.join(dir, `${baseName} (${index})${ext}`))) {
    index++;
  }
  return path.join(dir, `${baseName} (${index})${ext}`);
}

// Read file into memory buffer with retries to ensure Windows file handles are immediately closed
async function readFileWithRetry(filePath, maxRetries = 8, delayMs = 150) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fs.readFileSync(filePath);
    } catch (err) {
      if (
        (err.code === "EBUSY" ||
          err.code === "EPERM" ||
          err.code === "ENOENT") &&
        i < maxRetries - 1
      ) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Delete file with retries to overcome Windows antivirus / search indexer locks
async function unlinkWithRetry(filePath, maxRetries = 8, delayMs = 150) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    } catch (err) {
      if (
        (err.code === "EBUSY" || err.code === "EPERM") &&
        i < maxRetries - 1
      ) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function processImage(filePath) {
  const normalizedPath = path.resolve(filePath);
  const parsed = path.parse(normalizedPath);
  const ext = parsed.ext.toLowerCase();

  // Ignore non-images, temp files, or hidden files
  if (
    parsed.name.startsWith(".") ||
    parsed.name.startsWith("~") ||
    parsed.name.startsWith("temp_") ||
    parsed.name.includes(".tmp") ||
    !SUPPORTED_INPUT_EXTS.has(ext)
  ) {
    return;
  }

  // Determine target format by direct parent folder
  const parentFolder = path.basename(parsed.dir).toLowerCase();
  const config = TARGET_CONFIGS[parentFolder];
  if (!config) {
    return;
  }

  if (inProgress.has(normalizedPath)) {
    return;
  }

  const currentSignature = getFileSignature(normalizedPath);
  if (!currentSignature) {
    return;
  }

  if (processedSignatures.get(normalizedPath) === currentSignature) {
    return;
  }

  inProgress.add(normalizedPath);

  try {
    const isSameFormat = ext === config.ext.toLowerCase();
    let targetPath;

    if (isSameFormat) {
      // In-place compression
      targetPath = normalizedPath;
    } else {
      // Format conversion: prevent overwriting existing files with the same name
      targetPath = getNonConflictingPath(parsed.dir, parsed.name, config.ext);
    }

    const tempPath = path.join(
      parsed.dir,
      `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${parsed.name}${config.ext}`,
    );
    inProgress.add(tempPath);
    inProgress.add(targetPath);

    // Read into in-memory buffer so Windows never locks the physical file
    const fileBuffer = await readFileWithRetry(normalizedPath);
    const transform = sharp(fileBuffer);

    if (config.format === "webp") {
      transform.webp(config.options);
    } else if (config.format === "jpeg") {
      transform.jpeg(config.options);
    } else if (config.format === "png") {
      transform.png(config.options);
    }

    await transform.toFile(tempPath);

    // If format changed, remove the original source file (e.g. .png dropped into jpg folder)
    if (!isSameFormat) {
      await unlinkWithRetry(normalizedPath);
    }

    // Replace target path atomically with the newly compressed file
    if (fs.existsSync(targetPath)) {
      await unlinkWithRetry(targetPath);
    }
    fs.renameSync(tempPath, targetPath);

    const newSig = getFileSignature(targetPath);
    if (newSig) {
      processedSignatures.set(targetPath, newSig);
    }

    setTimeout(() => {
      inProgress.delete(targetPath);
      inProgress.delete(tempPath);
    }, 2000);
  } catch {
    // Process error gracefully without throwing
  } finally {
    inProgress.delete(normalizedPath);
  }
}

function startWatcher() {
  ensureDirectories();

  const watcher = chokidar.watch(IMAGES_DIR, {
    ignored: /(^|[\/\\])\..|temp_/,
    persistent: true,
    ignoreInitial: false,
    depth: 2,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 200,
    },
  });

  watcher
    .on("add", (filePath) => processImage(filePath))
    .on("change", (filePath) => processImage(filePath));

  return watcher;
}

if (require.main === module) {
  startWatcher();
}

module.exports = { startWatcher, processImage, ensureDirectories, IMAGES_DIR };
