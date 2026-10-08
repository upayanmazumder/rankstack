[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

function Test-DockerEngine {
    docker info --format "{{.ServerVersion}}" *> $null
    return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerEngine)) {
    $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path -LiteralPath $dockerDesktop)) {
        throw "Docker Desktop is required. Install it or start a compatible Docker engine."
    }

    Write-Host "Starting Docker Desktop..."
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden

    $ready = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        Start-Sleep -Seconds 2
        if (Test-DockerEngine) {
            $ready = $true
            break
        }
    }
    if (-not $ready) {
        throw "Docker Desktop did not become ready within 60 seconds."
    }
}

Write-Host "Starting MongoDB and Redis..."
docker compose up -d mongo redis
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose could not start MongoDB and Redis."
}

Write-Host "Ensuring the MongoDB rs0 replica set is initialized..."
docker compose up mongo-rs-init
if ($LASTEXITCODE -ne 0) {
    throw "MongoDB replica-set initialization failed."
}

Write-Host "Infrastructure is ready."
