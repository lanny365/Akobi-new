import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Package,
  Clock,
  Eye,
  Download
} from 'lucide-react';
import { Button } from './ui/button';

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

export function LabWalletViewer() {
  const walletBalance = 46100; // Current balance after transactions

  const transactions: WalletTransaction[] = [
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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Laboratory Wallet</h2>
              <p className="text-teal-100 text-sm mt-1">Read-only view for monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-200">Current Balance</p>
            <p className="text-3xl font-bold mt-1">₦{walletBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Available Balance</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">₦{walletBalance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Total Spent (Month)</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">₦3,900</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Items Purchased</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">{transactions.filter(t => t.type === 'debit').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
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
                        <p className="text-xs text-gray-500 mt-1">Pharmacy Ref: {txn.pharmacyRef}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {txn.timestamp}
                        </p>
                        <p className="text-xs text-gray-500">By: {txn.performedBy}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                    </p>
                    <Badge variant={txn.type === 'credit' ? 'default' : 'secondary'} className="mt-1 text-xs">
                      {txn.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Read-Only Access</p>
          <p className="text-sm text-blue-700 mt-1">
            You have view-only access to the laboratory wallet. All transactions are managed by the Lab Management team.
            Consumables are purchased from pharmacy inventory and automatically debited from this wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
