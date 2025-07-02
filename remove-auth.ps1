# Get all TypeScript files in the app directory recursively
Get-ChildItem -Path "app" -Recurse -Include "*.ts","*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName
    
    # Join the content into a single string
    $content = $content -join "`n"
    
    # Remove auth import
    $content = $content -replace 'import \{ auth \} from "@/lib/auth"\n?', ''
    
    # Remove session check blocks
    $content = $content -replace 'const session = await auth\(\)[^}]*\}', ''
    
    # Remove session variable usage
    $content = $content -replace 'session\.user\.id', ''
    
    # Split content back into lines
    $lines = $content -split "`n"
    
    # Save the file
    $lines | Set-Content $_.FullName
}

Write-Host "Auth-related code has been removed from all files." 