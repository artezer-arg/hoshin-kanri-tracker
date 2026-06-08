# Self-elevate to Administrator to allow listening on all network interfaces (0.0.0.0 / *)
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Clear screen
Clear-Host

# Get local IP address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.0.0.1" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "localhost" }
$port = 8081
$url = "http://*:$port/"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "         Toyota DX Plan — Servidor Local Iniciado" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Para entrar desde esta computadora:" -ForegroundColor White
Write-Host "  http://localhost:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para entrar desde CUALQUIER computadora de tu red local:" -ForegroundColor White
Write-Host "  http://$ip:$port" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Manten esta ventana abierta para que el servidor siga activo." -ForegroundColor Gray
Write-Host "Presiona Ctrl+C para detener el servidor." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try {
    $listener.Start()
} catch {
    Write-Host "Error al iniciar el servidor: $_" -ForegroundColor Red
    Write-Host "Asegurate de que el puerto $port no este en uso." -ForegroundColor Red
    Read-Host "Presiona Enter para salir..."
    exit
}

$currentDir = $PSScriptRoot
if (-not $currentDir) { $currentDir = Get-Location }

# Keep listening
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/") { $rawUrl = "/index.html" }
        
        $filePath = Join-Path $currentDir $rawUrl
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Determine content type
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            if ($ext -eq ".html" -or $ext -eq ".htm") { $contentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $contentType = "text/css" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript" }
            elseif ($ext -eq ".json") { $contentType = "application/json" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Catch connection resets or close requests silently
    }
}
