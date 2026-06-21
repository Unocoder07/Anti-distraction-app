@echo off
echo ========================================
echo    Sankalai Backend Status Check
echo ========================================
echo.

echo [1] Checking if backend is running on port 8083...
netstat -ano | findstr :8083
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is running on port 8083
) else (
    echo ❌ Backend is NOT running on port 8083
    echo.
    echo To start backend, run: mvn spring-boot:run
    pause
    exit /b 1
)

echo.
echo [2] Testing API endpoint...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8083/api/

echo.
echo [3] Backend Details:
curl -s http://localhost:8083/api/actuator/info 2>nul || echo No actuator endpoint available

echo.
echo ========================================
echo    Status Check Complete
echo ========================================
echo.
pause
