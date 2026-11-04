using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace ImageOptimizer
{
    static class Program
    {
        private static NotifyIcon trayIcon;
        private static Process nodeProcess;
        private static string appDir;
        private static string picturesDir;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            appDir = AppDomain.CurrentDomain.BaseDirectory;
            picturesDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), "optimize");

            // Ensure optimize directory and subfolders exist
            try
            {
                Directory.CreateDirectory(Path.Combine(picturesDir, "webp"));
                Directory.CreateDirectory(Path.Combine(picturesDir, "jpg"));
                Directory.CreateDirectory(Path.Combine(picturesDir, "png"));
            }
            catch { }

            // Start node background worker
            StartWorker();

            // Setup tray icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Image Optimizer (Active)";

            // Load custom icon if available
            try
            {
                string iconPath = Path.Combine(appDir, "assets", "icon.ico");
                if (File.Exists(iconPath))
                {
                    trayIcon.Icon = new Icon(iconPath);
                }
                else
                {
                    trayIcon.Icon = SystemIcons.Application;
                }
            }
            catch
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            trayIcon.Visible = true;

            var contextMenu = new ContextMenuStrip();
            var openItem = new ToolStripMenuItem("Open Pictures\\optimize", null, (s, e) => {
                if (Directory.Exists(picturesDir))
                    Process.Start("explorer.exe", picturesDir);
            });
            openItem.Font = new Font(openItem.Font, FontStyle.Bold);

            var startupItem = new ToolStripMenuItem("Start on Windows Boot", null, ToggleStartup);
            startupItem.Checked = IsStartupEnabled();

            var exitItem = new ToolStripMenuItem("Exit", null, (s, e) => {
                StopWorker();
                trayIcon.Visible = false;
                Application.Exit();
            });

            contextMenu.Items.Add(openItem);
            contextMenu.Items.Add(new ToolStripSeparator());
            contextMenu.Items.Add(startupItem);
            contextMenu.Items.Add(new ToolStripSeparator());
            contextMenu.Items.Add(exitItem);

            trayIcon.ContextMenuStrip = contextMenu;
            trayIcon.DoubleClick += (s, e) => {
                if (Directory.Exists(picturesDir))
                    Process.Start("explorer.exe", picturesDir);
            };

            Application.ApplicationExit += (s, e) => StopWorker();
            Application.Run();
        }

        private static void StartWorker()
        {
            try
            {
                string nodeExe = Path.Combine(appDir, "node.exe");
                if (!File.Exists(nodeExe))
                {
                    nodeExe = "node";
                }

                string scriptPath = Path.Combine(appDir, "src", "index.js");

                var psi = new ProcessStartInfo
                {
                    FileName = nodeExe,
                    Arguments = "\"" + scriptPath + "\"",
                    WorkingDirectory = appDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                nodeProcess = Process.Start(psi);
            }
            catch { }
        }

        private static void StopWorker()
        {
            try
            {
                if (nodeProcess != null && !nodeProcess.HasExited)
                {
                    nodeProcess.Kill();
                }
            }
            catch { }
        }

        private static bool IsStartupEnabled()
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", false))
                {
                    return key != null && key.GetValue("ImageOptimizer") != null;
                }
            }
            catch { return false; }
        }

        private static void ToggleStartup(object sender, EventArgs e)
        {
            var item = sender as ToolStripMenuItem;
            if (item == null) return;

            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (key != null)
                    {
                        if (item.Checked)
                        {
                            key.DeleteValue("ImageOptimizer", false);
                            item.Checked = false;
                        }
                        else
                        {
                            string exePath = Application.ExecutablePath;
                            key.SetValue("ImageOptimizer", "\"" + exePath + "\"");
                            item.Checked = true;
                        }
                    }
                }
            }
            catch { }
        }
    }
}
