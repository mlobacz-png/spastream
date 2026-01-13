import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignupNotificationPayload {
  user_email: string;
  plan_name: string;
  plan_price: number;
  status: string;
  trial_ends_at?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL is not configured");
    }

    const payload: SignupNotificationPayload = await req.json();
    const { user_email, plan_name, plan_price, status, trial_ends_at } = payload;

    const priceFormatted = `$${(plan_price / 100).toFixed(2)}`;
    const trialInfo = trial_ends_at
      ? `<p><strong>Trial Ends:</strong> ${new Date(trial_ends_at).toLocaleDateString()}</p>`
      : '';

    const emailContent = {
      from: "SpaStream <info@spastream.net>",
      to: [adminEmail],
      subject: `New Signup: ${plan_name} - ${user_email}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .detail-box {
                background: #f9fafb;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #10b981;
              }
              .detail-box p {
                margin: 8px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #6b7280;
                font-size: 14px;
                background: #f9fafb;
                border-radius: 0 0 8px 8px;
              }
              .badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
              }
              .badge-active {
                background: #d1fae5;
                color: #065f46;
              }
              .badge-trialing {
                background: #dbeafe;
                color: #1e40af;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 New Subscriber!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">
                A new user just signed up for SpaStream!
              </p>

              <div class="detail-box">
                <p><strong>Email:</strong> ${user_email}</p>
                <p><strong>Plan:</strong> ${plan_name}</p>
                <p><strong>Price:</strong> ${priceFormatted}/month</p>
                <p><strong>Status:</strong> <span class="badge badge-${status === 'active' ? 'active' : 'trialing'}">${status}</span></p>
                ${trialInfo}
                <p><strong>Signed Up:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                You can view all subscribers in your admin dashboard.
              </p>
            </div>
            <div class="footer">
              <p>SpaStream Admin Notification</p>
            </div>
          </body>
        </html>
      `,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailContent),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending signup notification:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
