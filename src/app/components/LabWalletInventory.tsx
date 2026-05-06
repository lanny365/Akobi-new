import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  DollarSign,
  Search,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePharmacyInventory } from '../context/PharmacyInventoryContext';

interface WalletTransaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  consumable?: string;
  quantity?: number;
  pharmacyRef?: string;
  timestamp: string;
  performedBy: string;
}

interface PharmacyConsumable {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  availableStock: number;
  unit: string;
}

interface LabConsumableRequest {
  id: string;
  consumableId: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  approvedAt?: string;
}

export function LabWalletInventory() {
  const { inventory, deductStock } = usePharmacyInventory();

  const [walletBalance, setWalletBalance] = useState(50000);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<PharmacyConsumable | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'TXN-001',
      type: 'credit',
      amount: 50000,
      description: 'Initial wallet funding',
      timestamp: '2026-04-20 08:00',
      performedBy: 'Admin'
    },
    {
      id: 'TXN-002',
      type: 'debit',
      amount: 1500,
      description: 'Consumables purchase',
      consumable: 'Blood Collection Tubes (10ml)',
      quantity: 50,
      pharmacyRef: 'PHARM-001',
      timestamp: '2026-04-21 09:30',
      performedBy: 'Lab Manager'
    },
    {
      id: 'TXN-003',
      type: 'debit',
      amount: 2400,
      description: 'Consumables purchase',
      consumable: 'Disposable Gloves (Box of 100)',
      quantity: 8,
      pharmacyRef: 'PHARM-002',
      timestamp: '2026-04-22 14:15',
      performedBy: 'Lab Technician'
    },
  ]);

  // Convert pharmacy inventory to consumables format (filter for lab consumables only)
  const pharmacyConsumables: PharmacyConsumable[] = inventory
    .filter(item => item.category === 'Lab Consumables')
    .map(item => ({
      id: item.id,
      name: item.name,
      category: item.subCategory,
      unitPrice: item.sellingPrice,
      availableStock: item.stockLevel,
      unit: 'unit'
    }));

  const [consumableRequests, setConsumableRequests] = useState<LabConsumableRequest[]>([
    {
      id: 'REQ-001',
      consumableId: 'PC-001',
      consumableName: 'Blood Collection Tubes (10ml)',
      quantity: 100,
      unitPrice: 30,
      totalAmount: 3000,
      status: 'approved',
      requestedBy: 'Lab Technician',
      requestedAt: '2026-04-26 08:30',
      approvedAt: '2026-04-26 08:45'
    }
  ]);

  const filteredConsumables = pharmacyConsumables.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRequestConsumable = () => {
    if (!selectedConsumable) return;

    const totalAmount = selectedConsumable.unitPrice * requestQuantity;

    if (totalAmount > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    if (requestQuantity > selectedConsumable.availableStock) {
      toast.error('Requested quantity exceeds available stock');
      return;
    }

    const newRequest: LabConsumableRequest = {
      id: `REQ-${String(consumableRequests.length + 1).padStart(3, '0')}`,
      consumableId: selectedConsumable.id,
      consumableName: selectedConsumable.name,
      quantity: requestQuantity,
      unitPrice: selectedConsumable.unitPrice,
      totalAmount,
      status: 'pending',
      requestedBy: 'Lab Manager',
      requestedAt: new Date().toLocaleString()
    };

    setConsumableRequests([newRequest, ...consumableRequests]);

    // Auto-approve and process (in real system, this would need approval)
    setTimeout(() => {
      processApprovedRequest(newRequest);
    }, 1000);

    setShowRequestDialog(false);
    setSelectedConsumable(null);
    setRequestQuantity(1);
    toast.success('Consumable request submitted successfully');
  };

  const processApprovedRequest = (request: LabConsumableRequest) => {
    // Deduct from wallet
    setWalletBalance(prev => prev - request.totalAmount);

    // Deduct from pharmacy inventory using shared context
    const success = deductStock(request.consumableId, request.quantity);
    
    if (!success) {
      toast.error('Failed to deduct stock from pharmacy inventory');
      return;
    }

    // Add transaction
    const newTransaction: WalletTransaction = {
      id: `TXN-${String(transactions.length + 1).padStart(3, '0')}`,
      type: 'debit',
      amount: request.totalAmount,
      description: 'Consumables purchase from pharmacy',
      consumable: request.consumableName,
      quantity: request.quantity,
      pharmacyRef: `PHARM-${String(transactions.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toLocaleString(),
      performedBy: request.requestedBy
    };

    setTransactions([newTransaction, ...transactions]);

    // Update request status
    setConsumableRequests(prev => prev.map(req =>
      req.id === request.id
        ? { ...req, status: 'approved' as const, approvedAt: new Date().toLocaleString() }
        : req
    ));

    toast.success('✅ Wallet debited & pharmacy stock updated!');
  };

  const stats = [
    {
      label: 'Current Balance',
      value: `₦${walletBalance.toLocaleString()}`,
      icon: Wallet,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      change: '+5.2%'
    },
    {
      label: 'Total Spent (Month)',
      value: '₦3,900',
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      change: '-12%'
    },
    {
      label: 'Pending Requests',
      value: consumableRequests.filter(r => r.status === 'pending').length,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      change: '2 pending'
    },
    {
      label: 'Items Purchased',
      value: transactions.filter(t => t.type === 'debit').length,
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      change: 'This month'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lab Wallet & Inventory</h1>
              <p className="text-teal-100 mt-1">Consumables management and financial tracking</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-200">Available Balance</p>
            <p className="text-4xl font-bold mt-1">₦{walletBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500">{stat.change}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg"
          onClick={() => setShowRequestDialog(true)}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Request Consumables from Pharmacy
        </Button>
        <Button
          variant="outline"
          className="shadow-lg"
          onClick={() => setShowTransactionHistory(true)}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          View Transaction History
        </Button>
        <Button variant="outline" className="shadow-lg">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Pharmacy Connection Status Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Pharmacy Inventory Connected</h3>
                <Badge className="bg-green-500 hover:bg-green-600">
                  ● LIVE
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-blue-600">{pharmacyConsumables.length} Lab Consumables</span> available from shared pharmacy stock
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Source</p>
            <p className="text-lg font-bold text-blue-600">🏥 PHARMACY</p>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
          <CardTitle>Recent Consumable Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {consumableRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No consumable requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consumableRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">{request.consumableName}</h4>
                        <Badge
                          variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Qty: {request.quantity}</span>
                        <span>Unit Price: ₦{request.unitPrice}</span>
                        <span className="font-semibold text-gray-900">Total: ₦{request.totalAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested by {request.requestedBy} on {request.requestedAt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Consumables from Pharmacy</DialogTitle>
            <DialogDescription>
              Select items from pharmacy inventory - Payment will be deducted from lab wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Wallet Balance Alert */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
              <Wallet className="w-5 h-5 text-teal-600" />
              <div>
                <p className="font-semibold text-teal-900">Available Wallet Balance</p>
                <p className="text-2xl font-bold text-teal-600">₦{walletBalance.toLocaleString()}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search consumables..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Consumables List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredConsumables.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all ${
                    selectedConsumable?.id === item.id
                      ? 'border-2 border-teal-500 bg-teal-50'
                      : 'border hover:border-teal-300'
                  }`}
                  onClick={() => setSelectedConsumable(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
                            🏥 PHARMACY
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm text-gray-600">
                            Unit Price: <span className="font-semibold text-gray-900">₦{item.unitPrice}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            In Stock: <span className="font-semibold text-gray-900">{item.availableStock} {item.unit}</span>
                          </p>
                        </div>
                      </div>
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quantity Selection */}
            {selectedConsumable && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Selected: {selectedConsumable.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedConsumable.availableStock}
                      value={requestQuantity}
                      onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <div className="mt-1 p-2 bg-white border rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{(selectedConsumable.unitPrice * requestQuantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedConsumable.unitPrice * requestQuantity > walletBalance && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800 font-medium">Insufficient wallet balance</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                onClick={handleRequestConsumable}
                disabled={!selectedConsumable || selectedConsumable.unitPrice * requestQuantity > walletBalance}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showTransactionHistory} onOpenChange={setShowTransactionHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Complete record of all wallet transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {txn.type === 'credit' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{txn.description}</h4>
                      {txn.consumable && (
                        <p className="text-sm text-gray-600 mt-1">
                          Item: {txn.consumable} × {txn.quantity}
                        </p>
                      )}
                      {txn.pharmacyRef && (
                        <p className="text-xs text-gray-500 mt-1">Ref: {txn.pharmacyRef}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {txn.timestamp} • {txn.performedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                    </p>
                    <Badge variant={txn.type === 'credit' ? 'default' : 'secondary'} className="mt-1">
                      {txn.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}