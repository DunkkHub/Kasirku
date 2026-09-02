param(
    [int] $Port = 8000,
    [string] $PublicUrl = '',
    [switch] $SkipPublic
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

$projectRoot = Get-KasirkuProjectRoot
$localBaseUrl = "http://127.0.0.1:$Port"
$failures = New-Object System.Collections.Generic.List[string]

function Test-KasirkuUrl {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Url,

        [int[]] $AllowedStatusCodes = @(200)
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15

        if ($AllowedStatusCodes -notcontains [int] $response.StatusCode) {
            $script:failures.Add("$Url returned HTTP $($response.StatusCode)")
        } else {
            Write-Host "PASS $Url ($($response.StatusCode))"
        }
    } catch {
        $script:failures.Add("$Url failed: $($_.Exception.Message)")
    }
}

for ($attempt = 1; $attempt -le 12; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri "$localBaseUrl/up" -UseBasicParsing -TimeoutSec 5

        if ([int] $response.StatusCode -eq 200) {
            break
        }
    } catch {
        if ($attempt -eq 12) {
            $failures.Add("$localBaseUrl/up failed after waiting for the server: $($_.Exception.Message)")
        } else {
            Start-Sleep -Seconds 2
        }
    }
}

Test-KasirkuUrl -Url "$localBaseUrl/up"
Test-KasirkuUrl -Url "$localBaseUrl/"

$manifestPath = Join-Path $projectRoot 'public\build\manifest.json'

if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $assets = New-Object System.Collections.Generic.List[string]

    foreach ($property in $manifest.PSObject.Properties) {
        if ($property.Value.PSObject.Properties.Name -contains 'file') {
            $assets.Add([string] $property.Value.file)
        }

        if ($property.Value.PSObject.Properties.Name -contains 'css') {
            foreach ($cssFile in $property.Value.css) {
                $assets.Add([string] $cssFile)
            }
        }
    }

    foreach ($asset in ($assets | Select-Object -Unique -First 3)) {
        Test-KasirkuUrl -Url "$localBaseUrl/build/$asset"
    }
} else {
    $failures.Add("public/build/manifest.json is missing. Run: npm ci && npm run build")
}

if (!$SkipPublic) {
    if ([string]::IsNullOrWhiteSpace($PublicUrl)) {
        $tailscale = Get-Command tailscale -ErrorAction SilentlyContinue

        if ($null -ne $tailscale) {
            $statusText = (& $tailscale.Source funnel status 2>$null | Out-String)

            if ($statusText -match 'https://[^\s]+\.ts\.net') {
                $PublicUrl = $Matches[0].TrimEnd('/')
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($PublicUrl)) {
        Write-Warning "No public .ts.net Funnel URL was detected. Re-run with -PublicUrl https://your-device.your-tailnet.ts.net after Funnel is enabled."
    } else {
        $PublicUrl = $PublicUrl.TrimEnd('/')
        Test-KasirkuUrl -Url "$PublicUrl/up"
        Test-KasirkuUrl -Url "$PublicUrl/"
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Health check failed:"

    foreach ($failure in $failures) {
        Write-Host "FAIL $failure"
    }

    exit 1
}

Write-Host "Health check passed."
