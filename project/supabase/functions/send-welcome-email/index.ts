import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailPayload {
  email: string;
  name?: string;
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
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload: WelcomeEmailPayload = await req.json();
    const { email, name } = payload;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const displayName = name || "there";

    const emailContent = {
      from: "SpaStream <info@spastream.net>",
      to: [email],
      subject: "Welcome to SpaStream - Your Account is Live!",
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 40px 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .feature-list {
                list-style: none;
                padding: 0;
                margin: 20px 0;
              }
              .feature-list li {
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
              }
              .feature-list li:before {
                content: "✓";
                color: #667eea;
                font-weight: bold;
                margin-right: 10px;
              }
              .footer {
                text-align: center;
                padding: 30px 20px;
                color: #6b7280;
                font-size: 14px;
                background: #f9fafb;
                border-radius: 0 0 8px 8px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to SpaStream!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px;">Hi ${displayName},</p>

              <p>Congratulations! Your SpaStream account is now <strong>live and ready</strong> to transform how you manage your med spa business.</p>
              
              <p>You now have access to all the powerful features designed to streamline your operations:</p>
              
              <ul class="feature-list">
                <li><strong>Client Management</strong> - Keep all client information organized in one place</li>
                <li><strong>Smart Scheduling</strong> - Manage appointments with ease</li>
                <li><strong>AI-Powered Insights</strong> - Get intelligent recommendations for treatments and pricing</li>
                <li><strong>Online Booking</strong> - Let clients book appointments 24/7</li>
                <li><strong>Marketing Automation</strong> - Engage clients with automated campaigns</li>
                <li><strong>Revenue Tracking</strong> - Monitor your business growth in real-time</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "https://kviciiartofmqbsbrqii.supabase.co"}/app" class="button">Get Started Now</a>
              </div>
              
              <p style="margin-top: 30px;">Need help getting started? Check out our <a href="#" style="color: #667eea;">onboarding guide</a> or reach out to our support team anytime.</p>
              
              <p>Here's to your success!</p>

              <p style="margin-top: 30px;">
                <strong>The SpaStream Team</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Empowering med spas with intelligent business management</span>
              </p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you signed up for SpaStream.</p>
              <p style="margin-top: 10px;">
                <a href="#" style="color: #667eea; margin: 0 10px;">Help Center</a> |
                <a href="#" style="color: #667eea; margin: 0 10px;">Contact Support</a>
              </p>
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
    console.error("Error sending welcome email:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
