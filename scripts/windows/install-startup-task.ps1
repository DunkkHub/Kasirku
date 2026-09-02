param(
    [string] $TaskName = 'Teisseire Pizza Menu',
    [int] $Port = 8000,
    [int] $StartupDelaySeconds = 45
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

$projectRoot = Get-KasirkuProjectRoot
$startScript = Join-Path $PSScriptRoot 'start-production.ps1'
$powershellCommand = Get-Command pwsh -ErrorAction SilentlyContinue

if ($null -eq $powershellCommand) {
    $powershellExe = (Get-Command powershell.exe).Source
} else {
    $powershellExe = $powershellCommand.Source
}

$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -Port $Port -StartupDelaySeconds $StartupDelaySeconds"
$action = New-ScheduledTaskAction -Execute $powershellExe -Argument $arguments -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -AllowStartIfOnBatteries `
    -DisallowStartIfOnBatteries:$false

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description 'Starts the Teisseire Pizza Laravel menu server with FrankenPHP and refreshes Tailscale Funnel.' `
    -Force | Out-Null

Write-Host "Startup task installed: $TaskName"
Write-Host "It runs at Windows logon and starts the local production server on port $Port."
Write-Host "Command line contains no application secrets; secrets stay in the local .env file."
