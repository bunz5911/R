/**
 * 신규 회원 가입 시 슈퍼바이저(bunz5911@gmail.com)에게 이메일 알림
 * 환경 변수: RESEND_API_KEY (Supabase Dashboard → Edge Functions → Secrets)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPERVISOR_EMAIL = "bunz5911@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const userId = body.user_id as string | undefined;

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error } = await admin
      .from("community_profiles")
      .select("id, email, display_name, status, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      return new Response(JSON.stringify({ error: "profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.status !== "pending") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailSent = false;

    if (RESEND_API_KEY) {
      const communityUrl = body.community_url || "https://github.com/bunz5911/R";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Storynara Community <onboarding@resend.dev>",
          to: [SUPERVISOR_EMAIL],
          subject: `[Storynara] 새 커뮤니티 가입 승인 요청 — ${profile.display_name}`,
          html: `
            <h2>새 회원 가입 승인 요청</h2>
            <p><strong>표시 이름:</strong> ${profile.display_name}</p>
            <p><strong>이메일:</strong> ${profile.email}</p>
            <p><strong>가입 시각:</strong> ${profile.created_at}</p>
            <p>커뮤니티 페이지에 로그인하여 승인·거절할 수 있습니다.</p>
            <p><a href="${communityUrl}">커뮤니티 열기</a></p>
          `,
        }),
      });

      emailSent = res.ok;
    }

    return new Response(
      JSON.stringify({ ok: true, emailSent, supervisor: SUPERVISOR_EMAIL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
