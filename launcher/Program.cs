using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace QiaojianLauncher
{
    /// <summary>
    /// 桥见柳州 · 启动器（一个程序干完全部事情）。
    ///
    ///   1. 内置静态服务，不需要 Node.js；
    ///   2. **默认对局域网开放**（绑定 0.0.0.0），手机连同一 Wi-Fi 就能打开；
    ///   3. 自动确保 Windows 防火墙放行（缺规则时申请一次管理员权限，之后不再打扰）；
    ///   4. 用一个可复制地址的小窗口告诉使用者：手机上该输入什么。
    ///
    /// 参数：
    ///   --local             只允许本机访问（不开放局域网、不改防火墙）
    ///   --port=4173         指定起始端口（默认从 4173 起找空位）
    ///   --no-launch         只起服务、不开浏览器（自动化验收用）
    ///   --add-firewall-only 只加防火墙规则然后退出（内部用于提权重启）
    /// </summary>
    internal static class Program
    {
        private const string RuleNameExe = "Bridge Observatory (exe)";
        private const string RuleNamePort = "Bridge Observatory (port)";

        private static string _root;
        private static readonly Dictionary<string, string> MimeMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { ".html", "text/html; charset=utf-8" },
            { ".htm", "text/html; charset=utf-8" },
            { ".js", "text/javascript; charset=utf-8" },
            { ".mjs", "text/javascript; charset=utf-8" },
            { ".css", "text/css; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".svg", "image/svg+xml" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".gif", "image/gif" },
            { ".webp", "image/webp" },
            { ".ico", "image/x-icon" },
            { ".woff", "font/woff" },
            { ".woff2", "font/woff2" },
            { ".ttf", "font/ttf" },
            { ".wav", "audio/wav" },
            { ".mp3", "audio/mpeg" },
            { ".mp4", "video/mp4" },
            { ".txt", "text/plain; charset=utf-8" },
            { ".md", "text/plain; charset=utf-8" },
            { ".webmanifest", "application/manifest+json" }
        };

        [STAThread]
        private static int Main(string[] args)
        {
            _root = Path.GetFullPath(AppDomain.CurrentDomain.BaseDirectory);

            var noLaunch = Array.IndexOf(args, "--no-launch") >= 0;
            var localOnly = Array.IndexOf(args, "--local") >= 0;
            var addFirewallOnly = Array.IndexOf(args, "--add-firewall-only") >= 0;
            var skipFirewall = Array.IndexOf(args, "--no-firewall") >= 0;

            if (addFirewallOnly)
            {
                return AddFirewallRules() ? 0 : 1;
            }

            var startPort = 4173;
            foreach (var arg in args)
            {
                if (arg.StartsWith("--port=", StringComparison.Ordinal))
                {
                    int parsed;
                    if (int.TryParse(arg.Substring("--port=".Length), out parsed)) startPort = parsed;
                }
            }

            // 先确保防火墙放行：只有在缺规则时才申请一次管理员权限，之后每次启动都跳过
            var firewallOk = localOnly || skipFirewall || EnsureFirewall();

            TcpListener listener = null;
            var port = startPort;
            for (var attempt = 0; attempt < 40; attempt++)
            {
                try
                {
                    var candidate = new TcpListener(localOnly ? IPAddress.Loopback : IPAddress.Any, port);
                    candidate.Start(64);
                    listener = candidate;
                    break;
                }
                catch (SocketException)
                {
                    port++;
                }
            }

            if (listener == null)
            {
                Fail("没有可用端口（4173–4212 都被占用）。请关闭占用端口的程序后重试。");
                return 2;
            }

            var localUrl = "http://127.0.0.1:" + port + "/";
            var lanUrls = localOnly ? new List<string>() : LanUrls(port);

            ThreadPool.QueueUserWorkItem(_ => AcceptLoop(listener));

            if (noLaunch)
            {
                Console.WriteLine(localUrl);
                foreach (var item in lanUrls) Console.WriteLine(item);
                Console.Out.Flush();
                Thread.Sleep(Timeout.Infinite);
                return 0;
            }

            if (!localOnly)
            {
                var uiThread = new Thread(() => ShowAccessWindow(lanUrls, firewallOk));
                uiThread.SetApartmentState(ApartmentState.STA);
                uiThread.IsBackground = true;
                uiThread.Start();
            }

            var browser = FindBrowser();
            if (browser == null)
            {
                Fail("没有找到 Microsoft Edge 或 Google Chrome。\n请安装其一后重试，或手动打开：\n" + localUrl);
                listener.Stop();
                return 3;
            }

            var profile = Path.Combine(Path.GetTempPath(), "qiaojian-liuzhou-app");
            var arguments = "\"--app=" + localUrl + "\" --window-size=1440,900 --window-position=40,40 --user-data-dir=\"" + profile + "\" --no-first-run --no-default-browser-check";

            var process = Process.Start(new ProcessStartInfo
            {
                FileName = browser,
                Arguments = arguments,
                UseShellExecute = false,
                WorkingDirectory = _root
            });

            if (process == null)
            {
                Fail("无法启动浏览器窗口。\n请手动打开：" + localUrl);
                listener.Stop();
                return 4;
            }

            process.WaitForExit();
            listener.Stop();
            return 0;
        }

        /* ---------------- 防火墙 ---------------- */

        private static bool IsAdmin()
        {
            try
            {
                return new WindowsPrincipal(WindowsIdentity.GetCurrent()).IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>规则是否已存在：看 netsh show rule 的退出码（0=有，1=没有），不解析本地化文案。</summary>
        private static bool RuleExists()
        {
            return Netsh("advfirewall firewall show rule name=\"" + RuleNameExe + "\"").Ok
                && Netsh("advfirewall firewall show rule name=\"" + RuleNamePort + "\"").Ok;
        }

        /// <summary>
        /// 确保防火墙放行。缺规则时：已是管理员就直接加；否则以管理员身份重启自己
        /// （--add-firewall-only），等它加完再继续。用户拒绝授权时返回 false，
        /// 服务照常运行（本机仍可访问），界面会给出提示。
        /// </summary>
        private static bool EnsureFirewall()
        {
            if (RuleExists()) return true;
            if (IsAdmin()) return AddFirewallRules();

            try
            {
                var elevate = Process.Start(new ProcessStartInfo
                {
                    FileName = Application.ExecutablePath,
                    Arguments = "--add-firewall-only",
                    Verb = "runas",
                    UseShellExecute = true
                });
                if (elevate == null) return false;
                elevate.WaitForExit();
                return RuleExists();
            }
            catch
            {
                // 用户点了「否」，或系统禁止提权
                return false;
            }
        }

        private static bool AddFirewallRules()
        {
            var exePath = Application.ExecutablePath;
            Netsh("advfirewall firewall delete rule name=\"" + RuleNameExe + "\"");
            Netsh("advfirewall firewall delete rule name=\"" + RuleNamePort + "\"");
            var okExe = Netsh("advfirewall firewall add rule name=\"" + RuleNameExe + "\" dir=in action=allow program=\"" + exePath + "\" enable=yes profile=any").Ok;
            var okPort = Netsh("advfirewall firewall add rule name=\"" + RuleNamePort + "\" dir=in action=allow protocol=TCP localport=4173-4212 profile=any").Ok;

            // node.js 也顺手放行（用 node server.js --lan 时手机同样能连）
            var node = FindNode();
            if (!string.IsNullOrEmpty(node))
            {
                Netsh("advfirewall firewall delete rule name=\"Bridge Observatory (node)\"");
                Netsh("advfirewall firewall add rule name=\"Bridge Observatory (node)\" dir=in action=allow program=\"" + node + "\" enable=yes profile=any");
            }

            return okExe && okPort;
        }

        private static string FindNode()
        {
            var path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
            foreach (var folder in path.Split(';'))
            {
                if (string.IsNullOrWhiteSpace(folder)) continue;
                try
                {
                    var candidate = Path.Combine(folder.Trim(), "node.exe");
                    if (File.Exists(candidate)) return candidate;
                }
                catch
                {
                    // 忽略非法路径
                }
            }
            return null;
        }

        private struct NetshResult
        {
            public bool Ok;
            public string Output;
        }

        private static NetshResult Netsh(string arguments)
        {
            var result = new NetshResult { Ok = false, Output = string.Empty };
            try
            {
                var info = new ProcessStartInfo("netsh", arguments)
                {
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
                using (var process = Process.Start(info))
                {
                    if (process == null) return result;
                    var output = process.StandardOutput.ReadToEnd() + process.StandardError.ReadToEnd();
                    if (!process.WaitForExit(10000))
                    {
                        try
                        {
                            process.Kill();
                        }
                        catch
                        {
                            // 进程可能已经退出
                        }
                        return result;
                    }
                    result.Ok = process.ExitCode == 0;
                    result.Output = output ?? string.Empty;
                    return result;
                }
            }
            catch
            {
                return result;
            }
        }

        /* ---------------- 手机地址窗口 ---------------- */

        private static void ShowAccessWindow(List<string> lanUrls, bool firewallOk)
        {
            try
            {
                var form = new Form
                {
                    Text = "桥见柳州 · 手机访问",
                    ClientSize = new Size(560, 300),
                    StartPosition = FormStartPosition.CenterScreen,
                    TopMost = true,
                    MaximizeBox = false,
                    MinimizeBox = true,
                    FormBorderStyle = FormBorderStyle.FixedDialog,
                    Font = new Font("Microsoft YaHei UI", 9F)
                };

                var title = new Label
                {
                    Text = "手机浏览器打开下面任一地址（需与电脑连同一个 Wi-Fi）",
                    Dock = DockStyle.Top,
                    Height = 42,
                    TextAlign = ContentAlignment.MiddleLeft,
                    Padding = new Padding(14, 0, 0, 0),
                    Font = new Font("Microsoft YaHei UI", 11F, FontStyle.Bold)
                };

                var addressBox = new TextBox
                {
                    Multiline = true,
                    ReadOnly = true,
                    ScrollBars = ScrollBars.Vertical,
                    Dock = DockStyle.Fill,
                    Font = new Font("Consolas", 13F),
                    BackColor = Color.White,
                    Text = lanUrls.Count > 0
                        ? string.Join(Environment.NewLine, lanUrls)
                        : "未找到局域网地址：请先确认电脑已连接 Wi-Fi 或网线。"
                };

                var hint = new Label
                {
                    Text = firewallOk
                        ? "防火墙已放行；演示结束关闭窗口即停止服务。"
                        : "注意：防火墙未放行（管理员授权被取消），手机可能连不上。重新打开本程序并在弹窗里选择“是”即可。",
                    Dock = DockStyle.Bottom,
                    Height = 46,
                    TextAlign = ContentAlignment.MiddleLeft,
                    Padding = new Padding(14, 0, 0, 0),
                    ForeColor = firewallOk ? Color.DimGray : Color.Firebrick
                };

                var buttons = new FlowLayoutPanel
                {
                    Dock = DockStyle.Bottom,
                    FlowDirection = FlowDirection.RightToLeft,
                    Height = 50,
                    Padding = new Padding(10, 8, 10, 8)
                };

                var close = new Button { Text = "关闭提示", AutoSize = true, MinimumSize = new Size(96, 32) };
                close.Click += (sender, eventArgs) => form.Close();

                var copy = new Button { Text = "复制地址", AutoSize = true, MinimumSize = new Size(96, 32) };
                copy.Click += (sender, eventArgs) =>
                {
                    if (lanUrls.Count == 0) return;
                    try
                    {
                        Clipboard.SetText(lanUrls[0]);
                        copy.Text = "已复制";
                    }
                    catch
                    {
                        // 剪贴板偶尔会被别的程序占用
                    }
                };

                buttons.Controls.Add(close);
                buttons.Controls.Add(copy);

                form.Controls.Add(addressBox);
                form.Controls.Add(title);
                form.Controls.Add(buttons);
                form.Controls.Add(hint);

                Application.Run(form);
            }
            catch
            {
                // 无桌面环境时窗口开不出来，但不该影响服务
            }
        }

        /* ---------------- 站点服务 ---------------- */

        private static List<string> LanUrls(int port)
        {
            var urls = new List<string>();
            try
            {
                foreach (var address in Dns.GetHostAddresses(Dns.GetHostName()))
                {
                    if (address.AddressFamily != AddressFamily.InterNetwork) continue;
                    var text = address.ToString();
                    if (text.StartsWith("127.") || text.StartsWith("169.254.")) continue;
                    // 198.18/19 是 Clash 之类 TUN 的假地址，手机连不上
                    if (text.StartsWith("198.18.") || text.StartsWith("198.19.")) continue;
                    urls.Add("http://" + text + ":" + port + "/");
                }
            }
            catch
            {
                // 枚举失败就当没有局域网地址
            }
            return urls;
        }

        private static void Fail(string message)
        {
            try
            {
                MessageBox.Show(message, "桥见柳州", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch
            {
                Console.Error.WriteLine(message);
            }
        }

        private static string FindBrowser()
        {
            var candidates = new List<string>
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };
            foreach (var candidate in candidates)
            {
                try
                {
                    if (File.Exists(candidate)) return candidate;
                }
                catch
                {
                    // 路径不可访问就跳过
                }
            }
            return null;
        }

        private static void AcceptLoop(TcpListener listener)
        {
            while (true)
            {
                TcpClient client;
                try
                {
                    client = listener.AcceptTcpClient();
                }
                catch
                {
                    return;
                }
                ThreadPool.QueueUserWorkItem(state => Serve((TcpClient)state), client);
            }
        }

        private static void Serve(TcpClient client)
        {
            try
            {
                using (client)
                using (var stream = client.GetStream())
                {
                    client.ReceiveTimeout = 8000;
                    var buffer = new byte[8192];
                    var read = stream.Read(buffer, 0, buffer.Length);
                    if (read <= 0) return;

                    var requestLine = Encoding.ASCII.GetString(buffer, 0, read).Split('\n')[0].Trim();
                    var parts = requestLine.Split(' ');
                    if (parts.Length < 2 || parts[0] != "GET")
                    {
                        Write(stream, 405, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Method Not Allowed"));
                        return;
                    }

                    var target = parts[1];
                    var queryIndex = target.IndexOf('?');
                    if (queryIndex >= 0) target = target.Substring(0, queryIndex);
                    target = Uri.UnescapeDataString(target);
                    if (target.EndsWith("/")) target += "index.html";

                    var relative = target.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                    var full = Path.GetFullPath(Path.Combine(_root, relative));

                    if (!full.StartsWith(_root, StringComparison.OrdinalIgnoreCase))
                    {
                        Write(stream, 403, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Forbidden"));
                        return;
                    }

                    if (!File.Exists(full))
                    {
                        Write(stream, 404, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Not Found: " + target));
                        return;
                    }

                    var extension = Path.GetExtension(full);
                    string mime;
                    if (!MimeMap.TryGetValue(extension, out mime)) mime = "application/octet-stream";
                    var bytes = File.ReadAllBytes(full);
                    Write(stream, 200, mime, bytes);
                }
            }
            catch
            {
                // 单个连接出错不影响服务
            }
        }

        private static void Write(NetworkStream stream, int status, string contentType, byte[] body)
        {
            var reason = status == 200 ? "OK" : status == 403 ? "Forbidden" : status == 404 ? "Not Found" : status == 405 ? "Method Not Allowed" : "Internal Server Error";
            var header = new StringBuilder();
            header.Append("HTTP/1.1 ").Append(status).Append(' ').Append(reason).Append("\r\n");
            header.Append("Content-Type: ").Append(contentType).Append("\r\n");
            header.Append("Content-Length: ").Append(body.Length).Append("\r\n");
            header.Append("Cache-Control: no-store, must-revalidate\r\n");
            header.Append("Connection: close\r\n");
            header.Append("\r\n");
            var headerBytes = Encoding.ASCII.GetBytes(header.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            stream.Write(body, 0, body.Length);
            stream.Flush();
        }
    }
}
