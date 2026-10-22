@echo off
rem ------------------------------------------------------------------
rem  Fallback entry, used only when the launcher exe is missing.
rem  The exe (bridge-observatory launcher) already does everything:
rem  static server, LAN access, firewall rule and the address window.
rem
rem  This script needs Node.js 18+ and opens to the LAN too, so a phone
rem  on the same Wi-Fi can connect. Run "node server.js" for loopback-only.
rem
rem  ASCII-only on purpose: cmd reads .bat in the OEM codepage, so any
rem  Chinese text here would be mangled and silently break the script.
rem ------------------------------------------------------------------
setlocal
cd /d "%~dp0"

set "LAUNCHER="
for %%f in ("%~dp0*.exe") do if not defined LAUNCHER set "LAUNCHER=%%~ff"

if defined LAUNCHER (
  echo   Starting launcher ...
  "%LAUNCHER%"
  goto :done
)

echo.
echo   Launcher not found; using Node.js in LAN mode.
echo   The addresses to type on the phone are printed below.
echo.
node server.js --lan

:done
pause >nul
endlocal
