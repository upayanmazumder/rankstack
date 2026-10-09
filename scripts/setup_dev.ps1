[CmdletBinding()]
param(
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if ($null -eq $pythonCommand) {
    throw "Python is required and must be available as 'python' on PATH."
}
if ($null -eq (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "pnpm is required and must be available on PATH."
}

$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Host "Creating the Python virtual environment..."
    & $pythonCommand.Source -m venv (Join-Path $repoRoot ".venv")
    if ($LASTEXITCODE -ne 0) {
        throw "Python virtual-environment creation failed."
    }
}

Write-Host "Installing backend dependencies..."
& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    throw "pip upgrade failed."
}
& $venvPython -m pip install -r (Join-Path $repoRoot "api\requirements.txt")
if ($LASTEXITCODE -ne 0) {
    throw "Backend dependency installation failed."
}

Write-Host "Installing frontend dependencies..."
Push-Location (Join-Path $repoRoot "app")
try {
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend dependency installation failed."
    }
}
finally {
    Pop-Location
}

$rootEnv = Join-Path $repoRoot ".env"
if (-not (Test-Path -LiteralPath $rootEnv)) {
    Copy-Item -LiteralPath (Join-Path $repoRoot ".env.example") -Destination $rootEnv
    Write-Host "Created .env from .env.example."
}

$webEnv = Join-Path $repoRoot "app\.env.local"
if (-not (Test-Path -LiteralPath $webEnv)) {
    Copy-Item -LiteralPath (Join-Path $repoRoot "app\example.env") -Destination $webEnv
    Write-Host "Created app/.env.local from app/example.env."
}

& (Join-Path $PSScriptRoot "start_infrastructure.ps1")

Write-Host "Creating MongoDB collections, validators, and indexes..."
& $venvPython (Join-Path $repoRoot "scripts\init_db.py")
if ($LASTEXITCODE -ne 0) {
    throw "Database initialization failed."
}

if ($Seed) {
    Write-Warning "Resetting application collections and loading demo data."
    & $venvPython (Join-Path $repoRoot "scripts\seed.py")
    if ($LASTEXITCODE -ne 0) {
        throw "Database seeding failed."
    }
}

Write-Host "Development setup is complete."
