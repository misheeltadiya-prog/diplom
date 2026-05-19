/**
 * Production checklist — env + health
 * Usage: node scripts/prod-check.mjs
 * Dev server ажиллаж байвал: BASE_URL=http://localhost:3000 node scripts/prod-check.mjs
 */
const base = process.env.BASE_URL?.trim() || "http://localhost:3000";

async function main() {
  console.log(`Checking ${base}/api/health ...`);
  try {
    const res = await fetch(`${base}/api/health`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    if (!res.ok) process.exitCode = 1;
  } catch (e) {
    console.error("Health check failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
}

main();
