import { corsHeaders } from "../_shared/cors.ts";
import { validateSession, getSupabaseClient } from "../_shared/auth.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Use POST" });

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (resp) {
    return resp as Response;
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return json(401, { error: "Missing authorization token" });
  }

  try {
    // Ensure the token is valid before revoking (optional but good practice)
    await validateSession(req, supabase);
  } catch (resp) {
    // If it's invalid/expired, we'll still proceed to ensure it's deleted
  }

  const { error } = await supabase.rpc("revoke_session", { session_token: token });

  if (error) {
    return json(500, { error: error.message });
  }

  return json(200, { ok: true, message: "Logged out successfully" });
});
