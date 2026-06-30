@echo off
echo ============================================
echo   Building Sankalai in RELEASE MODE
echo   (This avoids dev menu issues)
echo ============================================
echo.

echo Cleaning previous builds...
cd android
call gradlew clean
cd ..

echo.
echo Building release APK...
echo This will take 5-7 minutes...
cd android
call gradlew assembleRelease
cd ..

echo.
echo Installing release APK...
cd android\app\build\outputs\apk\release
adb install -r app-release.apk
cd ..\..\..\..\..\..

echo.
echo ============================================
echo   Release Build Complete!
echo ============================================
echo.
echo The app is installed without dev menu.
echo If you see permission errors, manually install:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
pause
