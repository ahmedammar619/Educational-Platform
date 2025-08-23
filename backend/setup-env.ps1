# ========================================
# Environment Setup Script for Windows
# ========================================

Write-Host "🚀 Setting up Educational Platform Backend Environment..." -ForegroundColor Green

# Check if .env file already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists. Backing up to .env.backup" -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup"
}

# Copy the template to .env
if (Test-Path "env.local") {
    Copy-Item "env.local" ".env"
    Write-Host "✅ Environment file created successfully!" -ForegroundColor Green
    Write-Host "📝 Please review .env file and update values as needed" -ForegroundColor Cyan
} else {
    Write-Host "❌ env.local template not found!" -ForegroundColor Red
    Write-Host "Please create env.local first or manually create .env file" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review and update .env file with your database credentials" -ForegroundColor White
Write-Host "2. Ensure PostgreSQL is running" -ForegroundColor White
Write-Host "3. Create database: education_dev_db" -ForegroundColor White
Write-Host "4. Run: npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 See ENVIRONMENT_SETUP.md for detailed configuration guide" -ForegroundColor Cyan
