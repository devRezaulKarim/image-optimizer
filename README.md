# Image Optimizer for Windows

An automated, lightweight background image optimizer and converter for **Windows 10 & 11**.

Drop or paste any image into your Windows **Pictures\optimize** folder, and it instantly converts and compresses it in the background—with zero setup or external dependencies required.

---

## 🌟 Features

* **Universal Windows (10/11) Compatibility**: Works out of the box on any 64-bit Windows device. No need to install Node.js or any other software.
* **Smart Duplicate Protection**: If a converted image with the same name already exists, it automatically numbers the new file (e.g., `photo (1).webp`, `photo (2).webp`). **Your previous images are never overwritten.**
* **Automatic Folder Setup**: On installation, it creates:
  * `Pictures\optimize\webp` (Converts & compresses to `.webp`)
  * `Pictures\optimize\jpg` (Converts & MozJPEG compresses to `.jpg`)
  * `Pictures\optimize\png` (Palette optimizes & compresses to `.png`)
* **Runs Silently on Windows Startup**: Launches quietly in your system tray upon booting Windows.
* **System Tray Control**:
  * Double-click tray icon to open `Pictures\optimize` in File Explorer.
  * Right-click to toggle startup on/off or exit.

---

## 📥 Installation

1. Go to the [**Releases**](https://github.com/devRezaulKarim/image-optimizer/releases) page.
2. Download **`ImageOptimizer-Setup.exe`**.
3. Run the installer (takes 3 seconds, no admin rights required).
4. Start dropping images into your `Pictures\optimize` subfolders!

---

## 🛠️ How It Works

| Drop Folder | Target Format | Engine | Features |
| :--- | :--- | :--- | :--- |
| `Pictures\optimize\webp` | **WebP** | Sharp (libvips) | Quality `80`, effort level `4` (~70-85% size reduction) |
| `Pictures\optimize\jpg` | **JPG** | MozJPEG | Quality `82`, progressive scan (~80-90% size reduction) |
| `Pictures\optimize\png` | **PNG** | Libimagequant | Compression level `9`, palette quantization (~60-75% size reduction) |

---

## 💻 Local Development & Building

### Prerequisites
* Windows 10 / 11
* Node.js 18+
* [Inno Setup 6](https://jrsoftware.org/isinfo.php)

### Build the Installer
```powershell
npm install
.\build.ps1 -Version 1.0.0
```
The compiled installer will be generated in `dist\ImageOptimizer-Setup.exe`.

---

## 🚀 CI/CD & Automated Releases

A GitHub Actions workflow (`.github/workflows/build-and-release.yml`) automatically triggers on every push/merge to the `main` branch. It compiles the native Windows launcher, packages the standalone Inno Setup installer, and publishes a new downloadable GitHub Release.

---

## 📄 License

MIT License. Free for personal and commercial use.
