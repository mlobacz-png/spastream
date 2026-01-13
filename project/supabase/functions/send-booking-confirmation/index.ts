import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingConfirmationRequest {
  to: string;
  businessName: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  confirmationMessage: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, businessName, clientName, service, date, time, confirmationMessage }: BookingConfirmationRequest = await req.json();

    if (!to || !businessName || !clientName || !service || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { background: #f9fafb; padding: 40px 30px; }
            .content p { margin: 0 0 16px 0; color: #374151; }
            .booking-details { background: white; padding: 24px; border-radius: 8px; margin: 24px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .booking-details h2 { margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; font-size: 14px; }
            .detail-value { font-weight: 600; color: #111827; font-size: 14px; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 13px; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>${confirmationMessage}</p>
              
              <div class="booking-details">
                <h2>Appointment Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Business</span>
                  <span class="detail-value">${businessName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time</span>
                  <span class="detail-value">${time}</span>
                </div>
              </div>
              
              <p>If you need to reschedule or cancel, please contact us directly.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from ${businessName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "SpaStream <info@spastream.net>",
      to: [to],
      subject: `Booking Confirmed - ${businessName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Confirmation email sent successfully",
        emailId: data?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
