Set-StrictMode -Version 2.0

function Get-KasirkuProjectRoot {
    $root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')
    return $root.Path
}

function Read-KasirkuDotEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    if (!(Test-Path -LiteralPath $Path)) {
        throw ".env file was not found at $Path"
    }

    $values = @{}

    foreach ($rawLine in Get-Content -LiteralPath $Path) {
        $line = $rawLine.Trim()

        if ($line.Length -eq 0 -or $line.StartsWith('#')) {
            continue
        }

        $separatorIndex = $line.IndexOf('=')

        if ($separatorIndex -lt 1) {
            continue
        }

        $key = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim()

        if ($value.Length -ge 2) {
            $first = $value.Substring(0, 1)
            $last = $value.Substring($value.Length - 1, 1)

            if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        $values[$key] = $value
    }

    return $values
}

function Get-KasirkuEnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable] $Values,

        [Parameter(Mandatory = $true)]
        [string] $Name,

        [string] $Default = ''
    )

    if ($Values.ContainsKey($Name)) {
        return [string] $Values[$Name]
    }

    return $Default
}

function Get-KasirkuRequiredCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue

    if ($null -eq $command) {
        throw "Required command '$Name' was not found on PATH."
    }

    return $command.Source
}

function Assert-KasirkuProductionEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ProjectRoot
    )

    $envPath = Join-Path $ProjectRoot '.env'
    $values = Read-KasirkuDotEnv -Path $envPath

    $appEnv = (Get-KasirkuEnvValue -Values $values -Name 'APP_ENV').ToLowerInvariant()
    $appDebug = (Get-KasirkuEnvValue -Values $values -Name 'APP_DEBUG').ToLowerInvariant()
    $appKey = Get-KasirkuEnvValue -Values $values -Name 'APP_KEY'

    if ($appEnv -ne 'production') {
        throw "APP_ENV must be production before running the public server. Current value: '$appEnv'."
    }

    if ($appDebug -eq 'true') {
        throw "APP_DEBUG must be false before running the public server."
    }

    if ([string]::IsNullOrWhiteSpace($appKey)) {
        throw "APP_KEY is missing. Run: php artisan key:generate"
    }

    return $values
}

function Get-KasirkuGitSha {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ProjectRoot
    )

    $git = Get-Command git -ErrorAction SilentlyContinue

    if ($null -eq $git) {
        return 'unknown'
    }

    Push-Location $ProjectRoot
    try {
        $sha = & $git.Source rev-parse HEAD 2>$null

        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($sha)) {
            return 'unknown'
        }

        return $sha.Trim()
    } finally {
        Pop-Location
    }
}
