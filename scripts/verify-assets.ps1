# scripts/verify-assets.ps1
Write-Host "Starting Vite dev server in background job..."
$job = Start-Job -ScriptBlock { npm run dev }
Start-Sleep -Seconds 15  # wait for server to be ready

$assets = @(
  '/data/exercises.json','/data/first-aid.json','/data/phq9.json','/data/gad7.json',
  '/data/african-foods.json','/data/global-foods.json','/data/immunization-schedules.json',
  '/data/preventive-care.json','/data/symptoms-lookup.json','/data/drug-counseling.json',
  '/data/who-protocols.json','/data/icd10cm-codes.json','/data/rxnorm-interactions.json',
  '/data/who-imci.json','/data/tccc-protocols.json','/data/nigeria-treatment-guidelines.json',
  '/data/nigeria-drug-registry.json','/data/ddx-cards.json',
  '/avatars/vita-default.png','/avatars/vita-error.png','/avatars/vita-success.png',
  '/avatars/vita-loading.png','/avatars/vita-empty.png','/avatars/vita-alert.png',
  '/avatars/vita-offline.png','/manifest.json','/serviceWorker.js','/favicon.ico',
  '/icon-192.png','/icon-512.png'
)

$results = @()
foreach ($path in $assets) {
  try {
    $resp = Invoke-WebRequest -Uri ("http://localhost:5173" + $path) -Method Head -TimeoutSec 5 -UseBasicParsing
    $actualStatus = $resp.StatusCode
  } catch {
    if ($_.Exception.Response) {
      $actualStatus = $_.Exception.Response.StatusCode.value__
    } else {
      $actualStatus = 'ERR'
    }
  }
  Write-Host "HEAD $path -> $actualStatus"
  $results += [PSCustomObject]@{ path=$path; actualStatus=$actualStatus }
}

# Shutdown dev server
if ($job -and $job.State -eq 'Running') {
  Stop-Job $job -Force -ErrorAction SilentlyContinue
  Remove-Job $job -ErrorAction SilentlyContinue
}
# Also kill any stray node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Output JSON
$results | ConvertTo-Json -Depth 3
