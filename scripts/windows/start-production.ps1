param(
    [int] $Port = 8000,
    [switch] $SkipFunnel,
    [int] $StartupDelaySeconds = 0
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

if ($StartupDelaySeconds -gt 0) {
    Write-Host "Waiting $StartupDelaySeconds seconds for Windows networking and services..."
    Start-Sleep -Seconds $StartupDelaySeconds
}

$projectRoot = Get-KasirkuProjectRoot
$pidFile = Join-Path $projectRoot 'storage\app\windows-production-server.pid'
$logsDir = Join-Path $projectRoot 'storage\logs'
$stdoutLog = Join-Path $logsDir 'frankenphp.out.log'
$stderrLog = Join-Path $logsDir 'frankenphp.err.log'
$caddyfile = Join-Path $projectRoot 'Caddyfile'

Write-Host "Preparing Teisseire Pizza production server from $projectRoot"

$php = Get-KasirkuRequiredCommand -Name 'php'
$composer = Get-KasirkuRequiredCommand -Name 'composer'
$npm = Get-KasirkuRequiredCommand -Name 'npm'
$frankenphp = Get-KasirkuRequiredCommand -Name 'frankenphp'
$envValues = Assert-KasirkuProductionEnv -ProjectRoot $projectRoot

if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'vendor\autoload.php'))) {
    throw "Composer dependencies are missing. Run: composer install --no-dev --prefer-dist --optimize-autoloader"
}

if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'public\build\manifest.json'))) {
    throw "Frontend assets are missing. Run: npm ci, then npm run build"
}

if (!(Test-Path -LiteralPath $caddyfile)) {
    throw "Caddyfile was not found at $caddyfile"
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

Push-Location $projectRoot
try {
    Write-Host "Checking optimized Composer autoloader..."
    & $composer dump-autoload --no-dev --classmap-authoritative

    if ($LASTEXITCODE -ne 0) {
        throw "composer dump-autoload failed."
    }

    Write-Host "Clearing stale Laravel caches..."
    & $php artisan optimize:clear

    if ($LASTEXITCODE -ne 0) {
        throw "php artisan optimize:clear failed."
    }

    Write-Host "Running database migrations..."
    & $php artisan migrate --force

    if ($LASTEXITCODE -ne 0) {
        throw "php artisan migrate --force failed."
    }

    $publicStorage = Join-Path $projectRoot 'public\storage'
    $storageTarget = Join-Path $projectRoot 'storage\app\public'

    if (!(Test-Path -LiteralPath $storageTarget)) {
        New-Item -ItemType Directory -Path $storageTarget -Force | Out-Null
    }

    if (!(Test-Path -LiteralPath $publicStorage)) {
        Write-Host "Creating public storage link..."
        & $php artisan storage:link

        if ($LASTEXITCODE -ne 0 -and !(Test-Path -LiteralPath $publicStorage)) {
            Write-Warning "Laravel storage:link failed; creating a Windows junction instead."
            New-Item -ItemType Junction -Path $publicStorage -Target $storageTarget | Out-Null
        }
    }

    Write-Host "Building Laravel production cache..."
    & $php artisan optimize

    if ($LASTEXITCODE -ne 0) {
        throw "php artisan optimize failed."
    }

    $existingProcess = $null

    if (Test-Path -LiteralPath $pidFile) {
        $existingPidText = (Get-Content -LiteralPath $pidFile -TotalCount 1).Trim()

        if ($existingPidText -match '^\d+$') {
            $existingProcess = Get-Process -Id ([int] $existingPidText) -ErrorAction SilentlyContinue
        }
    }

    if ($null -ne $existingProcess -and !$existingProcess.HasExited) {
        Write-Host "FrankenPHP is already running with PID $($existingProcess.Id)."
    } else {
        if (Test-Path -LiteralPath $pidFile) {
            Remove-Item -LiteralPath $pidFile -Force
        }

        Write-Host "Starting FrankenPHP on http://127.0.0.1:$Port ..."
        $env:LOCAL_SERVER_PORT = [string] $Port
        $process = Start-Process `
            -FilePath $frankenphp `
            -ArgumentList @('run', '--config', $caddyfile) `
            -WorkingDirectory $projectRoot `
            -RedirectStandardOutput $stdoutLog `
            -RedirectStandardError $stderrLog `
            -WindowStyle Hidden `
            -PassThru

        Set-Content -LiteralPath $pidFile -Value ([string] $process.Id) -Encoding ASCII
        Write-Host "FrankenPHP started with PID $($process.Id). Logs:"
        Write-Host "  $stdoutLog"
        Write-Host "  $stderrLog"
    }

    $healthScript = Join-Path $PSScriptRoot 'health-check.ps1'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $healthScript -Port $Port -SkipPublic

    if ($LASTEXITCODE -ne 0) {
        throw "Local health check failed. Review $stderrLog"
    }

    if (!$SkipFunnel) {
        $tailscale = Get-Command tailscale -ErrorAction SilentlyContinue

        if ($null -eq $tailscale) {
            Write-Warning "Tailscale CLI was not found. Install Tailscale, log in, enable Funnel, then run: tailscale funnel --bg $Port"
        } else {
            Write-Host "Starting or refreshing Tailscale Funnel in the background..."
            & $tailscale.Source funnel --bg $Port

            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Tailscale Funnel did not start. Log in to Tailscale, enable HTTPS certificates and Funnel, then run: tailscale funnel --bg $Port"
            } else {
                Write-Host "Tailscale Funnel status:"
                & $tailscale.Source funnel status
            }
        }
    }

    $appUrl = Get-KasirkuEnvValue -Values $envValues -Name 'APP_URL'

    if ($appUrl -notmatch '^https://.+\.ts\.net/?$') {
        Write-Warning "APP_URL is not a Tailscale HTTPS URL yet. After Funnel shows your .ts.net URL, update APP_URL and run: php artisan optimize:clear && php artisan optimize"
    }

    Write-Host "Production server is ready locally at http://127.0.0.1:$Port"
} finally {
    Pop-Location
}
