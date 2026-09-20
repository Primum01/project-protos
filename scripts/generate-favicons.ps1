Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\kipto\.gemini\antigravity-ide\brain\84de01d1-1e36-497f-9c9a-5b3a86fae966\.user_uploaded\media_1789897844668.png"
$publicDir = "c:\Users\kipto\OneDrive\Documents\TwinSpace System\public"

# Copy original to favicon.png and icon-512.png
Copy-Item -Path $srcPath -Destination (Join-Path $publicDir "favicon.png") -Force
Copy-Item -Path $srcPath -Destination (Join-Path $publicDir "icon-512.png") -Force

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

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
