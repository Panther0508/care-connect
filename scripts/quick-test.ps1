# Simple test: start preview, check root and one asset, stop server
Write-Host "Starting preview server..."
$proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run preview" -PassThru -NoNewWindow -WorkingDirectory "C:\Users\hp\.repo\care-connect"
Start-Sleep -Seconds 12

try {
  Write-Host "`nChecking root (/)..."
  $r = Invoke-WebRequest -Uri "http://localhost:4173/" -Method Head -TimeoutSec 5 -UseBasicParsing
  Write-Host "Status:" $r.StatusCode
} catch {
  Write-Host "Error:" $_.Exception.Message
}

try {
  Write-Host "`nChecking /data/exercises.json..."
  $r2 = Invoke-WebRequest -Uri "http://localhost:4173/data/exercises.json" -Method Head -TimeoutSec 5 -UseBasicParsing
  Write-Host "Status:" $r2.StatusCode
} catch {
  Write-Host "Error:" $_.Exception.Message
}

Write-Host "`nStopping server..."
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
