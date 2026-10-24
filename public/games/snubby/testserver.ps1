
$root = (Get-Location).Path
$listener = New-Object System.Net.HttpListener

try {
    $listener.Prefixes.Add("http://localhost:8000/")
    $listener.Start()
    Write-Host "Serving $root"
    Write-Host "Open http://localhost:8000/signin.html"

    while ($listener.IsListening) {
        $context = $listener.GetContext()

        try {
            $relative = [Uri]::UnescapeDataString(
                $context.Request.Url.AbsolutePath.TrimStart("/")
            )

            if ([string]::IsNullOrWhiteSpace($relative)) {
                $relative = "index.html"
            }

            $file = [IO.Path]::GetFullPath(
                (Join-Path $root $relative)
            )

            if (!$file.StartsWith(
                $root.TrimEnd("\") + "\",
                [StringComparison]::OrdinalIgnoreCase
            )) {
                $context.Response.StatusCode = 403
            }
            elseif (Test-Path -LiteralPath $file -PathType Leaf) {
                $bytes = [IO.File]::ReadAllBytes($file)
                $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()

                $mime = @{
                    ".html" = "text/html"
                    ".css"  = "text/css"
                    ".js"   = "text/javascript"
                    ".json" = "application/json"
                    ".png"  = "image/png"
                    ".jpg"  = "image/jpeg"
                    ".jpeg" = "image/jpeg"
                    ".svg"  = "image/svg+xml"
                    ".wasm" = "application/wasm"
                    ".woff2" = "font/woff2"
                }

                if ($mime.ContainsKey($ext)) {
                    $context.Response.ContentType = $mime[$ext]
                }
                else {
                    $context.Response.ContentType = "application/octet-stream"
                }

                $context.Response.ContentLength64 = $bytes.Length
                $context.Response.OutputStream.Write(
                    $bytes, 0, $bytes.Length
                )
            }
            else {
                $context.Response.StatusCode = 404
                $message = [Text.Encoding]::UTF8.GetBytes("File not found")
                $context.Response.OutputStream.Write(
                    $message, 0, $message.Length
                )
            }
        }
        catch {
            Write-Host $_.Exception.Message
            $context.Response.StatusCode = 500
        }
        finally {
            $context.Response.Close()
        }
    }
}
catch {
    Write-Host "Server failed: $($_.Exception.Message)"
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
