# PowerShell script to manage the QuizMaster backend
# Usage: .\start-backend.ps1

Write-Host "🚀 Managing QuizMaster backend..." -ForegroundColor Cyan

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

# Start the server
Write-Host "🌐 Starting QuizMaster backend server..." -ForegroundColor Cyan
try {
    # Start the server
    node backend/server.js
} catch {
    Write-Host "❌ Failed to start server: $_" -ForegroundColor Red
    exit 1
} 