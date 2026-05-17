import { useState, useRef } from 'react';
import { usePatientQueue } from '../context/PatientQueueContext';
import { useDoctorAuth } from '../context/DoctorAuthContext';
import { useAdmission } from '../context/AdmissionContext';
import { useCashier } from '../context/CashierContext';
import { useDischarge } from '../context/DischargeContext';
import { useTheatre } from '../context/TheatreContext';
import { useVitalSigns } from '../context/VitalSignsContext';
import { toast } from 'sonner';
import { DoctorLogin } from './DoctorLogin';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Stethoscope,
  Search,
  Users,
  FileText,
  UserCheck,
  UserPlus,
  LogOut,
  X,
  Pencil,
  Plus,
  Send,
  FlaskConical,
  Pill,
  Syringe,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Beaker,
  CreditCard,
  ScanLine,
} from 'lucide-react';

interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  cardNumber: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  status: 'pending' | 'in-progress' | 'completed';
  appointmentTime: string;
  isNewPatient?: boolean;
  registrationFee?: number;
  vitalSigns?: {
    bp: string;
    temp: string;
    pulse: string;
    weight: string;
  };
}

interface MedicalHistoryEntry {
  date: string;
  diagnosis: string;
  doctor: string;
  treatment: string;
}

interface SelectedMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface SelectedLabTest {
  id: string;
  name: string;
  category: string;
}

interface SelectedRadiologyTest {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  price: number;
}

// Medical term suggestions
const diagnosisSuggestions = [
  'Acute Upper Respiratory Infection',
  'Malaria',
  'Typhoid Fever',
  'Hypertension',
  'Diabetes Mellitus Type 2',
  'Gastroenteritis',
  'Urinary Tract Infection',
  'Pneumonia',
  'Bronchitis',
  'Migraine',
];

const symptomSuggestions = [
  'Fever',
  'Headache',
  'Cough',
  'Abdominal pain',
  'Vomiting',
  'Diarrhea',
  'Chest pain',
  'Shortness of breath',
  'Dizziness',
  'Fatigue',
];

// Registered Surgeons (Theatre-specific)
const registeredSurgeons = [
  'Dr. Sarah Johnson',
  'Dr. Michael Chen',
  'Dr. Amina Yusuf',
  'Dr. James Anderson',
  'Dr. David Williams',
  'Dr. Ahmed Hassan',
  'Dr. Fatima Ibrahim',
  'Dr. Grace Nnenna',
];

// Theatre Special Equipment Registry
const theatreEquipmentList = [
  'Laparoscopic equipment',
  'Endoscopic camera system',
  'C-Arm fluoroscopy machine',
  'Surgical microscope',
  'Electrosurgical unit (ESU)',
  'Anesthesia machine',
  'Patient monitoring system',
  'Surgical lights',
  'Operating table',
  'Suction apparatus',
  'Defibrillator',
  'Ultrasound machine',
  'Arthroscopy equipment',
  'Surgical drill set',
  'Tourniquet system',
  'Cryotherapy unit',
  'Laser equipment',
  'Nerve stimulator',
  'Bone saw',
  'Surgical retractors',
];

export function DoctorConsultation() {
  const { currentDoctor, logout, isAuthenticated } = useDoctorAuth();
  const { patientQueue, updatePatientStatus, removeFromQueue } = usePatientQueue();
  const { vitalSignsQueue, removeFromQueue: removeFromVitalSignsQueue } = useVitalSigns();
  const { initiateAdmission } = useAdmission();
  const { payments, submitDoctorBilling } = useCashier();
  const { initiateDischarge } = useDischarge();
  const { addTheatreNote } = useTheatre();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Consultation | null>(null);

  // Form states
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<SelectedLabTest[]>([]);
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState<SelectedRadiologyTest[]>([]);

  // Autocomplete states
  const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false);
  const [showSymptomSuggestions, setShowSymptomSuggestions] = useState(false);

  // Handwriting canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [handwritingNotes, setHandwritingNotes] = useState('');

  // Billing dialog
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [billingAmount, setBillingAmount] = useState('');
  const [billingDescription, setBillingDescription] = useState('');

  // Theatre note dialog
  const [showTheatreDialog, setShowTheatreDialog] = useState(false);
  const [theatreNote, setTheatreNote] = useState({
    preOpDiagnosis: '',
    plannedSurgery: '',
    indication: '',
    urgencyLevel: 'elective' as 'elective' | 'urgent' | 'emergency',
    anesthesiaType: '',
    estimatedDuration: '',
    specialEquipment: [] as string[], // Changed to array for multi-select
    preparationNotes: '',
    surgeonInCharge: '', // Changed from surgeonPreference
  });

  // Show login if not authenticated
  if (!isAuthenticated || !currentDoctor) {
    return <DoctorLogin />;
  }

  const normalizedCurrentDoctorName = currentDoctor.fullName.trim().toLowerCase();
  const cashierRoutedPatientKeys = new Set(
    payments
      .filter((payment) => payment.sourceModule === 'doctor')
      .flatMap((payment) => [payment.patientId, payment.cardNumber])
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase()),
  );
  const doctorQueuePatients = patientQueue.filter(
    (patient) =>
      patient.assignedDoctor.trim().toLowerCase() === normalizedCurrentDoctorName &&
      !cashierRoutedPatientKeys.has(patient.patientId.trim().toLowerCase()) &&
      !cashierRoutedPatientKeys.has(patient.cardNumber.trim().toLowerCase()),
  );
  const fallbackVitalsPatients = vitalSignsQueue
    .filter(
      (patient) =>
        patient.status === 'sent-to-doctor' &&
        patient.assignedDoctor.trim().toLowerCase() === normalizedCurrentDoctorName &&
        !cashierRoutedPatientKeys.has(patient.patientId.trim().toLowerCase()) &&
        !doctorQueuePatients.some((queuedPatient) => queuedPatient.patientId === patient.patientId),
    )
    .map((patient) => ({
      id: patient.id,
      patientId: patient.patientId,
      patientName: patient.patientName,
      cardNumber: patient.patientId,
      age: patient.age,
      gender: patient.gender,
      chiefComplaint: patient.chiefComplaint,
      assignedDoctor: patient.assignedDoctor,
      department: patient.routedFrom || 'General',
      consultingRoom: 'Pending room assignment',
      appointmentTime: patient.appointmentTime,
      status: 'pending' as const,
      routedAt: patient.routedAt || new Date().toISOString(),
      routedBy: patient.routedBy || 'Vital Signs Unit',
      vitalSigns: {
        bp: patient.vitalSigns?.bloodPressure || '',
        temp: patient.vitalSigns?.temperature || '',
        pulse: patient.vitalSigns?.pulse || '',
        weight: patient.vitalSigns?.weight || '',
        height: patient.vitalSigns?.height,
        bmi: patient.vitalSigns?.bmi,
        respiratoryRate: patient.vitalSigns?.respiratoryRate,
        oxygenSaturation: patient.vitalSigns?.oxygenSaturation,
        bloodSugar: patient.vitalSigns?.bloodSugar,
        notes: patient.vitalSigns?.notes,
      },
      injectionRecord: patient.injectionRecord
        ? {
            medicationName: patient.injectionRecord.medicationName,
            dosage: patient.injectionRecord.dosage,
            route: patient.injectionRecord.routeToDoctor,
            site: patient.injectionRecord.injectionSite,
            batchNumber: patient.injectionRecord.batchNumber,
            notes: patient.injectionRecord.notes,
          }
        : undefined,
    }));
  const visibleDoctorQueue = [...doctorQueuePatients, ...fallbackVitalsPatients];

  // Filter consultations for current doctor
  const consultations: Consultation[] = visibleDoctorQueue
    .map(patient => ({
      id: patient.id,
      patientId: patient.patientId,
      patientName: patient.patientName,
      cardNumber: patient.cardNumber,
      age: patient.age,
      gender: patient.gender,
      chiefComplaint: patient.chiefComplaint,
      status: patient.status,
      appointmentTime: patient.appointmentTime,
      isNewPatient: patient.isNewPatient,
      registrationFee: patient.registrationFee || 500, // Default registration fee
      vitalSigns: {
        bp: patient.vitalSigns.bp,
        temp: patient.vitalSigns.temp,
        pulse: patient.vitalSigns.pulse,
        weight: patient.vitalSigns.weight,
      }
    }));

  const filteredConsultations = consultations.filter(consultation =>
    consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    consultation.cardNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock medical history
  const medicalHistory: MedicalHistoryEntry[] = [
    {
      date: '2026-03-15',
      diagnosis: 'Malaria',
      doctor: 'Dr. Michael Chen',
      treatment: 'Artemether + Lumefantrine, Paracetamol',
    },
    {
      date: '2026-01-20',
      diagnosis: 'Upper Respiratory Tract Infection',
      doctor: 'Dr. Sarah Johnson',
      treatment: 'Amoxicillin 500mg, Cough syrup',
    },
  ];

  // Mock medication list
  const medications = [
    { id: '1', name: 'Paracetamol', category: 'Analgesic', price: 500 },
    { id: '2', name: 'Amoxicillin', category: 'Antibiotic', price: 1500 },
    { id: '3', name: 'Ibuprofen', category: 'NSAID', price: 800 },
    { id: '4', name: 'Metformin', category: 'Antidiabetic', price: 1200 },
    { id: '5', name: 'Artemether + Lumefantrine', category: 'Antimalarial', price: 2500 },
    { id: '6', name: 'Ciprofloxacin', category: 'Antibiotic', price: 1800 },
  ];

  // Mock lab tests
  const labTests = [
    { id: '1', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 3500 },
    { id: '2', name: 'Blood Sugar (Fasting)', category: 'Biochemistry', price: 1500 },
    { id: '3', name: 'Malaria Test', category: 'Parasitology', price: 2000 },
    { id: '4', name: 'Urinalysis', category: 'Clinical Chemistry', price: 2500 },
    { id: '5', name: 'Lipid Profile', category: 'Biochemistry', price: 5000 },
    { id: '6', name: 'Liver Function Test', category: 'Biochemistry', price: 4500 },
  ];

  const radiologyTests = [
    { id: '1', name: 'X-Ray (Chest)', category: 'X-Ray', bodyPart: 'Chest', price: 8000 },
    { id: '2', name: 'X-Ray (Abdomen)', category: 'X-Ray', bodyPart: 'Abdomen', price: 7500 },
    { id: '3', name: 'CT Scan (Head)', category: 'CT Scan', bodyPart: 'Head', price: 45000 },
    { id: '4', name: 'MRI (Brain)', category: 'MRI', bodyPart: 'Brain', price: 85000 },
    { id: '5', name: 'Ultrasound (Abdomen)', category: 'Ultrasound', bodyPart: 'Abdomen', price: 12000 },
    { id: '6', name: 'Mammography', category: 'X-Ray', bodyPart: 'Breast', price: 15000 },
  ];

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
    // Simulated handwriting interpretation
    toast.success('Handwriting interpreted');
    setHandwritingNotes('Simulated handwritten notes: Patient shows signs of improvement. Continue current medication.');
  };

  const handleAddMedication = (med: typeof medications[0]) => {
    setSelectedMedications([
      ...selectedMedications,
      {
        id: med.id,
        name: med.name,
        dosage: '500mg',
        frequency: '3 times daily',
        duration: '5 days',
      },
    ]);
    toast.success(`${med.name} added to prescription`);
  };

  const handleRouteToPharmacy = () => {
    if (selectedMedications.length === 0) {
      toast.error('Please add medications first');
      return;
    }
    toast.success(`Prescription sent to Pharmacy for ${selectedPatient?.patientName}`);
    setSelectedMedications([]);
  };

  const handleRouteToLab = () => {
    if (selectedLabTests.length === 0) {
      toast.error('Please select lab tests first');
      return;
    }
    toast.success(`Lab tests requested for ${selectedPatient?.patientName}`);
    setSelectedLabTests([]);
  };

  const handleRouteToRadiology = () => {
    if (selectedRadiologyTests.length === 0) {
      toast.error('Please select radiology tests first');
      return;
    }
    toast.success(`Radiology imaging requested for ${selectedPatient?.patientName}`);
    setSelectedRadiologyTests([]);
  };

  const handleRouteToTheatre = () => {
    if (!theatreNote.preOpDiagnosis || !theatreNote.plannedSurgery) {
      toast.error('Please complete theatre note before routing');
      return;
    }
    
    toast.success(`Patient ${selectedPatient?.patientName} routed to Theatre with complete surgical notes`);
    setShowTheatreDialog(false);
    
    // Add theatre note to context
    addTheatreNote({
      patientId: selectedPatient?.patientId || '',
      patientName: selectedPatient?.patientName || '',
      cardNumber: selectedPatient?.cardNumber || '',
      age: selectedPatient?.age || 0,
      gender: selectedPatient?.gender || '',
      requestingDoctor: currentDoctor.fullName,
      preOpDiagnosis: theatreNote.preOpDiagnosis,
      plannedSurgery: theatreNote.plannedSurgery,
      indication: theatreNote.indication,
      urgencyLevel: theatreNote.urgencyLevel,
      anesthesiaType: theatreNote.anesthesiaType,
      estimatedDuration: theatreNote.estimatedDuration,
      specialEquipment: theatreNote.specialEquipment,
      preparationNotes: theatreNote.preparationNotes,
      surgeonInCharge: theatreNote.surgeonInCharge,
    });
    
    // Reset theatre note
    setTheatreNote({
      preOpDiagnosis: '',
      plannedSurgery: '',
      indication: '',
      urgencyLevel: 'elective',
      anesthesiaType: '',
      estimatedDuration: '',
      specialEquipment: [],
      preparationNotes: '',
      surgeonInCharge: '',
    });
  };

  const handleManualBilling = async () => {
    if (!selectedPatient) return;

    // Calculate pharmacy bill from prescribed medications
    const totalPharmacyBill = selectedMedications.reduce((sum, med) => {
      const medication = medications.find(m => m.id === med.id);
      return sum + (medication?.price || 0);
    }, 0);

    // Calculate lab bill from ordered tests
    const totalLabBill = selectedLabTests.reduce((sum, test) => {
      const labTest = labTests.find(l => l.id === test.id);
      return sum + (labTest?.price || 0);
    }, 0);

    // Calculate radiology bill from ordered imaging tests
    const totalRadiologyBill = selectedRadiologyTests.reduce((sum, test) => {
      return sum + test.price;
    }, 0);

    // Get registration fee for new patients
    const registrationFee = selectedPatient.isNewPatient ? (selectedPatient.registrationFee || 0) : 0;

    // Get manual consultation/procedure fee
    const consultationFee = Number(billingAmount || 0);

    // Calculate grand total
    const grandTotal = totalPharmacyBill + totalLabBill + totalRadiologyBill + registrationFee + consultationFee;

    if (grandTotal === 0) {
      toast.error('No billing amounts to submit');
      return;
    }

    let breakdown = `Breakdown:\n`;
    if (registrationFee > 0) {
      breakdown += `- Registration Card: ₦${registrationFee.toLocaleString()}\n`;
    }
    breakdown += `- Pharmacy: ₦${totalPharmacyBill.toLocaleString()}\n`;
    breakdown += `- Lab Tests: ₦${totalLabBill.toLocaleString()}\n`;
    breakdown += `- Radiology: ₦${totalRadiologyBill.toLocaleString()}\n`;
    breakdown += `- Consultation/Procedure: ₦${consultationFee.toLocaleString()}`;

    toast.success(
      `✅ Total bill of ₦${grandTotal.toLocaleString()} sent to Patient MedLedger as DEBIT\n` + breakdown,
      { duration: 6000 }
    );

    // Reset billing fields
    await removeFromQueue(selectedPatient.patientId);
    removeFromVitalSignsQueue(selectedPatient.patientId);
    setSelectedPatient(null);
    setClinicalNotes('');
    setDiagnosis('');
    setTreatmentPlan('');
    setSelectedMedications([]);
    setSelectedLabTests([]);
    setSelectedRadiologyTests([]);
    setHandwritingNotes('');
    clearCanvas();
    setBillingAmount('');
    setBillingDescription('');
  };

  const handleRouteBillingToCashier = () => {
    if (!selectedPatient) return;

    const totalPharmacyBill = selectedMedications.reduce((sum, med) => {
      const medication = medications.find((item) => item.id === med.id);
      return sum + (medication?.price || 0);
    }, 0);

    const totalLabBill = selectedLabTests.reduce((sum, test) => {
      const labTest = labTests.find((item) => item.id === test.id);
      return sum + (labTest?.price || 0);
    }, 0);

    const totalRadiologyBill = selectedRadiologyTests.reduce((sum, test) => sum + test.price, 0);
    const registrationFee = selectedPatient.isNewPatient ? (selectedPatient.registrationFee || 0) : 0;
    const consultationFee = Number(billingAmount || 0);
    const grandTotal = totalPharmacyBill + totalLabBill + totalRadiologyBill + registrationFee + consultationFee;

    if (grandTotal === 0) {
      toast.error('No billing amounts to submit');
      return;
    }

    const billingServices = [
      ...(registrationFee > 0
        ? [{
            type: 'Registration',
            description: 'Registration Card',
            amount: registrationFee,
          }]
        : []),
      ...selectedMedications
        .map((med) => {
          const medication = medications.find((item) => item.id === med.id);
          return medication
            ? {
                type: 'Pharmacy',
                description: `${medication.name} - ${med.dosage}, ${med.frequency} for ${med.duration}`,
                amount: medication.price,
              }
            : null;
        })
        .filter((service): service is { type: string; description: string; amount: number } => service !== null),
      ...selectedLabTests
        .map((test) => {
          const labTest = labTests.find((item) => item.id === test.id);
          return labTest
            ? {
                type: 'Lab Test',
                description: labTest.name,
                amount: labTest.price,
              }
            : null;
        })
        .filter((service): service is { type: string; description: string; amount: number } => service !== null),
      ...selectedRadiologyTests.map((test) => ({
        type: 'Radiology',
        description: `${test.name} - ${test.bodyPart}`,
        amount: test.price,
      })),
      ...(consultationFee > 0
        ? [{
            type: 'Consultation',
            description: billingDescription.trim() || 'Doctor consultation/procedure fee',
            amount: consultationFee,
          }]
        : []),
    ];

    const { paymentId, ledgerReference } = submitDoctorBilling({
      patientId: selectedPatient.patientId,
      patientName: selectedPatient.patientName,
      cardNumber: selectedPatient.cardNumber,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      doctorName: currentDoctor.fullName,
      services: billingServices,
    });

    toast.success(
      `Cashier billing request ${paymentId} created and Patient MedLedger debited by ₦${grandTotal.toLocaleString()}. Reference: ${ledgerReference}`,
      { duration: 6000 },
    );

    setBillingAmount('');
    setBillingDescription('');
  };

  const handleInitiateDischarge = () => {
    if (!selectedPatient) return;

    initiateDischarge({
      patientId: selectedPatient.patientId,
      patientName: selectedPatient.patientName,
      cardNumber: selectedPatient.cardNumber,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      admissionDate: new Date().toISOString(),
      ward: 'General Ward',
      diagnosis: diagnosis || 'Diagnosis pending',
      treatment: treatmentPlan || 'Treatment plan pending',
      dischargedBy: currentDoctor.fullName,
      dischargeDate: new Date().toISOString(),
      status: 'pending-nursing-review',
    });

    toast.success(`Discharge initiated for ${selectedPatient.patientName}`);
  };

  const handleInitiateAdmission = () => {
    if (!selectedPatient) {
      return;
    }

    if (!diagnosis.trim()) {
      toast.error('Please enter the admission diagnosis before sending to Nursing.');
      return;
    }

    initiateAdmission({
      patientId: selectedPatient.patientId,
      patientName: selectedPatient.patientName,
      cardNumber: selectedPatient.cardNumber,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      diagnosis,
      admissionReason: clinicalNotes.trim() || selectedPatient.chiefComplaint,
      treatmentPlan: treatmentPlan.trim() || 'Treatment plan to continue on admission',
      requestingDoctor: currentDoctor.fullName,
      priority: 'routine',
    });

    toast.success(`Admission request sent to Nursing for ${selectedPatient.patientName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Doctor Consultation</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome, {currentDoctor.fullName} - {currentDoctor.specialization}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Info Banner */}
      {consultations.length === 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Welcome to Your Doctor Portal, {currentDoctor.fullName}!</h3>
              <p className="text-xs text-blue-700 mb-2">
                Your patient queue is currently empty. Patients will appear here automatically when nursing staff routes them to you from the Vital Signs unit.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  💡 Patients are routed from: Clinical → Vital Signs & Injection
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Queue</p>
                <p className="text-2xl font-bold mt-1">{consultations.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold mt-1">
                  {consultations.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold mt-1">
                  {consultations.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <UserCheck className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Patient Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={() => {
                    setSelectedPatient({ ...consultation, status: 'in-progress' });
                    void updatePatientStatus(consultation.patientId, 'in-progress');
                    toast.success(`${consultation.patientName} consultation started`);
                    // Reset form
                    setClinicalNotes('');
                    setDiagnosis('');
                    setTreatmentPlan('');
                    setHandwritingNotes('');
                    clearCanvas();
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedPatient?.id === consultation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{consultation.patientName}</h4>
                    <Badge variant={
                      consultation.status === 'pending' ? 'secondary' :
                      consultation.status === 'in-progress' ? 'default' :
                      'outline'
                    } className="text-xs">
                      {consultation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{consultation.cardNumber}</p>
                  <p className="text-sm text-gray-500">{consultation.chiefComplaint}</p>
                  <p className="text-xs text-gray-400 mt-2">⏰ {consultation.appointmentTime}</p>
                </div>
              ))}

              {filteredConsultations.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-dashed border-blue-300">
                    <Users className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <p className="font-semibold text-gray-900 mb-2">No Patients in Your Queue</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Patients will appear here when they are routed to you from Vital Signs
                    </p>
                    <div className="bg-white rounded-lg p-4 text-left space-y-2 text-xs text-gray-700">
                      <p className="font-semibold text-blue-700 mb-2">📋 How to get patients:</p>
                      <p>1. Go to <span className="font-semibold">Clinical → Vital Signs & Injection</span></p>
                      <p>2. Click on a patient card</p>
                      <p>3. Record vital signs</p>
                      <p>4. Click <span className="font-semibold">"Route to Doctor"</span> tab</p>
                      <p>5. Select your name: <span className="font-semibold text-blue-600">{currentDoctor.fullName}</span></p>
                      <p>6. Click "Route to Doctor" button</p>
                      <p className="pt-2 text-green-700 font-semibold">✓ Patient will appear in your queue instantly!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consultation Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPatient ? `Consultation - ${selectedPatient.patientName}` : 'Select a Patient'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <Tabs defaultValue="consultation">
                <TabsList className="grid grid-cols-7 w-full">
                  <TabsTrigger value="consultation">Consult</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="prescription">Rx</TabsTrigger>
                  <TabsTrigger value="lab">Lab</TabsTrigger>
                  <TabsTrigger value="radiology">Rdl</TabsTrigger>
                  <TabsTrigger value="routing">Route</TabsTrigger>
                  <TabsTrigger value="billing">Bill</TabsTrigger>
                </TabsList>

                {/* Consultation Tab */}
                <TabsContent value="consultation" className="space-y-4 mt-4">
                  {/* Status */}
                  <div className="flex gap-2">
                    {selectedPatient.status === 'pending' && (
                      <Button
                        onClick={() => {
                          void updatePatientStatus(selectedPatient.patientId, 'in-progress');
                          toast.success('Consultation started');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Consultation
                      </Button>
                    )}
                    {selectedPatient.status === 'in-progress' && (
                      <Badge className="bg-green-600 text-white px-4 py-2">In Progress</Badge>
                    )}
                  </div>

                  {/* Vital Signs */}
                  {selectedPatient.vitalSigns && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold mb-2">Vital Signs</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">BP</p>
                            <p className="font-semibold">{selectedPatient.vitalSigns.bp}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Temp</p>
                            <p className="font-semibold">{selectedPatient.vitalSigns.temp}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Pulse</p>
                            <p className="font-semibold">{selectedPatient.vitalSigns.pulse}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Weight</p>
                            <p className="font-semibold">{selectedPatient.vitalSigns.weight}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Clinical Notes with Autocomplete */}
                  <div className="relative">
                    <Label>Clinical Notes / Symptoms</Label>
                    <Textarea
                      value={clinicalNotes}
                      onChange={(e) => {
                        setClinicalNotes(e.target.value);
                        setShowSymptomSuggestions(e.target.value.length > 1);
                      }}
                      onFocus={() => setShowSymptomSuggestions(clinicalNotes.length > 1)}
                      onBlur={() => setTimeout(() => setShowSymptomSuggestions(false), 200)}
                      placeholder="Type symptoms... suggestions will appear"
                      rows={4}
                      className="mt-1"
                    />
                    {showSymptomSuggestions && (
                      <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                        <CardContent className="p-2">
                          {symptomSuggestions
                            .filter(s => s.toLowerCase().includes(clinicalNotes.toLowerCase()))
                            .map((symptom, idx) => (
                              <div
                                key={idx}
                                className="p-2 hover:bg-blue-50 cursor-pointer rounded"
                                onMouseDown={() => {
                                  setClinicalNotes(prev => prev + (prev ? ', ' : '') + symptom);
                                }}
                              >
                                {symptom}
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Handwriting Input */}
                  <div>
                    <Label>Handwriting Notes</Label>
                    <div className="mt-1 border rounded-lg p-2 bg-white">
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

                  {/* Diagnosis with Autocomplete */}
                  <div className="relative">
                    <Label>Diagnosis</Label>
                    <Textarea
                      value={diagnosis}
                      onChange={(e) => {
                        setDiagnosis(e.target.value);
                        setShowDiagnosisSuggestions(e.target.value.length > 1);
                      }}
                      onFocus={() => setShowDiagnosisSuggestions(diagnosis.length > 1)}
                      onBlur={() => setTimeout(() => setShowDiagnosisSuggestions(false), 200)}
                      placeholder="Type diagnosis... suggestions will appear"
                      rows={2}
                      className="mt-1"
                    />
                    {showDiagnosisSuggestions && (
                      <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                        <CardContent className="p-2">
                          {diagnosisSuggestions
                            .filter(d => d.toLowerCase().includes(diagnosis.toLowerCase()))
                            .map((diag, idx) => (
                              <div
                                key={idx}
                                className="p-2 hover:bg-blue-50 cursor-pointer rounded"
                                onMouseDown={() => setDiagnosis(diag)}
                              >
                                {diag}
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Treatment Plan */}
                  <div>
                    <Label>Treatment Plan</Label>
                    <Textarea
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      placeholder="Document treatment recommendations..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      void updatePatientStatus(selectedPatient.patientId, 'completed');
                      toast.success(`Consultation completed for ${selectedPatient.patientName}`);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Save & Complete Consultation
                  </Button>
                </TabsContent>

                {/* Medical History Tab */}
                <TabsContent value="history" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    {medicalHistory.map((entry, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{entry.diagnosis}</p>
                              <p className="text-sm text-gray-600">{entry.doctor}</p>
                            </div>
                            <Badge variant="outline">{new Date(entry.date).toLocaleDateString()}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Treatment:</span> {entry.treatment}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Prescription Tab */}
                <TabsContent value="prescription" className="space-y-4 mt-4">
                  <div>
                    <Label>Search Medication</Label>
                    <Input placeholder="Search medications..." className="mt-1" />
                  </div>

                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {medications.map((med) => (
                      <div key={med.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-500">{med.category}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddMedication(med)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Selected Medications */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="font-semibold text-green-800 mb-3">
                        Selected Medications ({selectedMedications.length})
                      </p>
                      {selectedMedications.length > 0 ? (
                        <div className="space-y-2">
                          {selectedMedications.map((med) => (
                            <div key={med.id} className="bg-white p-2 rounded flex items-start justify-between">
                              <div className="text-sm">
                                <p className="font-medium">{med.name}</p>
                                <p className="text-gray-600">
                                  {med.dosage} - {med.frequency} for {med.duration}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedMedications(selectedMedications.filter(m => m.id !== med.id))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No medications added yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleRouteToPharmacy}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Pharmacy
                  </Button>
                </TabsContent>

                {/* Lab Tests Tab */}
                <TabsContent value="lab" className="space-y-4 mt-4">
                  <div>
                    <Label>Search Lab Test</Label>
                    <Input placeholder="Search lab tests..." className="mt-1" />
                  </div>

                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {labTests.map((test) => (
                      <div key={test.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{test.name}</p>
                          <p className="text-sm text-gray-500">{test.category}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!selectedLabTests.find(t => t.id === test.id)) {
                              setSelectedLabTests([...selectedLabTests, test]);
                              toast.success(`${test.name} added`);
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <p className="font-semibold text-purple-800 mb-2">
                        Selected Tests ({selectedLabTests.length})
                      </p>
                      {selectedLabTests.length > 0 ? (
                        <div className="space-y-2">
                          {selectedLabTests.map((test) => (
                            <div key={test.id} className="bg-white p-2 rounded flex items-center justify-between text-sm">
                              <span>{test.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedLabTests(selectedLabTests.filter(t => t.id !== test.id))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No tests selected yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleRouteToLab}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Laboratory
                  </Button>
                </TabsContent>

                {/* Radiology Tests Tab */}
                <TabsContent value="radiology" className="space-y-4 mt-4">
                  <div>
                    <Label>Search Radiology Test</Label>
                    <Input placeholder="Search radiology tests..." className="mt-1" />
                  </div>

                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {radiologyTests.map((test) => (
                      <div key={test.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{test.name}</p>
                          <p className="text-sm text-gray-500">{test.category} - {test.bodyPart}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!selectedRadiologyTests.find(t => t.id === test.id)) {
                              setSelectedRadiologyTests([...selectedRadiologyTests, test]);
                              toast.success(`${test.name} added`);
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Card className="bg-teal-50 border-teal-200">
                    <CardContent className="p-4">
                      <p className="font-semibold text-teal-800 mb-2">
                        Selected Imaging ({selectedRadiologyTests.length})
                      </p>
                      {selectedRadiologyTests.length > 0 ? (
                        <div className="space-y-2">
                          {selectedRadiologyTests.map((test) => (
                            <div key={test.id} className="bg-white p-2 rounded flex items-center justify-between text-sm">
                              <span>{test.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedRadiologyTests(selectedRadiologyTests.filter(t => t.id !== test.id))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No imaging tests selected yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    onClick={handleRouteToRadiology}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Radiology
                  </Button>
                </TabsContent>

                {/* Routing Tab */}
                <TabsContent value="routing" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Route Patient To:</h3>

                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={handleRouteToLab}
                      >
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Laboratory
                      </Button>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleRouteToPharmacy}
                      >
                        <Pill className="w-4 h-4 mr-2" />
                        Pharmacy
                      </Button>

                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={handleRouteToRadiology}
                      >
                        <ScanLine className="w-4 h-4 mr-2" />
                        Radiology
                      </Button>

                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => setShowTheatreDialog(true)}
                      >
                        <Syringe className="w-4 h-4 mr-2" />
                        Theatre / Surgery
                      </Button>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleInitiateAdmission}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Initiate Ward Admission
                      </Button>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleInitiateDischarge}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Initiate Discharge
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Comprehensive Billing for {selectedPatient?.patientName}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 0. Registration Card Fee (New Patients Only) */}
                      {selectedPatient?.isNewPatient && (
                        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-amber-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-orange-600" />
                              Registration Card Fee
                            </CardTitle>
                            <p className="text-xs text-gray-600">New patient card from Reception</p>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-white rounded-lg p-4 border border-orange-200">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-xs font-semibold text-orange-900">New Patient Registration</p>
                                  <p className="text-[10px] text-gray-500">Issued at Reception</p>
                                </div>
                                <Badge className="bg-orange-600 text-xs">New</Badge>
                              </div>
                              <div className="text-[10px] text-gray-600 space-y-1">
                                <p>Card Type: New Patient Card</p>
                                <p>Issued By: Reception</p>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-orange-200">
                                  <span className="font-semibold text-sm">Registration Fee:</span>
                                  <Badge className="bg-orange-600 text-sm px-3 py-1">
                                    ₦{(selectedPatient?.registrationFee || 0).toLocaleString()}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 p-2 bg-orange-100 rounded text-[10px] text-orange-800">
                              <p>✓ This fee is auto-included for new patients</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* 1. Bill from Pharmacy */}
                      <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Pill className="w-4 h-4 text-green-600" />
                            Bill from Pharmacy
                          </CardTitle>
                          <p className="text-xs text-gray-600">Auto-populated from prescriptions</p>
                        </CardHeader>
                        <CardContent>
                          {selectedMedications.length > 0 ? (
                            <div className="space-y-3">
                              {selectedMedications.map((med, idx) => {
                                const medication = medications.find(m => m.id === med.id);
                                return (
                                  <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-xs font-semibold text-green-900">{med.name}</p>
                                        <p className="text-[10px] text-gray-500">{medication?.category}</p>
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-gray-600 space-y-1">
                                      <p>Dosage: {med.dosage}</p>
                                      <p>Frequency: {med.frequency}</p>
                                      <p>Duration: {med.duration}</p>
                                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                        <span className="font-semibold">Price:</span>
                                        <Badge className="bg-green-600 text-xs">
                                          ₦{(medication?.price || 0).toLocaleString()}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="pt-2 border-t border-green-300">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-900">Total Pharmacy:</span>
                                  <span className="text-lg font-bold text-green-700">
                                    ₦{selectedMedications.reduce((sum, med) => {
                                      const medication = medications.find(m => m.id === med.id);
                                      return sum + (medication?.price || 0);
                                    }, 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Pill className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-xs text-gray-500">No medications prescribed yet</p>
                              <Button
                                size="sm"
                                className="mt-3 bg-green-600 hover:bg-green-700 text-xs h-8"
                                onClick={() => {
                                  toast.info('Go to Prescription tab to add medications');
                                }}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Add Prescription
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* 2. Bill from Lab */}
                      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Beaker className="w-4 h-4 text-purple-600" />
                            Bill from Lab
                          </CardTitle>
                          <p className="text-xs text-gray-600">Auto-populated from lab orders</p>
                        </CardHeader>
                        <CardContent>
                          {selectedLabTests.length > 0 ? (
                            <div className="space-y-3">
                              {selectedLabTests.map((test, idx) => {
                                const labTest = labTests.find(l => l.id === test.id);
                                return (
                                  <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-xs font-semibold text-purple-900">{test.name}</p>
                                        <p className="text-[10px] text-gray-500">{labTest?.category}</p>
                                      </div>
                                      <Badge className="bg-orange-600 text-xs">
                                        pending
                                      </Badge>
                                    </div>
                                    <div className="text-[10px] text-gray-600 space-y-1">
                                      <p>Reason: {test.reason}</p>
                                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                        <span className="font-semibold">Price:</span>
                                        <Badge className="bg-purple-600 text-xs">
                                          ₦{(labTest?.price || 0).toLocaleString()}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="pt-2 border-t border-purple-300">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-900">Total Lab Tests:</span>
                                  <span className="text-lg font-bold text-purple-700">
                                    ₦{selectedLabTests.reduce((sum, test) => {
                                      const labTest = labTests.find(l => l.id === test.id);
                                      return sum + (labTest?.price || 0);
                                    }, 0).toLocaleString()}
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
                                  toast.info('Go to Lab Orders tab to order tests');
                                }}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Order Tests
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* 3. Bill from Radiology */}
                      <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ScanLine className="w-4 h-4 text-teal-600" />
                            Bill from Radiology
                          </CardTitle>
                          <p className="text-xs text-gray-600">Auto-populated from imaging orders</p>
                        </CardHeader>
                        <CardContent>
                          {selectedRadiologyTests.length > 0 ? (
                            <div className="space-y-3">
                              {selectedRadiologyTests.map((test, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-teal-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="text-xs font-semibold text-teal-900">{test.name}</p>
                                      <p className="text-[10px] text-gray-500">{test.category} - {test.bodyPart}</p>
                                    </div>
                                    <Badge className="bg-orange-600 text-xs">
                                      pending
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                    <span className="text-[10px] font-semibold">Price:</span>
                                    <Badge className="bg-teal-600 text-xs">
                                      ₦{test.price.toLocaleString()}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-teal-300">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-900">Total Radiology:</span>
                                  <span className="text-lg font-bold text-teal-700">
                                    ₦{selectedRadiologyTests.reduce((sum, test) => sum + test.price, 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <ScanLine className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-xs text-gray-500">No imaging tests ordered yet</p>
                              <Button
                                size="sm"
                                className="mt-3 bg-teal-600 hover:bg-teal-700 text-xs h-8"
                                onClick={() => {
                                  toast.info('Go to Radiology tab to order imaging');
                                }}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Order Imaging
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* 4. Manual Billing (Doctor) */}
                      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            💰 Manual Billing (Doctor)
                          </CardTitle>
                          <p className="text-xs text-gray-600">Consultation/Procedure fees</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Fee Amount (₦)</Label>
                              <Input
                                type="number"
                                placeholder="Enter consultation/procedure fee"
                                className="mt-1 h-9 text-sm"
                                value={billingAmount}
                                onChange={(e) => setBillingAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                placeholder="e.g., Consultation, Minor procedure"
                                className="mt-1 h-9 text-sm"
                                value={billingDescription}
                                onChange={(e) => setBillingDescription(e.target.value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Submit All Bills to MedLedger Button */}
                    <div className="mt-4">
                      <Button
                        onClick={handleRouteBillingToCashier}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Route Bills to Cashier and Auto Debit Patient MedLedger
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                <p className="text-gray-700 font-medium mb-2">
                  {consultations.length === 0
                    ? 'No patients in queue yet'
                    : 'Select a patient from the queue to begin consultation'}
                </p>
                {consultations.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Once patients are routed to you, they'll appear in the left sidebar
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Theatre Note Dialog */}
      <Dialog open={showTheatreDialog} onOpenChange={setShowTheatreDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Syringe className="w-5 h-5 text-white" />
              </div>
              <div>
                Theatre Note - {selectedPatient?.patientName}
                <p className="text-sm font-normal text-gray-600">Complete surgical notes before routing to theatre</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Complete the pre-operative assessment and surgical planning form to route patient to theatre
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Patient Info Banner */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Patient</p>
                    <p className="font-semibold">{selectedPatient?.patientName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Card Number</p>
                    <p className="font-semibold">{selectedPatient?.cardNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Age / Gender</p>
                    <p className="font-semibold">{selectedPatient?.age} years / {selectedPatient?.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Requesting Doctor</p>
                    <p className="font-semibold">{currentDoctor.fullName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pre-Operative Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-lg">Pre-Operative Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-base">
                    Pre-Operative Diagnosis <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={theatreNote.preOpDiagnosis}
                    onChange={(e) => setTheatreNote({ ...theatreNote, preOpDiagnosis: e.target.value })}
                    placeholder="Enter the pre-operative diagnosis..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-base">
                    Planned Surgery / Procedure <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={theatreNote.plannedSurgery}
                    onChange={(e) => setTheatreNote({ ...theatreNote, plannedSurgery: e.target.value })}
                    placeholder="Describe the planned surgical procedure..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-base">Indication for Surgery</Label>
                  <Textarea
                    value={theatreNote.indication}
                    onChange={(e) => setTheatreNote({ ...theatreNote, indication: e.target.value })}
                    placeholder="Why is surgery necessary?"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Surgical Planning */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Surgical Planning</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Urgency Level</Label>
                  <Select
                    value={theatreNote.urgencyLevel}
                    onValueChange={(value) => setTheatreNote({ ...theatreNote, urgencyLevel: value as 'elective' | 'urgent' | 'emergency' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elective">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Elective - Scheduled</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Urgent - Within 24-48 hours</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="emergency">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Emergency - Immediate</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Estimated Duration (Hours)</Label>
                  <Select
                    value={theatreNote.estimatedDuration}
                    onValueChange={(value) => setTheatreNote({ ...theatreNote, estimatedDuration: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5 hours">30 minutes</SelectItem>
                      <SelectItem value="1 hour">1 hour</SelectItem>
                      <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                      <SelectItem value="2 hours">2 hours</SelectItem>
                      <SelectItem value="2.5 hours">2.5 hours</SelectItem>
                      <SelectItem value="3 hours">3 hours</SelectItem>
                      <SelectItem value="3.5 hours">3.5 hours</SelectItem>
                      <SelectItem value="4 hours">4 hours</SelectItem>
                      <SelectItem value="4.5 hours">4.5 hours</SelectItem>
                      <SelectItem value="5 hours">5 hours</SelectItem>
                      <SelectItem value="6 hours">6 hours</SelectItem>
                      <SelectItem value="6+ hours">6+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Anesthesia Type</Label>
                  <Select
                    value={theatreNote.anesthesiaType}
                    onValueChange={(value) => setTheatreNote({ ...theatreNote, anesthesiaType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Anesthesia</SelectItem>
                      <SelectItem value="spinal">Spinal Anesthesia</SelectItem>
                      <SelectItem value="epidural">Epidural Anesthesia</SelectItem>
                      <SelectItem value="local">Local Anesthesia</SelectItem>
                      <SelectItem value="sedation">Conscious Sedation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Surgeon In Charge</Label>
                  <Select
                    value={theatreNote.surgeonInCharge}
                    onValueChange={(value) => setTheatreNote({ ...theatreNote, surgeonInCharge: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select surgeon (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {registeredSurgeons.map((surgeon) => (
                        <SelectItem key={surgeon} value={surgeon}>
                          {surgeon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-base">Special Equipment Required</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      {theatreEquipmentList.map((equipment) => (
                        <label
                          key={equipment}
                          className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={theatreNote.specialEquipment.includes(equipment)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTheatreNote({
                                  ...theatreNote,
                                  specialEquipment: [...theatreNote.specialEquipment, equipment]
                                });
                              } else {
                                setTheatreNote({
                                  ...theatreNote,
                                  specialEquipment: theatreNote.specialEquipment.filter(item => item !== equipment)
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{equipment}</span>
                        </label>
                      ))}
                    </div>
                    {theatreNote.specialEquipment.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Selected ({theatreNote.specialEquipment.length}):</p>
                        <p className="text-xs text-blue-700">{theatreNote.specialEquipment.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-base">Patient Preparation Notes</Label>
                  <Textarea
                    value={theatreNote.preparationNotes}
                    onChange={(e) => setTheatreNote({ ...theatreNote, preparationNotes: e.target.value })}
                    placeholder="Pre-operative preparations, NPO status, special considerations..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Vital Signs Summary */}
            {selectedPatient?.vitalSigns && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-2 text-green-900">Current Vital Signs</p>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">BP</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.vitalSigns.bp}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Temp</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.vitalSigns.temp}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pulse</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.vitalSigns.pulse}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Weight</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.vitalSigns.weight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alert Banner */}
            <div className={`p-4 rounded-lg border-l-4 ${
              theatreNote.urgencyLevel === 'emergency' ? 'bg-red-50 border-red-500' :
              theatreNote.urgencyLevel === 'urgent' ? 'bg-orange-50 border-orange-500' :
              'bg-blue-50 border-blue-500'
            }`}>
              <div className="flex items-start gap-3">
                {theatreNote.urgencyLevel === 'emergency' && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Emergency Surgery</p>
                      <p className="text-sm text-red-700 mt-1">
                        Theatre will be notified immediately. Ensure all required preparations are complete.
                      </p>
                    </div>
                  </>
                )}
                {theatreNote.urgencyLevel === 'urgent' && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900">Urgent Surgery</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Surgery should be scheduled within 24-48 hours. Theatre scheduling will prioritize this case.
                      </p>
                    </div>
                  </>
                )}
                {theatreNote.urgencyLevel === 'elective' && (
                  <>
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Elective Surgery</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Surgery will be scheduled according to theatre availability and patient convenience.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowTheatreDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRouteToTheatre}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Route to Theatre
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
