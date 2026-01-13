"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, AlertCircle, Loader2, CreditCard } from "lucide-react";

interface PaymentLink {
  id: string;
  amount: number;
  status: string;
  expires_at: string;
  client_id: string;
  user_id: string;
  invoices: {
    id: string;
    invoice_number: string;
    due_date: string;
    line_items: any[];
  };
  clients: {
    id: string;
    name: string;
    email: string;
  };
  business_information?: {
    business_name: string;
  };
}

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  useEffect(() => {
    fetchPaymentLink();
  }, [token]);

  const fetchPaymentLink = async () => {
    try {
      console.log("=== FETCHING PAYMENT LINK ===");
      console.log("Token:", token);

      const { data, error } = await supabase
        .from("payment_links")
        .select(`
          *,
          invoices (
            invoice_number,
            due_date,
            line_items
          ),
          clients (
            name,
            email
          )
        `)
        .eq("unique_token", token)
        .maybeSingle();

      console.log("Query result:", { data, error });

      if (error || !data) {
        console.log("Error or no data found:", error);
        setError("Payment link not found");
        setLoading(false);
        return;
      }

      // Fetch business information separately
      const { data: businessInfo } = await supabase
        .from("business_information")
        .select("business_name")
        .eq("user_id", data.user_id)
        .maybeSingle();

      // Add business info to the data
      if (businessInfo) {
        (data as any).business_information = businessInfo;
      }

      if (data.status === "paid") {
        setPaymentSuccess(true);
        setLoading(false);
        return;
      }

      if (data.status === "expired" || new Date(data.expires_at) < new Date()) {
        setError("This payment link has expired");
        setLoading(false);
        return;
      }

      if (data.status === "cancelled") {
        setError("This payment link has been cancelled");
        setLoading(false);
        return;
      }

      setPaymentLink(data as any);
      setLoading(false);
    } catch (err: any) {
      setError("Failed to load payment information");
      setLoading(false);
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
    setCardDetails({ ...cardDetails, number: formatted.slice(0, 19) });
  };

  const handleExpiryChange = (value: string) => {
    let formatted = value.replace(/\D/g, "");
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
    }
    setCardDetails({ ...cardDetails, expiry: formatted.slice(0, 5) });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentLink) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-payment-public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: paymentLink.amount,
            clientId: paymentLink.client_id,
            clientEmail: paymentLink.clients.email,
            invoiceId: paymentLink.invoices.id,
            description: `Payment for Invoice #${paymentLink.invoices.invoice_number}`,
            paymentLinkId: paymentLink.id,
            cardDetails: {
              number: cardDetails.number.replace(/\s/g, ""),
              exp_month: cardDetails.expiry.split("/")[0],
              exp_year: cardDetails.expiry.split("/")[1],
              cvc: cardDetails.cvc,
              name: cardDetails.name,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment failed");
      }

      setPaymentSuccess(true);
    } catch (err: any) {
      setError(err.message || "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const businessName = paymentLink?.business_information?.business_name || "Business";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Thank you for your payment. You will receive a confirmation email shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Unable to Process Payment</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentLink) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{businessName}</h1>
          <p className="text-gray-600">Secure Payment</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-semibold">{paymentLink.invoices.invoice_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Client:</span>
                <span className="font-semibold">{paymentLink.clients.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold">
                  {new Date(paymentLink.invoices.due_date).toLocaleDateString()}
                </span>
              </div>

              {paymentLink.invoices.line_items && paymentLink.invoices.line_items.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Services:</h4>
                  {paymentLink.invoices.line_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">
                        {item.service} x {item.quantity}
                      </span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Amount Due:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${paymentLink.amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cardholder Name</Label>
                  <Input
                    id="name"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Card Number</Label>
                  <Input
                    id="number"
                    value={cardDetails.number}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      value={cardDetails.expiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      type="text"
                      value={cardDetails.cvc}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>Pay ${paymentLink.amount.toFixed(2)}</>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Your payment is secured with 256-bit SSL encryption
                </p>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>
              Link expires on {new Date(paymentLink.expires_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
