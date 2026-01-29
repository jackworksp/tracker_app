param (
    [string]$SearchPath = $PWD
)

Write-Host "Searching in: $SearchPath"

Get-ChildItem -Path $SearchPath -Recurse -File -ErrorAction SilentlyContinue |
    Select-Object Name, DirectoryName |
    Sort-Object Name -Descending |
    Select-Object -First 30 |
    Format-Table -AutoSize
