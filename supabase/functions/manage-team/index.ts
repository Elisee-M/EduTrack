import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { action, school_id, email, role, user_role_id } = await req.json();

    // Verify caller is admin/super_admin of the school
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("school_id", school_id)
      .maybeSingle();

    if (!callerRole || !["super_admin", "admin"].includes(callerRole.role)) {
      return new Response(JSON.stringify({ error: "Only admins can manage team members" }), { status: 403, headers: corsHeaders });
    }

    if (action === "invite") {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

      if (existingUser) {
        // Check if already has a role in this school
        const { data: existingRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", existingUser.id)
          .eq("school_id", school_id)
          .maybeSingle();

        if (existingRole) {
          return new Response(JSON.stringify({ error: "User already has a role in this school" }), { status: 400, headers: corsHeaders });
        }

        // Add role directly
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: existingUser.id,
          school_id,
          role,
        });

        if (roleError) return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers: corsHeaders });

        // Update invitation status if exists
        await supabaseAdmin
          .from("school_invitations")
          .upsert({ school_id, email, role, invited_by: user.id, status: "accepted" }, { onConflict: "school_id,email" });

        return new Response(JSON.stringify({ message: "User added to school", status: "added" }), { headers: corsHeaders });
      } else {
        // Save as pending invitation
        const { error: invError } = await supabaseAdmin
          .from("school_invitations")
          .upsert({ school_id, email, role, invited_by: user.id, status: "pending" }, { onConflict: "school_id,email" });

        if (invError) return new Response(JSON.stringify({ error: invError.message }), { status: 400, headers: corsHeaders });

        return new Response(JSON.stringify({ message: "Invitation saved. User will be added when they sign up.", status: "pending" }), { headers: corsHeaders });
      }
    }

    if (action === "update_role") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("id", user_role_id)
        .eq("school_id", school_id);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      return new Response(JSON.stringify({ message: "Role updated" }), { headers: corsHeaders });
    }

    if (action === "remove") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("id", user_role_id)
        .eq("school_id", school_id);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      return new Response(JSON.stringify({ message: "Member removed" }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
