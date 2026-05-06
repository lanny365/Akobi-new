import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Pill,
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Prescription {
  id: string;
  patientName: string;
  cardNumber: string;
  doctor: string;
  medications: Array<{
    name: string;
    dosage: string;
    quantity: number;
    frequency: string;
  }>;
  status: 'pending' | 'dispensed' | 'cancelled';
  prescribedAt: string;
}

interface Drug {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  reorderLevel: number;
  expiryDate: string;
  price: number;
}

export function Pharmacy() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [prescriptions] = useState<Prescription[]>([
    {
      id: 'RX-001',
      patientName: 'James Anderson',
      cardNumber: 'PT-2026-0001',
      doctor: 'Dr. Sarah Johnson',
      medications: [
        { name: 'Paracetamol 500mg', dosage: '500mg', quantity: 20, frequency: '3x daily' },
        { name: 'Amoxicillin 500mg', dosage: '500mg', quantity: 15, frequency: '2x daily' }
      ],
      status: 'pending',
      prescribedAt: '2026-04-21 09:45'
    },
    {
      id: 'RX-002',
      patientName: 'Grace Okonkwo',
      cardNumber: 'PT-2026-0002',
      doctor: 'Dr. Sarah Johnson',
      medications: [
        { name: 'Ibuprofen 400mg', dosage: '400mg', quantity: 10, frequency: 'As needed' }
      ],
      status: 'dispensed',
      prescribedAt: '2026-04-21 09:30'
    },
  ]);

  const [inventory] = useState<Drug[]>([
    { id: '1', name: 'Paracetamol 500mg', category: 'Analgesic', stockLevel: 500, reorderLevel: 100, expiryDate: '2027-12-31', price: 50 },
    { id: '2', name: 'Amoxicillin 500mg', category: 'Antibiotic', stockLevel: 45, reorderLevel: 50, expiryDate: '2026-08-15', price: 150 },
    { id: '3', name: 'Ibuprofen 400mg', category: 'NSAID', stockLevel: 250, reorderLevel: 75, expiryDate: '2027-06-30', price: 75 },
    { id: '4', name: 'Metformin 500mg', category: 'Antidiabetic', stockLevel: 180, reorderLevel: 100, expiryDate: '2027-03-20', price: 120 },
  ]);

  const stats = [
    { label: 'Pending Prescriptions', value: '12', icon: Clock, color: 'bg-orange-500' },
    { label: 'Dispensed Today', value: '48', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Low Stock Items', value: '3', icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Revenue Today', value: '₦128,500', icon: TrendingUp, color: 'bg-blue-500' },
  ];

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Prescriptions</CardTitle>
              <Badge variant="secondary">{prescriptions.filter(p => p.status === 'pending').length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search prescriptions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredPrescriptions.map((rx) => (
                <div key={rx.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{rx.patientName}</h4>
                      <p className="text-sm text-gray-600">{rx.cardNumber}</p>
                      <p className="text-sm text-gray-500">By {rx.doctor}</p>
                    </div>
                    <Badge variant={rx.status === 'pending' ? 'secondary' : 'default'}>
                      {rx.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {rx.medications.map((med, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-medium text-gray-900">{med.name}</p>
                        <p className="text-gray-600">
                          Qty: {med.quantity} • {med.frequency}
                        </p>
                      </div>
                    ))}
                  </div>

                  {rx.status === 'pending' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Dispense Medication
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Drug Inventory</CardTitle>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventory.map((drug) => {
                const isLowStock = drug.stockLevel <= drug.reorderLevel;
                return (
                  <div
                    key={drug.id}
                    className={`border rounded-lg p-4 ${isLowStock ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{drug.name}</h4>
                        <p className="text-sm text-gray-600">{drug.category}</p>
                      </div>
                      {isLowStock && (
                        <Badge variant="destructive" className="ml-2">
                          Low Stock
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-600">Stock Level</p>
                        <p className="font-semibold text-gray-900">{drug.stockLevel} units</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reorder At</p>
                        <p className="font-semibold text-gray-900">{drug.reorderLevel} units</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expiry Date</p>
                        <p className="font-semibold text-gray-900">{drug.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold text-gray-900">₦{drug.price}</p>
                      </div>
                    </div>

                    {isLowStock && (
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        <Package className="w-4 h-4 mr-2" />
                        Reorder Stock
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
