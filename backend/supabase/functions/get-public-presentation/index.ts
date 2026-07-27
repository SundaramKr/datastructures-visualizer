// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Use POST" });

  let body: { share_token?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  const { share_token } = body;
  if (!share_token) {
    return json(400, { error: "Missing required field: share_token" });
  }

  const projectUrl = Deno.env.get("PROJECT_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceRoleKey) {
    return json(500, { error: "Missing PROJECT_URL or SERVICE_ROLE_KEY" });
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .rpc("get_presentation_by_token", { token: share_token });

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: "Presentation not found" });

  return json(200, { ok: true, presentation: data });
});
