$files = Get-ChildItem -Path "app" -Recurse -Include "*.ts", "*.tsx" | Select-Object -ExpandProperty FullName

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file)
    if ($content -match "getServerSession.*authOptions") {
        Write-Host "Updating $file"
        
        # Split content into lines
        $lines = $content -split "`r`n|\r|\n"
        
        # Process imports
        $newLines = @()
        $importLines = @()
        $inImports = $false
        
        foreach ($line in $lines) {
            if ($line -match "^import") {
                $inImports = $true
                if (-not ($line -match "getServerSession|authOptions")) {
                    $importLines += $line
                }
            } elseif ($inImports -and $line -match "^\s*$") {
                continue
            } elseif ($inImports) {
                $inImports = $false
                $importLines += 'import { auth } from "@/lib/auth"'
                $newLines += $importLines
                $newLines += $line
            } else {
                $newLines += $line
            }
        }
        
        # Update session initialization
        $newContent = ($newLines -join "`n") -replace 'const session = await getServerSession\(authOptions\)', 'const session = await auth()'
        
        # Write the file
        [System.IO.File]::WriteAllText($file, $newContent)
    }
} 