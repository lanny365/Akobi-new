import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Pill,
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Pencil,
  X,
  Minus,
  FileText,
  Truck,
  BarChart3,
  Archive,
  ClipboardCheck,
  UserCheck,
  XCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { useDrugRequest } from '../context/DrugRequestContext';
import { usePharmacyInventory } from '../context/PharmacyInventoryContext';

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
  subCategory: string;
  stockLevel: number;
  reorderLevel: number;
  expiryDate: string;
  price: number;
  costPrice: number;
  sellingPrice: number;
  accountToCredit: string;
  accountToDebit: string;
  stockStatus: 'NEW' | 'OLD';
}

export function Pharmacy() {
  const {
    drugRequests,
    getPendingRequests,
    approveDrugRequest,
    rejectDrugRequest,
    dispenseDrugRequest
  } = useDrugRequest();

  const { inventory, updateInventory } = usePharmacyInventory();
  const setInventory = updateInventory;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = useState(false);
  const [selectedDrugRequest, setSelectedDrugRequest] = useState<any>(null);
  const [isViewRequestDialogOpen, setIsViewRequestDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Detect current tab from URL
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return params.get('tab') || 'prescription';
  };
  const [activeMainTab, setActiveMainTab] = useState(getTabFromUrl());

  useEffect(() => {
    const handleHashChange = () => {
      setActiveMainTab(getTabFromUrl());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Add Product Dialog
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    subCategory: '',
    stockLevel: '',
    reorderLevel: '',
    expiryDate: '',
    costPrice: '',
    sellingPrice: '',
    accountToCredit: '',
    accountToDebit: '',
    stockStatus: 'NEW' as 'NEW' | 'OLD'
  });

  // Add Category Dialog
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Stock Filter State
  const [stockFilter, setStockFilter] = useState<'ALL' | 'NEW' | 'OLD'>('ALL');
  
  const [categories, setCategories] = useState([
    'Prescription Medicines (Rx)',
    'Over-The-Counter (OTC)',
    'Injectable & Infusions',
    'Topical Products',
    'Herbal & Supplements',
    'Medical Consumables',
    'Medical Devices & Equipment',
    'Baby & Maternal Care',
    'Personal Care Products',
    'Laboratory & Diagnostic Supplies',
    'Emergency & Critical Care',
    'Controlled Drugs'
  ]);

  // Add SubCategory Dialog
  const [isAddSubCategoryDialogOpen, setIsAddSubCategoryDialogOpen] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  
  // Category-specific subcategories
  const [categorySubCategories, setCategorySubCategories] = useState<Record<string, string[]>>({
    'Prescription Medicines (Rx)': [
      'Antibiotics',
      'Antimalarials',
      'Antihypertensives',
      'Antidiabetics',
      'Strong Analgesics',
      'Antiepileptics',
      'Antipsychotics',
      'Cardiovascular Drugs',
      'Hormonal Drugs'
    ],
    'Over-The-Counter (OTC)': [
      'Mild Pain Relievers',
      'Cold & Flu Medications',
      'Cough Syrups',
      'Antacids',
      'Anti-Allergy Drugs',
      'Anti-Diarrheal Drugs',
      'Laxatives'
    ],
    'Injectable & Infusions': [
      'IV Fluids',
      'Injectable Antibiotics',
      'Vaccines',
      'Insulin',
      'Blood Products',
      'Electrolyte Infusions'
    ],
    'Topical Products': [
      'Antifungal Creams',
      'Steroid Creams',
      'Antibacterial Ointments',
      'Eye Drops',
      'Ear Drops',
      'Nasal Sprays'
    ],
    'Herbal & Supplements': [
      'Multivitamins',
      'Vitamin C Supplements',
      'Iron Supplements',
      'Calcium Supplements',
      'Immune Boosters',
      'Herbal Tonics'
    ],
    'Medical Consumables': [
      'Syringes',
      'Needles',
      'Gloves',
      'Cotton Wool',
      'Bandages',
      'Plasters'
    ],
    'Medical Devices & Equipment': [
      'Thermometers',
      'Blood Pressure Monitors',
      'Glucometers',
      'Nebulizers',
      'Weighing Scales',
      'Pulse Oximeters'
    ],
    'Baby & Maternal Care': [
      'Infant Formula',
      'Diapers',
      'Baby Wipes',
      'Pregnancy Test Kits',
      'Prenatal Vitamins',
      'Feeding Bottles'
    ],
    'Personal Care Products': [
      'Bath Soaps',
      'Toothpaste',
      'Sanitary Pads',
      'Body Lotions',
      'Hand Sanitizers'
    ],
    'Laboratory & Diagnostic Supplies': [
      'Test Strips',
      'Reagents',
      'Specimen Bottles',
      'Rapid Test Kits',
      'Microscope Slides'
    ],
    'Emergency & Critical Care': [
      'Resuscitation Drugs',
      'Oxygen Supplies',
      'Emergency Injections',
      'IV Emergency Kits'
    ],
    'Controlled Drugs': [
      'Narcotic Analgesics',
      'Sedatives',
      'Psychotropic Drugs',
      'Opioids'
    ]
  });

  // Get subcategories for current selected category
  const getCurrentSubCategories = () => {
    if (!newProduct.category) return [];
    return categorySubCategories[newProduct.category] || [];
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    if (categories.includes(newCategoryName.trim())) {
      toast.error('Category already exists');
      return;
    }

    setCategories([...categories, newCategoryName.trim()]);
    setNewProduct({ ...newProduct, category: newCategoryName.trim() });
    setIsAddCategoryDialogOpen(false);
    setNewCategoryName('');
    toast.success(`Category "${newCategoryName}" added successfully!`);
  };

  const handleAddSubCategory = () => {
    if (!newSubCategoryName.trim()) {
      toast.error('Please enter a subcategory name');
      return;
    }

    if (!newProduct.category) {
      toast.error('Please select a category first');
      return;
    }
    
    const currentSubCats = categorySubCategories[newProduct.category] || [];
    if (currentSubCats.includes(newSubCategoryName.trim())) {
      toast.error('Subcategory already exists');
      return;
    }

    setCategorySubCategories({
      ...categorySubCategories,
      [newProduct.category]: [...currentSubCats, newSubCategoryName.trim()]
    });
    setNewProduct({ ...newProduct, subCategory: newSubCategoryName.trim() });
    setIsAddSubCategoryDialogOpen(false);
    setNewSubCategoryName('');
    toast.success(`Subcategory "${newSubCategoryName}" added successfully!`);
  };

  // Handwriting canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [handwritingNotes, setHandwritingNotes] = useState('');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
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
      status: 'pending',
      prescribedAt: '2026-04-21 09:30'
    },
    {
      id: 'RX-003',
      patientName: 'Mohammed Ibrahim',
      cardNumber: 'PT-2026-0003',
      doctor: 'Dr. Michael Chen',
      medications: [
        { name: 'Metformin 500mg', dosage: '500mg', quantity: 30, frequency: '2x daily' }
      ],
      status: 'dispensed',
      prescribedAt: '2026-04-21 08:00'
    },
  ]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const interpretHandwriting = () => {
    toast.success('Handwriting interpreted');
    setHandwritingNotes('Simulated pharmacist notes: Medication dispensed to patient. Counseling provided on proper usage and potential side effects.');
  };

  const calculateTotalAmount = (medications: Array<{ name: string; quantity: number }>) => {
    return medications.reduce((total, med) => {
      const drug = inventory.find(d => d.name === med.name);
      return total + (drug ? drug.price * med.quantity : 0);
    }, 0);
  };

  const handleDispenseMedication = () => {
    if (!selectedPrescription) return;

    // Check if all medications are available in stock
    const insufficientStock: string[] = [];
    selectedPrescription.medications.forEach(med => {
      const drug = inventory.find(d => d.name === med.name);
      if (drug && drug.stockLevel < med.quantity) {
        insufficientStock.push(`${med.name} (Available: ${drug.stockLevel}, Required: ${med.quantity})`);
      }
    });

    if (insufficientStock.length > 0) {
      toast.error(`Insufficient stock for: ${insufficientStock.join(', ')}`);
      return;
    }

    // Deduct from inventory
    const updatedInventory = inventory.map(drug => {
      const medication = selectedPrescription.medications.find(m => m.name === drug.name);
      if (medication) {
        return {
          ...drug,
          stockLevel: drug.stockLevel - medication.quantity
        };
      }
      return drug;
    });

    setInventory(updatedInventory);

    // Update prescription status
    setPrescriptions(prescriptions.map(rx =>
      rx.id === selectedPrescription.id
        ? { ...rx, status: 'dispensed' as const }
        : rx
    ));

    const totalAmount = calculateTotalAmount(selectedPrescription.medications);
    toast.success(`Medication dispensed successfully! Total: ₦${totalAmount.toLocaleString()}`);
    setIsDispenseDialogOpen(false);
    setSelectedPrescription(null);
    clearCanvas();
    setHandwritingNotes('');
  };

  const stats = [
    { label: 'Pending Prescriptions', value: prescriptions.filter(p => p.status === 'pending').length.toString(), icon: Clock, color: 'bg-orange-500' },
    { label: 'Dispensed Today', value: prescriptions.filter(p => p.status === 'dispensed').length.toString(), icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Low Stock Items', value: inventory.filter(d => d.stockLevel <= d.reorderLevel).length.toString(), icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Total Items', value: inventory.length.toString(), icon: Package, color: 'bg-blue-500' },
  ];

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = () => {
    // Validation
    if (!newProduct.name || !newProduct.category || !newProduct.subCategory || 
        !newProduct.stockLevel || !newProduct.costPrice || !newProduct.sellingPrice ||
        !newProduct.accountToCredit || !newProduct.accountToDebit) {
      toast.error('Please fill in all required fields');
      return;
    }

    const productId = (inventory.length + 1).toString();
    const product: Drug = {
      id: productId,
      name: newProduct.name,
      category: newProduct.category,
      subCategory: newProduct.subCategory,
      stockLevel: parseInt(newProduct.stockLevel),
      reorderLevel: parseInt(newProduct.reorderLevel) || 50,
      expiryDate: newProduct.expiryDate,
      price: parseInt(newProduct.sellingPrice),
      costPrice: parseInt(newProduct.costPrice),
      sellingPrice: parseInt(newProduct.sellingPrice),
      accountToCredit: newProduct.accountToCredit,
      accountToDebit: newProduct.accountToDebit,
      stockStatus: newProduct.stockStatus
    };

    setInventory([...inventory, product]);
    setIsAddProductDialogOpen(false);
    setNewProduct({
      name: '',
      category: '',
      subCategory: '',
      stockLevel: '',
      reorderLevel: '',
      expiryDate: '',
      costPrice: '',
      sellingPrice: '',
      accountToCredit: '',
      accountToDebit: '',
      stockStatus: 'NEW'
    });
    toast.success(`Product "${newProduct.name}" added successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center shadow-md">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Pharmacy Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {activeMainTab === 'inventory' ? 'Manage drug inventory and suppliers' : 'Dispense medications and manage prescriptions'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

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

      {/* Main Content - Conditional Rendering Based on Tab */}
      {activeMainTab === 'inventory' ? (
        /* INVENTORY MANAGEMENT SECTION */
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Inventory Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="approvals" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="approvals" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Approvals
                  {getPendingRequests().length > 0 && (
                    <Badge className="ml-1 bg-red-600 text-xs">{getPendingRequests().length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="product" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product
                </TabsTrigger>
                <TabsTrigger value="supplier" className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Supplier
                </TabsTrigger>
                <TabsTrigger value="stock" className="flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Stock
                </TabsTrigger>
                <TabsTrigger value="report" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Report
                </TabsTrigger>
              </TabsList>

              {/* Approvals Tab */}
              <TabsContent value="approvals" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Drug Request Approvals</h3>
                    <p className="text-sm text-gray-600">Review and approve drug requests from doctors, surgeons, and anesthetists</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-orange-600">
                      {getPendingRequests().length} Pending
                    </Badge>
                    <Badge className="bg-green-600">
                      {drugRequests.filter(r => r.status === 'Approved').length} Approved
                    </Badge>
                    <Badge className="bg-red-600">
                      {drugRequests.filter(r => r.status === 'Rejected').length} Rejected
                    </Badge>
                  </div>
                </div>

                {/* Filter Tabs */}
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="pending">
                      Pending ({getPendingRequests().length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({drugRequests.filter(r => r.status === 'Approved').length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({drugRequests.filter(r => r.status === 'Rejected').length})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      All ({drugRequests.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Pending Requests */}
                  <TabsContent value="pending" className="space-y-3">
                    {getPendingRequests().length === 0 ? (
                      <Card className="bg-gray-50">
                        <CardContent className="p-8 text-center">
                          <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">No pending requests</p>
                        </CardContent>
                      </Card>
                    ) : (
                      getPendingRequests().map((request) => (
                        <Card key={request.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className={`${
                                    request.priority === 'Emergency' ? 'bg-red-600' :
                                    request.priority === 'Urgent' ? 'bg-orange-600' : 'bg-blue-600'
                                  }`}>
                                    {request.priority}
                                  </Badge>
                                  <Badge variant="outline" className={`${
                                    request.requesterType === 'Doctor' ? 'border-blue-600 text-blue-600' :
                                    request.requesterType === 'Surgeon' ? 'border-purple-600 text-purple-600' :
                                    'border-green-600 text-green-600'
                                  }`}>
                                    {request.requesterType}
                                  </Badge>
                                  <span className="text-sm font-semibold text-gray-900">{request.requestNumber}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Requester</p>
                                    <p className="text-sm font-medium text-gray-900">{request.requesterName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Patient</p>
                                    <p className="text-sm font-medium text-gray-900">{request.patientName}</p>
                                    <p className="text-xs text-gray-500">{request.patientCardNumber}</p>
                                  </div>
                                </div>

                                <div className="bg-gray-50 rounded p-3 mb-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">Requested Drugs ({request.drugs.length})</p>
                                  <div className="space-y-1">
                                    {request.drugs.slice(0, 2).map((drug, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs">
                                        <span className="font-medium">{drug.drugName}</span>
                                        <span className="text-gray-600">Qty: {drug.quantity}</span>
                                      </div>
                                    ))}
                                    {request.drugs.length > 2 && (
                                      <p className="text-xs text-blue-600">+{request.drugs.length - 2} more drugs...</p>
                                    )}
                                  </div>
                                </div>

                                {request.notes && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                                    <p className="text-xs text-blue-900">
                                      <AlertCircle className="w-3 h-3 inline mr-1" />
                                      {request.notes}
                                    </p>
                                  </div>
                                )}

                                <p className="text-xs text-gray-500">
                                  Requested: {new Date(request.requestDate).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDrugRequest(request);
                                    setIsViewRequestDialogOpen(true);
                                  }}
                                  className="whitespace-nowrap"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    approveDrugRequest(request.id, 'Inventory Manager');
                                    toast.success(`Request ${request.requestNumber} approved!`);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDrugRequest(request);
                                    setIsRejectDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:bg-red-50 border-red-200 whitespace-nowrap"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Approved Requests */}
                  <TabsContent value="approved" className="space-y-3">
                    {drugRequests.filter(r => r.status === 'Approved').length === 0 ? (
                      <Card className="bg-gray-50">
                        <CardContent className="p-8 text-center">
                          <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">No approved requests</p>
                        </CardContent>
                      </Card>
                    ) : (
                      drugRequests.filter(r => r.status === 'Approved').map((request) => (
                        <Card key={request.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className="bg-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approved
                                  </Badge>
                                  <Badge variant="outline">{request.requesterType}</Badge>
                                  <span className="text-sm font-semibold">{request.requestNumber}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500">Requester</p>
                                    <p className="font-medium">{request.requesterName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Patient</p>
                                    <p className="font-medium">{request.patientName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Approved By</p>
                                    <p className="font-medium">{request.approvedBy}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Approved: {request.approvedDate ? new Date(request.approvedDate).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDrugRequest(request);
                                  setIsViewRequestDialogOpen(true);
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Rejected Requests */}
                  <TabsContent value="rejected" className="space-y-3">
                    {drugRequests.filter(r => r.status === 'Rejected').length === 0 ? (
                      <Card className="bg-gray-50">
                        <CardContent className="p-8 text-center">
                          <XCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">No rejected requests</p>
                        </CardContent>
                      </Card>
                    ) : (
                      drugRequests.filter(r => r.status === 'Rejected').map((request) => (
                        <Card key={request.id} className="border-l-4 border-l-red-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className="bg-red-600">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Rejected
                                  </Badge>
                                  <Badge variant="outline">{request.requesterType}</Badge>
                                  <span className="text-sm font-semibold">{request.requestNumber}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Requester</p>
                                    <p className="font-medium">{request.requesterName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Patient</p>
                                    <p className="font-medium">{request.patientName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Rejected By</p>
                                    <p className="font-medium">{request.rejectedBy}</p>
                                  </div>
                                </div>
                                {request.rejectionReason && (
                                  <div className="bg-red-50 border border-red-200 rounded p-2">
                                    <p className="text-xs font-semibold text-red-900">Rejection Reason:</p>
                                    <p className="text-xs text-red-800">{request.rejectionReason}</p>
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  Rejected: {request.rejectedDate ? new Date(request.rejectedDate).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDrugRequest(request);
                                  setIsViewRequestDialogOpen(true);
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* All Requests */}
                  <TabsContent value="all" className="space-y-3">
                    {drugRequests.map((request) => (
                      <Card key={request.id} className={`border-l-4 ${
                        request.status === 'Pending' ? 'border-l-orange-500' :
                        request.status === 'Approved' ? 'border-l-green-500' :
                        'border-l-red-500'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={`${
                                  request.status === 'Pending' ? 'bg-orange-600' :
                                  request.status === 'Approved' ? 'bg-green-600' : 'bg-red-600'
                                }`}>
                                  {request.status}
                                </Badge>
                                <Badge variant="outline">{request.requesterType}</Badge>
                                <span className="text-sm font-semibold">{request.requestNumber}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Requester</p>
                                  <p className="font-medium">{request.requesterName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Patient</p>
                                  <p className="font-medium">{request.patientName}</p>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDrugRequest(request);
                                setIsViewRequestDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Product Tab */}
              <TabsContent value="product" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Product Management</h3>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddProductDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                  </Button>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Sub Category</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Stock Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cost Price</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Selling Price</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Account Credit</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Account Debit</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Expiry</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inventory.map((drug) => {
                        const isLowStock = drug.stockLevel <= drug.reorderLevel;
                        return (
                          <tr key={drug.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{drug.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{drug.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{drug.subCategory}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                {drug.stockLevel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge className={drug.stockStatus === 'NEW' ? 'bg-green-600' : 'bg-orange-600'}>
                                {drug.stockStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">₦{drug.costPrice.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-700">₦{drug.sellingPrice.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{drug.accountToCredit}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{drug.accountToDebit}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{drug.expiryDate}</td>
                            <td className="px-4 py-3 text-sm">
                              <Button size="sm" variant="outline">
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Supplier Tab */}
              <TabsContent value="supplier" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Supplier Management</h3>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Supplier
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">PharmaCorp Ltd</h4>
                          <p className="text-xs text-gray-500">Primary Supplier</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact:</span>
                          <span className="font-medium">+234 800 123 4567</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Products:</span>
                          <span className="font-medium">45 items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Order:</span>
                          <span className="font-medium">Apr 20, 2026</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">MediSupply Inc</h4>
                          <p className="text-xs text-gray-500">Backup Supplier</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact:</span>
                          <span className="font-medium">+234 800 987 6543</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Products:</span>
                          <span className="font-medium">32 items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Order:</span>
                          <span className="font-medium">Apr 15, 2026</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">HealthDist Nigeria</h4>
                          <p className="text-xs text-gray-500">Specialty Supplier</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact:</span>
                          <span className="font-medium">+234 800 555 9999</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Products:</span>
                          <span className="font-medium">18 items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Order:</span>
                          <span className="font-medium">Apr 18, 2026</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Stock Tab */}
              <TabsContent value="stock" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Stock Levels & Alerts</h3>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reorder Alerts ({inventory.filter(d => d.stockLevel <= d.reorderLevel).length})
                  </Button>
                </div>

                {/* Stock Filter Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStockFilter('ALL')}
                    className={`flex-1 ${stockFilter === 'ALL' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    All Stock ({inventory.length})
                  </Button>
                  <Button
                    onClick={() => setStockFilter('NEW')}
                    className={`flex-1 ${stockFilter === 'NEW' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    New Products ({inventory.filter(d => d.stockStatus === 'NEW').length})
                  </Button>
                  <Button
                    onClick={() => setStockFilter('OLD')}
                    className={`flex-1 ${stockFilter === 'OLD' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Old Stock - B/F ({inventory.filter(d => d.stockStatus === 'OLD').length})
                  </Button>
                </div>

                {/* Stock Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NEW Stock Summary */}
                  {(stockFilter === 'ALL' || stockFilter === 'NEW') && (
                    <Card className="border-2 border-green-300 bg-green-50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">NEW STOCK</h4>
                            <p className="text-sm text-gray-600">{inventory.filter(d => d.stockStatus === 'NEW').length} Products</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total Cost Price:</span>
                            <span className="text-lg font-bold text-blue-600">
                              ₦{inventory.filter(d => d.stockStatus === 'NEW').reduce((sum, d) => sum + (d.costPrice * d.stockLevel), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total Selling Price:</span>
                            <span className="text-lg font-bold text-green-600">
                              ₦{inventory.filter(d => d.stockStatus === 'NEW').reduce((sum, d) => sum + (d.sellingPrice * d.stockLevel), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-green-300">
                            <span className="text-sm font-bold text-gray-800">Potential Profit:</span>
                            <span className="text-lg font-bold text-green-700">
                              ₦{(inventory.filter(d => d.stockStatus === 'NEW').reduce((sum, d) => sum + (d.sellingPrice * d.stockLevel), 0) - 
                                 inventory.filter(d => d.stockStatus === 'NEW').reduce((sum, d) => sum + (d.costPrice * d.stockLevel), 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* OLD Stock Summary */}
                  {(stockFilter === 'ALL' || stockFilter === 'OLD') && (
                    <Card className="border-2 border-orange-300 bg-orange-50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                            <Archive className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">OLD STOCK (Brought Forward)</h4>
                            <p className="text-sm text-gray-600">{inventory.filter(d => d.stockStatus === 'OLD').length} Products</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total Cost Price:</span>
                            <span className="text-lg font-bold text-blue-600">
                              ₦{inventory.filter(d => d.stockStatus === 'OLD').reduce((sum, d) => sum + (d.costPrice * d.stockLevel), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total Selling Price:</span>
                            <span className="text-lg font-bold text-green-600">
                              ₦{inventory.filter(d => d.stockStatus === 'OLD').reduce((sum, d) => sum + (d.sellingPrice * d.stockLevel), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-orange-300">
                            <span className="text-sm font-bold text-gray-800">Potential Profit:</span>
                            <span className="text-lg font-bold text-orange-700">
                              ₦{(inventory.filter(d => d.stockStatus === 'OLD').reduce((sum, d) => sum + (d.sellingPrice * d.stockLevel), 0) - 
                                 inventory.filter(d => d.stockStatus === 'OLD').reduce((sum, d) => sum + (d.costPrice * d.stockLevel), 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Stock Items List with Alerts */}
                <div className="space-y-3">
                  {inventory
                    .filter(drug => stockFilter === 'ALL' || drug.stockStatus === stockFilter)
                    .map((drug) => {
                      const isLowStock = drug.stockLevel <= drug.reorderLevel;
                      const isEmpty = drug.stockLevel === 0;
                      const stockPercentage = (drug.stockLevel / (drug.reorderLevel * 3)) * 100;
                    
                    return (
                      <Card key={drug.id} className={`${isEmpty ? 'border-4 border-red-600 bg-red-100' : isLowStock ? 'border-2 border-orange-400 bg-orange-50' : 'border border-gray-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{drug.name}</h4>
                                <Badge className={drug.stockStatus === 'NEW' ? 'bg-green-600' : 'bg-orange-600'}>
                                  {drug.stockStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{drug.category} - {drug.subCategory}</p>
                            </div>
                            <div className="flex gap-2">
                              {isEmpty && (
                                <Badge className="bg-red-600 text-white animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  OUT OF STOCK
                                </Badge>
                              )}
                              {!isEmpty && isLowStock && (
                                <Badge className="bg-orange-600 text-white">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  LOW STOCK
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Current Stock:</span>
                              <span className={`font-bold ${isEmpty ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                                {drug.stockLevel} / {drug.reorderLevel * 3} units
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${isEmpty ? 'bg-red-600' : isLowStock ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Reorder Level:</span>
                                <span className="font-semibold ml-1">{drug.reorderLevel}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Expiry:</span>
                                <span className="font-semibold ml-1">{drug.expiryDate}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Cost Price:</span>
                                <span className="font-semibold ml-1 text-blue-600">₦{drug.costPrice.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Selling Price:</span>
                                <span className="font-semibold ml-1 text-green-600">₦{drug.sellingPrice.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            {/* Critical Alert Messages */}
                            {isEmpty && (
                              <div className="mt-3 p-3 bg-red-600 text-white rounded-lg">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5" />
                                  <div>
                                    <p className="font-bold">⚠️ CRITICAL ALERT - STOCK EMPTY!</p>
                                    <p className="text-sm">This product is OUT OF STOCK. Doctors and Surgeons will be notified when attempting to prescribe.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {!isEmpty && isLowStock && (
                              <div className="mt-3 p-3 bg-orange-500 text-white rounded-lg">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5" />
                                  <div>
                                    <p className="font-bold">⚠️ LOW STOCK WARNING!</p>
                                    <p className="text-sm">Stock below reorder level. Doctors and Surgeons will see a warning when prescribing this product.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Report Tab */}
              <TabsContent value="report" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Inventory Reports & Analytics</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Inventory Value</p>
                          <p className="text-2xl font-bold mt-1 text-green-600">
                            ₦{inventory.reduce((sum, drug) => sum + (drug.price * drug.stockLevel), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Products Count</p>
                          <p className="text-2xl font-bold mt-1">{inventory.length}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Low Stock Items</p>
                          <p className="text-2xl font-bold mt-1 text-red-600">
                            {inventory.filter(d => d.stockLevel <= d.reorderLevel).length}
                          </p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Dispensed</p>
                          <p className="text-2xl font-bold mt-1 text-purple-600">
                            {prescriptions.filter(p => p.status === 'dispensed').length}
                          </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Inventory Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-gray-600">Total Stock Units:</span>
                        <span className="font-semibold">{inventory.reduce((sum, d) => sum + d.stockLevel, 0).toLocaleString()} units</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-gray-600">Average Price Per Unit:</span>
                        <span className="font-semibold">₦{Math.round(inventory.reduce((sum, d) => sum + d.price, 0) / inventory.length)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-gray-600">Categories:</span>
                        <span className="font-semibold">{new Set(inventory.map(d => d.category)).size} types</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Reorder Required:</span>
                        <Badge variant="destructive">
                          {inventory.filter(d => d.stockLevel <= d.reorderLevel).length} items
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        /* PRESCRIPTION MANAGEMENT SECTION */
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

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredPrescriptions.map((rx) => (
                  <div key={rx.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{rx.patientName}</h4>
                        <p className="text-sm text-gray-600">{rx.cardNumber}</p>
                        <p className="text-sm text-gray-500">By {rx.doctor}</p>
                      </div>
                      <Badge variant={rx.status === 'pending' ? 'secondary' : rx.status === 'dispensed' ? 'default' : 'destructive'}>
                        {rx.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      {rx.medications.map((med, idx) => {
                        const drug = inventory.find(d => d.name === med.name);
                        const available = drug?.stockLevel || 0;
                        const isInsufficient = available < med.quantity;

                        return (
                          <div key={idx} className={`p-2 rounded text-sm ${isInsufficient ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{med.name}</p>
                                <p className="text-gray-600">
                                  Qty: {med.quantity} • {med.frequency}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs ${isInsufficient ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                  Stock: {available}
                                </p>
                                {drug && (
                                  <p className="text-xs font-semibold text-green-700">
                                    ₦{(drug.price * med.quantity).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <p className="font-semibold text-gray-900">
                        Total: ₦{calculateTotalAmount(rx.medications).toLocaleString()}
                      </p>
                      {rx.status === 'pending' && (
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(rx);
                            setIsDispenseDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Dispense
                        </Button>
                      )}
                    </div>
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {inventory.map((drug) => {
                  const isLowStock = drug.stockLevel <= drug.reorderLevel;
                  return (
                    <div
                      key={drug.id}
                      className={`border-2 rounded-lg p-4 ${isLowStock ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
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

                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Stock Level</p>
                          <p className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                            {drug.stockLevel} units
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Price/Unit</p>
                          <p className="font-semibold text-gray-900">₦{drug.price}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reorder Level</p>
                          <p className="font-semibold text-gray-700">{drug.reorderLevel}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expiry Date</p>
                          <p className="font-semibold text-gray-700 text-xs">{drug.expiryDate}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dispense Dialog */}
      <Dialog open={isDispenseDialogOpen} onOpenChange={setIsDispenseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispense Medication - {selectedPrescription?.patientName}</DialogTitle>
            <DialogDescription>
              Record handwritten notes and dispense medication for {selectedPrescription?.cardNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-4">
              {/* Prescription Details */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Prescription Details</h3>
                  <div className="space-y-2">
                    {selectedPrescription.medications.map((med, idx) => {
                      const drug = inventory.find(d => d.name === med.name);
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-gray-600">Qty: {med.quantity} • {med.frequency}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Stock: {drug?.stockLevel || 0}</p>
                            {drug && (
                              <p className="font-semibold text-green-700">
                                ₦{(drug.price * med.quantity).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="font-semibold text-blue-900">
                      Total Amount: ₦{calculateTotalAmount(selectedPrescription.medications).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Handwriting Notes */}
              <div>
                <Label className="text-sm font-semibold">Pharmacist Handwriting Notes</Label>
                <div className="mt-2 border rounded-lg p-2 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border rounded cursor-crosshair bg-gray-50 w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={clearCanvas}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                    <Button size="sm" onClick={interpretHandwriting}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Interpret Handwriting
                    </Button>
                  </div>
                  {handwritingNotes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      {handwritingNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Label className="text-sm font-semibold">Additional Notes</Label>
                <Textarea
                  placeholder="Counseling notes, special instructions, patient concerns..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDispenseMedication}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Dispense Medication
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDispenseDialogOpen(false);
                    clearCanvas();
                    setHandwritingNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter details of the new product to add to the inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Product Name</Label>
                <Input
                  placeholder="Enter product name"
                  className="mt-1"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Category</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => {
                      if (value === 'add-new-category') {
                        setIsAddCategoryDialogOpen(true);
                      } else {
                        // Clear subcategory when category changes
                        setNewProduct({ ...newProduct, category: value, subCategory: '' });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="add-new-category">
                        <span className="flex items-center text-green-600 font-semibold">
                          <Plus className="w-3 h-3 mr-1" />
                          Add New Category
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setIsAddCategoryDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Sub Category</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={newProduct.subCategory}
                    onValueChange={(value) => {
                      if (value === 'add-new-subcategory') {
                        setIsAddSubCategoryDialogOpen(true);
                      } else {
                        setNewProduct({ ...newProduct, subCategory: value });
                      }
                    }}
                    disabled={!newProduct.category}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={newProduct.category ? "Select subcategory" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrentSubCategories().map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                      <SelectItem value="add-new-subcategory">
                        <span className="flex items-center text-green-600 font-semibold">
                          <Plus className="w-3 h-3 mr-1" />
                          Add New Subcategory
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setIsAddSubCategoryDialogOpen(true)}
                    disabled={!newProduct.category}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {!newProduct.category && (
                  <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold">Stock Level</Label>
                <Input
                  placeholder="Enter stock level"
                  className="mt-1"
                  value={newProduct.stockLevel}
                  onChange={(e) => setNewProduct({ ...newProduct, stockLevel: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Reorder Level</Label>
                <Input
                  placeholder="Enter reorder level"
                  className="mt-1"
                  value={newProduct.reorderLevel}
                  onChange={(e) => setNewProduct({ ...newProduct, reorderLevel: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Expiry Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={newProduct.expiryDate}
                  onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Stock Status</Label>
                <Select
                  value={newProduct.stockStatus}
                  onValueChange={(value: 'NEW' | 'OLD') => setNewProduct({ ...newProduct, stockStatus: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-green-600">NEW</Badge>
                        <span>New Stock</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="OLD">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-orange-600">OLD</Badge>
                        <span>Old Stock</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Cost Price</Label>
                <Input
                  placeholder="Enter cost price"
                  className="mt-1"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Selling Price</Label>
                <Input
                  placeholder="Enter selling price"
                  className="mt-1"
                  value={newProduct.sellingPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Account to Credit</Label>
                <Input
                  placeholder="Enter account to credit"
                  className="mt-1"
                  value={newProduct.accountToCredit}
                  onChange={(e) => setNewProduct({ ...newProduct, accountToCredit: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Account to Debit</Label>
                <Input
                  placeholder="Enter account to debit"
                  className="mt-1"
                  value={newProduct.accountToDebit}
                  onChange={(e) => setNewProduct({ ...newProduct, accountToDebit: e.target.value })}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddProduct}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProductDialogOpen(false);
                  setNewProduct({
                    name: '',
                    category: '',
                    subCategory: '',
                    stockLevel: '',
                    reorderLevel: '',
                    expiryDate: '',
                    costPrice: '',
                    sellingPrice: '',
                    accountToCredit: '',
                    accountToDebit: '',
                    stockStatus: 'NEW' as 'NEW' | 'OLD'
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter the name of the new category to add to the inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Category Name</Label>
                <Input
                  placeholder="Enter category name"
                  className="mt-1"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddCategory}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddCategoryDialogOpen(false);
                  setNewCategoryName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add SubCategory Dialog */}
      <Dialog open={isAddSubCategoryDialogOpen} onOpenChange={setIsAddSubCategoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
            <DialogDescription>
              Enter the name of the new subcategory to add to the inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Subcategory Name</Label>
                <Input
                  placeholder="Enter subcategory name"
                  className="mt-1"
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddSubCategory}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subcategory
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddSubCategoryDialogOpen(false);
                  setNewSubCategoryName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Drug Request Dialog */}
      <Dialog open={isViewRequestDialogOpen} onOpenChange={setIsViewRequestDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              Drug Request Details
            </DialogTitle>
            <DialogDescription>
              Review the complete details of this drug request
            </DialogDescription>
          </DialogHeader>

          {selectedDrugRequest && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedDrugRequest.status === 'Pending' ? 'bg-orange-50 border border-orange-200' :
                selectedDrugRequest.status === 'Approved' ? 'bg-green-50 border border-green-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{selectedDrugRequest.requestNumber}</p>
                    <p className="text-sm text-gray-600">
                      Requested on {new Date(selectedDrugRequest.requestDate).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={`${
                    selectedDrugRequest.status === 'Pending' ? 'bg-orange-600' :
                    selectedDrugRequest.status === 'Approved' ? 'bg-green-600' : 'bg-red-600'
                  } text-lg px-4 py-2`}>
                    {selectedDrugRequest.status}
                  </Badge>
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Requester Type</p>
                    <Badge variant="outline" className={`${
                      selectedDrugRequest.requesterType === 'Doctor' ? 'border-blue-600 text-blue-600' :
                      selectedDrugRequest.requesterType === 'Surgeon' ? 'border-purple-600 text-purple-600' :
                      'border-green-600 text-green-600'
                    }`}>
                      {selectedDrugRequest.requesterType}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Priority Level</p>
                    <Badge className={`${
                      selectedDrugRequest.priority === 'Emergency' ? 'bg-red-600' :
                      selectedDrugRequest.priority === 'Urgent' ? 'bg-orange-600' : 'bg-blue-600'
                    }`}>
                      {selectedDrugRequest.priority}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Requester Name</p>
                    <p className="font-semibold">{selectedDrugRequest.requesterName}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Requester ID</p>
                    <p className="font-semibold">{selectedDrugRequest.requesterId}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Patient Name</p>
                    <p className="font-semibold">{selectedDrugRequest.patientName}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Patient Card Number</p>
                    <p className="font-semibold">{selectedDrugRequest.patientCardNumber}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Requested Drugs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Requested Drugs ({selectedDrugRequest.drugs.length})</CardTitle>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₦{selectedDrugRequest.drugs.reduce((sum: number, drug: any) => sum + drug.totalPrice, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedDrugRequest.drugs.map((drug: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{drug.drugName}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="text-lg font-bold text-green-600">₦{drug.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Dosage</p>
                            <p className="font-medium">{drug.dosage}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium">{drug.quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Unit Price</p>
                            <p className="font-medium">₦{drug.unitPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Frequency</p>
                            <p className="font-medium">{drug.frequency}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-medium">{drug.duration}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-medium text-green-600">₦{drug.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Drugs: {selectedDrugRequest.drugs.length}</p>
                        <p className="text-sm text-gray-600">Total Items: {selectedDrugRequest.drugs.reduce((sum: number, drug: any) => sum + drug.quantity, 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">Grand Total</p>
                        <p className="text-3xl font-bold text-blue-600">
                          ₦{selectedDrugRequest.drugs.reduce((sum: number, drug: any) => sum + drug.totalPrice, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedDrugRequest.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedDrugRequest.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Approval/Rejection Details */}
              {selectedDrugRequest.status === 'Approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Approved</p>
                      <p className="text-sm text-green-800">
                        By {selectedDrugRequest.approvedBy} on {new Date(selectedDrugRequest.approvedDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedDrugRequest.status === 'Rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Rejected</p>
                      <p className="text-sm text-red-800">
                        By {selectedDrugRequest.rejectedBy} on {new Date(selectedDrugRequest.rejectedDate).toLocaleString()}
                      </p>
                      {selectedDrugRequest.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-100 rounded">
                          <p className="text-xs font-semibold text-red-900">Reason:</p>
                          <p className="text-sm text-red-800">{selectedDrugRequest.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Requests */}
              {selectedDrugRequest.status === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      approveDrugRequest(selectedDrugRequest.id, 'Inventory Manager');
                      toast.success(`Request ${selectedDrugRequest.requestNumber} approved!`);
                      setIsViewRequestDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Request
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      setIsViewRequestDialogOpen(false);
                      setIsRejectDialogOpen(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Request
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Drug Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>

          {selectedDrugRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold">{selectedDrugRequest.requestNumber}</p>
                <p className="text-xs text-gray-600">Requested by {selectedDrugRequest.requesterName}</p>
              </div>

              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejecting this request..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                  <p className="text-xs text-orange-900">
                    Please check for anomalies such as incorrect dosages, unavailable drugs, 
                    or suspicious quantities before rejecting.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      toast.error('Please provide a rejection reason');
                      return;
                    }
                    rejectDrugRequest(selectedDrugRequest.id, 'Inventory Manager', rejectionReason);
                    toast.success(`Request ${selectedDrugRequest.requestNumber} rejected`);
                    setIsRejectDialogOpen(false);
                    setRejectionReason('');
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
