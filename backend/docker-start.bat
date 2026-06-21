@echo off
echo ========================================
echo    Starting Sankalai Backend with Docker
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/3] Stopping any existing containers...
docker-compose down

echo.
echo [2/3] Building Docker images...
docker-compose build

echo.
echo [3/3] Starting services...
docker-compose up -d

echo.
echo ========================================
echo    Services Started Successfully!
echo ========================================
echo.
echo PostgreSQL: localhost:5432
echo Backend API: http://localhost:8083
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.

REM Wait for services to be healthy
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo Done! Press any key to view logs (Ctrl+C to exit)...
pause >nul

docker-compose logs -f
