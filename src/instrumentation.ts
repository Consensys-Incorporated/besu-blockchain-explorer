// Structured (pino) logging for the Next.js server, configured in next-logger.config.js.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("pino");
    await import("next-logger");
  }
}
