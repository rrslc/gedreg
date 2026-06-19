import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar que o usuário solicitante é admin
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Não autorizado");

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) throw new Error("Não autorizado");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("perfil")
      .eq("id", user.id)
      .single();

    if (profile?.perfil !== "admin") throw new Error("Acesso negado: apenas administradores");

    const { action, userData } = await req.json();
    let result;

    if (action === "create") {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.senha,
        email_confirm: true,
        user_metadata: { nome: userData.nome, perfil: userData.perfil },
      });
      if (error) throw error;
      result = { id: data.user.id };

    } else if (action === "update") {
      const updates: Record<string, unknown> = {
        user_metadata: { nome: userData.nome, perfil: userData.perfil },
      };
      if (userData.senha) updates.password = userData.senha;
      if (userData.email) updates.email = userData.email;

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.id, updates);
      if (error) throw error;

      await supabaseAdmin
        .from("profiles")
        .update({ nome: userData.nome, email: userData.email, perfil: userData.perfil })
        .eq("id", userData.id);

      result = { success: true };

    } else if (action === "delete") {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userData.id);
      if (error) throw error;
      result = { success: true };

    } else {
      throw new Error("Ação desconhecida");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const status = err.message.includes("Acesso negado") ? 403 : 400;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
