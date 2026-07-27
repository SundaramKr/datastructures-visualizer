import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Validate a session token from the Authorization header.
 * Returns the authenticated user's email.
 * Throws a Response if validation fails.
 */
export async function validateSession(
  req: Request,
  supabase: SupabaseClient
): Promise<string> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new Response(
      JSON.stringify({ error: "Missing authorization token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabase.rpc("validate_session", {
    session_token: token,
  });

  if (error || !data) {
    throw new Response(
      JSON.stringify({ error: "Invalid or expired session token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return data as string; // returns user_email
}

/**
 * Create a Supabase client using environment variables.
 * Throws a Response if env vars are missing.
 */
export function getSupabaseClient(): SupabaseClient {
  const projectUrl = Deno.env.get("PROJECT_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!projectUrl || !serviceRoleKey) {
    throw new Response(
      JSON.stringify({ error: "Missing PROJECT_URL or SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
