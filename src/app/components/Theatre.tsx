import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Scissors,
  Calendar,
  Users,
  AlertCircle,
  Search,
  Plus,
  CheckCircle,
  Clock,
  FileText,
  UserPlus,
  ClipboardCheck,
  FolderOpen,
  Wrench,
  Activity,
  Heart,
  Syringe,
  Shield,
  Stethoscope,
  Thermometer,
  Zap,
  Wind,
  ChevronDown,
  Settings,
  LogOut,
  Package,
  PackageCheck,
  Pill,
  Droplet,
  X,
  AlertTriangle,
  Minus,
  Trash2,
  ArrowRight,
  Bed,
  Cross,
  Beaker,
  Send,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useTheatre } from '../context/TheatreContext';
import { useTheatreAuth } from '../context/TheatreAuthContext';
import { SurgeonLogin } from './SurgeonLogin';
import { AnesthetistLogin } from './AnesthetistLogin';
import { toast } from 'sonner';

// Theatre Equipment Categories
const theatreEquipment = {
  surgicalInstruments: [
    'Scalpel',
    'Forceps',
    'Scissors',
    'Needle holders',
    'Retractors',
    'Surgical clamps',
    'Towel clamps',
    'Tissue forceps',
  ],
  anesthesiaEquipment: [
    'Anesthesia machine',
    'Ventilator',
    'Oxygen cylinders',
    'Laryngoscope',
    'Endotracheal tubes',
    'Anesthesia cart',
    'Airways',
    'Breathing circuits',
  ],
  monitoringEquipment: [
    'ECG monitor',
    'Pulse oximeter',
    'Blood pressure monitor',
    'Capnography monitor',
    'Temperature monitor',
    'Multi-parameter monitor',
  ],
  operatingRoomEquipment: [
    'Operating table',
    'Surgical lights',
    'Electrosurgical unit (cautery)',
    'Suction machine',
    'Surgical Mayo stand',
    'Instrument tables',
  ],
  sterilizationEquipment: [
    'Autoclave machine',
    'Sterilization trays',
    'UV sterilizers',
    'Sterilization indicators',
    'Sterile containers',
  ],
  disposableConsumables: [
    'Gloves',
    'Syringes',
    'Sutures',
    'Drapes',
    'IV sets',
    'Gauze',
    'Swabs',
    'Needles',
  ],
  specializedEquipment: [
    'Laparoscopy tower',
    'Orthopedic drill',
    'Endoscopy system',
    'C-Arm fluoroscopy',
    'Surgical microscope',
    'Cryotherapy unit',
  ],
  emergencyEquipment: [
    'Defibrillator',
    'Crash cart',
    'Emergency suction',
    'Backup oxygen',
    'Emergency drugs',
    'Resuscitation bag',
  ],
};

// Staff Roles
const staffRoles = [
  'Theatre Attendant',
  'Surgeon',
  'Assistant Surgeon',
  'Anesthetist',
  'Scrub Nurse',
  'Circulating Nurse',
  'Theatre Technician',
  'Recovery Nurse',
];

interface Surgery {
  id: string;
  patientName: string;
  cardNumber: string;
  surgeryType: string;
  surgeon: string;
  nurses: string[];
  theatreRoom: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'pre-op' | 'in-progress' | 'post-op' | 'completed';
  duration?: string;
  notes?: string;
  checkedOutEquipment?: EquipmentCheckout[];
}

interface EquipmentItem {
  name: string;
  category: string;
  totalCount: number;
  availableCount: number;
  inUseCount: number;
}

interface EquipmentCheckout {
  equipmentName: string;
  category: string;
  quantityCheckedOut: number;
  checkedOutBy: string;
  checkedOutAt: string;
  returned: boolean;
  returnedAt?: string;
  returnedBy?: string;
}

interface TheatreStaff {
  id: string;
  name: string;
  role: string;
  specialization?: string;
  licenseNumber?: string;
  contactNumber: string;
  availability: 'available' | 'in-surgery' | 'off-duty';
}

interface PreOpChecklist {
  consentFormUploaded: boolean;
  consentFormFile: string;
  consentFormDate: string;
  labResultsVerified: boolean;
  labTestsCompleted: string;
  labResultsNotes: string;
  patientFastingStatus: boolean;
  fastingHours: string;
  lastMealTime: string;
  riskAssessment: boolean;
  riskLevel: string;
  riskFactors: string;
  allergiesMedicalAlert: boolean;
  knownAllergies: string;
  medicalAlerts: string;
  notes: string;
}

interface TheatreCaseFile {
  id: string;
  patientId: string;
  patientName: string;
  diagnosis: string;
  plannedProcedure: string;
  surgeonNotes: string;
  medicalHistory: string;
  labResults: string;
  imagingResults: string;
}

interface AnesthesiaDrug {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  timeGiven: string;
  price: number;
}

interface AnesthesiaRecord {
  patientId: string;
  patientName: string;
  cardNumber: string;
  anesthetistName: string;
  anesthesiaType: string;
  drugs: AnesthesiaDrug[];
  monitoring: {
    bloodPressure: string;
    pulseRate: string;
    oxygenSaturation: string;
    respiratoryRate: string;
    timeStarted: string;
    timeEnded: string;
  };
  medicalHistory: string;
  billingAmount: string;
  surgeryReport: string;
  timestamp: string;
}

export function Theatre() {
  const { currentStaff, logout, isAuthenticated } = useTheatreAuth();
  const { theatreNotes, updateTheatreNote } = useTheatre();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);
  
  // Handle tab from URL parameter (hash-based routing)
  const getTabFromUrl = () => {
    const hash = window.location.hash; // e.g., "#/theatre?tab=staff"
    const queryStart = hash.indexOf('?');
    if (queryStart !== -1) {
      const queryString = hash.substring(queryStart + 1);
      const params = new URLSearchParams(queryString);
      return params.get('tab') || 'overview';
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  // Listen for URL changes to update active tab
  useEffect(() => {
    const handleUrlChange = () => {
      const tab = getTabFromUrl();
      setActiveTab(tab);
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleUrlChange);
    
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Ensure activeTab has a valid value
  useEffect(() => {
    if (!activeTab || !['overview', 'surgeon', 'anesthetist', 'staff', 'preop', 'casefile', 'equipment'].includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab]);

  // Staff Management State
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [theatreStaff, setTheatreStaff] = useState<TheatreStaff[]>([
    {
      id: 'TS-001',
      name: 'Dr. Sarah Johnson',
      role: 'Surgeon',
      specialization: 'General Surgery',
      licenseNumber: 'SG-2019-0345',
      contactNumber: '+234 802 345 6789',
      availability: 'in-surgery',
    },
    {
      id: 'TS-002',
      name: 'Dr. Michael Chen',
      role: 'Anesthetist',
      specialization: 'Anesthesiology',
      licenseNumber: 'AN-2018-0892',
      contactNumber: '+234 803 456 7890',
      availability: 'available',
    },
    {
      id: 'TS-003',
      name: 'Nurse Mary Williams',
      role: 'Scrub Nurse',
      licenseNumber: 'RN-2020-1234',
      contactNumber: '+234 804 567 8901',
      availability: 'available',
    },
  ]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    specialization: '',
    licenseNumber: '',
    contactNumber: '',
  });

  // Pre-Op Checklist State
  const [showPreOpDialog, setShowPreOpDialog] = useState(false);
  
  // Debug
  console.log('Pre-Op Dialog State:', showPreOpDialog);
  
  const [preOpChecklist, setPreOpChecklist] = useState<PreOpChecklist>({
    consentFormUploaded: false,
    consentFormFile: '',
    consentFormDate: '',
    labResultsVerified: false,
    labTestsCompleted: '',
    labResultsNotes: '',
    patientFastingStatus: false,
    fastingHours: '',
    lastMealTime: '',
    riskAssessment: false,
    riskLevel: '',
    riskFactors: '',
    allergiesMedicalAlert: false,
    knownAllergies: '',
    medicalAlerts: '',
    notes: '',
  });

  // Case File State
  const [showCaseFileDialog, setShowCaseFileDialog] = useState(false);
  const [caseFiles, setCaseFiles] = useState<TheatreCaseFile[]>([]);
  const [selectedCaseFile, setSelectedCaseFile] = useState<TheatreCaseFile | null>(null);

  // Equipment Management State
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState('');
  const [showEquipmentCheckoutDialog, setShowEquipmentCheckoutDialog] = useState(false);
  const [showEquipmentReturnDialog, setShowEquipmentReturnDialog] = useState(false);
  const [selectedSurgeryForEquipment, setSelectedSurgeryForEquipment] = useState<Surgery | null>(null);
  const [showEquipmentInUseDialog, setShowEquipmentInUseDialog] = useState(false);
  
  // Anesthesia State
  const [showAnesthesiaDialog, setShowAnesthesiaDialog] = useState(false);
  const [selectedPatientForAnesthesia, setSelectedPatientForAnesthesia] = useState<any>(null);
  const [anesthesiaType, setAnesthesiaType] = useState('');
  const [anesthesiaDrugs, setAnesthesiaDrugs] = useState<AnesthesiaDrug[]>([]);
  const [newDrug, setNewDrug] = useState({
    drugName: '',
    dose: '',
    route: '',
  });
  const [anesthesiaMonitoring, setAnesthesiaMonitoring] = useState({
    bloodPressure: '',
    pulseRate: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    timeStarted: '',
    timeEnded: '',
  });
  const [anesthesiaRecords, setAnesthesiaRecords] = useState<AnesthesiaRecord[]>([]);
  const [billingAmount, setBillingAmount] = useState('');
  const [surgeryReport, setSurgeryReport] = useState('');

  // Pre-Op Medications State
  const [showPreOpMedicationsDialog, setShowPreOpMedicationsDialog] = useState(false);
  const [selectedCaseForMedications, setSelectedCaseForMedications] = useState<any>(null);
  const [newPreOpMed, setNewPreOpMed] = useState({
    name: '',
    type: 'medication' as 'medication' | 'drip',
    dosage: '',
    route: 'IV',
    frequency: '',
  });
  
  // Pharmacy Inventory - Mock data
  const [pharmacyInventory] = useState([
    { name: 'Normal Saline 0.9%', type: 'drip', stock: 150, unit: 'bags', price: 500 },
    { name: 'Dextrose 5%', type: 'drip', stock: 120, unit: 'bags', price: 600 },
    { name: 'Ringer\'s Lactate', type: 'drip', stock: 100, unit: 'bags', price: 700 },
    { name: 'Cefuroxime 750mg', type: 'medication', stock: 200, unit: 'vials', price: 1500 },
    { name: 'Metronidazole 500mg', type: 'medication', stock: 180, unit: 'vials', price: 800 },
    { name: 'Morphine 10mg/ml', type: 'medication', stock: 50, unit: 'ampules', price: 2500 },
    { name: 'Midazolam 5mg/ml', type: 'medication', stock: 75, unit: 'ampules', price: 2000 },
    { name: 'Atropine 0.6mg/ml', type: 'medication', stock: 60, unit: 'ampules', price: 1200 },
    { name: 'Ondansetron 4mg', type: 'medication', stock: 90, unit: 'ampules', price: 1800 },
    { name: 'Diclofenac 75mg', type: 'medication', stock: 120, unit: 'ampules', price: 600 },
    { name: 'Tramadol 100mg', type: 'medication', stock: 100, unit: 'ampules', price: 900 },
    { name: 'Ranitidine 50mg', type: 'medication', stock: 150, unit: 'ampules', price: 500 },
    { name: 'Propofol 200mg', type: 'medication', stock: 80, unit: 'vials', price: 5000 },
    { name: 'Ketamine 500mg', type: 'medication', stock: 60, unit: 'vials', price: 4500 },
    { name: 'Lidocaine 2%', type: 'medication', stock: 100, unit: 'vials', price: 1500 },
    { name: 'Bupivacaine 0.5%', type: 'medication', stock: 70, unit: 'ampules', price: 3000 },
    { name: 'Diazepam 10mg', type: 'medication', stock: 90, unit: 'ampules', price: 1000 },
    { name: 'Fentanyl 100mcg', type: 'medication', stock: 50, unit: 'ampules', price: 3500 },
    { name: 'Rocuronium 50mg', type: 'medication', stock: 40, unit: 'vials', price: 6000 },
    { name: 'Succinylcholine 100mg', type: 'medication', stock: 45, unit: 'vials', price: 4000 },
  ]);
  
  // Equipment Inventory - Initialize with counts
  const [equipmentInventory, setEquipmentInventory] = useState<EquipmentItem[]>(() => {
    const inventory: EquipmentItem[] = [];
    Object.entries(theatreEquipment).forEach(([category, items]) => {
      items.forEach((item) => {
        inventory.push({
          name: item,
          category,
          totalCount: 10, // Default total count
          availableCount: 10,
          inUseCount: 0,
        });
      });
    });
    return inventory;
  });

  const [mockSurgeries] = useState<Surgery[]>([
    {
      id: 'SUR-001',
      patientName: 'James Anderson',
      cardNumber: 'PT-2026-0001',
      surgeryType: 'Appendectomy',
      surgeon: 'Dr. Sarah Johnson',
      nurses: ['Nurse Mary', 'Nurse John'],
      theatreRoom: 'Theatre 1',
      scheduledDate: '2026-04-21',
      scheduledTime: '14:00',
      status: 'scheduled',
    },
    {
      id: 'SUR-002',
      patientName: 'Grace Okonkwo',
      cardNumber: 'PT-2026-0002',
      surgeryType: 'Cesarean Section',
      surgeon: 'Dr. Michael Chen',
      nurses: ['Nurse Lisa', 'Nurse Peter'],
      theatreRoom: 'Theatre 2',
      scheduledDate: '2026-04-21',
      scheduledTime: '10:00',
      status: 'in-progress',
      duration: '1h 30m',
    },
    {
      id: 'SUR-003',
      patientName: 'Mohammed Ibrahim',
      cardNumber: 'PT-2025-1234',
      surgeryType: 'Hernia Repair',
      surgeon: 'Dr. Sarah Johnson',
      nurses: ['Nurse Emma', 'Nurse David'],
      theatreRoom: 'Theatre 1',
      scheduledDate: '2026-04-20',
      scheduledTime: '09:00',
      status: 'completed',
      duration: '2h 15m',
      notes: 'Surgery completed successfully. Patient stable.',
    },
  ]);

  const stats = [
    { label: 'Scheduled Today', value: '5', icon: Calendar, color: 'bg-blue-500' },
    { label: 'In Progress', value: '1', icon: Scissors, color: 'bg-orange-500' },
    { label: 'Completed', value: '3', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Theatre Rooms', value: '3', icon: Users, color: 'bg-purple-500' },
  ];

  const filteredSurgeries = mockSurgeries.filter(
    (surgery) =>
      surgery.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surgery.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surgery.surgeryType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Anesthesia handlers
  const handleAddDrug = () => {
    if (!newDrug.drugName || !newDrug.dose || !newDrug.route) {
      toast.error('Please fill in all drug fields');
      return;
    }

    // Get drug price from pharmacy inventory
    const pharmacyItem = pharmacyInventory.find(item => item.name === newDrug.drugName);
    const drugPrice = pharmacyItem?.price || 0;

    const drug: AnesthesiaDrug = {
      id: `DRUG-${Date.now()}`,
      ...newDrug,
      timeGiven: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: drugPrice,
    };

    setAnesthesiaDrugs([...anesthesiaDrugs, drug]);
    
    // Auto-calculate billing: add drug price to current billing amount
    const currentBilling = Number(billingAmount) || 0;
    const newTotal = currentBilling + drugPrice;
    setBillingAmount(String(newTotal));
    
    setNewDrug({ drugName: '', dose: '', route: '' });
    toast.success(`Drug added: ₦${drugPrice.toLocaleString()} added to bill`);
  };

  const handleRemoveDrug = (id: string) => {
    const drugToRemove = anesthesiaDrugs.find(d => d.id === id);
    if (drugToRemove) {
      // Subtract drug price from billing
      const currentBilling = Number(billingAmount) || 0;
      const newTotal = Math.max(0, currentBilling - drugToRemove.price);
      setBillingAmount(String(newTotal));
    }
    
    setAnesthesiaDrugs(anesthesiaDrugs.filter(d => d.id !== id));
    toast.success('Drug removed and billing updated');
  };

  const handleSaveAnesthesiaRecord = () => {
    if (!anesthesiaType || anesthesiaDrugs.length === 0) {
      toast.error('Please select anesthesia type and add at least one drug');
      return;
    }

    if (!anesthesiaMonitoring.bloodPressure || !anesthesiaMonitoring.pulseRate) {
      toast.error('Please fill in vital monitoring data');
      return;
    }

    const record: AnesthesiaRecord = {
      patientId: selectedPatientForAnesthesia?.cardNumber || '',
      patientName: selectedPatientForAnesthesia?.patientName || '',
      cardNumber: selectedPatientForAnesthesia?.cardNumber || '',
      anesthetistName: currentStaff?.fullName || '',
      anesthesiaType,
      drugs: anesthesiaDrugs,
      monitoring: anesthesiaMonitoring,
      medicalHistory: selectedPatientForAnesthesia?.medicalHistory || '',
      billingAmount,
      surgeryReport,
      timestamp: new Date().toISOString(),
    };

    setAnesthesiaRecords([...anesthesiaRecords, record]);
    
    // Reset form
    setAnesthesiaType('');
    setAnesthesiaDrugs([]);
    setAnesthesiaMonitoring({
      bloodPressure: '',
      pulseRate: '',
      oxygenSaturation: '',
      respiratoryRate: '',
      timeStarted: '',
      timeEnded: '',
    });
    setBillingAmount('');
    setSurgeryReport('');
    setShowAnesthesiaDialog(false);
    setSelectedPatientForAnesthesia(null);
    
    toast.success('Anesthesia record saved successfully');
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.role) {
      toast.error('Please fill in required fields');
      return;
    }

    const staff: TheatreStaff = {
      id: `TS-${String(theatreStaff.length + 1).padStart(3, '0')}`,
      ...newStaff,
      availability: 'available',
    };

    setTheatreStaff([...theatreStaff, staff]);
    toast.success(`${newStaff.name} registered successfully`);
    setNewStaff({
      name: '',
      role: '',
      specialization: '',
      licenseNumber: '',
      contactNumber: '',
    });
    setShowStaffDialog(false);
  };

  const handleSavePreOpChecklist = () => {
    const completedItems = Object.values(preOpChecklist).filter(
      (value) => typeof value === 'boolean' && value
    ).length;
    toast.success(`Pre-Op checklist saved (${completedItems}/5 items completed)`);
    setShowPreOpDialog(false);
  };

  // Equipment checkout handler
  const handleEquipmentCheckout = (equipmentName: string, quantity: number) => {
    if (!selectedSurgeryForEquipment || !currentStaff) return;

    // Update inventory
    setEquipmentInventory((prev) =>
      prev.map((item) =>
        item.name === equipmentName
          ? {
              ...item,
              availableCount: item.availableCount - quantity,
              inUseCount: item.inUseCount + quantity,
            }
          : item
      )
    );

    // Record checkout
    const checkout: EquipmentCheckout = {
      equipmentName,
      category: equipmentInventory.find((e) => e.name === equipmentName)?.category || '',
      quantityCheckedOut: quantity,
      checkedOutBy: currentStaff.fullName,
      checkedOutAt: new Date().toISOString(),
      returned: false,
    };

    // Update surgery with checked out equipment
    const updatedEquipment = [
      ...(selectedSurgeryForEquipment.checkedOutEquipment || []),
      checkout,
    ];
    
    setSelectedSurgeryForEquipment({
      ...selectedSurgeryForEquipment,
      checkedOutEquipment: updatedEquipment,
    });

    toast.success(`Checked out ${quantity}x ${equipmentName}`);
  };

  // Equipment return handler
  const handleEquipmentReturn = (checkout: EquipmentCheckout) => {
    if (!selectedSurgeryForEquipment || !currentStaff) return;

    // Update inventory
    setEquipmentInventory((prev) =>
      prev.map((item) =>
        item.name === checkout.equipmentName
          ? {
              ...item,
              availableCount: item.availableCount + checkout.quantityCheckedOut,
              inUseCount: item.inUseCount - checkout.quantityCheckedOut,
            }
          : item
      )
    );

    // Mark as returned
    const updatedEquipment = selectedSurgeryForEquipment.checkedOutEquipment?.map((co) =>
      co.equipmentName === checkout.equipmentName && co.checkedOutAt === checkout.checkedOutAt
        ? {
            ...co,
            returned: true,
            returnedAt: new Date().toISOString(),
            returnedBy: currentStaff.fullName,
          }
        : co
    );

    setSelectedSurgeryForEquipment({
      ...selectedSurgeryForEquipment,
      checkedOutEquipment: updatedEquipment,
    });

    toast.success(`Returned ${checkout.quantityCheckedOut}x ${checkout.equipmentName}`);
  };

  // Pre-Op Medication handler
  const handleAddPreOpMedication = () => {
    if (!selectedCaseForMedications || !currentStaff) return;
    
    if (!newPreOpMed.name || !newPreOpMed.dosage || !newPreOpMed.frequency) {
      toast.error('Please fill in all required fields');
      return;
    }

    const medication: any = {
      id: `MED-${Date.now()}`,
      name: newPreOpMed.name,
      type: newPreOpMed.type,
      dosage: newPreOpMed.dosage,
      route: newPreOpMed.route,
      frequency: newPreOpMed.frequency,
      prescribedBy: currentStaff.fullName,
      prescribedDate: new Date().toISOString(),
      administered: false,
    };

    // Update theatre note
    updateTheatreNote(selectedCaseForMedications.id, {
      preOpMedications: [
        ...(selectedCaseForMedications.preOpMedications || []),
        medication,
      ],
    });

    toast.success(`Added ${newPreOpMed.type}: ${newPreOpMed.name}`);
    
    // Reset form
    setNewPreOpMed({
      name: '',
      type: 'medication',
      dosage: '',
      route: 'IV',
      frequency: '',
    });
  };

  const handleRemovePreOpMedication = (medId: string) => {
    if (!selectedCaseForMedications) return;

    updateTheatreNote(selectedCaseForMedications.id, {
      preOpMedications: selectedCaseForMedications.preOpMedications?.filter(
        (med: any) => med.id !== medId
      ),
    });

    toast.success('Medication removed');
  };

  const handleMarkMedicationAdministered = (medId: string) => {
    if (!selectedCaseForMedications || !currentStaff) return;

    const updatedMeds = selectedCaseForMedications.preOpMedications?.map((med: any) =>
      med.id === medId
        ? {
            ...med,
            administered: true,
            administeredBy: currentStaff.fullName,
            administeredDate: new Date().toISOString(),
          }
        : med
    );

    updateTheatreNote(selectedCaseForMedications.id, {
      preOpMedications: updatedMeds,
    });

    toast.success('Marked as administered');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="surgeon">Surgeon</TabsTrigger>
          <TabsTrigger value="anesthetist">Anesthetist</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="preop">Pre-Op</TabsTrigger>
          <TabsTrigger value="casefile">Case Files</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Surgeries</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search surgeries..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSurgeries.map((surgery) => (
                  <Card
                    key={surgery.id}
                    className={`cursor-pointer transition-all ${
                      selectedSurgery?.id === surgery.id ? 'border-red-500 bg-red-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedSurgery(surgery)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{surgery.patientName}</h4>
                            <Badge
                              variant={
                                surgery.status === 'scheduled'
                                  ? 'secondary'
                                  : surgery.status === 'in-progress'
                                  ? 'default'
                                  : surgery.status === 'completed'
                                  ? 'outline'
                                  : 'secondary'
                              }
                              className={
                                surgery.status === 'in-progress'
                                  ? 'bg-orange-500'
                                  : surgery.status === 'completed'
                                  ? 'bg-green-600 text-white'
                                  : ''
                              }
                            >
                              {surgery.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{surgery.cardNumber}</p>
                          <p className="text-sm font-medium text-gray-900 mb-2">{surgery.surgeryType}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Surgeon:</span> {surgery.surgeon}
                            </div>
                            <div>
                              <span className="font-medium">Theatre:</span> {surgery.theatreRoom}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {surgery.scheduledDate}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span> {surgery.scheduledTime}
                            </div>
                          </div>
                          {surgery.duration && (
                            <p className="text-sm text-gray-500 mt-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Duration: {surgery.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surgeon Tab */}
        <TabsContent value="surgeon" className="mt-6 space-y-6">
          {isAuthenticated && currentStaff?.role === 'surgeon' ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Surgeon Portal - Welcome, {currentStaff.fullName}</CardTitle>
                      <p className="text-sm text-gray-600">{currentStaff.specialization}</p>
                    </div>
                    <Button onClick={logout} variant="outline">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">My Cases</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {theatreNotes.filter(n => 
                            n.surgeonInCharge === currentStaff.fullName && 
                            (n.status === 'pending' || n.status === 'scheduled' || n.status === 'pre-op')
                          ).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {theatreNotes.filter(n => 
                            n.surgeonInCharge === currentStaff.fullName && n.status === 'in-progress'
                          ).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Pending Pre-Op</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                          {theatreNotes.filter(n => 
                            n.surgeonInCharge === currentStaff.fullName && 
                            (n.status === 'pending' || n.status === 'scheduled')
                          ).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                          {theatreNotes.filter(n => 
                            n.surgeonInCharge === currentStaff.fullName && n.status === 'completed'
                          ).length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* My Surgical Cases */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-blue-600" />
                        My Surgical Cases
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Patients routed from Doctor Module - Manage pre-op checklists and case files</p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {theatreNotes.filter(note => note.surgeonInCharge === currentStaff.fullName).length} Cases
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {(() => {
                      const myCases = theatreNotes.filter(note => note.surgeonInCharge === currentStaff?.fullName);
                      
                      if (myCases.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No cases assigned to you</p>
                            <p className="text-gray-500 text-sm mt-2">Cases routed from the Doctor Module will appear here</p>
                          </div>
                        );
                      }
                      
                      return myCases.map((note) => (
                        <Card key={note.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            {/* Header Section */}
                            <div className="flex items-start justify-between mb-4 pb-4 border-b">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h4 className="font-bold text-lg text-gray-900">{note.patientName}</h4>
                                  <Badge variant="outline" className="font-mono">{note.cardNumber}</Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    className={
                                      note.status === 'pending' ? 'bg-yellow-500 text-white' :
                                      note.status === 'scheduled' ? 'bg-blue-500 text-white' :
                                      note.status === 'in-progress' ? 'bg-orange-500 text-white' :
                                      note.status === 'completed' ? 'bg-green-600 text-white' : 
                                      'bg-gray-500 text-white'
                                    }
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {note.status}
                                  </Badge>
                                  <Badge
                                    className={
                                      note.urgencyLevel === 'emergency' ? 'bg-red-600 text-white' :
                                      note.urgencyLevel === 'urgent' ? 'bg-orange-500 text-white' :
                                      'bg-gray-500 text-white'
                                    }
                                  >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {note.urgencyLevel}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Details Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Planned Surgery</p>
                                    <p className="font-semibold text-gray-900">{note.plannedSurgery}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Stethoscope className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Diagnosis</p>
                                    <p className="font-semibold text-gray-900">{note.preOpDiagnosis}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {note.scheduledDate && (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Scheduled Date & Time</p>
                                        <p className="font-semibold text-gray-900">{note.scheduledDate} at {note.scheduledTime}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Scissors className="w-4 h-4 text-gray-500 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Theatre Room</p>
                                        <p className="font-semibold text-gray-900">{note.theatreRoom}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <div className="flex items-start gap-2">
                                  <Users className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Requested By</p>
                                    <p className="font-semibold text-gray-900">{note.requestingDoctor}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Section */}
                            <div className="pt-6 mt-4 border-t-2 border-gray-100">
                              <div className="mb-4 flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900 tracking-tight">Case Management Actions</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">Quick access to case management tools</p>
                                </div>
                              </div>
                              
                              {/* Action Grid */}
                              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                {/* Pre-Op Checklist */}
                                <button
                                  onClick={() => {
                                    setSelectedSurgery({
                                      id: note.id,
                                      patientName: note.patientName,
                                      cardNumber: note.cardNumber,
                                      surgeryType: note.plannedSurgery,
                                      surgeon: note.surgeonInCharge,
                                      nurses: note.assignedNurses || [],
                                      theatreRoom: note.theatreRoom || '',
                                      scheduledDate: note.scheduledDate || '',
                                      scheduledTime: note.scheduledTime || '',
                                      status: note.status as any,
                                    });
                                    setShowPreOpDialog(true);
                                  }}
                                  className="group relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-left transition-all hover:border-green-400 hover:shadow-lg hover:shadow-green-100 hover:-translate-y-0.5"
                                >
                                  <div className="flex flex-col items-center text-center gap-2">
                                    <div className="rounded-full bg-green-100 p-3 group-hover:bg-green-200 transition-colors">
                                      <ClipboardCheck className="w-6 h-6 text-green-700" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-green-900">Pre-Op Checklist</p>
                                      <p className="text-[10px] text-green-600 mt-0.5">Verify preparations</p>
                                    </div>
                                  </div>
                                </button>
                                
                                {/* Case File */}
                                <button
                                  onClick={() => {
                                    setSelectedCaseFile({
                                      id: note.id,
                                      patientId: note.patientId,
                                      patientName: note.patientName,
                                      diagnosis: note.preOpDiagnosis,
                                      plannedProcedure: note.plannedSurgery,
                                      surgeonNotes: note.preparationNotes,
                                      medicalHistory: `Age: ${note.age}, Gender: ${note.gender}`,
                                      labResults: '',
                                      imagingResults: '',
                                    });
                                    setShowCaseFileDialog(true);
                                  }}
                                  className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-4 text-left transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100 hover:-translate-y-0.5"
                                >
                                  <div className="flex flex-col items-center text-center gap-2">
                                    <div className="rounded-full bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                                      <FolderOpen className="w-6 h-6 text-purple-700" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-purple-900">Case File</p>
                                      <p className="text-[10px] text-purple-600 mt-0.5">View case details</p>
                                    </div>
                                  </div>
                                </button>
                                
                                {/* Pre-Op Medications */}
                                <button
                                  onClick={() => {
                                    setSelectedCaseForMedications(note);
                                    setShowPreOpMedicationsDialog(true);
                                  }}
                                  className="group relative overflow-hidden rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 text-left transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-100 hover:-translate-y-0.5"
                                >
                                  <div className="flex flex-col items-center text-center gap-2">
                                    <div className="rounded-full bg-teal-100 p-3 group-hover:bg-teal-200 transition-colors">
                                      <Pill className="w-6 h-6 text-teal-700" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-teal-900">Pre-Op Med/Drip</p>
                                      <p className="text-[10px] text-teal-600 mt-0.5">Manage medications</p>
                                    </div>
                                  </div>
                                </button>
                                
                                {/* Checkout Equipment */}
                                <button
                                  onClick={() => {
                                    setSelectedSurgeryForEquipment({
                                      id: note.id,
                                      patientName: note.patientName,
                                      cardNumber: note.cardNumber,
                                      surgeryType: note.plannedSurgery,
                                      surgeon: note.surgeonInCharge,
                                      nurses: note.assignedNurses || [],
                                      theatreRoom: note.theatreRoom || '',
                                      scheduledDate: note.scheduledDate || '',
                                      scheduledTime: note.scheduledTime || '',
                                      status: note.status as any,
                                      checkedOutEquipment: [],
                                    });
                                    setShowEquipmentCheckoutDialog(true);
                                  }}
                                  className="group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-left transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-0.5"
                                >
                                  <div className="flex flex-col items-center text-center gap-2">
                                    <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                                      <Package className="w-6 h-6 text-blue-700" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-blue-900">Checkout Equipment</p>
                                      <p className="text-[10px] text-blue-600 mt-0.5">Issue equipment</p>
                                    </div>
                                  </div>
                                </button>
                                
                                {/* Return Equipment */}
                                <button
                                  onClick={() => {
                                    setSelectedSurgeryForEquipment({
                                      id: note.id,
                                      patientName: note.patientName,
                                      cardNumber: note.cardNumber,
                                      surgeryType: note.plannedSurgery,
                                      surgeon: note.surgeonInCharge,
                                      nurses: note.assignedNurses || [],
                                      theatreRoom: note.theatreRoom || '',
                                      scheduledDate: note.scheduledDate || '',
                                      scheduledTime: note.scheduledTime || '',
                                      status: note.status as any,
                                      checkedOutEquipment: [],
                                    });
                                    setShowEquipmentReturnDialog(true);
                                  }}
                                  className="group relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-left transition-all hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 hover:-translate-y-0.5"
                                >
                                  <div className="flex flex-col items-center text-center gap-2">
                                    <div className="rounded-full bg-orange-100 p-3 group-hover:bg-orange-200 transition-colors">
                                      <PackageCheck className="w-6 h-6 text-orange-700" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-orange-900">Return Equipment</p>
                                      <p className="text-[10px] text-orange-600 mt-0.5">Return after use</p>
                                    </div>
                                  </div>
                                </button>
                              </div>

                              {/* Billing & Routing Section */}
                              <div className="pt-6 mt-6 border-t-2 border-gray-100">
                                <div className="mb-4 flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 tracking-tight">Billing & Routing</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Route patient and manage case billing</p>
                                  </div>
                                </div>

                                {/* Route Options - 3 Buttons */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-xs font-semibold text-gray-700">Route Patient To:</h5>
                                    {note.routedTo && (
                                      <Badge className={`text-xs ${
                                        note.routedTo === 'morgue' ? 'bg-gray-700' :
                                        note.routedTo === 'anesthetist' ? 'bg-cyan-600' :
                                        'bg-blue-600'
                                      }`}>
                                        Routed to {note.routedTo === 'anesthetist' ? 'Anesthetist' : note.routedTo === 'ward' ? 'Ward' : 'Morgue'}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {note.routedTo === 'morgue' ? (
                                    // Show locked state when routed to morgue
                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                                      <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-3">
                                          <Cross className="w-8 h-8 text-red-700" />
                                        </div>
                                        <h4 className="text-sm font-bold text-red-900 mb-1">Patient Routed to Morgue</h4>
                                        <p className="text-xs text-red-700 mb-2">
                                          Routed on {note.routedDate} by {note.routedBy || 'Surgeon'}
                                        </p>
                                        <div className="bg-white border border-red-300 rounded-lg p-3 mt-3">
                                          <p className="text-xs text-gray-700">
                                            <strong>⚠️ Routing Locked:</strong> Once a patient is routed to the Morgue, 
                                            they cannot be rerouted to Ward or Anesthetist.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                      {/* 1. Route to Anesthetist */}
                                      <button
                                        onClick={() => {
                                          updateTheatreNote(note.id, {
                                            routedTo: 'anesthetist',
                                            routedDate: new Date().toLocaleString(),
                                            routedBy: currentStaff?.fullName || 'Surgeon'
                                          });
                                          toast.success(`${note.patientName} routed to Anesthetist for anesthesia management`);
                                        }}
                                        disabled={note.routedTo === 'anesthetist'}
                                        className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                                          note.routedTo === 'anesthetist'
                                            ? 'border-cyan-400 bg-cyan-100 cursor-not-allowed'
                                            : 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100 hover:-translate-y-0.5'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center text-center gap-2">
                                          <div className={`rounded-full p-3 transition-colors ${
                                            note.routedTo === 'anesthetist' ? 'bg-cyan-200' : 'bg-cyan-100 group-hover:bg-cyan-200'
                                          }`}>
                                            <Syringe className="w-6 h-6 text-cyan-700" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-cyan-900">Route to Anesthetist</p>
                                            <p className="text-[10px] text-cyan-600 mt-0.5">
                                              {note.routedTo === 'anesthetist' ? '✓ Currently Routed' : 'Anesthesia management'}
                                            </p>
                                          </div>
                                        </div>
                                      </button>

                                      {/* 2. Route to Ward and Nursing */}
                                      <button
                                        onClick={() => {
                                          updateTheatreNote(note.id, {
                                            routedTo: 'ward',
                                            routedDate: new Date().toLocaleString(),
                                            routedBy: currentStaff?.fullName || 'Surgeon'
                                          });
                                          toast.success(`${note.patientName} routed to Ward and Nursing for post-operative care`);
                                        }}
                                        disabled={note.routedTo === 'ward'}
                                        className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                                          note.routedTo === 'ward'
                                            ? 'border-blue-400 bg-blue-100 cursor-not-allowed'
                                            : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-0.5'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center text-center gap-2">
                                          <div className={`rounded-full p-3 transition-colors ${
                                            note.routedTo === 'ward' ? 'bg-blue-200' : 'bg-blue-100 group-hover:bg-blue-200'
                                          }`}>
                                            <Bed className="w-6 h-6 text-blue-700" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-blue-900">Route to Ward & Nursing</p>
                                            <p className="text-[10px] text-blue-600 mt-0.5">
                                              {note.routedTo === 'ward' ? '✓ Currently Routed' : 'Post-operative care'}
                                            </p>
                                          </div>
                                        </div>
                                      </button>

                                      {/* 3. Route to Lab */}
                                      <button
                                        onClick={() => {
                                          toast.success(`Lab test request sent for ${note.patientName}`);
                                          toast.info('Lab will add test results and billing to this case');
                                        }}
                                        className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-4 text-left transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100 hover:-translate-y-0.5"
                                      >
                                        <div className="flex flex-col items-center text-center gap-2">
                                          <div className="rounded-full bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                                            <Beaker className="w-6 h-6 text-purple-700" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-purple-900">Route to Lab</p>
                                            <p className="text-[10px] text-purple-600 mt-0.5">Order lab tests</p>
                                          </div>
                                        </div>
                                      </button>

                                      {/* 4. Route to Morgue */}
                                      <button
                                        onClick={() => {
                                          if (window.confirm(
                                            `⚠️ CRITICAL ACTION ⚠️\n\n` +
                                            `Are you sure you want to route ${note.patientName} to the Morgue?\n\n` +
                                            `This action is IRREVERSIBLE and will:\n` +
                                            `• Lock all routing options\n` +
                                            `• Mark the patient as deceased\n` +
                                            `• Prevent any future routing changes\n\n` +
                                            `Click OK to confirm or Cancel to abort.`
                                          )) {
                                            updateTheatreNote(note.id, {
                                              routedTo: 'morgue',
                                              routedDate: new Date().toLocaleString(),
                                              routedBy: currentStaff?.fullName || 'Surgeon',
                                              status: 'completed'
                                            });
                                            toast.error(
                                              `${note.patientName} has been routed to Morgue.\n` +
                                              `Routing locked - No further changes allowed.`,
                                              { duration: 10000 }
                                            );
                                          }
                                        }}
                                        className="group relative overflow-hidden rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-100 p-4 text-left transition-all hover:border-red-400 hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 hover:bg-red-50"
                                      >
                                        <div className="flex flex-col items-center text-center gap-2">
                                          <div className="rounded-full bg-gray-200 p-3 group-hover:bg-red-100 transition-colors">
                                            <Cross className="w-6 h-6 text-gray-700 group-hover:text-red-700" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-gray-900 group-hover:text-red-900">Route to Morgue</p>
                                            <p className="text-[10px] text-gray-600 group-hover:text-red-600 mt-0.5">⚠️ Irreversible action</p>
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Billing Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                  {/* 1. Bill from Anesthetist */}
                                  <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <Syringe className="w-4 h-4 text-cyan-600" />
                                        Bill from Anesthetist
                                      </CardTitle>
                                      <p className="text-xs text-gray-600">Auto-populated from anesthesia work</p>
                                    </CardHeader>
                                    <CardContent>
                                      {(() => {
                                        const patientAnesthesiaRecords = anesthesiaRecords.filter(
                                          r => r.cardNumber === note.cardNumber
                                        );
                                        const totalAnesthesiaBill = patientAnesthesiaRecords.reduce(
                                          (sum, record) => sum + Number(record.billingAmount || 0),
                                          0
                                        );

                                        return patientAnesthesiaRecords.length > 0 ? (
                                          <div className="space-y-3">
                                            {patientAnesthesiaRecords.map((record, idx) => (
                                              <div key={idx} className="bg-white rounded-lg p-3 border border-cyan-200">
                                                <div className="flex justify-between items-start mb-2">
                                                  <div>
                                                    <p className="text-xs font-semibold text-cyan-900">{record.anesthesiaType}</p>
                                                    <p className="text-[10px] text-gray-500">By {record.anesthetistName}</p>
                                                  </div>
                                                  <Badge className="bg-cyan-600 text-xs">
                                                    ₦{Number(record.billingAmount).toLocaleString()}
                                                  </Badge>
                                                </div>
                                                <div className="text-[10px] text-gray-600">
                                                  <p>Drugs: {record.drugs.length} items</p>
                                                  <p className="truncate">Drug Cost: ₦{record.drugs.reduce((s, d) => s + d.price, 0).toLocaleString()}</p>
                                                </div>
                                              </div>
                                            ))}
                                            <div className="pt-2 border-t border-cyan-300">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-900">Total Anesthesia:</span>
                                                <span className="text-lg font-bold text-cyan-700">
                                                  ₦{totalAnesthesiaBill.toLocaleString()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-6">
                                            <Syringe className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-500">No anesthesia bills yet</p>
                                          </div>
                                        );
                                      })()}
                                    </CardContent>
                                  </Card>

                                  {/* 2. Bill from Pre-Op Med/Drip */}
                                  <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-teal-600" />
                                        Bill from Pre-Op Med/Drip
                                      </CardTitle>
                                      <p className="text-xs text-gray-600">Drugs picked from pharmacy</p>
                                    </CardHeader>
                                    <CardContent>
                                      {(() => {
                                        const preOpMeds = note.preOpMedications || [];
                                        const totalPreOpBill = preOpMeds.reduce(
                                          (sum, med: any) => {
                                            const drug = pharmacyInventory.find(d => d.name === med.name);
                                            return sum + (drug?.price || 0);
                                          },
                                          0
                                        );

                                        return preOpMeds.length > 0 ? (
                                          <div className="space-y-3">
                                            {preOpMeds.map((med: any, idx: number) => {
                                              const drug = pharmacyInventory.find(d => d.name === med.name);
                                              return (
                                                <div key={idx} className="bg-white rounded-lg p-3 border border-teal-200">
                                                  <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                      <p className="text-xs font-semibold text-teal-900">{med.name}</p>
                                                      <p className="text-[10px] text-gray-500">{med.dosage} - {med.route}</p>
                                                    </div>
                                                    <Badge className="bg-teal-600 text-xs">
                                                      ₦{(drug?.price || 0).toLocaleString()}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            <div className="pt-2 border-t border-teal-300">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-900">Total Pre-Op:</span>
                                                <span className="text-lg font-bold text-teal-700">
                                                  ₦{totalPreOpBill.toLocaleString()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-6">
                                            <Pill className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-500">No pre-op medications yet</p>
                                          </div>
                                        );
                                      })()}
                                    </CardContent>
                                  </Card>

                                  {/* 3. Manual Billing by Surgeon */}
                                  <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        💰 Manual Billing (Surgeon)
                                      </CardTitle>
                                      <p className="text-xs text-gray-600">Additional surgery fees</p>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-3">
                                        <div>
                                          <Label className="text-xs">Surgery Fee (₦)</Label>
                                          <Input
                                            type="number"
                                            placeholder="Enter surgery fee"
                                            className="mt-1 h-9 text-sm"
                                            id={`surgery-fee-${note.id}`}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Description</Label>
                                          <Input
                                            placeholder="e.g., Consultation, Theatre fees"
                                            className="mt-1 h-9 text-sm"
                                            id={`surgery-desc-${note.id}`}
                                          />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* 4. Bill from Lab */}
                                  <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <Beaker className="w-4 h-4 text-purple-600" />
                                        Bill from Lab
                                      </CardTitle>
                                      <p className="text-xs text-gray-600">Auto-populated from lab tests</p>
                                    </CardHeader>
                                    <CardContent>
                                      {(() => {
                                        const labTests = note.labTests || [];
                                        const totalLabBill = labTests.reduce(
                                          (sum, test) => sum + Number(test.price || 0),
                                          0
                                        );

                                        return labTests.length > 0 ? (
                                          <div className="space-y-3">
                                            {labTests.map((test, idx) => (
                                              <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                                                <div className="flex justify-between items-start mb-2">
                                                  <div>
                                                    <p className="text-xs font-semibold text-purple-900">{test.testName}</p>
                                                    <p className="text-[10px] text-gray-500">{test.category}</p>
                                                  </div>
                                                  <Badge className={test.status === 'completed' ? 'bg-green-600 text-xs' : 'bg-orange-600 text-xs'}>
                                                    {test.status}
                                                  </Badge>
                                                </div>
                                                <div className="text-[10px] text-gray-600 space-y-1">
                                                  {test.result && <p>Result: {test.result}</p>}
                                                  <p>Ordered by: {test.orderedBy}</p>
                                                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                                    <span className="font-semibold">Price:</span>
                                                    <Badge className="bg-purple-600 text-xs">
                                                      ₦{Number(test.price).toLocaleString()}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            <div className="pt-2 border-t border-purple-300">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-900">Total Lab Tests:</span>
                                                <span className="text-lg font-bold text-purple-700">
                                                  ₦{totalLabBill.toLocaleString()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-6">
                                            <Beaker className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-500">No lab tests ordered yet</p>
                                            <Button
                                              size="sm"
                                              className="mt-3 bg-purple-600 hover:bg-purple-700 text-xs h-8"
                                              onClick={() => {
                                                toast.info('Route patient to Lab to order tests');
                                              }}
                                            >
                                              <Send className="w-3 h-3 mr-1" />
                                              Route to Lab
                                            </Button>
                                          </div>
                                        );
                                      })()}
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Submit All Bills to MedLedger Button */}
                                <div className="mt-4">
                                  <Button
                                    onClick={() => {
                                      const patientAnesthesiaRecords = anesthesiaRecords.filter(
                                        r => r.cardNumber === note.cardNumber
                                      );
                                      const totalAnesthesiaBill = patientAnesthesiaRecords.reduce(
                                        (sum, record) => sum + Number(record.billingAmount || 0),
                                        0
                                      );

                                      const preOpMeds = note.preOpMedications || [];
                                      const totalPreOpBill = preOpMeds.reduce(
                                        (sum: number, med: any) => {
                                          const drug = pharmacyInventory.find(d => d.name === med.name);
                                          return sum + (drug?.price || 0);
                                        },
                                        0
                                      );

                                      const surgeryFeeInput = document.getElementById(`surgery-fee-${note.id}`) as HTMLInputElement;
                                      const surgeryDescInput = document.getElementById(`surgery-desc-${note.id}`) as HTMLInputElement;
                                      const surgeryFee = Number(surgeryFeeInput?.value || 0);

                                      const labTests = note.labTests || [];
                                      const totalLabBill = labTests.reduce((sum, test) => sum + Number(test.price || 0), 0);
                                      
                                      const grandTotal = totalAnesthesiaBill + totalPreOpBill + surgeryFee + totalLabBill;

                                      if (grandTotal === 0) {
                                        toast.error('No billing amounts to submit');
                                        return;
                                      }

                                      toast.success(
                                        `✅ Total bill of ₦${grandTotal.toLocaleString()} sent to Patient MedLedger as DEBIT\n` +
                                        `Breakdown:\n` +
                                        `- Anesthesia: ₦${totalAnesthesiaBill.toLocaleString()}\n` +
                                        `- Pre-Op Med/Drip: ₦${totalPreOpBill.toLocaleString()}\n` +
                                        `- Surgery Fee: ₦${surgeryFee.toLocaleString()}`,
                                        { duration: 6000 }
                                      );

                                      if (surgeryFeeInput) surgeryFeeInput.value = '';
                                      if (surgeryDescInput) surgeryDescInput.value = '';
                                    }}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3"
                                  >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Submit All Bills to Patient MedLedger (Auto Debit)
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <SurgeonLogin />
          )}
        </TabsContent>

        {/* Anesthetist Tab */}
        <TabsContent value="anesthetist" className="mt-6 space-y-6">
          {isAuthenticated && currentStaff?.role === 'anesthetist' ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Anesthetist Portal - Welcome, {currentStaff.fullName}</CardTitle>
                      <p className="text-sm text-gray-600">{currentStaff.specialization}</p>
                    </div>
                    <Button onClick={logout} variant="outline">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-l-4 border-l-teal-500">
                        <CardContent className="p-6">
                          <p className="text-sm text-gray-600">Patients Today</p>
                          <p className="text-3xl font-bold text-teal-600 mt-2">{theatreNotes.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-cyan-500">
                        <CardContent className="p-6">
                          <p className="text-sm text-gray-600">Active Monitoring</p>
                          <p className="text-3xl font-bold text-cyan-600 mt-2">{anesthesiaRecords.filter(r => !r.monitoring.timeEnded).length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <p className="text-sm text-gray-600">Records Today</p>
                          <p className="text-3xl font-bold text-blue-600 mt-2">{anesthesiaRecords.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-6">
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="text-3xl font-bold text-green-600 mt-2">{anesthesiaRecords.filter(r => r.monitoring.timeEnded).length}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Patients List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Theatre Patients - Select for Anesthesia</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {theatreNotes.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">No patients in theatre today</p>
                          ) : (
                            theatreNotes.map((note) => (
                              <Card
                                key={note.id}
                                className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-cyan-500"
                                onClick={() => {
                                  setSelectedPatientForAnesthesia(note);
                                  setShowAnesthesiaDialog(true);
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-gray-900">{note.patientName}</h4>
                                        <Badge variant="outline">{note.cardNumber}</Badge>
                                        <Badge className="bg-cyan-600">{note.status}</Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mt-2">
                                        <div><span className="font-medium">Surgery:</span> {note.plannedSurgery}</div>
                                        <div><span className="font-medium">Surgeon:</span> {note.surgeonInCharge}</div>
                                        <div><span className="font-medium">Theatre:</span> {note.theatreRoom || 'TBA'}</div>
                                        <div><span className="font-medium">Time:</span> {note.scheduledTime || 'TBA'}</div>
                                      </div>
                                    </div>
                                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                                      <Syringe className="w-4 h-4 mr-2" />
                                      Start Anesthesia
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Anesthesia Records */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Today's Anesthesia Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {anesthesiaRecords.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">No anesthesia records today</p>
                          ) : (
                            anesthesiaRecords.map((record, idx) => (
                              <Card key={idx} className="border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{record.patientName}</h4>
                                        <p className="text-sm text-gray-600">{record.cardNumber}</p>
                                      </div>
                                      <Badge className="bg-green-600">{record.anesthesiaType}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div><span className="font-medium">BP:</span> {record.monitoring.bloodPressure}</div>
                                      <div><span className="font-medium">Pulse:</span> {record.monitoring.pulseRate} bpm</div>
                                      <div><span className="font-medium">SpO₂:</span> {record.monitoring.oxygenSaturation}%</div>
                                      <div><span className="font-medium">RR:</span> {record.monitoring.respiratoryRate}/min</div>
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">Drugs administered:</span> {record.drugs.map(d => d.drugName).join(', ')}
                                    </div>
                                    {record.billingAmount && (
                                      <div className="text-sm font-bold text-green-700">
                                        Billing: ₦{record.billingAmount}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <AnesthetistLogin />
          )}
        </TabsContent>

        {/* Staff Registry Tab */}
        <TabsContent value="staff" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Theatre Staff Registry</CardTitle>
                <Button onClick={() => setShowStaffDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {theatreStaff.map((staff) => (
                  <Card key={staff.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                            <Badge>{staff.role}</Badge>
                            <Badge
                              variant={
                                staff.availability === 'available'
                                  ? 'outline'
                                  : staff.availability === 'in-surgery'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className={
                                staff.availability === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : staff.availability === 'in-surgery'
                                  ? 'bg-orange-500'
                                  : 'bg-gray-400'
                              }
                            >
                              {staff.availability}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            {staff.specialization && (
                              <div>
                                <span className="font-medium">Specialization:</span> {staff.specialization}
                              </div>
                            )}
                            {staff.licenseNumber && (
                              <div>
                                <span className="font-medium">License:</span> {staff.licenseNumber}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Contact:</span> {staff.contactNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-Op Management Tab */}
        <TabsContent value="preop" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pre-Operation Management</CardTitle>
                <Button
                  onClick={() => {
                    alert('Button clicked!');
                    console.log('Opening Pre-Op Dialog');
                    setShowPreOpDialog(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  New Pre-Op Checklist
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-dashed border-green-300">
                <div className="text-center">
                  <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="font-semibold text-gray-900 mb-2">Pre-Surgery Checklist</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete pre-operative assessments before surgery
                  </p>
                  <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm max-w-md mx-auto">
                    <p className="font-semibold text-green-700">✓ Checklist Items:</p>
                    <p>• Consent form uploaded</p>
                    <p>• Lab results verified</p>
                    <p>• Patient fasting status</p>
                    <p>• Risk assessment</p>
                    <p>• Allergies & medical alert</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Case Files Tab */}
        <TabsContent value="casefile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Theatre Case Files</CardTitle>
                <Button
                  onClick={() => setShowCaseFileDialog(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Create Case File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-300">
                <div className="text-center">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 mb-2">Theatre Case File System</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive case management linked with patient history and lab results
                  </p>
                  <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm max-w-md mx-auto">
                    <p className="font-semibold text-purple-700">📋 Case File Includes:</p>
                    <p>• Diagnosis</p>
                    <p>• Planned procedure</p>
                    <p>• Surgeon notes</p>
                    <p>• Patient medical history</p>
                    <p>• Lab & imaging results</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Items</p>
                    <p className="text-3xl font-bold text-blue-900">{equipmentInventory.length}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Available</p>
                    <p className="text-3xl font-bold text-green-900">
                      {equipmentInventory.reduce((acc, item) => acc + item.availableCount, 0)}
                    </p>
                  </div>
                  <PackageCheck className="w-10 h-10 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setShowEquipmentInUseDialog(true)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">In Use</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {equipmentInventory.reduce((acc, item) => acc + item.inUseCount, 0)}
                    </p>
                    <p className="text-xs text-orange-700 mt-1">Click to view details</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Low Stock</p>
                    <p className="text-3xl font-bold text-red-900">
                      {equipmentInventory.filter((item) => item.availableCount < 3).length}
                    </p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Inventory Management */}
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Equipment Inventory Management</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Add, remove, and manage theatre equipment stock</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowEquipmentDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Equipment Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left p-3 font-semibold text-gray-700">Equipment Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Total</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Available</th>
                      <th className="text-center p-3 font-semibold text-gray-700">In Use</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentInventory.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-gray-900">{item.totalCount}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-semibold ${
                            item.availableCount < 3 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.availableCount}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-orange-600">{item.inUseCount}</span>
                        </td>
                        <td className="p-3 text-center">
                          {item.availableCount === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          ) : item.availableCount < 3 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newCount = item.totalCount + 1;
                                setEquipmentInventory((prev) =>
                                  prev.map((eq) =>
                                    eq.name === item.name
                                      ? { ...eq, totalCount: newCount, availableCount: eq.availableCount + 1 }
                                      : eq
                                  )
                                );
                                toast.success(`Added 1x ${item.name}`);
                              }}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (item.availableCount > 0) {
                                  setEquipmentInventory((prev) =>
                                    prev.map((eq) =>
                                      eq.name === item.name
                                        ? {
                                            ...eq,
                                            totalCount: Math.max(0, eq.totalCount - 1),
                                            availableCount: Math.max(0, eq.availableCount - 1),
                                          }
                                        : eq
                                    )
                                  );
                                  toast.success(`Removed 1x ${item.name}`);
                                } else {
                                  toast.error('No available stock to remove');
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                  setEquipmentInventory((prev) => prev.filter((eq) => eq.name !== item.name));
                                  toast.success(`Deleted ${item.name}`);
                                }
                              }}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Categories Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Categories Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Surgical Instruments */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">Surgical Instruments</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.surgicalInstruments.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Anesthesia Equipment */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold">Anesthesia Equipment</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.anesthesiaEquipment.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monitoring Equipment */}
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold">Monitoring Equipment</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.monitoringEquipment.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Room Equipment */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold">Operating Room Equipment</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.operatingRoomEquipment.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sterilization Equipment */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">Sterilization Equipment</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.sterilizationEquipment.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Disposable Consumables */}
                <Card className="border-l-4 border-l-pink-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Syringe className="w-5 h-5 text-pink-600" />
                      <h3 className="font-semibold">Disposable Consumables</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.disposableConsumables.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Specialized Equipment */}
                <Card className="border-l-4 border-l-indigo-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold">Specialized Equipment</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.specializedEquipment.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Equipment */}
                <Card className="border-l-4 border-l-red-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold">Emergency & Support Equipment</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-700">
                      {theatreEquipment.emergencyEquipment.map((item, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Registration Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register Theatre Staff</DialogTitle>
            <DialogDescription>Add new staff member to the theatre registry</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Specialization</Label>
                <Input
                  value={newStaff.specialization}
                  onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                  placeholder="e.g., General Surgery"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>License Number</Label>
                <Input
                  value={newStaff.licenseNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, licenseNumber: e.target.value })}
                  placeholder="e.g., SG-2019-0345"
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label>
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newStaff.contactNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, contactNumber: e.target.value })}
                  placeholder="+234 XXX XXX XXXX"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowStaffDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddStaff} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Register Staff
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-Op Checklist Dialog */}
      <Dialog open={showPreOpDialog} onOpenChange={setShowPreOpDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pre-Operation Checklist Form</DialogTitle>
            <DialogDescription>Complete all pre-surgical requirements and documentation before procedure</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 1. Consent Form Section */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={preOpChecklist.consentFormUploaded}
                  onChange={(e) =>
                    setPreOpChecklist({ ...preOpChecklist, consentFormUploaded: e.target.checked })
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">1. Consent Form Uploaded</p>
                  <p className="text-sm text-gray-600 mb-3">Signed surgical consent form on file</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Consent Form Document Reference</Label>
                      <Input
                        type="text"
                        value={preOpChecklist.consentFormFile}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, consentFormFile: e.target.value })
                        }
                        placeholder="Enter document reference number"
                        className="mt-1 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Document reference or file ID</p>
                    </div>
                    <div>
                      <Label className="text-sm">Date Signed</Label>
                      <Input
                        type="date"
                        value={preOpChecklist.consentFormDate}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, consentFormDate: e.target.value })
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Lab Results Section */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={preOpChecklist.labResultsVerified}
                  onChange={(e) =>
                    setPreOpChecklist({ ...preOpChecklist, labResultsVerified: e.target.checked })
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">2. Lab Results Verified</p>
                  <p className="text-sm text-gray-600 mb-3">All required lab tests completed and reviewed</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Lab Tests Completed</Label>
                      <Input
                        value={preOpChecklist.labTestsCompleted}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, labTestsCompleted: e.target.value })
                        }
                        placeholder="e.g., CBC, Blood Type, Coagulation Panel, ECG"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Lab Results Notes</Label>
                      <Textarea
                        value={preOpChecklist.labResultsNotes}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, labResultsNotes: e.target.value })
                        }
                        placeholder="Enter findings, abnormalities, or special considerations..."
                        rows={2}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Patient Fasting Status Section */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={preOpChecklist.patientFastingStatus}
                  onChange={(e) =>
                    setPreOpChecklist({ ...preOpChecklist, patientFastingStatus: e.target.checked })
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">3. Patient Fasting Status</p>
                  <p className="text-sm text-gray-600 mb-3">NPO status confirmed (nil by mouth)</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Fasting Hours</Label>
                      <Input
                        type="number"
                        value={preOpChecklist.fastingHours}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, fastingHours: e.target.value })
                        }
                        placeholder="e.g., 8"
                        className="mt-1 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hours fasted before surgery</p>
                    </div>
                    <div>
                      <Label className="text-sm">Last Meal Time</Label>
                      <Input
                        type="time"
                        value={preOpChecklist.lastMealTime}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, lastMealTime: e.target.value })
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Risk Assessment Section */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={preOpChecklist.riskAssessment}
                  onChange={(e) => setPreOpChecklist({ ...preOpChecklist, riskAssessment: e.target.checked })}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">4. Risk Assessment</p>
                  <p className="text-sm text-gray-600 mb-3">Surgical risk assessment completed</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Risk Level</Label>
                      <Select
                        value={preOpChecklist.riskLevel}
                        onValueChange={(value) => setPreOpChecklist({ ...preOpChecklist, riskLevel: value })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="moderate">Moderate Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                          <SelectItem value="critical">Critical Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Risk Factors & Considerations</Label>
                      <Textarea
                        value={preOpChecklist.riskFactors}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, riskFactors: e.target.value })
                        }
                        placeholder="e.g., Age, comorbidities, previous surgeries, medications..."
                        rows={2}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Allergies & Medical Alert Section */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={preOpChecklist.allergiesMedicalAlert}
                  onChange={(e) =>
                    setPreOpChecklist({ ...preOpChecklist, allergiesMedicalAlert: e.target.checked })
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">5. Allergies & Medical Alerts</p>
                  <p className="text-sm text-gray-600 mb-3">Patient allergies and alerts documented</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Known Allergies</Label>
                      <Textarea
                        value={preOpChecklist.knownAllergies}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, knownAllergies: e.target.value })
                        }
                        placeholder="e.g., Penicillin, Latex, Iodine, None known..."
                        rows={2}
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Medical Alerts & Special Precautions</Label>
                      <Textarea
                        value={preOpChecklist.medicalAlerts}
                        onChange={(e) =>
                          setPreOpChecklist({ ...preOpChecklist, medicalAlerts: e.target.value })
                        }
                        placeholder="e.g., Diabetic, Pacemaker, Blood thinner medications, DNR status..."
                        rows={2}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="font-semibold">Additional Pre-Operative Notes</Label>
              <Textarea
                value={preOpChecklist.notes}
                onChange={(e) => setPreOpChecklist({ ...preOpChecklist, notes: e.target.value })}
                placeholder="Enter any additional pre-operative notes, special instructions, or concerns..."
                rows={3}
                className="mt-2 bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreOpDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSavePreOpChecklist} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Pre-Op Checklist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Case File Dialog */}
      <Dialog open={showCaseFileDialog} onOpenChange={setShowCaseFileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Theatre Case File</DialogTitle>
            <DialogDescription>
              {selectedCaseFile ? `Viewing case file for ${selectedCaseFile.patientName}` : 'Create new case file'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient ID</Label>
                <Input
                  value={selectedCaseFile?.patientId || ''}
                  onChange={(e) =>
                    setSelectedCaseFile(selectedCaseFile ? { ...selectedCaseFile, patientId: e.target.value } : null)
                  }
                  placeholder="Enter patient ID"
                  className="mt-1"
                  disabled={!!selectedCaseFile}
                />
              </div>
              <div>
                <Label>Patient Name</Label>
                <Input
                  value={selectedCaseFile?.patientName || ''}
                  onChange={(e) =>
                    setSelectedCaseFile(selectedCaseFile ? { ...selectedCaseFile, patientName: e.target.value } : null)
                  }
                  placeholder="Enter patient name"
                  className="mt-1"
                  disabled={!!selectedCaseFile}
                />
              </div>
            </div>

            <div>
              <Label>Diagnosis</Label>
              <Textarea
                value={selectedCaseFile?.diagnosis || ''}
                onChange={(e) =>
                  setSelectedCaseFile(selectedCaseFile ? { ...selectedCaseFile, diagnosis: e.target.value } : null)
                }
                placeholder="Enter pre-operative diagnosis"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Planned Procedure</Label>
              <Textarea
                value={selectedCaseFile?.plannedProcedure || ''}
                onChange={(e) =>
                  setSelectedCaseFile(
                    selectedCaseFile ? { ...selectedCaseFile, plannedProcedure: e.target.value } : null
                  )
                }
                placeholder="Enter planned surgical procedure"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Surgeon Notes</Label>
              <Textarea
                value={selectedCaseFile?.surgeonNotes || ''}
                onChange={(e) =>
                  setSelectedCaseFile(selectedCaseFile ? { ...selectedCaseFile, surgeonNotes: e.target.value } : null)
                }
                placeholder="Enter surgeon's notes and observations"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Medical History</Label>
              <Textarea
                value={selectedCaseFile?.medicalHistory || ''}
                onChange={(e) =>
                  setSelectedCaseFile(
                    selectedCaseFile ? { ...selectedCaseFile, medicalHistory: e.target.value } : null
                  )
                }
                placeholder="Enter relevant medical history"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Lab Results</Label>
              <Textarea
                value={selectedCaseFile?.labResults || ''}
                onChange={(e) =>
                  setSelectedCaseFile(selectedCaseFile ? { ...selectedCaseFile, labResults: e.target.value } : null)
                }
                placeholder="Enter lab results and findings"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Imaging Results</Label>
              <Textarea
                value={selectedCaseFile?.imagingResults || ''}
                onChange={(e) =>
                  setSelectedCaseFile(
                    selectedCaseFile ? { ...selectedCaseFile, imagingResults: e.target.value } : null
                  )
                }
                placeholder="Enter imaging results (X-ray, CT, MRI, etc.)"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCaseFileDialog(false);
                  setSelectedCaseFile(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (selectedCaseFile) {
                    // Save case file
                    const existingIndex = caseFiles.findIndex(cf => cf.id === selectedCaseFile.id);
                    if (existingIndex >= 0) {
                      const updated = [...caseFiles];
                      updated[existingIndex] = selectedCaseFile;
                      setCaseFiles(updated);
                      toast.success('Case file updated successfully');
                    } else {
                      setCaseFiles([...caseFiles, selectedCaseFile]);
                      toast.success('Case file created successfully');
                    }
                    setShowCaseFileDialog(false);
                    setSelectedCaseFile(null);
                  }
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Save Case File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Checkout Dialog */}
      <Dialog open={showEquipmentCheckoutDialog} onOpenChange={setShowEquipmentCheckoutDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipment Checkout</DialogTitle>
            <DialogDescription>
              {selectedSurgeryForEquipment
                ? `Checkout equipment for ${selectedSurgeryForEquipment.patientName}'s ${selectedSurgeryForEquipment.surgeryType}`
                : 'Select equipment to checkout'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {Object.entries(theatreEquipment).map(([category, items]) => (
              <div key={category} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const inventoryItem = equipmentInventory.find((e) => e.name === item);
                    return (
                      <div key={item} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{item}</p>
                          <p className="text-sm text-gray-600">
                            Available: {inventoryItem?.availableCount || 0} | In Use: {inventoryItem?.inUseCount || 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max={inventoryItem?.availableCount || 0}
                            placeholder="Qty"
                            className="w-20"
                            id={`checkout-${item}`}
                            disabled={(inventoryItem?.availableCount || 0) === 0}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`checkout-${item}`) as HTMLInputElement;
                              const quantity = parseInt(input.value);
                              if (quantity > 0 && quantity <= (inventoryItem?.availableCount || 0)) {
                                handleEquipmentCheckout(item, quantity);
                                input.value = '';
                              } else {
                                toast.error('Invalid quantity');
                              }
                            }}
                            disabled={(inventoryItem?.availableCount || 0) === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Checkout
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {selectedSurgeryForEquipment?.checkedOutEquipment && selectedSurgeryForEquipment.checkedOutEquipment.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-3">Checked Out Equipment</h3>
                <div className="space-y-2">
                  {selectedSurgeryForEquipment.checkedOutEquipment
                    .filter((co) => !co.returned)
                    .map((checkout, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                        <div>
                          <p className="font-medium">{checkout.equipmentName}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {checkout.quantityCheckedOut} | By: {checkout.checkedOutBy}
                          </p>
                        </div>
                        <Badge className="bg-green-600">Checked Out</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEquipmentCheckoutDialog(false);
                  setSelectedSurgeryForEquipment(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Return Dialog */}
      <Dialog open={showEquipmentReturnDialog} onOpenChange={setShowEquipmentReturnDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Equipment</DialogTitle>
            <DialogDescription>
              {selectedSurgeryForEquipment
                ? `Return equipment for ${selectedSurgeryForEquipment.patientName}'s ${selectedSurgeryForEquipment.surgeryType}`
                : 'Select equipment to return'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSurgeryForEquipment?.checkedOutEquipment && selectedSurgeryForEquipment.checkedOutEquipment.length > 0 ? (
              <>
                <div className="space-y-2">
                  {selectedSurgeryForEquipment.checkedOutEquipment
                    .filter((co) => !co.returned)
                    .map((checkout, idx) => (
                      <Card key={idx} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{checkout.equipmentName}</p>
                              <p className="text-sm text-gray-600">Quantity: {checkout.quantityCheckedOut}</p>
                              <p className="text-sm text-gray-600">
                                Checked out by: {checkout.checkedOutBy} on{' '}
                                {new Date(checkout.checkedOutAt).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleEquipmentReturn(checkout)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Return
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {selectedSurgeryForEquipment.checkedOutEquipment.some((co) => co.returned) && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold text-lg mb-3">Returned Equipment</h3>
                    <div className="space-y-2">
                      {selectedSurgeryForEquipment.checkedOutEquipment
                        .filter((co) => co.returned)
                        .map((checkout, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-700">{checkout.equipmentName}</p>
                                <p className="text-sm text-gray-600">
                                  Quantity: {checkout.quantityCheckedOut} | Returned by: {checkout.returnedBy} on{' '}
                                  {checkout.returnedAt && new Date(checkout.returnedAt).toLocaleString()}
                                </p>
                              </div>
                              <Badge className="bg-gray-600">Returned</Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-600 py-8">No equipment checked out for this surgery</p>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEquipmentReturnDialog(false);
                  setSelectedSurgeryForEquipment(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-Op Medications Dialog */}
      <Dialog open={showPreOpMedicationsDialog} onOpenChange={setShowPreOpMedicationsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              Pre-Operative Medications & Drips
            </DialogTitle>
            <DialogDescription>
              {selectedCaseForMedications && (
                <div className="mt-2 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Patient:</span>{' '}
                      <span className="text-gray-900">{selectedCaseForMedications.patientName}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Card Number:</span>{' '}
                      <span className="text-gray-900">{selectedCaseForMedications.cardNumber}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Surgery:</span>{' '}
                      <span className="text-gray-900">{selectedCaseForMedications.plannedSurgery}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Scheduled:</span>{' '}
                      <span className="text-gray-900">
                        {selectedCaseForMedications.scheduledDate} at {selectedCaseForMedications.scheduledTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Medication/Drip Form */}
            <Card className="border-2 border-teal-200 bg-teal-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Pre-Operative Medication or Drip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Type</Label>
                    <Select
                      value={newPreOpMed.type}
                      onValueChange={(value: any) => setNewPreOpMed({ ...newPreOpMed, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="drip">Drip/IV Fluid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Select from Pharmacy Inventory</Label>
                    <Select
                      value={newPreOpMed.name}
                      onValueChange={(value) => setNewPreOpMed({ ...newPreOpMed, name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose medication/drip..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pharmacyInventory
                          .filter((item) => item.type === newPreOpMed.type)
                          .map((item) => (
                            <SelectItem key={item.name} value={item.name}>
                              <div className="flex items-center justify-between w-full">
                                <span>{item.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  Stock: {item.stock} {item.unit}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dosage</Label>
                    <Input
                      placeholder="e.g., 500ml, 750mg"
                      value={newPreOpMed.dosage}
                      onChange={(e) => setNewPreOpMed({ ...newPreOpMed, dosage: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Route</Label>
                    <Select
                      value={newPreOpMed.route}
                      onValueChange={(value) => setNewPreOpMed({ ...newPreOpMed, route: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IV">IV (Intravenous)</SelectItem>
                        <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                        <SelectItem value="SC">SC (Subcutaneous)</SelectItem>
                        <SelectItem value="PO">PO (Oral)</SelectItem>
                        <SelectItem value="PR">PR (Rectal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Frequency/Instructions</Label>
                    <Input
                      placeholder="e.g., Once pre-op, 30 minutes before surgery, Stat"
                      value={newPreOpMed.frequency}
                      onChange={(e) => setNewPreOpMed({ ...newPreOpMed, frequency: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Button onClick={handleAddPreOpMedication} className="w-full bg-teal-600 hover:bg-teal-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Pre-Op Orders
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Pre-Op Medications List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Pre-Op Medication Orders
                  {selectedCaseForMedications?.preOpMedications && (
                    <Badge variant="outline">
                      {selectedCaseForMedications.preOpMedications.length} Item(s)
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedCaseForMedications?.preOpMedications ||
                selectedCaseForMedications.preOpMedications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No pre-operative medications ordered yet</p>
                    <p className="text-sm">Add medications using the form above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCaseForMedications.preOpMedications.map((med: any) => (
                      <Card
                        key={med.id}
                        className={`border-l-4 ${
                          med.administered ? 'border-l-green-500 bg-green-50/30' : 'border-l-yellow-500 bg-yellow-50/30'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {med.type === 'drip' ? (
                                  <Droplet className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Pill className="w-5 h-5 text-purple-600" />
                                )}
                                <h4 className="font-bold text-gray-900">{med.name}</h4>
                                <Badge variant={med.type === 'drip' ? 'default' : 'outline'}>
                                  {med.type === 'drip' ? 'IV Drip' : 'Medication'}
                                </Badge>
                                {med.administered ? (
                                  <Badge className="bg-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Administered
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-4 gap-3 text-sm text-gray-700">
                                <div>
                                  <p className="text-xs text-gray-500">Dosage</p>
                                  <p className="font-semibold">{med.dosage}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Route</p>
                                  <p className="font-semibold">{med.route}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Frequency</p>
                                  <p className="font-semibold">{med.frequency}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Prescribed By</p>
                                  <p className="font-semibold">{med.prescribedBy}</p>
                                </div>
                              </div>
                              {med.administered && (
                                <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                                  <p className="text-green-800">
                                    <strong>Administered by:</strong> {med.administeredBy} on{' '}
                                    {new Date(med.administeredDate).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {!med.administered && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkMedicationAdministered(med.id)}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Mark Administered
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemovePreOpMedication(med.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Remove
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pharmacy Inventory Reference */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pharmacy Inventory Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pharmacyInventory.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        {item.type === 'drip' ? (
                          <Droplet className="w-4 h-4 text-blue-600 mt-0.5" />
                        ) : (
                          <Pill className="w-4 h-4 text-purple-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.stock} {item.unit}
                            </Badge>
                            <Badge
                              variant={item.stock > 50 ? 'default' : item.stock > 20 ? 'outline' : 'destructive'}
                              className="text-xs"
                            >
                              {item.stock > 50 ? 'In Stock' : item.stock > 20 ? 'Low' : 'Critical'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreOpMedicationsDialog(false)}>
                Close
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  toast.success('Pre-Op medication orders saved');
                  setShowPreOpMedicationsDialog(false);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Orders
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Equipment Dialog */}
      <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>Add new equipment item to the theatre inventory</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>
                  Equipment Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter equipment name"
                  id="new-equipment-name"
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedEquipmentCategory}
                  onValueChange={(value) => setSelectedEquipmentCategory(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surgicalInstruments">Surgical Instruments</SelectItem>
                    <SelectItem value="anesthesiaEquipment">Anesthesia Equipment</SelectItem>
                    <SelectItem value="monitoringEquipment">Monitoring Equipment</SelectItem>
                    <SelectItem value="operatingRoomEquipment">Operating Room Equipment</SelectItem>
                    <SelectItem value="sterilizationEquipment">Sterilization Equipment</SelectItem>
                    <SelectItem value="disposableConsumables">Disposable Consumables</SelectItem>
                    <SelectItem value="specializedEquipment">Specialized Equipment</SelectItem>
                    <SelectItem value="emergencyEquipment">Emergency Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Initial Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  defaultValue="1"
                  placeholder="Enter quantity"
                  id="new-equipment-quantity"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select defaultValue="available">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEquipmentDialog(false);
                  setSelectedEquipmentCategory('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const nameInput = document.getElementById('new-equipment-name') as HTMLInputElement;
                  const quantityInput = document.getElementById('new-equipment-quantity') as HTMLInputElement;

                  if (!nameInput?.value || !selectedEquipmentCategory || !quantityInput?.value) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  const quantity = parseInt(quantityInput.value);
                  
                  // Check if equipment already exists
                  const existingEquipment = equipmentInventory.find(
                    (item) => item.name.toLowerCase() === nameInput.value.toLowerCase()
                  );

                  if (existingEquipment) {
                    // Update existing equipment
                    setEquipmentInventory((prev) =>
                      prev.map((item) =>
                        item.name.toLowerCase() === nameInput.value.toLowerCase()
                          ? {
                              ...item,
                              totalCount: item.totalCount + quantity,
                              availableCount: item.availableCount + quantity,
                            }
                          : item
                      )
                    );
                    toast.success(`Updated ${nameInput.value} - Added ${quantity} units`);
                  } else {
                    // Add new equipment
                    const newEquipment: EquipmentItem = {
                      name: nameInput.value,
                      category: selectedEquipmentCategory,
                      totalCount: quantity,
                      availableCount: quantity,
                      inUseCount: 0,
                    };

                    setEquipmentInventory((prev) => [...prev, newEquipment]);
                    toast.success(`Added ${nameInput.value} to inventory`);
                  }

                  setShowEquipmentDialog(false);
                  setSelectedEquipmentCategory('');
                  nameInput.value = '';
                  quantityInput.value = '1';
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment In Use Dialog */}
      <Dialog open={showEquipmentInUseDialog} onOpenChange={setShowEquipmentInUseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              Equipment Currently In Use
            </DialogTitle>
            <DialogDescription>
              View all equipment currently checked out and in use across all surgeries
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Get all checked out equipment from all surgeries */}
            {(() => {
              const allCheckedOutEquipment: Array<{
                equipment: EquipmentCheckout;
                surgeryId: string;
                patientName: string;
                procedureType: string;
              }> = [];

              mockSurgeries.forEach((surgery) => {
                if (surgery.checkedOutEquipment) {
                  surgery.checkedOutEquipment
                    .filter((eq) => !eq.returned)
                    .forEach((equipment) => {
                      allCheckedOutEquipment.push({
                        equipment,
                        surgeryId: surgery.id,
                        patientName: surgery.patientName,
                        procedureType: surgery.procedureType,
                      });
                    });
                }
              });

              return allCheckedOutEquipment.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PackageCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold">No Equipment Currently In Use</p>
                  <p className="text-sm mt-2">All equipment is available in inventory</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allCheckedOutEquipment.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column - Equipment Details */}
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Package className="w-5 h-5 text-orange-600 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg">
                                  {item.equipment.equipmentName}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {item.equipment.category}
                                  </Badge>
                                  <Badge className="bg-orange-600">
                                    Quantity: {item.equipment.quantityCheckedOut}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="pl-7 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Checked out by:</span>
                                <span className="font-semibold text-gray-900">
                                  {item.equipment.checkedOutBy}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Time:</span>
                                <span className="font-semibold text-gray-900">
                                  {new Date(item.equipment.checkedOutAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-semibold text-orange-700">
                                  {(() => {
                                    const now = new Date();
                                    const checkoutTime = new Date(item.equipment.checkedOutAt);
                                    const diffMs = now.getTime() - checkoutTime.getTime();
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const hours = Math.floor(diffMins / 60);
                                    const mins = diffMins % 60;
                                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Surgery Details */}
                          <div className="space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                            <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Associated Surgery
                            </h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Surgery ID:</span>
                                <span className="font-semibold text-blue-700">{item.surgeryId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Patient:</span>
                                <span className="font-semibold text-gray-900">{item.patientName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Procedure:</span>
                                <span className="font-semibold text-gray-900">{item.procedureType}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Summary Stats */}
                  <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total Items In Use</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {allCheckedOutEquipment.reduce(
                              (acc, item) => acc + item.equipment.quantityCheckedOut,
                              0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Equipment Types</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {new Set(allCheckedOutEquipment.map((item) => item.equipment.equipmentName)).size}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Active Surgeries</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {new Set(allCheckedOutEquipment.map((item) => item.surgeryId)).size}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowEquipmentInUseDialog(false)} className="bg-blue-600 hover:bg-blue-700">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Anesthesia Management Dialog */}
      <Dialog open={showAnesthesiaDialog} onOpenChange={setShowAnesthesiaDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="w-6 h-6 text-cyan-600" />
              Anesthesia Management - {selectedPatientForAnesthesia?.patientName}
            </DialogTitle>
            <DialogDescription>
              Anesthetist: {currentStaff?.fullName} | Patient: {selectedPatientForAnesthesia?.cardNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Section 1: Anesthesia Type Selection */}
            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-600" />
                  1. Select Anesthesia Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={anesthesiaType} onValueChange={setAnesthesiaType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose anesthesia type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Anesthesia">General Anesthesia</SelectItem>
                    <SelectItem value="Spinal Anesthesia">Spinal Anesthesia</SelectItem>
                    <SelectItem value="Epidural Anesthesia">Epidural Anesthesia</SelectItem>
                    <SelectItem value="Local Anesthesia">Local Anesthesia</SelectItem>
                    <SelectItem value="Sedation (Conscious Sedation)">Sedation (Conscious Sedation)</SelectItem>
                  </SelectContent>
                </Select>
                {anesthesiaType && (
                  <Badge className="mt-3 bg-cyan-600">{anesthesiaType}</Badge>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Drugs Administration */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-600" />
                  2. Drugs & Doses Administration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Drug Form */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-purple-900">Add Drug</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-sm">Drug Name (from Pharmacy)</Label>
                      <Select
                        value={newDrug.drugName}
                        onValueChange={(value) => setNewDrug({ ...newDrug, drugName: value })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue placeholder="Select drug..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pharmacyInventory
                            .filter(item => item.type === 'medication')
                            .map((drug) => (
                              <SelectItem key={drug.name} value={drug.name}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>{drug.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ₦{drug.price.toLocaleString()} | Stock: {drug.stock}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Dose</Label>
                      <Input
                        value={newDrug.dose}
                        onChange={(e) => setNewDrug({ ...newDrug, dose: e.target.value })}
                        placeholder="e.g., 200 mg, 5 ml"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Route</Label>
                      <Select
                        value={newDrug.route}
                        onValueChange={(value) => setNewDrug({ ...newDrug, route: value })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue placeholder="Select route..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IV">IV (Intravenous)</SelectItem>
                          <SelectItem value="Spinal">Spinal</SelectItem>
                          <SelectItem value="Epidural">Epidural</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
                          <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddDrug}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Drug
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Drugs List */}
                {anesthesiaDrugs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Administered Drugs</h4>
                      <Badge className="bg-purple-600">
                        Total Drug Cost: ₦{anesthesiaDrugs.reduce((sum, drug) => sum + drug.price, 0).toLocaleString()}
                      </Badge>
                    </div>
                    {anesthesiaDrugs.map((drug) => (
                      <div
                        key={drug.id}
                        className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Drug</p>
                            <p className="font-semibold text-purple-900">{drug.drugName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Dose</p>
                            <p className="font-semibold">{drug.dose}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Route</p>
                            <p className="font-semibold">{drug.route}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Time Given</p>
                            <p className="font-semibold text-cyan-700">{drug.timeGiven}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="font-semibold text-green-700">₦{drug.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveDrug(drug.id)}
                          className="ml-3 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 3: Vital Signs Monitoring */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  3. Anesthesia Monitoring - Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Blood Pressure (mmHg)
                    </Label>
                    <Input
                      value={anesthesiaMonitoring.bloodPressure}
                      onChange={(e) =>
                        setAnesthesiaMonitoring({ ...anesthesiaMonitoring, bloodPressure: e.target.value })
                      }
                      placeholder="e.g., 120/80"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-pink-500" />
                      Pulse Rate (bpm)
                    </Label>
                    <Input
                      value={anesthesiaMonitoring.pulseRate}
                      onChange={(e) =>
                        setAnesthesiaMonitoring({ ...anesthesiaMonitoring, pulseRate: e.target.value })
                      }
                      placeholder="e.g., 72"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Wind className="w-4 h-4 text-blue-500" />
                      Oxygen Saturation - SpO₂ (%)
                    </Label>
                    <Input
                      value={anesthesiaMonitoring.oxygenSaturation}
                      onChange={(e) =>
                        setAnesthesiaMonitoring({ ...anesthesiaMonitoring, oxygenSaturation: e.target.value })
                      }
                      placeholder="e.g., 98"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      Respiratory Rate (/min)
                    </Label>
                    <Input
                      value={anesthesiaMonitoring.respiratoryRate}
                      onChange={(e) =>
                        setAnesthesiaMonitoring({ ...anesthesiaMonitoring, respiratoryRate: e.target.value })
                      }
                      placeholder="e.g., 16"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      Time Started
                    </Label>
                    <Input
                      type="time"
                      value={anesthesiaMonitoring.timeStarted}
                      onChange={(e) =>
                        setAnesthesiaMonitoring({ ...anesthesiaMonitoring, timeStarted: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      Time Ended (Optional)
                    </Label>
                    <Input
                      type="time"
                      value={anesthesiaMonitoring.timeEnded}
                      onChange={(e) =>
                        setAnesthesiaMonitoring({ ...anesthesiaMonitoring, timeEnded: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Patient Medical History */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  4. Patient Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPatientForAnesthesia?.medicalHistory || 'No medical history available'}
                  readOnly
                  rows={3}
                  className="bg-blue-50 border-blue-200"
                />
              </CardContent>
            </Card>

            {/* Section 5: Billing */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  💰 5. Billing (Auto-Calculated from Drugs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Drug Costs:</span>
                        <span className="font-semibold text-green-800">
                          ₦{anesthesiaDrugs.reduce((sum, drug) => sum + drug.price, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Additional Fees (if any):</span>
                        <Input
                          type="number"
                          value={Number(billingAmount) - anesthesiaDrugs.reduce((sum, drug) => sum + drug.price, 0)}
                          onChange={(e) => {
                            const additionalFee = Number(e.target.value) || 0;
                            const drugTotal = anesthesiaDrugs.reduce((sum, drug) => sum + drug.price, 0);
                            setBillingAmount(String(drugTotal + additionalFee));
                          }}
                          placeholder="0"
                          className="w-32 h-8 text-right"
                        />
                      </div>
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">Total Billing Amount:</span>
                          <span className="font-bold text-2xl text-green-700">
                            ₦{Number(billingAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">
                    💡 Billing automatically includes all administered drugs from pharmacy inventory. Add any additional anesthesia service fees above.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Surgery Report */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  6. Surgery Report / Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={surgeryReport}
                  onChange={(e) => setSurgeryReport(e.target.value)}
                  placeholder="Enter surgery report, observations, complications, patient response to anesthesia..."
                  rows={4}
                  className="mt-1"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnesthesiaDialog(false);
                  setAnesthesiaType('');
                  setAnesthesiaDrugs([]);
                  setAnesthesiaMonitoring({
                    bloodPressure: '',
                    pulseRate: '',
                    oxygenSaturation: '',
                    respiratoryRate: '',
                    timeStarted: '',
                    timeEnded: '',
                  });
                  setBillingAmount('');
                  setSurgeryReport('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAnesthesiaRecord}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Anesthesia Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}