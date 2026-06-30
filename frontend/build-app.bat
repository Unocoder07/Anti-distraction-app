@echo off
echo ============================================
echo   Building Sankalai App with App Blocking
echo ============================================
echo.

echo Step 1: Clearing Metro cache...
npx expo start --clear --no-dev --minify & timeout /t 5 /nobreak >nul & taskkill /F /IM node.exe >nul 2>&1

echo.
echo Step 2: Cleaning Android build...
cd android
call gradlew clean
cd ..

echo.
echo Step 3: Building Android app...
echo This will take 3-5 minutes...
npx expo run:android

echo.
echo ============================================
echo   Build Complete!
echo ============================================
pause
