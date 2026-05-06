import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Receipt, Plus, Trash2, Search, DollarSign, User, Calendar, FileText, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface BillItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ManualBill {
  id: string;
  billNumber: string;
  patientName: string;
  patientId: string;
  dateCreated: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
}

export function ManualBilling() {
  const [bills, setBills] = useState<ManualBill[]>([
    {
      id: '1',
      billNumber: 'BILL-2026-001',
      patientName: 'John Doe',
      patientId: 'PAT-001',
      dateCreated: '2026-04-22',
      items: [
        { id: '1', description: 'General Consultation', category: 'Consultation', quantity: 1, unitPrice: 5000, total: 5000 },
        { id: '2', description: 'Blood Test (CBC)', category: 'Laboratory', quantity: 1, unitPrice: 3500, total: 3500 },
      ],
      subtotal: 8500,
      discount: 850,
      tax: 0,
      total: 7650,
      status: 'paid',
      paymentMethod: 'Cash'
    },
    {
      id: '2',
      billNumber: 'BILL-2026-002',
      patientName: 'Jane Smith',
      patientId: 'PAT-002',
      dateCreated: '2026-04-22',
      items: [
        { id: '1', description: 'Specialist Consultation', category: 'Consultation', quantity: 1, unitPrice: 10000, total: 10000 },
      ],
      subtotal: 10000,
      discount: 0,
      tax: 0,
      total: 10000,
      status: 'pending'
    },
  ]);

  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [newBillItems, setNewBillItems] = useState<BillItem[]>([]);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const selectedBill = bills.find(b => b.id === selectedBillId);

  const handleAddBillItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      description: '',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setNewBillItems([...newBillItems, newItem]);
  };

  const handleUpdateBillItem = (id: string, field: string, value: any) => {
    setNewBillItems(newBillItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveBillItem = (id: string) => {
    setNewBillItems(newBillItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return newBillItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discountPercent) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCreateBill = () => {
    if (!patientName || !patientId || newBillItems.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newBill: ManualBill = {
      id: Date.now().toString(),
      billNumber: `BILL-2026-${String(bills.length + 1).padStart(3, '0')}`,
      patientName,
      patientId,
      dateCreated: new Date().toISOString().split('T')[0],
      items: newBillItems,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      tax: 0,
      total: calculateTotal(),
      status: 'draft'
    };

    setBills([...bills, newBill]);
    setIsCreatingBill(false);
    setNewBillItems([]);
    setPatientName('');
    setPatientId('');
    setDiscountPercent(0);
    toast.success('Bill created successfully');
  };

  const handleUpdateBillStatus = (billId: string, status: ManualBill['status']) => {
    setBills(bills.map(b => b.id === billId ? { ...b, status } : b));
    toast.success('Bill status updated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = [
    { label: 'Total Bills', value: bills.length.toString(), color: 'bg-blue-500' },
    { label: 'Pending Bills', value: bills.filter(b => b.status === 'pending').length.toString(), color: 'bg-yellow-500' },
    { label: 'Paid Bills', value: bills.filter(b => b.status === 'paid').length.toString(), color: 'bg-green-500' },
    { label: 'Total Revenue', value: `₦${bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.total, 0).toLocaleString()}`, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Billing Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-2xl">Manual Billing</CardTitle>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsCreatingBill(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Bill
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Create and manage manual bills for patients
          </p>
        </CardHeader>
        <CardContent>
          {isCreatingBill ? (
            // Create Bill Mode
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700">Create New Bill</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreatingBill(false);
                      setNewBillItems([]);
                      setPatientName('');
                      setPatientId('');
                      setDiscountPercent(0);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleCreateBill}
                  >
                    Save Bill
                  </Button>
                </div>
              </div>

              {/* Patient Information */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Patient Name</Label>
                    <Input
                      placeholder="Enter patient name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Patient ID</Label>
                    <Input
                      placeholder="PAT-XXX"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-700">Bill Items</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddBillItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {newBillItems.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-4">
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => handleUpdateBillItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) => handleUpdateBillItem(item.id, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consultation">Consultation</SelectItem>
                            <SelectItem value="Laboratory">Laboratory</SelectItem>
                            <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="Surgery">Surgery</SelectItem>
                            <SelectItem value="Ward">Ward</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateBillItem(item.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Unit Price (₦)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateBillItem(item.id, 'unitPrice', Number(e.target.value))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="text-xs">Total</Label>
                        <p className="font-semibold text-gray-900">₦{item.total.toLocaleString()}</p>
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBillItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {newBillItems.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No items added yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Bill Summary</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">₦{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Discount:</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20 h-8"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <span className="font-semibold text-red-600">-₦{calculateDiscount().toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-green-600">₦{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Bill Selector */}
              <div className="mb-6">
                <Label htmlFor="bill-select" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Select Bill
                </Label>
                <select
                  id="bill-select"
                  value={selectedBillId}
                  onChange={(e) => setSelectedBillId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Choose a bill to view details --</option>
                  {bills.map(bill => (
                    <option key={bill.id} value={bill.id}>
                      {bill.billNumber} - {bill.patientName} - ₦{bill.total.toLocaleString()} ({bill.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Bill Details */}
              {selectedBill ? (
                <div className="space-y-6">
                  {/* Bill Info Header */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{selectedBill.billNumber}</h3>
                        <p className="text-sm text-gray-600">{selectedBill.patientName} ({selectedBill.patientId})</p>
                      </div>
                      <Badge className={getStatusColor(selectedBill.status)}>
                        {selectedBill.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(selectedBill.dateCreated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-green-600">₦{selectedBill.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bill Items */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Bill Items</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Qty</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Price</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedBill.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-xs">{item.category}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">₦{item.unitPrice.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">₦{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bill Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">₦{selectedBill.subtotal.toLocaleString()}</span>
                      </div>
                      {selectedBill.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-semibold text-red-600">-₦{selectedBill.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t flex justify-between">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-green-600">₦{selectedBill.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      {selectedBill.status === 'draft' && (
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateBillStatus(selectedBill.id, 'pending')}
                        >
                          Submit Bill
                        </Button>
                      )}
                      {selectedBill.status === 'pending' && (
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateBillStatus(selectedBill.id, 'paid')}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => toast.info('Printing bill ' + selectedBill.billNumber)}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Bill
                      </Button>
                      {selectedBill.status !== 'cancelled' && selectedBill.status !== 'paid' && (
                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleUpdateBillStatus(selectedBill.id, 'cancelled')}
                        >
                          Cancel Bill
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bill Selected</h3>
                  <p className="text-sm text-gray-500">
                    Select a bill from the dropdown above or create a new one
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
