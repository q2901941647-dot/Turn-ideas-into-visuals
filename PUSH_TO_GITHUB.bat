@echo off
cd /d "%~dp0"
setlocal

rem --- Allow the interactive GitHub sign-in window ---
set "GIT_TERMINAL_PROMPT=1"
set "GCM_INTERACTIVE=auto"

rem --- Locate the portable Git shipped with WorkBuddy ---
set "PG=D:\workbuddy\resources\vendor\PortableGit"
if not exist "%PG%\cmd\git.exe" set "PG=%LOCALAPPDATA%\Programs\Git"
if not exist "%PG%\cmd\git.exe" if exist "C:\Program Files\Git\cmd\git.exe" set "PG=C:\Program Files\Git"
set "PATH=%PG%\cmd;%PG%\mingw64\bin;%PG%\usr\bin;%PATH%"
set "GIT=%PG%\cmd\git.exe"

if not exist "%GIT%" goto NOGIT
"%GIT%" --version >nul 2>&1
if errorlevel 1 goto NOGIT

echo.
echo  ==================================================
echo   Upload this project to GitHub (one click)
echo  ==================================================
echo.
echo  Git found and ready.
echo.
echo  IMPORTANT: A browser window WILL open for GitHub sign-in.
echo  Click the green "Authorize" button, then come back here.
echo  (Only needed the first time; later uploads are automatic.)
echo.
echo  The repository URL below is already filled in.
echo  Just press Enter to use it, or paste a different URL.
echo.
set "REPO=https://github.com/q2901941647-dot/Turn-ideas-into-visuals.git"
set /p REPO="Repository URL: "
if "%REPO%"=="" (
  echo No URL entered. Nothing was uploaded.
  pause
  exit /b 1
)

"%GIT%" remote remove origin >nul 2>&1
"%GIT%" remote add origin %REPO%
echo.
echo Uploading... (70 MB of videos, this may take a few minutes)
echo.
"%GIT%" push -u origin main
if not errorlevel 1 goto SUCCESS

echo.
echo Normal push failed - the remote repository already has files
echo from your earlier web uploads. Replacing them with the full
echo project is the right move here.
echo.
set "OVER=Y"
set /p OVER="Overwrite the remote repository with this complete one? [Y/N]: "
if /I "%OVER%" NEQ "Y" goto CANCEL
"%GIT%" push -u origin main --force
if errorlevel 1 goto FAILED
goto SUCCESS

:NOGIT
echo.
echo  ERROR: Could not find git.exe.
echo  Expected at: D:\workbuddy\resources\vendor\PortableGit\cmd\git.exe
echo  Please install Git for Windows from https://git-scm.com/download/win
echo  then run this script again.
echo.
pause
exit /b 1

:FAILED
echo.
echo Upload still failed. Please send me the red error text above.
echo.
pause
exit /b 1

:CANCEL
echo Cancelled. Nothing changed on GitHub.
pause
exit /b 1

:SUCCESS
echo.
echo  UPLOAD COMPLETE.
echo.
echo  Last step: repo Settings -^> Pages -^> Source = GitHub Actions
echo  Your site will be at:
echo  https://q2901941647-dot.github.io/Turn-ideas-into-visuals/
echo.
pause
