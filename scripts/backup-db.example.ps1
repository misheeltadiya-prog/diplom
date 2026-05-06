# Жишээ: prod MySQL нөөцлөлт. Өөрийн холболтын мэдээллийг оруулна уу.
# mysqldump хэрэгтэй (MySQL client).
$env:MYSQL_HOST = "your-db.host"
$env:MYSQL_USER = "your_user"
$env:MYSQL_PASSWORD = "your_pass"
$env:MYSQL_DATABASE = "zeel_platform"
$out = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

mysqldump -h $env:MYSQL_HOST -u $env:MYSQL_USER -p"$env:MYSQL_PASSWORD" `
  --single-transaction --routines --triggers `
  $env:MYSQL_DATABASE | Out-File -Encoding utf8 $out

Write-Host "Wrote $out"
