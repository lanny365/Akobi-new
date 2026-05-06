import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  User,
  Users,
  Phone,
  FileText,
  CreditCard,
  Shield,
  Upload,
  Save,
  X,
  Search,
  Plus,
  Download,
  Printer,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { createPatient, createVisit, resolveDepartmentId, searchPatients } from '../utils/api';

interface PatientRegistrationFormProps {
  open: boolean;
  onClose: () => void;
  onPatientRegistered?: (patient: any) => void;
}

interface PatientData {
  cardNumber: string;
  cardType: 'personal' | 'family';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  smsAlerts?: boolean;
  familyMembers?: number;
  registrationDate: string;
}

export function PatientRegistrationForm({ open, onClose, onPatientRegistered }: PatientRegistrationFormProps) {
  const [cardType, setCardType] = useState<'personal' | 'family' | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<number>(1);
  const [age, setAge] = useState<number | ''>('');
  const [referralType, setReferralType] = useState<'none' | 'existing' | 'new' | 'patient'>('none');
  const [selectedReferrer, setSelectedReferrer] = useState<string>('');
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientReferrer, setSelectedPatientReferrer] = useState<any>(null);
  const [attachedFamilyMembers, setAttachedFamilyMembers] = useState<any[]>([]);
  const [familyMemberSearchQuery, setFamilyMemberSearchQuery] = useState('');
  const [familyMemberSearchResults, setFamilyMemberSearchResults] = useState<any[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<PatientData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    smsAlerts: false
  });

  // Sample existing referrers
  const existingReferrers = [
    { id: '1', name: 'Dr. John Smith', type: 'Doctor', hospital: 'City General Hospital' },
    { id: '2', name: 'Dr. Sarah Johnson', type: 'Doctor', hospital: 'Metro Medical Center' },
    { id: '3', name: 'St. Mary Hospital', type: 'Hospital', hospital: 'St. Mary Hospital' },
    { id: '4', name: 'Dr. Michael Brown', type: 'Doctor', hospital: 'Private Practice' },
    { id: '5', name: 'Community Health Center', type: 'Clinic', hospital: 'Community Health Center' },
  ];

  // Sample existing patients (in real app, this would come from database)
  const existingPatients = [
    { id: 'P-2025-0001', name: 'John Doe', cardNumber: 'P-2025-0001', phone: '+234 801 234 5678', address: '123 Main St, Lagos' },
    { id: 'P-2025-0045', name: 'Mary Johnson', cardNumber: 'P-2025-0045', phone: '+234 802 345 6789', address: '45 Victoria Island, Lagos' },
    { id: 'FC-2025-0012', name: 'Ahmed Ibrahim', cardNumber: 'FC-2025-0012', phone: '+234 803 456 7890', address: '78 Ikeja GRA, Lagos' },
    { id: 'P-2025-0089', name: 'Grace Okafor', cardNumber: 'P-2025-0089', phone: '+234 804 567 8901', address: '12 Lekki Phase 1, Lagos' },
    { id: 'P-2025-0123', name: 'David Chen', cardNumber: 'P-2025-0123', phone: '+234 805 678 9012', address: '90 Ikoyi, Lagos' },
  ];

  const sections = [
    { id: 'personal', title: 'Personal Information', icon: User },
    { id: 'identification', title: 'Identification Details', icon: FileText },
    { id: 'next-of-kin', title: 'Next of Kin', icon: User },
    { id: 'emergency', title: 'Emergency Contact', icon: Phone },
    { id: 'visit', title: 'Hospital Visit Info', icon: FileText },
    { id: 'payment', title: 'Insurance / Payment', icon: CreditCard },
    { id: 'additional', title: 'Additional Information', icon: FileText },
    { id: 'consent', title: 'Consent & Confirmation', icon: Shield },
  ];

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) {
      setAge('');
      return;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    setAge(calculatedAge);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCardNumber = (type: 'personal' | 'family') => {
    const prefix = type === 'family' ? 'FC' : 'P';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
  };

  const getControlValue = (form: HTMLFormElement, id: string) => {
    const control = form.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    return control?.value?.trim() || '';
  };

  const normalizeGender = (value: string): 'Male' | 'Female' | 'Other' => {
    if (value.toLowerCase() === 'female') {
      return 'Female';
    }

    if (value.toLowerCase() === 'other') {
      return 'Other';
    }

    return 'Male';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cardType) {
      toast.error('Select a card type before submitting the form.');
      return;
    }

    const form = e.currentTarget;
    const departmentSelection = getControlValue(form, 'department');
    const chiefComplaint = 'New patient registration - awaiting vital signs';

    setIsSubmitting(true);

    try {
      const patient = await createPatient({
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: normalizeGender(getControlValue(form, 'gender')),
        date_of_birth: formData.dateOfBirth,
        phone: formData.phone,
        email: formData.email || undefined,
        address: getControlValue(form, 'address') || undefined,
        next_of_kin_name: getControlValue(form, 'nokName') || undefined,
        next_of_kin_phone: getControlValue(form, 'nokPhone') || undefined,
        card_type: cardType === 'family' ? 'Family Card' : 'Personal Card',
      });

      await createVisit({
        patient_id: patient.id,
        department_id: await resolveDepartmentId(departmentSelection),
        chief_complaint: chiefComplaint,
        reason_to_see_doctor: 'Consultation',
        consultation_type: getControlValue(form, 'visitType') || 'Outpatient',
      });

      const patientData: PatientData = {
        cardNumber: patient.card?.card_number || generateCardNumber(cardType),
        cardType,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        phone: patient.phone,
        email: patient.email || undefined,
        smsAlerts: formData.smsAlerts,
        familyMembers: cardType === 'family' ? familyMembers : undefined,
        registrationDate: new Date().toISOString(),
      };

      setRegisteredPatient(patientData);
      setShowQRCode(true);

      const message = cardType === 'family'
        ? `Family card registered successfully with ${familyMembers} member(s)`
        : 'Personal card registered successfully';

      toast.success(`${message}. Patient has been sent to the vital signs queue.`);

      onPatientRegistered?.({
        id: String(patient.id),
        patientId: patient.patient_number,
        name: patient.full_name,
        age: age || 0,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email || '',
        chiefComplaint,
        status: 'routed',
        registrationTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        backendPatientId: patient.id,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to register patient in the backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardTypeSelect = (type: 'personal' | 'family') => {
    setCardType(type);
    setCurrentSection(0);
    // Reset family-specific states
    if (type === 'personal') {
      setAttachedFamilyMembers([]);
      setFamilyMembers(1);
    } else {
      setFamilyMembers(1); // Start with just the family head
    }
  };

  const mapSearchResult = (patient: any) => ({
    id: patient.patient_number,
    name: patient.full_name,
    cardNumber: patient.card?.card_number || patient.patient_number,
    phone: patient.phone,
    address: patient.address || 'No address on file',
    backendPatientId: patient.id,
  });

  const handlePatientSearch = async (query: string) => {
    setPatientSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchPatients(query);
      setSearchResults(results.map(mapSearchResult));
    } catch {
      const fallbackResults = existingPatients.filter(patient =>
        patient.cardNumber.toLowerCase().includes(query.toLowerCase()) ||
        patient.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(fallbackResults);
    }
  };

  const handleSelectPatientReferrer = (patient: any) => {
    setSelectedPatientReferrer(patient);
    setSearchResults([]);
    setPatientSearchQuery(patient.name);
  };

  const handleFamilyMemberSearch = async (query: string) => {
    setFamilyMemberSearchQuery(query);
    if (query.trim().length < 2) {
      setFamilyMemberSearchResults([]);
      return;
    }

    try {
      const results = await searchPatients(query);
      setFamilyMemberSearchResults(
        results
          .map(mapSearchResult)
          .filter((patient) => !attachedFamilyMembers.some(member => member.id === patient.id)),
      );
    } catch {
      const fallbackResults = existingPatients
        .filter(patient =>
          patient.cardNumber.startsWith('P-') &&
          !attachedFamilyMembers.some(member => member.id === patient.id)
        )
        .filter(patient =>
          patient.cardNumber.toLowerCase().includes(query.toLowerCase()) ||
          patient.name.toLowerCase().includes(query.toLowerCase())
        );
      setFamilyMemberSearchResults(fallbackResults);
    }
  };

  const handleAttachFamilyMember = (patient: any) => {
    setAttachedFamilyMembers([...attachedFamilyMembers, patient]);
    setFamilyMemberSearchResults([]);
    setFamilyMemberSearchQuery('');
    setFamilyMembers(attachedFamilyMembers.length + 2); // +1 for new member, +1 for family head
    toast.success(`${patient.name} attached to family card`);
  };

  const handleRemoveFamilyMember = (patientId: string) => {
    setAttachedFamilyMembers(attachedFamilyMembers.filter(member => member.id !== patientId));
    setFamilyMembers(Math.max(1, attachedFamilyMembers.length)); // Update count, minimum 1 (family head)
    toast.info('Family member removed');
  };

  const handleCloseAll = () => {
    setShowQRCode(false);
    setRegisteredPatient(null);
    setCardType(null);
    setCurrentSection(0);
    setFormData({ firstName: '', lastName: '', dateOfBirth: '', phone: '', email: '', smsAlerts: false });
    onClose();
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('patient-qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${registeredPatient?.cardNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQRCode = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow || !registeredPatient) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient QR Code - ${registeredPatient.cardNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
            }
            .header {
              margin-bottom: 30px;
            }
            h1 { color: #2563eb; margin-bottom: 10px; }
            .info { margin: 20px 0; }
            .qr-container { margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AKOBI ISHMS</h1>
            <h2>Patient QR Code</h2>
          </div>
          <div class="info">
            <p><strong>Card Number:</strong> ${registeredPatient.cardNumber}</p>
            <p><strong>Patient:</strong> ${registeredPatient.firstName} ${registeredPatient.lastName}</p>
            <p><strong>Card Type:</strong> ${registeredPatient.cardType === 'family' ? 'Family Card' : 'Personal Card'}</p>
          </div>
          <div class="qr-container">
            ${document.getElementById('patient-qr-code')?.outerHTML || ''}
          </div>
          <p style="margin-top: 30px; color: #666;">Scan this QR code for quick patient information access</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const SectionIcon = sections[currentSection].icon;

  return (
    <>
    <Dialog open={open && !showQRCode} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            New Patient Registration
          </DialogTitle>
          <DialogDescription>
            {!cardType
              ? 'Select card type to begin registration'
              : `Complete all sections to register a ${cardType} card. All fields marked with * are required.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Card Type Selection */}
        {!cardType ? (
          <div className="py-8">
            <h3 className="text-lg font-semibold text-center mb-6">Choose Card Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Personal Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
                onClick={() => handleCardTypeSelect('personal')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Personal Card</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Register an individual patient with their personal medical information
                  </p>
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-left space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Individual patient record
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Separate billing
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Independent medical history
                    </p>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                    Select Personal Card
                  </Button>
                </CardContent>
              </Card>

              {/* Family Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500"
                onClick={() => handleCardTypeSelect('family')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Family Card</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Register multiple family members under one card with shared billing
                  </p>
                  <div className="bg-green-50 rounded-lg p-3 text-xs text-left space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Multiple family members
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Consolidated billing
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Shared family information
                    </p>
                  </div>
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                    Select Family Card
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* Card Type Badge */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Card Type:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  cardType === 'personal'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {cardType === 'personal' ? 'Personal Card' : 'Family Card'}
                </span>
                {cardType === 'family' && (
                  <span className="text-sm text-gray-600">
                    ({familyMembers} member{familyMembers > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCardType(null);
                  setCurrentSection(0);
                }}
              >
                Change Card Type
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setCurrentSection(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  currentSection === index
                    ? 'bg-blue-600 text-white shadow-md'
                    : currentSection > index
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{section.title}</span>
                <span className="md:hidden">{index + 1}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Information */}
          {currentSection === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-blue-600" />
                  {cardType === 'family' ? 'Family Head Information' : 'Personal Information'}
                </CardTitle>
                {cardType === 'family' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Provide information for the family head (primary cardholder)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Family Members Count - Only for Family Card */}
                {cardType === 'family' && (
                  <>
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Label htmlFor="familyMembersCount">Total Family Members (including head) *</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          id="familyMembersCount"
                          type="number"
                          min="1"
                          max="10"
                          value={familyMembers}
                          readOnly
                          className="w-32 bg-white cursor-not-allowed"
                          required
                        />
                        <span className="text-sm text-gray-600">
                          1 Family Head + {attachedFamilyMembers.length} Attached Member{attachedFamilyMembers.length !== 1 ? 's' : ''} = {familyMembers} Total
                        </span>
                      </div>
                    </div>

                    {/* Attach Existing Personal Cards to Family */}
                    <div className="mb-6 p-4 bg-white border-2 border-green-300 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Attach Existing Personal Cardholders to Family
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Search and attach existing patients with personal cards to this family card. They will become family members with shared billing.
                      </p>

                      {/* Search for Personal Cards */}
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="familyMemberSearch">Search by Card Number or Name</Label>
                          <div className="relative">
                            <Input
                              id="familyMemberSearch"
                              placeholder="e.g., P-2025-0001 or John Doe (Personal Cards Only)"
                              value={familyMemberSearchQuery}
                              onChange={(e) => handleFamilyMemberSearch(e.target.value)}
                              className="pr-10"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        {/* Search Results */}
                        {familyMemberSearchResults.length > 0 && (
                          <div className="border border-green-300 rounded-lg bg-white max-h-48 overflow-y-auto">
                            <div className="p-2">
                              <p className="text-xs text-green-600 mb-2 px-2 font-semibold">
                                Found {familyMemberSearchResults.length} personal cardholder{familyMemberSearchResults.length > 1 ? 's' : ''}
                              </p>
                              {familyMemberSearchResults.map((patient) => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => handleAttachFamilyMember(patient)}
                                  className="w-full p-3 hover:bg-green-50 rounded-lg text-left transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-gray-900">{patient.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Card: {patient.cardNumber} • {patient.phone}
                                      </p>
                                    </div>
                                    <Plus className="w-5 h-5 text-green-600" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Results */}
                        {familyMemberSearchQuery.length >= 2 && familyMemberSearchResults.length === 0 && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              No personal cards found matching "{familyMemberSearchQuery}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Attached Family Members List */}
                      {attachedFamilyMembers.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h5 className="text-sm font-semibold text-green-900 mb-2">
                            Attached Family Members ({attachedFamilyMembers.length})
                          </h5>
                          {attachedFamilyMembers.map((member, index) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{member.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {member.cardNumber} • {member.phone}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFamilyMember(member.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Remove from family"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {attachedFamilyMembers.length === 0 && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                          <p className="text-sm text-gray-500">
                            No family members attached yet. Search and add personal cardholders above.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="First name" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Last name" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <select id="gender" className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        setFormData({...formData, dateOfBirth: e.target.value});
                        calculateAge(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age (Auto-calculated) *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Select date of birth"
                      value={age}
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <select id="maritalStatus" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">Select status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input id="nationality" placeholder="e.g., Nigerian" required />
                  </div>
                  <div>
                    <Label htmlFor="stateOfOrigin">State of Origin</Label>
                    <Input id="stateOfOrigin" placeholder="State of origin" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+234 xxx xxx xxxx" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input id="occupation" placeholder="Occupation" />
                  </div>
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <select id="religion" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">Select religion</option>
                      <option value="christianity">Christianity</option>
                      <option value="islam">Islam</option>
                      <option value="traditional">Traditional</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* SMS Alerts Checkbox */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="smsAlerts"
                      checked={formData.smsAlerts}
                      onChange={(e) => setFormData({...formData, smsAlerts: e.target.checked})}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="smsAlerts" className="font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        Enable SMS Alerts
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive appointment reminders, test results, prescription notifications, and important updates via SMS to your registered phone number ({formData.phone || 'not provided'}).
                      </p>
                      {formData.smsAlerts && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-800 font-medium flex items-center gap-2">
                            ✓ SMS alerts enabled - You will receive notifications at {formData.phone || 'your phone number'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Residential Address *</Label>
                  <Textarea id="address" placeholder="Complete residential address" required />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 2: Identification Details */}
          {currentSection === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-blue-600" />
                  Identification Details
                </CardTitle>
                {cardType === 'family' && (
                  <p className="text-sm text-gray-600 mt-2">
                    A unique family card ID will be generated. Each family member will have an individual patient ID linked to this card.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientId">
                      {cardType === 'family' ? 'Family Card ID / Hospital Number *' : 'Patient ID / Hospital Number *'}
                    </Label>
                    <Input
                      id="patientId"
                      placeholder={cardType === 'family' ? 'Auto-generated: FC-2025-XXXX' : 'Auto-generated: P-2025-XXXX'}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationalId">National ID Number</Label>
                    <Input id="nationalId" placeholder="National ID / NIN" />
                  </div>
                </div>

                {/* Passport Photograph */}
                <div>
                  <Label>Passport Photograph *</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      {passportPhoto ? (
                        <img src={passportPhoto} alt="Passport" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="passport"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('passport')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a recent passport photograph (max 2MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Next of Kin Information */}
          {currentSection === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-blue-600" />
                  Next of Kin Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nokName">Next of Kin Full Name *</Label>
                    <Input id="nokName" placeholder="Full name" required />
                  </div>
                  <div>
                    <Label htmlFor="nokRelationship">Relationship to Patient *</Label>
                    <Input id="nokRelationship" placeholder="e.g., Spouse, Parent, Sibling" required />
                  </div>
                  <div>
                    <Label htmlFor="nokPhone">Phone Number *</Label>
                    <Input id="nokPhone" type="tel" placeholder="+234 xxx xxx xxxx" required />
                  </div>
                  <div>
                    <Label htmlFor="nokEmail">Email Address</Label>
                    <Input id="nokEmail" type="email" placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nokAddress">Address *</Label>
                  <Textarea id="nokAddress" placeholder="Complete address" required />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Emergency Contact Information */}
          {currentSection === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-red-600" />
                  Emergency Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
                    <Input id="emergencyName" placeholder="Full name" required />
                  </div>
                  <div>
                    <Label htmlFor="emergencyRelationship">Relationship *</Label>
                    <Input id="emergencyRelationship" placeholder="Relationship" required />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Phone Number *</Label>
                    <Input id="emergencyPhone" type="tel" placeholder="+234 xxx xxx xxxx" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emergencyAddress">Address *</Label>
                  <Textarea id="emergencyAddress" placeholder="Complete address" required />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 5: Hospital Visit Information */}
          {currentSection === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-blue-600" />
                  Hospital Visit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationDate">Date of Registration *</Label>
                    <Input id="registrationDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div>
                    <Label htmlFor="registrationTime">Time of Registration *</Label>
                    <Input id="registrationTime" type="time" defaultValue={new Date().toTimeString().slice(0, 5)} required />
                  </div>
                  <div>
                    <Label htmlFor="department">Department / Unit *</Label>
                    <select id="department" className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                      <option value="">Select department</option>
                      <option value="general">General Medicine</option>
                      <option value="surgery">Surgery</option>
                      <option value="pediatrics">Pediatrics</option>
                      <option value="maternity">Maternity</option>
                      <option value="emergency">Emergency</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="orthopedics">Orthopedics</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="attendingDoctor">Attending Doctor</Label>
                    <select id="attendingDoctor" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">Select doctor</option>
                      <option value="dr-smith">Dr. Smith</option>
                      <option value="dr-johnson">Dr. Johnson</option>
                      <option value="dr-williams">Dr. Williams</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="visitType">Visit Type *</Label>
                    <select id="visitType" className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                      <option value="">Select visit type</option>
                      <option value="outpatient">Outpatient</option>
                      <option value="inpatient">Inpatient</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Referral Section */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Referral Information
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="referralType">Was this patient referred?</Label>
                      <select
                        id="referralType"
                        value={referralType}
                        onChange={(e) => {
                          setReferralType(e.target.value as 'none' | 'existing' | 'new' | 'patient');
                          setSelectedReferrer('');
                          setShowReferralForm(false);
                          setPatientSearchQuery('');
                          setSearchResults([]);
                          setSelectedPatientReferrer(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="none">No Referral (Walk-in)</option>
                        <option value="patient">Inpatient (Our Customer)</option>
                        <option value="existing">External Referrer (Doctor/Hospital)</option>
                        <option value="new">Add New External Referrer</option>
                      </select>
                    </div>

                    {/* Patient Referrer Search (Inpatient) */}
                    {referralType === 'patient' && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="patientSearch">Search Patient by Card Number or Name</Label>
                          <div className="relative">
                            <Input
                              id="patientSearch"
                              placeholder="Enter card number (e.g., P-2025-0001) or patient name"
                              value={patientSearchQuery}
                              onChange={(e) => handlePatientSearch(e.target.value)}
                              className="pr-10"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                          <div className="border border-gray-300 rounded-lg bg-white max-h-60 overflow-y-auto">
                            <div className="p-2">
                              <p className="text-xs text-gray-500 mb-2 px-2">
                                Found {searchResults.length} patient{searchResults.length > 1 ? 's' : ''}
                              </p>
                              {searchResults.map((patient) => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => handleSelectPatientReferrer(patient)}
                                  className="w-full p-3 hover:bg-blue-50 rounded-lg text-left transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-gray-900">{patient.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Card: {patient.cardNumber} • {patient.phone}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5">{patient.address}</p>
                                    </div>
                                    <User className="w-5 h-5 text-blue-500" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Results */}
                        {patientSearchQuery.length >= 2 && searchResults.length === 0 && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              No patient found with card number or name "{patientSearchQuery}"
                            </p>
                          </div>
                        )}

                        {/* Selected Patient Info */}
                        {selectedPatientReferrer && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">Selected Patient Referrer:</p>
                                <h4 className="font-bold text-green-900 text-lg">{selectedPatientReferrer.name}</h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPatientReferrer(null);
                                  setPatientSearchQuery('');
                                }}
                                className="text-gray-500 hover:text-red-600"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">Card Number:</span>
                                <span className="font-semibold text-gray-900">{selectedPatientReferrer.cardNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-semibold text-gray-900">{selectedPatientReferrer.phone}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-green-600 mt-0.5" />
                                <span className="text-gray-600">Address:</span>
                                <span className="font-semibold text-gray-900">{selectedPatientReferrer.address}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-green-300">
                              <p className="text-xs text-green-800 italic">
                                This patient from our database referred the new patient
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Existing Referrer Selection */}
                    {referralType === 'existing' && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="existingReferrer">Select Referrer</Label>
                          <select
                            id="existingReferrer"
                            value={selectedReferrer}
                            onChange={(e) => setSelectedReferrer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                            required
                          >
                            <option value="">-- Choose a referrer --</option>
                            {existingReferrers.map((referrer) => (
                              <option key={referrer.id} value={referrer.id}>
                                {referrer.name} ({referrer.type}) - {referrer.hospital}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedReferrer && (
                          <div className="p-3 bg-white border border-blue-200 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900 mb-1">Selected Referrer:</p>
                            <p className="text-sm text-gray-700">
                              {existingReferrers.find(r => r.id === selectedReferrer)?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {existingReferrers.find(r => r.id === selectedReferrer)?.type} - {existingReferrers.find(r => r.id === selectedReferrer)?.hospital}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* New Referrer Form */}
                    {referralType === 'new' && (
                      <div className="space-y-3 p-4 bg-white border border-blue-200 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-3">New Referrer Details</h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="newReferrerName">Referrer Name *</Label>
                            <Input
                              id="newReferrerName"
                              placeholder="e.g., Dr. John Doe"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newReferrerType">Referrer Type *</Label>
                            <select
                              id="newReferrerType"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="">Select type</option>
                              <option value="doctor">Doctor</option>
                              <option value="hospital">Hospital</option>
                              <option value="clinic">Clinic</option>
                              <option value="pharmacy">Pharmacy</option>
                              <option value="other">Other Healthcare Provider</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="newReferrerHospital">Hospital/Organization *</Label>
                            <Input
                              id="newReferrerHospital"
                              placeholder="e.g., City Medical Center"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newReferrerPhone">Contact Phone</Label>
                            <Input
                              id="newReferrerPhone"
                              type="tel"
                              placeholder="+234 xxx xxx xxxx"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="newReferrerAddress">Address</Label>
                            <Textarea
                              id="newReferrerAddress"
                              placeholder="Complete address of referrer"
                              rows={2}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="referralReason">Reason for Referral</Label>
                            <Textarea
                              id="referralReason"
                              placeholder="Why was the patient referred to our facility?"
                              rows={2}
                            />
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                          This referrer will be saved and available for future patient registrations
                        </div>
                      </div>
                    )}

                    {referralType === 'none' && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">
                          This patient is a walk-in (no referral)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 6: Insurance / Payment Information */}
          {currentSection === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-green-600" />
                  Insurance / Payment Information
                </CardTitle>
                {cardType === 'family' && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">Family Card Billing:</span>
                      This payment information applies to all {familyMembers} family members
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentCategory">Payment Category *</Label>
                    <select id="paymentCategory" className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                      <option value="">Select payment category</option>
                      <option value="cash">Cash</option>
                      <option value="insurance">Insurance</option>
                      <option value="hmo">HMO</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="insuranceProvider">Insurance Provider / HMO Name</Label>
                    <Input id="insuranceProvider" placeholder="Provider name" />
                  </div>
                  <div>
                    <Label htmlFor="insuranceNumber">Insurance Number</Label>
                    <Input id="insuranceNumber" placeholder="Insurance policy/card number" />
                  </div>
                  <div>
                    <Label htmlFor="sponsor">Sponsor Name</Label>
                    <Input id="sponsor" placeholder="Sponsor name (if applicable)" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 7: Additional Information */}
          {currentSection === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-blue-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredCommunication">Preferred Communication Method</Label>
                    <select id="preferredCommunication" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="phone">Phone Call</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language Spoken</Label>
                    <Input id="language" placeholder="Primary language" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="specialNotes">Special Notes / Remarks</Label>
                  <Textarea id="specialNotes" placeholder="Any additional information or special requirements" rows={4} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 8: Consent and Confirmation */}
          {currentSection === 7 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="w-5 h-5 text-purple-600" />
                  Consent and Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`border rounded-lg p-4 mb-4 ${
                  cardType === 'family'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    cardType === 'family' ? 'text-green-900' : 'text-blue-900'
                  }`}>
                    {cardType === 'family' ? 'Family Card Consent' : 'Patient Consent'}
                  </h4>
                  <p className={`text-sm ${
                    cardType === 'family' ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {cardType === 'family'
                      ? `I, as the family head, hereby consent to medical treatment for all ${familyMembers} registered family members and confirm that all information provided is accurate and complete. I understand that this information will be kept confidential and used solely for medical purposes.`
                      : 'I hereby consent to medical treatment and confirm that all information provided is accurate and complete. I understand that this information will be kept confidential and used solely for medical purposes.'
                    }
                  </p>
                </div>

                {cardType === 'family' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Family Card Summary
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1 mb-3">
                      <li>• Total members: {familyMembers} (1 Family Head + {attachedFamilyMembers.length} Attached)</li>
                      <li>• Consolidated billing for all family members</li>
                      <li>• Shared payment and insurance information</li>
                      <li>• Individual medical records maintained for each member</li>
                    </ul>

                    {attachedFamilyMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-300">
                        <p className="text-xs font-semibold text-yellow-900 mb-2">Attached Family Members:</p>
                        <div className="space-y-1">
                          {attachedFamilyMembers.map((member, index) => (
                            <div key={member.id} className="text-xs text-yellow-800 bg-white/50 rounded px-2 py-1">
                              {index + 1}. {member.name} ({member.cardNumber})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Referral Summary */}
                {referralType !== 'none' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Referral Information
                    </h4>
                    {referralType === 'patient' && selectedPatientReferrer ? (
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-2">
                          Referred by Patient: {selectedPatientReferrer.name}
                        </p>
                        <div className="space-y-1 text-xs bg-white/50 rounded p-2">
                          <p>Card Number: {selectedPatientReferrer.cardNumber}</p>
                          <p>Phone: {selectedPatientReferrer.phone}</p>
                          <p>Address: {selectedPatientReferrer.address}</p>
                        </div>
                      </div>
                    ) : referralType === 'existing' && selectedReferrer ? (
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold">
                          Referred by: {existingReferrers.find(r => r.id === selectedReferrer)?.name}
                        </p>
                        <p className="text-xs mt-1">
                          {existingReferrers.find(r => r.id === selectedReferrer)?.type} - {existingReferrers.find(r => r.id === selectedReferrer)?.hospital}
                        </p>
                      </div>
                    ) : referralType === 'new' ? (
                      <p className="text-sm text-blue-800">
                        New external referrer information will be saved with this registration
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientSignature">Patient Signature</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex items-center justify-center bg-gray-50">
                      <p className="text-sm text-gray-500">Signature pad / Upload signature</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="staffName">Staff Name *</Label>
                    <Input id="staffName" placeholder="Name of registering staff" required />
                  </div>
                  <div>
                    <Label htmlFor="staffSignature">Staff Signature</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex items-center justify-center bg-gray-50">
                      <p className="text-sm text-gray-500">Staff signature</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmationDate">Date *</Label>
                    <Input id="confirmationDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <input type="checkbox" id="confirmAccuracy" className="mt-1" required />
                  <label htmlFor="confirmAccuracy" className="text-sm text-yellow-900">
                    I confirm that all information provided has been verified and is accurate to the best of my knowledge. *
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => currentSection > 0 && setCurrentSection(currentSection - 1)}
              disabled={currentSection === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>

              {currentSection < sections.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cardType === 'family' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting
                    ? 'Saving to Backend...'
                    : cardType === 'family'
                    ? `Register Family Card (${familyMembers} members)`
                    : 'Submit Registration'}
                </Button>
              )}
            </div>
          </div>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* QR Code Success Modal */}
    <Dialog open={showQRCode} onOpenChange={handleCloseAll}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-green-600">
            <QrCode className="w-6 h-6" />
            Patient Registration Successful!
          </DialogTitle>
          <DialogDescription>
            Patient has been registered successfully. Use the QR code below for quick access to patient information.
          </DialogDescription>
        </DialogHeader>

        {registeredPatient && (
          <div className="space-y-6 py-4">
            {/* Patient Info Card */}
            <Card className={`${
              registeredPatient.cardType === 'family' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
            }`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Card Number</p>
                    <p className="font-semibold text-lg">{registeredPatient.cardNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Card Type</p>
                    <p className="font-semibold text-lg">
                      {registeredPatient.cardType === 'family' ? 'Family Card' : 'Personal Card'}
                      {registeredPatient.cardType === 'family' && registeredPatient.familyMembers && (
                        <span className="text-sm text-green-600 ml-2">({registeredPatient.familyMembers} members)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patient Name</p>
                    <p className="font-semibold">{registeredPatient.firstName} {registeredPatient.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold flex items-center gap-2">
                      {registeredPatient.phone}
                      {registeredPatient.smsAlerts && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <Phone className="w-3 h-3" />
                          SMS Enabled
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-semibold">{registeredPatient.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration Date</p>
                    <p className="font-semibold">{new Date(registeredPatient.registrationDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {registeredPatient.smsAlerts && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">SMS Alerts Active:</span>
                      Patient will receive appointment reminders, test results, and medical notifications
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code Display */}
            <div className="flex flex-col items-center justify-center bg-white border-2 border-gray-200 rounded-lg p-8">
              <p className="text-sm text-gray-600 mb-4 font-semibold">Patient Quick Access QR Code</p>
              <div className="bg-white p-6 rounded-lg border-4 border-gray-100">
                <QRCodeSVG
                  id="patient-qr-code"
                  value={JSON.stringify({
                    cardNumber: registeredPatient.cardNumber,
                    cardType: registeredPatient.cardType,
                    name: `${registeredPatient.firstName} ${registeredPatient.lastName}`,
                    phone: registeredPatient.phone,
                    dateOfBirth: registeredPatient.dateOfBirth,
                    registrationDate: registeredPatient.registrationDate,
                    familyMembers: registeredPatient.familyMembers
                  })}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center max-w-md">
                Scan this QR code with your mobile device or hospital scanner to instantly access patient information, 
                book appointments, or assign doctors.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={downloadQRCode}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </Button>
              <Button
                onClick={printQRCode}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print QR Code
              </Button>
              <Button
                onClick={handleCloseAll}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
