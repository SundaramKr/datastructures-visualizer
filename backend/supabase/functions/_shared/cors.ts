// CORS origin — set ALLOWED_ORIGIN env var in production, defaults to * for development
const allowedOrigin = typeof Deno !== "undefined"
  ? (Deno.env.get("ALLOWED_ORIGIN") || "*")
  : "*";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
