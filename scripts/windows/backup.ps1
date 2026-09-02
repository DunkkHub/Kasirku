param(
    [string] $BackupRoot = ''
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

$projectRoot = Get-KasirkuProjectRoot
$envPath = Join-Path $projectRoot '.env'
$envValues = Read-KasirkuDotEnv -Path $envPath

if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
    $BackupRoot = Join-Path $projectRoot 'backups'
}

$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$backupDir = Join-Path $BackupRoot $timestamp
$databaseBackupDir = Join-Path $backupDir 'database'
$uploadsBackupDir = Join-Path $backupDir 'uploads'

New-Item -ItemType Directory -Path $databaseBackupDir -Force | Out-Null

$dbConnection = (Get-KasirkuEnvValue -Values $envValues -Name 'DB_CONNECTION' -Default 'sqlite').ToLowerInvariant()

if ($dbConnection -eq 'sqlite') {
    $databasePath = Get-KasirkuEnvValue -Values $envValues -Name 'DB_DATABASE' -Default 'database/database.sqlite'

    if (![System.IO.Path]::IsPathRooted($databasePath)) {
        $databasePath = Join-Path $projectRoot $databasePath
    }

    if (!(Test-Path -LiteralPath $databasePath)) {
        throw "SQLite database file was not found at $databasePath"
    }

    Copy-Item -LiteralPath $databasePath -Destination (Join-Path $databaseBackupDir 'database.sqlite') -Force
} elseif ($dbConnection -eq 'mysql' -or $dbConnection -eq 'mariadb') {
    $mysqldump = Get-KasirkuRequiredCommand -Name 'mysqldump'
    $databaseName = Get-KasirkuEnvValue -Values $envValues -Name 'DB_DATABASE'

    if ([string]::IsNullOrWhiteSpace($databaseName)) {
        throw "DB_DATABASE is missing from .env"
    }

    $defaultsFile = Join-Path ([System.IO.Path]::GetTempPath()) ("kasirku-mysqldump-" + [System.Guid]::NewGuid().ToString('N') + ".cnf")
    $sqlPath = Join-Path $databaseBackupDir "$databaseName.sql"

    $defaultsContent = @(
        '[client]',
        "host=$(Get-KasirkuEnvValue -Values $envValues -Name 'DB_HOST' -Default '127.0.0.1')",
        "port=$(Get-KasirkuEnvValue -Values $envValues -Name 'DB_PORT' -Default '3306')",
        "user=$(Get-KasirkuEnvValue -Values $envValues -Name 'DB_USERNAME')",
        "password=$(Get-KasirkuEnvValue -Values $envValues -Name 'DB_PASSWORD')"
    )

    Set-Content -LiteralPath $defaultsFile -Value $defaultsContent -Encoding ASCII

    try {
        & $mysqldump "--defaults-extra-file=$defaultsFile" --single-transaction --routines --triggers "--result-file=$sqlPath" $databaseName

        if ($LASTEXITCODE -ne 0) {
            throw "mysqldump failed."
        }
    } finally {
        if (Test-Path -LiteralPath $defaultsFile) {
            Remove-Item -LiteralPath $defaultsFile -Force
        }
    }
} else {
    throw "Unsupported DB_CONNECTION '$dbConnection'. This backup script supports sqlite, mysql, and mariadb."
}

$uploadsSource = Join-Path $projectRoot 'storage\app\public'

if (Test-Path -LiteralPath $uploadsSource) {
    Copy-Item -LiteralPath $uploadsSource -Destination $uploadsBackupDir -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $uploadsBackupDir -Force | Out-Null
}

$gitSha = Get-KasirkuGitSha -ProjectRoot $projectRoot
$manifest = @(
    "created_at=$((Get-Date).ToString('o'))",
    "project_root=$projectRoot",
    "git_sha=$gitSha",
    "db_connection=$dbConnection",
    "uploads_source=$uploadsSource"
)

Set-Content -LiteralPath (Join-Path $backupDir 'backup-info.txt') -Value $manifest -Encoding UTF8

Write-Host "Backup complete: $backupDir"
