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

  let body: {
    presentation_id?: string;
    slide_number?: number;
    visualizer_type?: string;
    visualizer_config?: any;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  const { presentation_id, slide_number, visualizer_type, visualizer_config } = body;
  // Fix: use == null instead of !slide_number to allow slide_number === 0
  if (!presentation_id || slide_number == null) {
    return json(400, { error: "Missing required fields: presentation_id, slide_number" });
  }

  // Verify user owns the presentation
  const { data: pres, error: presError } = await supabase
    .from("presentations")
    .select("user_id")
    .eq("id", presentation_id)
    .single();

  if (presError || !pres) return json(404, { error: "Presentation not found" });
  if (pres.user_id !== userEmail) return json(403, { error: "Not authorized" });

  // Upsert slide config
  const { data, error } = await supabase
    .from("slide_configs")
    .upsert({
      presentation_id,
      slide_number,
      visualizer_type: visualizer_type || null,
      visualizer_config: visualizer_config || null,
    }, {
      onConflict: "presentation_id,slide_number"
    })
    .select()
    .single();

  if (error) return json(500, { error: error.message });

  return json(200, { ok: true, slide_config: data });
});
