'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Package, AlertTriangle, TrendingDown, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_type: string;
  current_quantity: number;
  min_quantity: number;
  reorder_quantity: number;
  unit_cost: number;
  supplier_name: string;
  supplier_contact: string;
  expiration_date: string;
  lot_number: string;
  storage_location: string;
  notes: string;
  is_active: boolean;
}

interface Transaction {
  id: string;
  product_id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reason: string;
  transaction_date: string;
}

export function InventorySection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Botox',
    unit_type: 'units',
    current_quantity: '0',
    min_quantity: '0',
    reorder_quantity: '0',
    unit_cost: '0',
    supplier_name: '',
    supplier_contact: '',
    expiration_date: '',
    lot_number: '',
    storage_location: '',
    notes: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    product_id: '',
    transaction_type: 'purchase',
    quantity: '0',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
    }
  };

  const handleSaveProduct = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const productData = {
      user_id: user.id,
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      unit_type: formData.unit_type,
      current_quantity: parseFloat(formData.current_quantity),
      min_quantity: parseFloat(formData.min_quantity),
      reorder_quantity: parseFloat(formData.reorder_quantity),
      unit_cost: parseFloat(formData.unit_cost),
      supplier_name: formData.supplier_name,
      supplier_contact: formData.supplier_contact,
      expiration_date: formData.expiration_date || null,
      lot_number: formData.lot_number,
      storage_location: formData.storage_location,
      notes: formData.notes,
      is_active: true,
    };

    if (selectedProduct) {
      const { error } = await supabase
        .from('inventory_products')
        .update(productData)
        .eq('id', selectedProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('inventory_products')
        .insert(productData);

      if (error) {
        console.error('Error creating product:', error);
        return;
      }
    }

    setDialogOpen(false);
    setSelectedProduct(null);
    resetForm();
    fetchProducts();
  };

  const handleLogTransaction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const product = products.find(p => p.id === transactionForm.product_id);
    if (!product) return;

    const quantity = parseFloat(transactionForm.quantity);
    const actualQuantity = transactionForm.transaction_type === 'usage' || transactionForm.transaction_type === 'waste'
      ? -Math.abs(quantity)
      : Math.abs(quantity);

    const transactionData = {
      user_id: user.id,
      product_id: transactionForm.product_id,
      transaction_type: transactionForm.transaction_type,
      quantity: actualQuantity,
      unit_cost: product.unit_cost,
      total_cost: Math.abs(actualQuantity) * product.unit_cost,
      performed_by: user.id,
      reason: transactionForm.reason,
      notes: transactionForm.notes,
    };

    const { error } = await supabase
      .from('inventory_transactions')
      .insert(transactionData);

    if (error) {
      console.error('Error logging transaction:', error);
      return;
    }

    const newQuantity = product.current_quantity + actualQuantity;
    await supabase
      .from('inventory_products')
      .update({ current_quantity: newQuantity })
      .eq('id', transactionForm.product_id);

    setTransactionDialogOpen(false);
    setTransactionForm({
      product_id: '',
      transaction_type: 'purchase',
      quantity: '0',
      reason: '',
      notes: '',
    });
    fetchProducts();
    fetchTransactions();
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      category: product.category,
      unit_type: product.unit_type,
      current_quantity: product.current_quantity.toString(),
      min_quantity: product.min_quantity.toString(),
      reorder_quantity: product.reorder_quantity.toString(),
      unit_cost: product.unit_cost.toString(),
      supplier_name: product.supplier_name || '',
      supplier_contact: product.supplier_contact || '',
      expiration_date: product.expiration_date || '',
      lot_number: product.lot_number || '',
      storage_location: product.storage_location || '',
      notes: product.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('inventory_products')
      .update({ is_active: false })
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return;
    }

    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: 'Botox',
      unit_type: 'units',
      current_quantity: '0',
      min_quantity: '0',
      reorder_quantity: '0',
      unit_cost: '0',
      supplier_name: '',
      supplier_contact: '',
      expiration_date: '',
      lot_number: '',
      storage_location: '',
      notes: '',
    });
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.current_quantity <= p.min_quantity);
  };

  const getExpiringProducts = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return products.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = new Date(p.expiration_date);
      return expDate <= thirtyDaysFromNow && expDate >= new Date();
    });
  };

  const getTotalInventoryValue = () => {
    return products.reduce((total, p) => total + (p.current_quantity * p.unit_cost), 0);
  };

  const lowStockProducts = getLowStockProducts();
  const expiringProducts = getExpiringProducts();
  const totalValue = getTotalInventoryValue();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-800">Inventory Management</h2>
          <p className="text-sm text-slate-600">Track products, supplies, and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <TrendingDown className="w-4 h-4 mr-2" />
                Log Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Transaction</DialogTitle>
                <DialogDescription>Record inventory usage, purchases, or adjustments</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product</Label>
                  <Select
                    value={transactionForm.product_id}
                    onValueChange={(value) => setTransactionForm({ ...transactionForm, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.current_quantity} {product.unit_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Transaction Type</Label>
                  <Select
                    value={transactionForm.transaction_type}
                    onValueChange={(value) => setTransactionForm({ ...transactionForm, transaction_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase (Add Stock)</SelectItem>
                      <SelectItem value="usage">Usage (Remove Stock)</SelectItem>
                      <SelectItem value="waste">Waste (Remove Stock)</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Reason</Label>
                  <Input
                    value={transactionForm.reason}
                    onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })}
                    placeholder="e.g., Client treatment, Monthly restock"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={transactionForm.notes}
                    onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleLogTransaction} className="w-full">
                  Log Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedProduct(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                  Add or update inventory products and supplies
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Botox 100 Units"
                  />
                </div>

                <div>
                  <Label>SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Product code"
                  />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Botox">Botox</SelectItem>
                      <SelectItem value="Filler">Filler</SelectItem>
                      <SelectItem value="Serum">Serum</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Unit Type *</Label>
                  <Select value={formData.unit_type} onValueChange={(value) => setFormData({ ...formData, unit_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="ml">ML</SelectItem>
                      <SelectItem value="vials">Vials</SelectItem>
                      <SelectItem value="bottles">Bottles</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Current Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Minimum Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Reorder Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Unit Cost ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Lot Number</Label>
                  <Input
                    value={formData.lot_number}
                    onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Storage Location</Label>
                  <Input
                    value={formData.storage_location}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                    placeholder="e.g., Refrigerator A"
                  />
                </div>

                <div>
                  <Label>Supplier Name</Label>
                  <Input
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Supplier Contact</Label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                    placeholder="Phone or email"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Button onClick={handleSaveProduct} className="w-full">
                    {selectedProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-light">${totalValue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-light">{lowStockProducts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-light">{expiringProducts.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Stock Alert:</strong> {lowStockProducts.length} product(s) are running low:{' '}
            {lowStockProducts.map(p => p.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {expiringProducts.length > 0 && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Expiration Alert:</strong> {expiringProducts.length} product(s) expiring soon:{' '}
            {expiringProducts.map(p => p.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Products</CardTitle>
          <CardDescription>Your current inventory stock</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No products yet. Add your first product to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const isLowStock = product.current_quantity <= product.min_quantity;
                const isExpiringSoon = product.expiration_date &&
                  new Date(product.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-slate-800">{product.name}</h3>
                        <Badge variant="outline">{product.category}</Badge>
                        {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                        {isExpiringSoon && <Badge className="bg-orange-500">Expiring Soon</Badge>}
                      </div>
                      <div className="flex gap-6 mt-2 text-sm text-slate-600">
                        <span>Stock: {product.current_quantity} {product.unit_type}</span>
                        <span>Min: {product.min_quantity} {product.unit_type}</span>
                        <span>Cost: ${product.unit_cost}/{product.unit_type}</span>
                        {product.expiration_date && (
                          <span>Expires: {format(new Date(product.expiration_date), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                      {product.supplier_name && (
                        <div className="text-xs text-slate-500 mt-1">
                          Supplier: {product.supplier_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="rounded-full"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-full text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Recent Transactions</CardTitle>
          <CardDescription>Latest inventory movements</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => {
                const product = products.find(p => p.id === transaction.product_id);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-800">{product?.name}</div>
                      <div className="text-sm text-slate-600">
                        {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                        {transaction.reason && ` - ${transaction.reason}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${transaction.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.quantity >= 0 ? '+' : ''}{transaction.quantity} {product?.unit_type}
                      </div>
                      <div className="text-sm text-slate-600">${transaction.total_cost.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
