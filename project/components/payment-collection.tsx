"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { DollarSign, CheckCircle, CreditCard } from "lucide-react";

interface PaymentCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  amount?: number;
  appointmentId?: string;
  packageId?: string;
  invoiceId?: string;
  onSuccess?: () => void;
}

export function PaymentCollection({
  open,
  onOpenChange,
  clientId,
  clientName,
  amount = 0,
  appointmentId,
  packageId,
  invoiceId,
  onSuccess,
}: PaymentCollectionProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [transactionType, setTransactionType] = useState<"payment" | "deposit" | "refund">(
    "payment"
  );
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [processingFee, setProcessingFee] = useState(0);
  const [totalWithFee, setTotalWithFee] = useState(0);

  useEffect(() => {
    if (user && open) {
      fetchPaymentSettings();
    }
  }, [user, open]);

  useEffect(() => {
    setPaymentAmount(amount);
  }, [amount]);

  useEffect(() => {
    if (paymentSettings && paymentMethod === 'card' && paymentSettings.pass_processing_fees) {
      const feePercentage = paymentSettings.processing_fee_percentage / 100;
      const feeFixed = paymentSettings.processing_fee_fixed;
      const calculatedFee = (paymentAmount * feePercentage) + feeFixed;
      setProcessingFee(calculatedFee);
      setTotalWithFee(paymentAmount + calculatedFee);
    } else {
      setProcessingFee(0);
      setTotalWithFee(paymentAmount);
    }
  }, [paymentAmount, paymentMethod, paymentSettings]);

  const fetchPaymentSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setPaymentSettings(data);
      const methods = data.payment_methods || [];
      if (methods.length > 0) {
        setPaymentMethod(methods[0]);
      }
    }
  };

  const handleCollectPayment = async () => {
    if (!user || paymentAmount <= 0) return;

    setProcessing(true);

    const finalAmount = paymentMethod === 'card' && paymentSettings?.pass_processing_fees
      ? totalWithFee
      : paymentAmount;

    const transactionData = {
      user_id: user.id,
      client_id: clientId,
      invoice_id: invoiceId || null,
      appointment_id: appointmentId || null,
      package_id: packageId || null,
      transaction_type: transactionType,
      payment_method: paymentMethod,
      amount: finalAmount,
      processing_fee_amount: paymentMethod === 'card' ? processingFee : 0,
      status: "completed",
      notes: notes,
      processed_at: new Date().toISOString(),
    };

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionData);

    if (!transactionError) {
      if (invoiceId) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("amount_paid, total_amount")
          .eq("id", invoiceId)
          .single();

        if (invoice) {
          const newAmountPaid = invoice.amount_paid + paymentAmount;
          await supabase
            .from("invoices")
            .update({
              amount_paid: newAmountPaid,
              balance_due: invoice.total_amount - newAmountPaid,
            })
            .eq("id", invoiceId);
        }
      }

      if (packageId) {
        const { data: packagePayment } = await supabase
          .from("package_payments")
          .select("amount_paid, total_amount")
          .eq("package_id", packageId)
          .single();

        if (packagePayment) {
          const newAmountPaid = packagePayment.amount_paid + paymentAmount;
          await supabase
            .from("package_payments")
            .update({
              amount_paid: newAmountPaid,
              balance_due: packagePayment.total_amount - newAmountPaid,
            })
            .eq("package_id", packageId);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
        if (onSuccess) onSuccess();
        setNotes("");
      }, 2000);
    }

    setProcessing(false);
  };

  const availablePaymentMethods = paymentSettings?.payment_methods || ["card", "cash", "check"];
  const isStripeConfigured = paymentSettings?.stripe_publishable_key && paymentSettings?.stripe_secret_key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Collect Payment
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Payment Recorded!</h3>
            <p className="text-gray-500">
              ${paymentAmount.toFixed(2)} received from {clientName}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Client:</span> {clientName}
              </p>
              {amount > 0 && (
                <p className="text-sm text-blue-900 mt-1">
                  <span className="font-semibold">Amount Due:</span> ${amount.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={(val: any) => setTransactionType(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Full Payment</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentMethods.includes("card") && (
                    <SelectItem value="card">
                      Credit/Debit Card {!isStripeConfigured && "(Setup Required)"}
                    </SelectItem>
                  )}
                  {availablePaymentMethods.includes("cash") && (
                    <SelectItem value="cash">Cash</SelectItem>
                  )}
                  {availablePaymentMethods.includes("check") && (
                    <SelectItem value="check">Check</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {paymentMethod === "card" && !isStripeConfigured && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Configure Stripe in Payment Settings to accept card payments online
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {paymentMethod === 'card' && paymentSettings?.pass_processing_fees && processingFee > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-amber-900">Fee Breakdown</p>
                <div className="text-xs text-amber-800 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Service amount:</span>
                    <span>${paymentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing fee ({paymentSettings.processing_fee_percentage}% + ${paymentSettings.processing_fee_fixed}):</span>
                    <span>${processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-amber-300 pt-0.5 mt-1">
                    <span>Total charge:</span>
                    <span>${totalWithFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleCollectPayment} disabled={processing || paymentAmount <= 0}>
                {processing ? "Processing..." : `Record Payment: $${totalWithFee.toFixed(2)}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
