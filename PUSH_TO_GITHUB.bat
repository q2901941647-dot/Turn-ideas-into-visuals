@echo off
cd /d "%~dp0"
echo.
echo  ==================================================
echo   Upload this project to GitHub (one click)
echo  ==================================================
echo.
echo  STEP 1  Go to github.com and create a NEW repository.
echo          Do NOT tick "Add a README" / ".gitignore" / "license".
echo  STEP 2  Copy the repository URL shown on the next page.
echo          It looks like: https://github.com/NAME/REPO.git
echo  STEP 3  Paste it below and press Enter.
echo.
set /p REPO="Repository URL: "
if "%REPO%"=="" (
  echo No URL entered. Nothing was uploaded.
  pause
  exit /b 1
)
git remote remove origin >nul 2>&1
git remote add origin %REPO%
echo.
echo Uploading... If a browser window opens, sign in to GitHub.
echo (This can take a few minutes for the 70 MB of videos.)
echo.
git push -u origin main
if not errorlevel 1 goto SUCCESS
echo.
echo Normal push failed - the remote repository may already contain files.
set /p OVER="Overwrite the remote repository with this complete one? [Y/N]: "
if /I "%OVER%" NEQ "Y" goto CANCEL
git push -u origin main --force
if errorlevel 1 goto FAILED
goto SUCCESS
:FAILED
echo.
echo Upload still failed. Please send me the error text above.
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
echo  After the Action finishes, your site is live at:
echo  https://YOUR-NAME.github.io/YOUR-REPO/
echo.
pause
