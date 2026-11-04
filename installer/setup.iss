#ifndef MyAppVersion
#define MyAppVersion "1.0.0"
#endif

#define MyAppName "Image Optimizer"
#define MyAppPublisher "devRezaulKarim"
#define MyAppURL "https://github.com/devRezaulKarim/image-optimizer"
#define MyAppExeName "ImageOptimizer.exe"

[Setup]
AppId={{E581335A-C434-4541-A893-9DF71783B091}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\Programs\ImageOptimizer
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=ImageOptimizer-Setup
SetupIconFile=..\assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern

VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=Image Optimizer Setup
VersionInfoProductName=Image Optimizer
VersionInfoCopyright=Copyright (C) 2026 devRezaulKarim

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Dirs]
Name: "{%USERPROFILE}\Pictures\optimize"
Name: "{%USERPROFILE}\Pictures\optimize\webp"
Name: "{%USERPROFILE}\Pictures\optimize\jpg"
Name: "{%USERPROFILE}\Pictures\optimize\png"

[Files]
Source: "..\ImageOptimizer.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\node.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\src\*"; DestDir: "{app}\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\icon.ico"
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\icon.ico"

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ImageOptimizer"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
