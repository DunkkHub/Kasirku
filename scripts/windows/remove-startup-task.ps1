param(
    [string] $TaskName = 'Teisseire Pizza Menu'
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($null -eq $task) {
    Write-Host "Startup task was not found: $TaskName"
    exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Startup task removed: $TaskName"
