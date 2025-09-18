@echo off
REM Educational Platform Backup System - Windows Batch Script
REM Usage: backup.bat [command]
REM Commands: setup, full, database, files, r2, env, restore

echo ================================
echo Educational Platform Backup
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ and try again
    pause
    exit /b 1
)

REM Check if in correct directory
if not exist "package.json" (
    echo ERROR: Please run this script from the backup directory
    echo Current directory: %cd%
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Handle commands
if "%1"=="" goto :show_menu
if "%1"=="setup" goto :run_setup
if "%1"=="full" goto :run_full_backup
if "%1"=="database" goto :run_database_backup
if "%1"=="files" goto :run_files_backup
if "%1"=="r2" goto :run_r2_backup
if "%1"=="env" goto :run_env_backup
if "%1"=="restore" goto :run_restore
if "%1"=="help" goto :show_help

echo Unknown command: %1
goto :show_help

:show_menu
echo Select an option:
echo 1. Setup and test system
echo 2. Full backup (recommended)
echo 3. Database backup only
echo 4. Files backup only
echo 5. R2 storage backup only
echo 6. Environment backup only
echo 7. Restore from backup
echo 8. Show help
echo 0. Exit
echo.
set /p choice="Enter your choice (0-8): "

if "%choice%"=="1" goto :run_setup
if "%choice%"=="2" goto :run_full_backup
if "%choice%"=="3" goto :run_database_backup
if "%choice%"=="4" goto :run_files_backup
if "%choice%"=="5" goto :run_r2_backup
if "%choice%"=="6" goto :run_env_backup
if "%choice%"=="7" goto :run_restore
if "%choice%"=="8" goto :show_help
if "%choice%"=="0" goto :end

echo Invalid choice. Please try again.
pause
goto :show_menu

:run_setup
echo Running setup...
npm run setup
pause
goto :end

:run_full_backup
echo Running full backup...
npm run backup:full
pause
goto :end

:run_database_backup
echo Running database backup...
npm run backup:database
pause
goto :end

:run_files_backup
echo Running files backup...
npm run backup:files
pause
goto :end

:run_r2_backup
echo Running R2 storage backup...
npm run backup:r2
pause
goto :end

:run_env_backup
echo Running environment backup...
npm run backup:env
pause
goto :end

:run_restore
echo Starting restore process...
npm run restore
pause
goto :end

:show_help
echo.
echo Educational Platform Backup System
echo.
echo Usage: backup.bat [command]
echo.
echo Commands:
echo   setup     - Setup and test the backup system
echo   full      - Complete system backup (recommended)
echo   database  - Database backup only
echo   files     - Files backup only
echo   r2        - R2 storage backup only
echo   env       - Environment backup only
echo   restore   - Interactive restore process
echo   help      - Show this help message
echo.
echo Examples:
echo   backup.bat setup
echo   backup.bat full
echo   backup.bat restore
echo.
echo For detailed documentation, see README.md
echo.
pause
goto :end

:end
echo.
echo Backup script finished.
