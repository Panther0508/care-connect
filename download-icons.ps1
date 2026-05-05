$icons = @('heart-pulse','stethoscope','alert','check-circle','x-circle','wifi-off','bell','calendar','clipboard','pill','syringe','activity','scale','water','moon','brain','first-aid-kit','qr-code','share','lock','globe')
$base = 'https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/icons/outline'
$outDir = 'public/images/icons/healthicons'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
foreach ($icon in $icons) {
    $url = "$base/${icon}-24.svg"
    $out = "$outDir/$icon.svg"
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 10
        Write-Host "Downloaded $icon"
    } catch {
        Write-Host "Failed $icon : $($_.Exception.Message)"
    }
}
