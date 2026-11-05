# Build script for Image Optimizer
param (
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==> Building Image Optimizer v$Version..." -ForegroundColor Cyan

# 0. Ensure assets exist
$assetsDir = Join-Path $ScriptDir "assets"
$iconIco = Join-Path $assetsDir "icon.ico"
if (-not (Test-Path $iconIco)) {
    throw "assets\icon.ico not found at $iconIco"
}

# 1. Compile launcher with Windows native csc.exe and embed icon
Write-Host "==> Compiling native launcher with custom icon (ImageOptimizer.exe)..."
$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $cscPath)) {
    throw "C# compiler not found at $cscPath"
}

$launcherSrc = Join-Path $ScriptDir "launcher.cs"
$launcherExe = Join-Path $ScriptDir "ImageOptimizer.exe"
& $cscPath /target:winexe /optimize+ "/win32icon:$iconIco" /out:$launcherExe /reference:System.Windows.Forms.dll,System.Drawing.dll $launcherSrc
if ($LASTEXITCODE -ne 0) { throw "Launcher compilation failed." }

# 2. Ensure node.exe exists in project root for bundling
$targetNode = Join-Path $ScriptDir "node.exe"
if (-not (Test-Path $targetNode)) {
    Write-Host "==> Fetching node.exe..."
    $sysNode = (Get-Command node -ErrorAction SilentlyContinue)
    if ($sysNode) {
        Copy-Item $sysNode.Source $targetNode -Force
    } else {
        throw "node.exe not found on system to bundle."
    }
}

# 3. Compile Inno Setup Installer
Write-Host "==> Compiling installer with Inno Setup..."
$isccPaths = @(
    "iscc.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
)

$iscc = $null
foreach ($p in $isccPaths) {
    if (Get-Command $p -ErrorAction SilentlyContinue) {
        $iscc = $p
        break
    } elseif (Test-Path $p) {
        $iscc = $p
        break
    }
}

if (-not $iscc) {
    throw "Inno Setup Compiler (ISCC.exe) not found. Please install Inno Setup 6."
}

$issPath = Join-Path $ScriptDir "installer\setup.iss"
& $iscc "/DMyAppVersion=$Version" $issPath
if ($LASTEXITCODE -ne 0) { throw "Installer compilation failed." }

Write-Host "==> Build completed successfully! Output: dist\ImageOptimizer-Setup.exe" -ForegroundColor Green
