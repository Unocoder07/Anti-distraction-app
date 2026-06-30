@echo off
echo ============================================
echo   Fixing DevMenu Fragment Crash
echo ============================================
echo.

echo This error happens because of saved fragment state
echo from a previous build. We'll do a complete clean.
echo.

echo Step 1: Clearing all caches...
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul
rmdir /s /q android\.gradle 2>nul
echo Done!

echo.
echo Step 2: Cleaning Gradle...
cd android
call gradlew clean
cd ..
echo Done!

echo.
echo Step 3: Building fresh install...
echo This will take 3-5 minutes...
npx expo run:android --no-build-cache --device

echo.
echo ============================================
echo   If it still crashes, try:
echo   - Manually uninstall app from phone
echo   - Run this script again
echo   - Or use build-release.bat instead
echo ============================================
pause
