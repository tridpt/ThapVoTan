param([string]$JdkPath, [string]$SdkPath)
$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gameVersion = (Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json).version
if (-not $SdkPath) { $SdkPath = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' } }
if (-not $JdkPath) {
    $candidates = @($env:JAVA_HOME, (Join-Path $env:LOCALAPPDATA 'TwoPlayerGamesBuild\jdk-17.0.20.1+1'), 'D:\Temp\temurin17\jdk-17.0.20.1+1')
    $JdkPath = $candidates | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'bin\java.exe')) } | Select-Object -First 1
}
if (-not $JdkPath) { throw 'JDK 17 required. Pass -JdkPath with the installed JDK directory.' }
if (-not (Test-Path -LiteralPath (Join-Path $SdkPath 'platforms\android-35'))) { throw 'Android SDK platform 35 required. Pass -SdkPath with your SDK directory.' }
$env:JAVA_HOME=$JdkPath
$env:ANDROID_HOME=$SdkPath
Push-Location (Join-Path $projectRoot 'android')
try {
    & .\gradlew.bat assembleDebug --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Gradle failed: $LASTEXITCODE" }
    $outputDir=Join-Path $projectRoot 'artifacts'
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    $artifactPath = Join-Path $outputDir "ThapVoTan-$gameVersion.apk"
    Copy-Item -LiteralPath '.\app\build\outputs\apk\debug\app-debug.apk' -Destination $artifactPath -Force
    $hashStream = [System.IO.File]::OpenRead($artifactPath)
    $hashProvider = [System.Security.Cryptography.SHA256]::Create()
    try { $hashText = [BitConverter]::ToString($hashProvider.ComputeHash($hashStream)).Replace('-', '').ToLowerInvariant() }
    finally { $hashStream.Dispose(); $hashProvider.Dispose() }
    "$hashText  ThapVoTan-$gameVersion.apk" | Set-Content -LiteralPath (Join-Path $outputDir "ThapVoTan-$gameVersion.sha256") -Encoding ascii
    [PSCustomObject]@{Algorithm='SHA256'; Hash=$hashText; Path=$artifactPath}
} finally { Pop-Location }
