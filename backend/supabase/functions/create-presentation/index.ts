// deno-lint-ignore-file
import { corsHeaders } from "../_shared/cors.ts";
import { isAllowedEmail } from "../_shared/email.ts";
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

  if (!isAllowedEmail(userEmail)) {
    return json(403, { error: "Only @bmsce.ac.in email addresses are allowed" });
  }

  let body: { 
    title?: string; 
    description?: string; 
    google_slides_url?: string;
    visualizer_type?: string;
    visualizer_config?: any;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  const { title, description, google_slides_url, visualizer_type, visualizer_config } = body;
  if (!title || !google_slides_url) {
    return json(400, { error: "Missing required fields: title, google_slides_url" });
  }

  // Validate Google Slides URL format
  const googleSlidesPattern = /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/;
  if (!googleSlidesPattern.test(google_slides_url)) {
    return json(400, { error: "Invalid Google Slides URL format" });
  }

  const { data, error } = await supabase
    .from("presentations")
    .insert({
      user_id: userEmail,
      title,
      description: description || null,
      google_slides_url,
    })
    .select()
    .single();

  if (error) return json(500, { error: error.message });

  // If provided, automatically create the first slide configuration
  if (visualizer_type) {
    const { error: slideError } = await supabase
      .from("slide_configs")
      .insert({
        presentation_id: data.id,
        slide_number: 0,
        visualizer_type: visualizer_type,
        visualizer_config: visualizer_config || null
      });
      
    if (slideError) console.error("Failed to insert slide config:", slideError);
  }

  return json(201, { ok: true, presentation: data });
});
