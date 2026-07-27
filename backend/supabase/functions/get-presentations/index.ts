// deno-lint-ignore-file
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

  // Authenticate via session token
  let userEmail: string;
  try {
    userEmail = await validateSession(req, supabase);
  } catch (resp) {
    return resp as Response;
  }

  const { data, error } = await supabase
    .rpc("get_user_presentations", { user_email: userEmail });

  if (error) return json(500, { error: error.message });

  return json(200, { ok: true, presentations: data });
});
