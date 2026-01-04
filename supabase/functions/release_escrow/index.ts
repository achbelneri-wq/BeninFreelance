import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { orderId } = await req.json();

    // 1. Vérification de l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const token = authHeader.split(" ")[1];
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // 2. Récupérer l'ID de l'utilisateur connecté (celui qui libère)
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Nous devons récupérer l'ID interne (integer) de l'utilisateur à partir de son UUID (auth.uid())
    const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id');
    if (userIdError || !userIdData) {
        console.error("Error getting user ID:", userIdError);
        return new Response(JSON.stringify({ error: "Could not retrieve internal user ID" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
    const releasedByUserId = userIdData;

    // 3. Appel de la fonction RPC atomique
    const { data, error } = await supabase.rpc("release_escrow", {
      p_order_id: orderId,
      p_released_by: releasedByUserId,
    });

    if (error) {
      console.error("RPC Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
