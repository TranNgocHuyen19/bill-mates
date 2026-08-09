[CmdletBinding()]
param(
    [switch]$KeepSupabase,
    [switch]$KeepTailscale
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $projectRoot ".local"
$supabaseCli = Join-Path $projectRoot "infra\node_modules\.bin\supabase.cmd"

function Stop-ProcessTree {
    param([int]$RootProcessId)

    $processes = Get-CimInstance Win32_Process
    $descendants = [System.Collections.Generic.List[int]]::new()

    function Add-Descendants {
        param([int]$ParentProcessId)

        foreach ($child in $processes | Where-Object { $_.ParentProcessId -eq $ParentProcessId }) {
            Add-Descendants -ParentProcessId $child.ProcessId
            $descendants.Add($child.ProcessId)
        }
    }

    Add-Descendants -ParentProcessId $RootProcessId
    foreach ($processId in $descendants) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue
}

foreach ($service in @("frontend", "backend")) {
    $pidFile = Join-Path $localDir "$service.pid"
    if (-not (Test-Path $pidFile)) {
        continue
    }

    $servicePid = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue
    if ($servicePid) {
        Stop-ProcessTree -RootProcessId ([int]$servicePid)
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not $KeepTailscale) {
    & tailscale serve reset
}

if (-not $KeepSupabase -and (Test-Path $supabaseCli)) {
    Push-Location $projectRoot
    try {
        & $supabaseCli stop
    }
    finally {
        Pop-Location
    }
}

Write-Host "BillMates local services stopped. Database and Storage data were preserved."
