@echo off
echo Cleaning and rebuilding app...
echo.

echo Step 1: Uninstalling app from device...
npx react-native uninstall-android

echo.
echo Step 2: Cleaning build folders...
cd android
call gradlew clean
cd ..

echo.
echo Step 3: Clearing caches...
rmdir /s /q .expo 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\.gradle 2>nul

echo.
echo Step 4: Rebuilding app...
npx expo run:android --no-build-cache

pause
