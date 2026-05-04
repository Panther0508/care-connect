# Full route verification — starts preview server, checks routes, stops server
Write-Host "Starting preview server..."
$job = Start-Job -ScriptBlock { npm run preview }
Start-Sleep -Seconds 12

$routes = @(
  '/', '/onboarding', '/dashboard', '/clinician/profile', '/referral-generator',
  '/health', '/ai', '/nutrition', '/workout', '/workout-history', '/cycle',
  '/water', '/sleep', '/medications', '/calculators', '/mental-health',
  '/education', '/education/module-1', '/first-aid', '/care-locator',
  '/community', '/topic/test', '/post/test', '/patient-history', '/passport',
  '/clinician-view', '/outbreak', '/alerts', '/register-need', '/reservation/test-id',
  '/impact', '/crisis-map', '/facility/test', '/settings', '/sync-patterns',
  '/subscription', '/referral', '/support', '/terms', '/privacy', '/contact',
  '/language', '/admin', '/audit-log', '/training', '/evaluation',
  '/chw-triage', '/protocol-navigator', '/encounter-logger', '/emergency',
  '/rewards', '/quests', '/avatar'
)

$base = "http://localhost:4173"
$results = @()

foreach ($route in $routes) {
  $url = $base + $route
  try {
    $resp = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 8 -UseBasicParsing
    $status = $resp.StatusCode
  } catch {
    if ($_.Exception.Response) {
      $status = $_.Exception.Response.StatusCode.value__
    } else {
      $status = 'ERR'
    }
  }
  Write-Host "$route -> $status"
  $results += [PSCustomObject]@{ path=$route; actualStatus=$status }
}

# Stop server
if ($job -and $job.State -eq 'Running') { Stop-Job $job -Force | Out-Null }
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$total = $results.Count
$ok = ($results | Where-Object { $_.actualStatus -eq 200 }).Count
$fail = $total - $ok
Write-Host "`n=== ROUTE VERIFICATION SUMMARY ==="
Write-Host "Total routes: $total"
Write-Host "Passed (200): $ok"
Write-Host "Failed (non-200): $fail"
if ($fail -gt 0) {
  $results | Where-Object { $_.actualStatus -ne 200 } | Format-Table -AutoSize
}
