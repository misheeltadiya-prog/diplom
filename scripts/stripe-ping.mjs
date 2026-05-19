#!/usr/bin/env node
/**
 * Next-ээс тусдаа: Node + IPv4-ээр api.stripe.com руу шууд HTTPS.
 * Ашиглах:
 *   set STRIPE_SECRET_KEY=sk_test_...   (cmd)
 *   $env:STRIPE_SECRET_KEY="sk_test_..." ; node scripts/stripe-ping.mjs   (PowerShell)
 */
import https from "node:https";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("STRIPE_SECRET_KEY байхгүй. PowerShell: $env:STRIPE_SECRET_KEY=\"sk_test_...\"");
  process.exit(1);
}

const opts = {
  hostname: "api.stripe.com",
  port: 443,
  path: "/v1/balance",
  method: "GET",
  agent: new https.Agent({ family: 4 }),
  headers: {
    Authorization: `Bearer ${key}`,
    "User-Agent": "diplom2-stripe-ping/1",
  },
};

const req = https.request(opts, (res) => {
  let body = "";
  res.on("data", (c) => {
    body += c;
  });
  res.on("end", () => {
    console.log("status:", res.statusCode);
    console.log(body.slice(0, 500));
    // 200 = OK; 401 = түлхүүр буруу гэх мэт — сүлжээний хувьд Stripe хүрсэн.
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error("HTTPS алдаа:", err.message);
  process.exit(1);
});

req.end();
