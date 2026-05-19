export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvValidation } = await import("@/lib/env");
    logEnvValidation();
  }
}
