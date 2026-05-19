# Stripe орчны жишээ. Дараахыг хий:
#   Copy-Item scripts\dev-stripe-env.example.ps1 scripts\dev-stripe-env.ps1
# Дараа нь dev-stripe-env.ps1 дотор зөвхөн ӨӨРИЙН утгуудыг нэг мөрөөр бөглөнө.
# scripts\dev-stripe-env.ps1 нь .gitignore-д — Git-д commit хийхгүй.
#
# Ажиллуулах (энэ terminal-оос дараа нь):
#   . .\scripts\dev-stripe-env.ps1
#   npm run dev

$env:STRIPE_SECRET_KEY = "sk_test_REPLACE_ME_FULL_SINGLE_LINE_NO_NEWLINE"
$env:STRIPE_WEBHOOK_SECRET = "whsec_REPLACE_ME_FULL_SINGLE_LINE"
$env:STRIPE_PRICE_ID_PRO = "price_REPLACE_ME"
$env:STRIPE_PRICE_ID_BUSINESS = "price_REPLACE_ME"
# Шаардлагатай бол:
# $env:NEXT_PUBLIC_APP_URL = "http://localhost:3001"
