"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { FileText, Plus, Download, Eye, Trash2, DollarSign, Send } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-generator";
import { PaymentCollection } from "@/components/payment-collection";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface LineItem {
  service: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  client_id: string;
  clients?: { name: string };
  line_items: LineItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes: string;
}

const services = [
  { name: "Botox", price: 400 },
  { name: "Dermal Fillers", price: 650 },
  { name: "Chemical Peel", price: 150 },
  { name: "Microneedling", price: 300 },
  { name: "Laser Hair Removal", price: 250 },
  { name: "Hydrafacial", price: 200 },
  { name: "IV Therapy", price: 175 },
  { name: "Consultation", price: 100 },
];

export function InvoicesSection() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const [newInvoice, setNewInvoice] = useState({
    client_id: "",
    due_date: "",
    line_items: [{ service: "", quantity: 1, price: 0, total: 0 }] as LineItem[],
    notes: "",
    discount_amount: 0,
  });

  useEffect(() => {
    console.log('InvoicesSection - user changed:', user ? 'User present' : 'No user', user?.id);
    if (user) {
      fetchData();
    } else {
      console.log('InvoicesSection - No user, not fetching data');
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Debug: Check if session exists
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session access token:', session?.access_token);

    const [invoicesRes, clientsRes, settingsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, email, phone").eq("user_id", user.id),
      supabase.from("payment_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    console.log('Invoices error:', invoicesRes.error);
    console.log('Clients error:', clientsRes.error);

    if (invoicesRes.data) setInvoices(invoicesRes.data as any);
    if (clientsRes.data) setClients(clientsRes.data);
    if (settingsRes.data) setPaymentSettings(settingsRes.data);

    setLoading(false);
  };

  const calculateInvoiceTotal = (lineItems: LineItem[], discountAmount: number) => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = paymentSettings?.tax_rate || 0;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, totalAmount };
  };

  const addLineItem = () => {
    setNewInvoice({
      ...newInvoice,
      line_items: [...newInvoice.line_items, { service: "", quantity: 1, price: 0, total: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    const items = newInvoice.line_items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, line_items: items });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const items = [...newInvoice.line_items];
    items[index] = { ...items[index], [field]: value };

    if (field === "service") {
      const service = services.find((s) => s.name === value);
      if (service) {
        items[index].price = service.price;
        items[index].total = service.price * items[index].quantity;
      }
    } else if (field === "quantity" || field === "price") {
      items[index].total = items[index].price * items[index].quantity;
    }

    setNewInvoice({ ...newInvoice, line_items: items });
  };

  const handleCreateInvoice = async () => {
    if (!user || !newInvoice.client_id) {
      alert("Please select a client");
      return;
    }

    if (newInvoice.line_items.length === 0 || !newInvoice.line_items[0].service) {
      alert("Please add at least one service");
      return;
    }

    try {
      const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotal(
        newInvoice.line_items,
        newInvoice.discount_amount
      );

      const invoiceNumberRes = await supabase.rpc("generate_invoice_number");

      if (invoiceNumberRes.error) {
        console.error("Error generating invoice number:", invoiceNumberRes.error);
      }

      const invoiceNumber = invoiceNumberRes.data || `INV-${Date.now()}`;

      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        client_id: newInvoice.client_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: newInvoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "draft",
        line_items: newInvoice.line_items,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: newInvoice.discount_amount,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        notes: newInvoice.notes,
      });

      if (error) {
        console.error("Error creating invoice:", error);
        alert(`Failed to create invoice: ${error.message}`);
        return;
      }

      await fetchData();
      setDialogOpen(false);
      setNewInvoice({
        client_id: "",
        due_date: "",
        line_items: [{ service: "", quantity: 1, price: 0, total: 0 }],
        notes: "",
        discount_amount: 0,
      });

      alert("Invoice created successfully!");
    } catch (err: any) {
      console.error("Unexpected error:", err);
      alert(`An error occurred: ${err.message}`);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.client_id);
    if (!client) return;

    generateInvoicePDF(invoice, client, paymentSettings);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    await supabase.from("invoices").delete().eq("id", id);
    fetchData();
  };

  const handleSendPaymentLink = async (invoice: Invoice) => {
    console.log("=== SEND PAYMENT LINK CLICKED ===");
    console.log("handleSendPaymentLink called for invoice:", invoice.id);
    console.log("Payment settings:", paymentSettings);

    if (!paymentSettings?.stripe_secret_key) {
      alert("Please configure Stripe in Payment Settings first.");
      return;
    }

    const client = clients.find((c) => c.id === invoice.client_id);
    console.log("Client found:", client);

    if (!client?.email) {
      alert("Client email is required to send payment link.");
      return;
    }

    console.log("Starting payment link request...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please sign in again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-payment-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ invoiceId: invoice.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Payment link error response:", result);
        throw new Error(result.error || "Failed to send payment link");
      }

      console.log("Payment link result:", result);

      // Show the payment URL in a copyable dialog
      const expiresDate = result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : "7 days";
      const message = `Payment link created!\n\nURL: ${result.paymentUrl}\n\nExpires: ${expiresDate}\n\nAn email has been sent to ${client.email}`;

      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.paymentUrl);
        alert(`${message}\n\n✓ Link copied to clipboard!`);
      } else {
        alert(message);
      }
    } catch (error: any) {
      console.error("Error sending payment link:", error);
      alert(`Failed to send payment link: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const totals = {
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    totalOutstanding: invoices
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce((sum, i) => sum + i.balance_due, 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{totals.draft}</div>
            <div className="text-sm text-gray-500">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{totals.sent}</div>
            <div className="text-sm text-gray-500">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totals.paid}</div>
            <div className="text-sm text-gray-500">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{totals.overdue}</div>
            <div className="text-sm text-gray-500">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-cyan-600">
              ${totals.totalOutstanding.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Outstanding</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={newInvoice.client_id}
                  onValueChange={(val) => setNewInvoice({ ...newInvoice, client_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Line Items</Label>
                  <Button size="sm" variant="outline" onClick={addLineItem}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Item
                  </Button>
                </div>

                {newInvoice.line_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Select
                        value={item.service}
                        onValueChange={(val) => updateLineItem(index, "service", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.name} value={service.name}>
                              {service.name} (${service.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, "quantity", parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateLineItem(index, "price", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input value={`$${item.total.toFixed(2)}`} disabled />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLineItem(index)}
                      className="col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Discount Amount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newInvoice.discount_amount}
                  onChange={(e) =>
                    setNewInvoice({
                      ...newInvoice,
                      discount_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  placeholder="Additional notes for this invoice..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {(() => {
                  const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotal(
                    newInvoice.line_items,
                    newInvoice.discount_amount
                  );
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {newInvoice.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-${newInvoice.discount_amount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax ({((paymentSettings?.tax_rate || 0) * 100).toFixed(1)}%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice} disabled={!newInvoice.client_id}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {invoice.clients?.name} • Due {invoice.due_date}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span>Total: ${invoice.total_amount.toFixed(2)}</span>
                    <span>Paid: ${invoice.amount_paid.toFixed(2)}</span>
                    <span className="font-semibold">
                      Balance: ${invoice.balance_due.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {invoice.balance_due > 0 && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInvoiceForPayment(invoice);
                          setPaymentDialogOpen(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Collect Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendPaymentLink(invoice)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send Payment Link
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(invoice)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteInvoice(invoice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {invoices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No invoices yet. Create your first invoice!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedInvoiceForPayment && (
        <PaymentCollection
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          clientId={selectedInvoiceForPayment.client_id}
          clientName={selectedInvoiceForPayment.clients?.name || "Unknown Client"}
          amount={selectedInvoiceForPayment.balance_due}
          invoiceId={selectedInvoiceForPayment.id}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
