[CmdletBinding()]
param()

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $projectRoot ".local"

function Get-ServiceState {
    param(
        [string]$Name,
        [int]$Port
    )

    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
    [pscustomobject]@{
        Service = $Name
        Port = $Port
        State = if ($listener) { "running" } else { "stopped" }
        PID = if ($listener) { $listener.OwningProcess } else { $null }
    }
}

@(
    Get-ServiceState -Name "Frontend" -Port 3000
    Get-ServiceState -Name "FastAPI + PaddleOCR" -Port 8000
    Get-ServiceState -Name "Supabase API" -Port 55421
    Get-ServiceState -Name "PostgreSQL" -Port 55422
    Get-ServiceState -Name "Supabase Studio" -Port 55423
    Get-ServiceState -Name "Mailpit" -Port 55424
) | Format-Table -AutoSize

Write-Host "Tailscale Serve:"
& tailscale serve status

$backendErrorLog = Join-Path $localDir "logs\backend-error.log"
if (Test-Path $backendErrorLog) {
    $errors = Get-Content -LiteralPath $backendErrorLog -Tail 5
    if ($errors) {
        Write-Host ""
        Write-Host "Latest backend log:"
        $errors
    }
}
