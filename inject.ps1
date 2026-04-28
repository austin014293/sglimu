$path = "c:\Users\park4\OneDrive\Desktop\test7"
$files = Get-ChildItem -Path $path -Filter *.html | Where-Object { $_.Name -ne 'admin.html' }
$headPattern = '(?i)</head>'
$headReplace = "    <link rel=`"stylesheet`" href=`"cart.css`">`r`n    <link rel=`"stylesheet`" href=`"inquiry.css`">`r`n</head>"
$bodyPattern = '(?i)</body>'
$bodyReplace = "    <!-- SG LIMU Global Scripts -->`r`n    <script src=`"cart.js`"></script>`r`n    <script type=`"module`" src=`"inquiry.js`"></script>`r`n</body>"

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Avoid duplicate injection
    if ($content -notmatch 'cart\.css') {
        $content = [regex]::Replace($content, $headPattern, $headReplace)
        $content = [regex]::Replace($content, $bodyPattern, $bodyReplace)
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    }
}
Write-Output "Injection Done"
