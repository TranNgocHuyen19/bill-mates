[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$tailscale = Get-Command tailscale -ErrorAction Stop
$status = & $tailscale.Source status --json | ConvertFrom-Json
$dnsName = [string]$status.Self.DNSName
if (-not $dnsName) {
    throw "Tailscale is not connected. Sign in to Tailscale first."
}

$dnsName = $dnsName.TrimEnd(".")
$publicUrl = "https://$dnsName"

& $tailscale.Source serve reset
& $tailscale.Source serve --bg http://127.0.0.1:3000
& $tailscale.Source serve --bg --set-path /api http://127.0.0.1:8000/api
& $tailscale.Source serve --bg --set-path /auth http://127.0.0.1:55421/auth
& $tailscale.Source serve --bg --set-path /rest http://127.0.0.1:55421/rest
& $tailscale.Source serve --bg --set-path /storage http://127.0.0.1:55421/storage

$serveStatus = & $tailscale.Source serve status --json
if (-not $serveStatus -or $serveStatus.Trim() -eq "{}") {
    throw "Tailscale Serve is not enabled or no proxy routes were created."
}

Write-Host "BillMates is available to this tailnet at $publicUrl"
