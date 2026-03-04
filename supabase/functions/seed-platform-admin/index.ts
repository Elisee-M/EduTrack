import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = "elisee@admin.com";
  const password = "admin123456";

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(u => u.email === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Platform Admin" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    userId = data.user.id;
  }

  // Insert into platform_admins (ignore if exists)
  const { error: paError } = await supabaseAdmin
    .from("platform_admins")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  if (paError) return new Response(JSON.stringify({ error: paError.message }), { status: 400 });

  return new Response(JSON.stringify({ success: true, userId, email, note: "Default password: admin123456 — change it after first login" }));
});
