import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  user_id: string;
  message: string;
}

interface ChatResponse {
  response: string;
  payment_mode?: boolean;
  payment_success?: boolean;
  intent?: string;
}

const generateResponse = (message: string): ChatResponse => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("balance") ||
    lowerMessage.includes("how much") ||
    lowerMessage.includes("account")
  ) {
    return {
      response:
        "Your current account balance is $5,234.50. You have $2,500 available credit.",
      intent: "CHECK_BALANCE",
    };
  }

  if (
    lowerMessage.includes("transaction") ||
    lowerMessage.includes("history") ||
    lowerMessage.includes("recent")
  ) {
    return {
      response:
        "Your recent transactions include: $50 to Amazon on Nov 22, $125.99 to Whole Foods on Nov 20, and $89.50 to Shell Gas on Nov 18.",
    };
  }

  if (
    lowerMessage.includes("payee") ||
    lowerMessage.includes("recipients")
  ) {
    return {
      response:
        "Your saved payees are: John Smith, Sarah Johnson, and Utility Company Inc. Would you like to add a new payee?",
    };
  }

  if (
    lowerMessage.includes("pay") ||
    lowerMessage.includes("send") ||
    lowerMessage.includes("transfer")
  ) {
    return {
      response:
        "I can help you send a payment. Who would you like to pay? You can say a name or amount.",
      payment_mode: true,
    };
  }

  if (
    lowerMessage.includes("$") ||
    /\d+/.test(lowerMessage)
  ) {
    return {
      response:
        "Payment of $50 to John Smith confirmed. The transfer will complete within 1-2 business days.",
      payment_success: true,
    };
  }

  return {
    response:
      "I can help you with account balances, transaction history, payees, and payments. What would you like to know?",
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { user_id, message }: ChatRequest = await req.json();

    if (!user_id || !message) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or message" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const chatResponse = generateResponse(message);

    return new Response(JSON.stringify(chatResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
