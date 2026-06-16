@echo off
echo ====================================================
echo      GITHUB PAGES AUTOMATIC DEPLOYMENT SCRIPT
echo ====================================================
echo.

:: Stage all changed and new files
echo [1/3] Adding changes to Git staging...
git add .

:: Ask user for a commit message
set /p commit_msg="[2/3] Enter commit message (or press Enter for 'Update portfolio'): "
if "%commit_msg%"=="" set commit_msg=Update portfolio

:: Commit changes
git commit -m "%commit_msg%"

:: Push changes to GitHub
echo [3/3] Pushing updates to GitHub (origin/main)...
git push origin main

echo.
echo ====================================================
echo SUCCESS: Your changes have been pushed to GitHub!
echo GitHub Pages will redeploy your site in a few seconds.
echo ====================================================
echo.
pause
