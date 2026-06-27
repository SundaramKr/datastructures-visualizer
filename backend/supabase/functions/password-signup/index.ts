// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { corsHeaders } from "../_shared/cors.ts";
import {
  emailDomainError,
  isAllowedEmail,
  normalizeEmail,
} from "../_shared/email.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json(405, { error: "Use POST" });

    let body: { email?: string; name?: string | null; password?: string };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Body must be JSON" });
    }

    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password;
    if (!email) return json(400, { error: "Missing email" });
    if (!isAllowedEmail(email)) return json(403, { error: emailDomainError() });
    if (!password || typeof password !== "string" || password.length < 6) {
      return json(400, { error: "Password must be at least 6 characters" });
    }

    const projectUrl = Deno.env.get("PROJECT_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
    if (!projectUrl || !serviceRoleKey) {
      return json(500, { error: "Missing PROJECT_URL or SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(projectUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const bcryptLib: any = (bcrypt as any).default ?? bcrypt;
    const passwordHash = await bcryptLib.hash(password, 10);
    const row: Record<string, unknown> = {
      email,
      password_hash: passwordHash,
    };
    if (typeof body.name !== "undefined") row.name = body.name?.trim() || null;

    const { error } = await supabase.from("users").upsert(row, { onConflict: "email" });
    if (error) return json(500, { error: error.message });

    return json(200, { ok: true, email, name: row.name ?? null });
  } catch (err) {
    return json(500, {
      error: "Unhandled exception",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});
