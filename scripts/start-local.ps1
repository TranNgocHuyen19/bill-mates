[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipTailscale
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$localDir = Join-Path $projectRoot ".local"
$logDir = Join-Path $localDir "logs"
$supabaseCli = Join-Path $projectRoot "infra\node_modules\.bin\supabase.cmd"
$python = Join-Path $backendDir ".venv\Scripts\python.exe"

New-Item -ItemType Directory -Force -Path $localDir, $logDir | Out-Null

if (-not (Test-Path $supabaseCli)) {
    throw "Supabase CLI is missing. Run: npm install --prefix infra"
}
if (-not (Test-Path $python)) {
    throw "Backend virtual environment is missing at backend\.venv."
}

function Wait-HttpOk {
    param(
        [Parameter(Mandatory)]
        [string]$Url,
        [int]$Attempts = 60
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    throw "Service did not become ready: $Url"
}

function Assert-PortAvailable {
    param([int]$Port)

    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) {
        throw "Port $Port is already in use by PID $($listener.OwningProcess). Stop the old process first."
    }
}

try {
    docker info *> $null
}
catch {
    $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dockerDesktop)) {
        throw "Docker Desktop is not installed."
    }

    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    for ($attempt = 1; $attempt -le 90; $attempt++) {
        Start-Sleep -Seconds 2
        docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            break
        }
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop did not become ready."
    }
}

Push-Location $projectRoot
try {
    & $supabaseCli start --exclude realtime,imgproxy,edge-runtime,logflare,vector,supavisor |
        Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase local stack failed to start."
    }

    $supabaseStatus = & $supabaseCli status --output json | ConvertFrom-Json
}
finally {
    Pop-Location
}

$tailscaleStatus = & tailscale status --json | ConvertFrom-Json
$dnsName = ([string]$tailscaleStatus.Self.DNSName).TrimEnd(".")
if (-not $dnsName) {
    throw "Tailscale is not connected."
}

$publicUrl = "https://$dnsName"
$databaseUrl = ([string]$supabaseStatus.DB_URL) -replace "^postgresql://", "postgresql+psycopg://"
$anonKey = [string]$supabaseStatus.PUBLISHABLE_KEY
if (-not $anonKey) {
    $anonKey = [string]$supabaseStatus.ANON_KEY
}

$backendEnv = @(
    "PROJECT_NAME=BillMates"
    "API_V1_STR=/api/v1"
    "ENVIRONMENT=local"
    "FRONTEND_URL=$publicUrl"
    "DATABASE_URL=$databaseUrl"
    "SUPABASE_URL=$publicUrl"
    "SUPABASE_INTERNAL_URL=$($supabaseStatus.API_URL)"
    "SUPABASE_JWT_SECRET=$($supabaseStatus.JWT_SECRET)"
    "SUPABASE_SERVICE_ROLE_KEY=$($supabaseStatus.SERVICE_ROLE_KEY)"
    "SUPABASE_JWT_AUDIENCE=authenticated"
    "OCR_ENABLED=true"
    "OCR_LANGUAGE=vi"
    "OCR_VERSION=PP-OCRv5"
    "OCR_DEVICE=cpu"
    "OCR_CPU_THREADS=4"
    "OCR_ENABLE_MKLDNN=false"
    "OCR_TEXT_DETECTION_MODEL=PP-OCRv5_mobile_det"
    "OCR_TEXT_RECOGNITION_MODEL=latin_PP-OCRv5_mobile_rec"
)
Set-Content -LiteralPath (Join-Path $backendDir ".env.local") -Value $backendEnv -Encoding utf8

$frontendEnv = @(
    "NEXT_PUBLIC_API_ENDPOINT=$publicUrl"
    "NEXT_PUBLIC_URL=$publicUrl"
    "NEXT_PUBLIC_SUPABASE_URL=$publicUrl"
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$anonKey"
)
Set-Content -LiteralPath (Join-Path $frontendDir ".env.local") -Value $frontendEnv -Encoding utf8

Push-Location $backendDir
try {
    & $python -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) {
        throw "Database migration failed."
    }
}
finally {
    Pop-Location
}

if (-not $SkipBuild) {
    Push-Location $frontendDir
    try {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed."
        }
    }
    finally {
        Pop-Location
    }
}

Assert-PortAvailable -Port 8000
Assert-PortAvailable -Port 3000

$backendOut = Join-Path $logDir "backend.log"
$backendErr = Join-Path $logDir "backend-error.log"
$frontendOut = Join-Path $logDir "frontend.log"
$frontendErr = Join-Path $logDir "frontend-error.log"

$backendProcess = Start-Process -FilePath $python `
    -ArgumentList "-m", "src.server" `
    -WorkingDirectory $backendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr `
    -PassThru
$backendProcess.Id | Set-Content -LiteralPath (Join-Path $localDir "backend.pid")

$frontendProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "start" `
    -WorkingDirectory $frontendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr `
    -PassThru
$frontendProcess.Id | Set-Content -LiteralPath (Join-Path $localDir "frontend.pid")

try {
    Wait-HttpOk -Url "http://127.0.0.1:8000/api/v1/health"
    Wait-HttpOk -Url "http://127.0.0.1:3000"

    if (-not $SkipTailscale) {
        & (Join-Path $PSScriptRoot "configure-tailscale.ps1")
        Wait-HttpOk -Url "$publicUrl/api/v1/health"
    }
}
catch {
    & (Join-Path $PSScriptRoot "stop-local.ps1") -KeepSupabase
    throw
}

Write-Host ""
Write-Host "BillMates local deployment is running."
Write-Host "App:      $publicUrl"
Write-Host "API docs: $publicUrl/api/v1/openapi.json"
Write-Host "Studio:   http://127.0.0.1:55423"
Write-Host "Mailpit:  http://127.0.0.1:55424"
