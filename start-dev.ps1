# PowerShell script to manage the QuizMaster backend in development mode
# Usage: .\start-dev.ps1

Write-Host "🚀 Managing QuizMaster backend (Development Mode)..." -ForegroundColor Cyan

# Try to stop any running Node.js processes
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "📋 Stopping existing Node.js processes..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force
        Write-Host "✅ Stopped Node.js processes successfully" -ForegroundColor Green
    } else {
        Write-Host "📋 No Node.js processes found running" -ForegroundColor Magenta
    }
} catch {
    Write-Host "⚠️ Error while stopping Node.js processes: $_" -ForegroundColor Red
}

# Start the server in development mode
Write-Host "🌐 Starting QuizMaster backend in development mode (with auto-reload)..." -ForegroundColor Cyan
try {
    # Run npm script for development
    npm run dev
} catch {
    Write-Host "❌ Failed to start development server: $_" -ForegroundColor Red
    
    # Provide troubleshooting help
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure nodemon is installed: npm install -g nodemon" -ForegroundColor Yellow
    Write-Host "2. Check if the 'dev' script is defined in package.json" -ForegroundColor Yellow
    Write-Host "3. Try running 'node backend/server.js' directly" -ForegroundColor Yellow
    
    exit 1
} 