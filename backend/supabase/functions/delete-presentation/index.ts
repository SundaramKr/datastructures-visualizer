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

  let body: { presentation_id?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  const { presentation_id } = body;
  if (!presentation_id) {
    return json(400, { error: "Missing required field: presentation_id" });
  }

  // Verify user owns the presentation
  const { data: pres, error: presError } = await supabase
    .from("presentations")
    .select("user_id")
    .eq("id", presentation_id)
    .single();

  if (presError || !pres) return json(404, { error: "Presentation not found" });
  if (pres.user_id !== userEmail) return json(403, { error: "Not authorized" });

  // Delete (slide_configs cascade via FK)
  const { error } = await supabase
    .from("presentations")
    .delete()
    .eq("id", presentation_id);

  if (error) return json(500, { error: error.message });

  return json(200, { ok: true });
});
