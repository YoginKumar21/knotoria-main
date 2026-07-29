Add-Type -AssemblyName System.Drawing
$srcPath = "d:\knotoria\client\public\knotoria-logo.png"

if (Test-Path $srcPath) {
    Write-Output "Loading image: $srcPath"
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($src)

    $width = $bmp.Width
    $height = $bmp.Height

    $minX = $width
    $maxX = 0
    $minY = $height
    $maxY = 0

    Write-Output "Scanning pixels to find bounding box..."
    for ($y = 0; $y -lt $height; $y++) {
        for ($x = 0; $x -lt $width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            # Background is cream/white (R > 230 && G > 220 && B > 200)
            $isBg = ($pixel.R -gt 230) -and ($pixel.G -gt 220) -and ($pixel.B -gt 200)
            if (-not $isBg -and $pixel.A -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    # Add a small padding of 4 pixels
    $padding = 4
    $minX = [Math]::Max(0, $minX - $padding)
    $minY = [Math]::Max(0, $minY - $padding)
    $maxX = [Math]::Min($width - 1, $maxX + $padding)
    $maxY = [Math]::Min($height - 1, $maxY + $padding)

    $newWidth = $maxX - $minX + 1
    $newHeight = $maxY - $minY + 1

    Write-Output "Cropping to size: ${newWidth}x${newHeight}"
    $croppedBmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $g = [System.Drawing.Graphics]::FromImage($croppedBmp)
    $g.Clear([System.Drawing.Color]::Transparent)

    # Copy cropped area and make background transparent
    for ($y = 0; $y -lt $newHeight; $y++) {
        for ($x = 0; $x -lt $newWidth; $x++) {
            $pixel = $bmp.GetPixel($minX + $x, $minY + $y)
            $isBg = ($pixel.R -gt 230) -and ($pixel.G -gt 220) -and ($pixel.B -gt 200)
            if ($isBg) {
                $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            } else {
                $croppedBmp.SetPixel($x, $y, $pixel)
            }
        }
    }

    $src.Dispose()
    $bmp.Dispose()
    $g.Dispose()

    # Save to temp, then replace
    $tempPath = "d:\knotoria\client\public\knotoria-logo-temp.png"
    $croppedBmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $croppedBmp.Dispose()

    # Move temp to original
    Remove-Item $srcPath
    Rename-Item $tempPath "knotoria-logo.png"

    Write-Output "Successfully cropped and saved transparent logo to public/knotoria-logo.png"
} else {
    Write-Output "Error: knotoria-logo.png not found."
}
