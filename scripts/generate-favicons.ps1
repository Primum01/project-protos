param(
    [string]$SourcePath = "$PSScriptRoot/../public/favicon.png"
)

Add-Type -AssemblyName System.Drawing

$publicDir = (Resolve-Path "$PSScriptRoot/../public").Path
$srcPath = (Resolve-Path $SourcePath -ErrorAction SilentlyContinue)

if (-not $srcPath -or -not (Test-Path $srcPath)) {
    Write-Error "Source image not found at '$SourcePath'. Please provide a valid source image."
    exit 1
}

# Copy to favicon.png and icon-512.png if a different source path was supplied
$destFavicon = Join-Path $publicDir "favicon.png"
if ($srcPath.Path -ne $destFavicon) {
    Copy-Item -Path $srcPath.Path -Destination $destFavicon -Force
}
$destIcon512 = Join-Path $publicDir "icon-512.png"
if ($srcPath.Path -ne $destIcon512) {
    Copy-Item -Path $srcPath.Path -Destination $destIcon512 -Force
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath.Path)

function Resize-Image($img, $width, $height, $destPath) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $width, $height)
    $g.Dispose()
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Resize-Image $srcImg 16 16 (Join-Path $publicDir "favicon-16x16.png")
Resize-Image $srcImg 32 32 (Join-Path $publicDir "favicon-32x32.png")
Resize-Image $srcImg 48 48 (Join-Path $publicDir "favicon-48x48.png")
Resize-Image $srcImg 180 180 (Join-Path $publicDir "apple-touch-icon.png")
Resize-Image $srcImg 192 192 (Join-Path $publicDir "icon-192.png")

# Create .ico file using System.Drawing.Icon
$bmp32 = New-Object System.Drawing.Bitmap 32, 32
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g32.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g32.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g32.DrawImage($srcImg, 0, 0, 32, 32)
$g32.Dispose()

$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$icoPath = Join-Path $publicDir "favicon.ico"
$icoStream = [System.IO.File]::OpenWrite($icoPath)
$icon.Save($icoStream)
$icoStream.Close()
$icon.Dispose()
$bmp32.Dispose()

# Create favicon.svg with embedded base64 image so SVG loaders also get this exact logo
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$base64 = [Convert]::ToBase64String($bytes)
$svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,$base64" />
</svg>
"@
[System.IO.File]::WriteAllText((Join-Path $publicDir "favicon.svg"), $svgContent, [System.Text.Encoding]::UTF8)

$srcImg.Dispose()
Write-Output "Favicon and app icon assets created successfully!"
