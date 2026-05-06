export function isDemoLoginEnabled() {
  if (process.env.DEMO_LOGIN_ENABLED === "1" || process.env.DEMO_LOGIN_ENABLED === "true") {
    return true;
  }
  return false;
}

