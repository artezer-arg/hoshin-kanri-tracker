$port = 8081
$url = "http://localhost:$port/"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "         Toyota DX Plan - Servidor Local Iniciado" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Para entrar desde esta computadora:" -ForegroundColor White
Write-Host "  http://localhost:$port" -ForegroundColor Yellow
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
    exit
}

$currentDir = $PSScriptRoot
if (-not $currentDir) { $currentDir = Get-Location }

# Real-time active users list
$global:ActiveUsers = @{}

# Keep listening
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/api/user") {
            $response.ContentType = "application/json"
            $username = ""
            if ($request.IsLocal) {
                $username = $env:USERNAME
            }
            $userJson = '{"username":"' + $username + '"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($userJson)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }
        if ($rawUrl -eq "/api/tasks") {
            $tasksFile = Join-Path $currentDir "tasks.json"
            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                [System.IO.File]::WriteAllText($tasksFile, $body, [System.Text.Encoding]::UTF8)
                $response.ContentType = "application/json"
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            } else {
                if (Test-Path $tasksFile -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($tasksFile)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not Found"}')
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                }
            }
            $response.Close()
            continue
        }
        if ($rawUrl -eq "/api/metadata") {
            $metadataFile = Join-Path $currentDir "metadata.json"
            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                [System.IO.File]::WriteAllText($metadataFile, $body, [System.Text.Encoding]::UTF8)
                $response.ContentType = "application/json"
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            } else {
                if (Test-Path $metadataFile -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($metadataFile)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not Found"}')
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                }
            }
            $response.Close()
            continue
        }
        if ($rawUrl -eq "/api/collaborators") {
            $collabFile = Join-Path $currentDir "collaborators.json"
            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                [System.IO.File]::WriteAllText($collabFile, $body, [System.Text.Encoding]::UTF8)
                $response.ContentType = "application/json"
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            } else {
                if (Test-Path $collabFile -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($collabFile)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not Found"}')
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                }
            }
            $response.Close()
            continue
        }
        if ($rawUrl -eq "/api/heartbeat") {
            $username = $request.QueryString["username"]
            if ($username) {
                $username = $username.Trim()
                $global:ActiveUsers[$username] = [DateTime]::Now
            }
            
            # Remove inactive users (no heartbeat in last 15 seconds)
            $now = [DateTime]::Now
            $expired = @()
            foreach ($user in $global:ActiveUsers.Keys) {
                $diff = $now - $global:ActiveUsers[$user]
                if ($diff.TotalSeconds -gt 15) {
                    $expired += $user
                }
            }
            foreach ($user in $expired) {
                $global:ActiveUsers.Remove($user)
            }
            
            # Format JSON response containing the list of active users
            $activeArray = @()
            foreach ($user in $global:ActiveUsers.Keys) {
                $activeArray += $user
            }
            $jsonList = "[" + (($activeArray | ForEach-Object { '"' + $_ + '"' }) -join ",") + "]"
            
            $response.ContentType = "application/json"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonList)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }
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
