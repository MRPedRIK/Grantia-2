$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Instale e abra o Docker Desktop antes de continuar.'
    exit 1
}
if (-not (Test-Path -LiteralPath '.env')) {
    function New-Secret {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        return [Convert]::ToBase64String($bytes)
    }
    $databasePassword = New-Secret
    $jwtSecret = New-Secret
    $adminPassword = New-Secret
    @("POSTGRES_PASSWORD=$databasePassword", "JWT_SECRET=$jwtSecret", "ADMIN_PASSWORD=$adminPassword", 'PORT=8080') | Set-Content -LiteralPath '.env' -Encoding ascii
    Write-Host 'Login: admin@local'
    Write-Host "Senha inicial: $adminPassword"
    Write-Host 'Guarde a senha. Ela tambem esta no arquivo local .env.'
}
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar. Verifique se o Docker esta aberto.' }
Write-Host 'Sistema em http://localhost:8080 (aguarde a inicializacao).'
