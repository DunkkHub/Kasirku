param(
    [int] $Port = 8000,
    [switch] $StopFunnel
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

$projectRoot = Get-KasirkuProjectRoot
$pidFile = Join-Path $projectRoot 'storage\app\windows-production-server.pid'

if (Test-Path -LiteralPath $pidFile) {
    $pidText = (Get-Content -LiteralPath $pidFile -TotalCount 1).Trim()

    if ($pidText -match '^\d+$') {
        $process = Get-Process -Id ([int] $pidText) -ErrorAction SilentlyContinue

        if ($null -ne $process -and !$process.HasExited) {
            Write-Host "Stopping FrankenPHP PID $($process.Id)..."
            Stop-Process -Id $process.Id -Force
        } else {
            Write-Host "No live FrankenPHP process found for saved PID $pidText."
        }
    }

    Remove-Item -LiteralPath $pidFile -Force
} else {
    Write-Host "No saved FrankenPHP PID file found."
}

if ($StopFunnel) {
    $tailscale = Get-Command tailscale -ErrorAction SilentlyContinue

    if ($null -eq $tailscale) {
        Write-Warning "Tailscale CLI was not found; cannot disable Funnel from this script."
    } else {
        Write-Host "Disabling Tailscale Funnel for local target port $Port..."
        & $tailscale.Source funnel $Port off

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not disable Funnel for port $Port. If needed, run: tailscale funnel reset"
        }
    }
}

Write-Host "Stop command finished."
