@echo off
echo ========================================
echo   Sankalai Backend - Spring Boot
echo ========================================
echo.

echo Checking Java installation...
java -version
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)

echo.
echo Checking Maven installation...
mvn -version
if errorlevel 1 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven 3.6 or higher
    pause
    exit /b 1
)

echo.
echo Building application...
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Starting Spring Boot application...
echo Server will start on http://localhost:8080/api
echo Press Ctrl+C to stop
echo.
call mvn spring-boot:run
