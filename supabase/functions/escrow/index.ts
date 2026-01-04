import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2";

// Configuration Escrow (doit être synchronisée avec le frontend si possible)
const ESCROW_CONFIG = {
  MIN_ORDER_AMOUNT: 500, // Montant minimum de commande (XOF)
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { orderId, buyerId, sellerId, amount, currency, paymentMethod, paymentReference } = await req.json();

    // 1. Vérification de l'authentification (via JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Le JWT est vérifié par Supabase Edge Functions automatiquement, 
    // mais nous devons créer le client avec le token pour RLS.
    const token = authHeader.split(" ")[1];
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // 2. Vérification des données
    if (amount < ESCROW_CONFIG.MIN_ORDER_AMOUNT) {
      return new Response(JSON.stringify({ error: `Montant minimum: ${ESCROW_CONFIG.MIN_ORDER_AMOUNT} ${currency}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Appel de la fonction RPC atomique
    const { data, error } = await supabase.rpc("initialize_escrow", {
      p_order_id: orderId,
      p_buyer_id: buyerId,
      p_seller_id: sellerId,
      p_amount: amount,
      p_currency: currency,
      p_payment_method: paymentMethod,
      p_payment_reference: paymentReference,
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
