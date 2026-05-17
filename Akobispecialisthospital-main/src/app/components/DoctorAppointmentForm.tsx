import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import {
  User,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  Stethoscope,
  CheckCircle,
  Search,
  AlertCircle,
  Save,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { searchPatients, type BackendPatient } from '../utils/api';

interface DoctorAppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onAppointmentBooked?: (appointment: BookedAppointmentData) => Promise<void> | void;
}

export interface BookedAppointmentData {
  id: string;
  backendPatientId?: number;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  chiefComplaint: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  doctorName: string;
  requiresImmediateRouting: boolean;
}

const getTodayDateString = () => {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

const createInitialFormData = () => ({
  // Patient Details
  patientCardNumber: '',
  patientName: '',
  patientPhone: '',
  patientEmail: '',

  // Doctor Details
  department: '',
  doctorName: '',
  specialization: '',
  roomNumber: '',

  // Date & Time
  appointmentDate: getTodayDateString(),
  appointmentTime: '',
  duration: '30',
  appointmentType: 'Consultation',

  // Reason for Visit
  chiefComplaint: '',
  symptoms: '',
  previousVisit: 'no',
  previousVisitDate: '',

  // Status Tracking
  status: 'Scheduled',
  priority: 'Normal',
  arrivalFlow: 'scheduled',

  // Payment & Insurance
  paymentMethod: 'Cash',
  insuranceProvider: '',
  insuranceNumber: '',
  policyNumber: '',
  consultationFee: '',

  // Notes & Follow-up
  specialInstructions: '',
  followUpRequired: 'no',
  followUpDate: '',
  additionalNotes: ''
});

export function DoctorAppointmentForm({ open, onClose, onAppointmentBooked }: DoctorAppointmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<BackendPatient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(true);
  const [patientSearchResults, setPatientSearchResults] = useState<BackendPatient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);

  const [formData, setFormData] = useState(createInitialFormData);

  const departments = [
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'General Medicine',
    'Surgery',
    'Gynecology',
    'ENT',
    'Ophthalmology'
  ];

  const doctors = [
    { name: 'Dr. John Smith', specialization: 'Cardiology', room: 'C-101' },
    { name: 'Dr. Sarah Johnson', specialization: 'Neurology', room: 'N-205' },
    { name: 'Dr. Michael Brown', specialization: 'Pediatrics', room: 'P-103' },
    { name: 'Dr. Emily Davis', specialization: 'Orthopedics', room: 'O-302' },
    { name: 'Dr. Robert Wilson', specialization: 'Dermatology', room: 'D-201' },
  ];

  const appointmentTypes = [
    'Consultation',
    'Follow-up',
    'Check-up',
    'Emergency',
    'Surgery',
    'Diagnostic',
    'Therapy'
  ];

  const insuranceProviders = [
    'NHIS',
    'Hygeia HMO',
    'Reliance HMO',
    'Total Health Trust',
    'MetroHealth HMO',
    'Other'
  ];

  const steps = [
    { id: 'patient', title: 'Patient Details', icon: User },
    { id: 'doctor', title: 'Doctor Details', icon: Stethoscope },
    { id: 'datetime', title: 'Date & Time', icon: Calendar },
    { id: 'reason', title: 'Reason for Visit', icon: FileText },
    { id: 'status', title: 'Status Tracking', icon: CheckCircle },
    { id: 'payment', title: 'Payment & Insurance', icon: CreditCard },
    { id: 'notes', title: 'Notes & Follow-up', icon: FileText },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientSearch = (query: string) => {
    setPatientSearchQuery(query);
  };

  const calculateAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) {
      return 0;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  useEffect(() => {
    if (!showPatientSearch || patientSearchQuery.trim().length < 2) {
      setPatientSearchResults([]);
      setIsSearchingPatients(false);
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingPatients(true);
      try {
        const patients = await searchPatients(patientSearchQuery);
        if (isActive) {
          setPatientSearchResults(patients);
        }
      } catch (error) {
        if (isActive) {
          setPatientSearchResults([]);
          toast.error(error instanceof Error ? error.message : 'Unable to search backend patients.');
        }
      } finally {
        if (isActive) {
          setIsSearchingPatients(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [patientSearchQuery, showPatientSearch]);

  const selectPatient = (patient: BackendPatient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientCardNumber: patient.patient_number,
      patientName: patient.full_name,
      patientPhone: patient.phone,
      patientEmail: patient.email || ''
    }));
    setShowPatientSearch(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.arrivalFlow === 'immediate' && !selectedPatient) {
      toast.error('Select an existing registered patient before sending them to Vital Signs immediately.');
      return;
    }

    // Generate appointment ID
    const appointmentId = `APT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    try {
      await onAppointmentBooked?.({
        id: appointmentId,
        backendPatientId: selectedPatient?.id,
        patientId: formData.patientCardNumber,
        patientName: formData.patientName,
        age: calculateAge(selectedPatient?.date_of_birth),
        gender: selectedPatient?.gender || 'Unknown',
        phone: formData.patientPhone,
        email: formData.patientEmail,
        chiefComplaint: formData.chiefComplaint,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        appointmentType: formData.appointmentType,
        doctorName: formData.doctorName,
        requiresImmediateRouting: formData.arrivalFlow === 'immediate',
      });

      toast.success(`Appointment ${appointmentId} booked successfully!`, {
        description:
          formData.arrivalFlow === 'immediate'
            ? `${formData.patientName} has been sent to the Vital Signs queue for ${formData.doctorName}`
            : `${formData.patientName} scheduled with ${formData.doctorName} on ${formData.appointmentDate} at ${formData.appointmentTime}`
      });

      onClose();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save this appointment right now.');
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setSelectedPatient(null);
    setShowPatientSearch(true);
    setPatientSearchQuery('');
    setFormData(createInitialFormData());
  };

  const filteredDoctors = formData.department
    ? doctors.filter(doc => doc.specialization === formData.department)
    : doctors;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Book Doctor's Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient with an available doctor
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                index === currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-1 text-center hidden sm:block ${
                index === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Patient Details */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-600">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Details
                </h3>
                <p className="text-sm text-blue-700">Search for an existing patient or enter new patient details</p>
              </div>

              {showPatientSearch ? (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="Search by name, card number, or phone..."
                        value={patientSearchQuery}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {patientSearchQuery && (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {isSearchingPatients ? (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                            Searching backend patients...
                          </div>
                        ) : patientSearchResults.length > 0 ? (
                          patientSearchResults.map((patient) => (
                            <div
                              key={patient.id}
                              onClick={() => selectPatient(patient)}
                              className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{patient.full_name}</p>
                                  <p className="text-sm text-gray-600">Card: {patient.patient_number}</p>
                                  <p className="text-xs text-gray-500">{patient.phone}</p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No backend patients found</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2"
                              onClick={() => setShowPatientSearch(false)}
                            >
                              Enter Manually
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {selectedPatient && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-900">{selectedPatient.name}</p>
                            <p className="text-sm text-green-700">Card: {selectedPatient.cardNumber}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(null);
                              setShowPatientSearch(true);
                              setFormData(prev => ({
                                ...prev,
                                patientCardNumber: '',
                                patientName: '',
                                patientPhone: '',
                                patientEmail: ''
                              }));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Patient Card Number *</Label>
                        <Input
                          value={formData.patientCardNumber}
                          onChange={(e) => handleInputChange('patientCardNumber', e.target.value)}
                          placeholder="P-2026-0001"
                          required
                          disabled={!!selectedPatient}
                        />
                      </div>
                      <div>
                        <Label>Patient Name *</Label>
                        <Input
                          value={formData.patientName}
                          onChange={(e) => handleInputChange('patientName', e.target.value)}
                          placeholder="John Doe"
                          required
                          disabled={!!selectedPatient}
                        />
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          value={formData.patientPhone}
                          onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                          placeholder="+234 801 234 5678"
                          required
                          disabled={!!selectedPatient}
                        />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          value={formData.patientEmail}
                          onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                          placeholder="patient@example.com"
                          disabled={!!selectedPatient}
                        />
                      </div>
                    </div>

                    {!selectedPatient && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPatientSearch(true)}
                        className="w-full"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search Existing Patients
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Doctor Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-600">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Doctor Details
                </h3>
                <p className="text-sm text-purple-700">Select the department and doctor for this appointment</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Department *</Label>
                      <select
                        value={formData.department}
                        onChange={(e) => {
                          handleInputChange('department', e.target.value);
                          handleInputChange('doctorName', '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Doctor Name *</Label>
                      <select
                        value={formData.doctorName}
                        onChange={(e) => {
                          const doctor = filteredDoctors.find(d => d.name === e.target.value);
                          handleInputChange('doctorName', e.target.value);
                          if (doctor) {
                            handleInputChange('specialization', doctor.specialization);
                            handleInputChange('roomNumber', doctor.room);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!formData.department}
                      >
                        <option value="">Select Doctor</option>
                        {filteredDoctors.map((doctor) => (
                          <option key={doctor.name} value={doctor.name}>{doctor.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Specialization</Label>
                      <Input
                        value={formData.specialization}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Room Number</Label>
                      <Input
                        value={formData.roomNumber}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-600">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date & Time
                </h3>
                <p className="text-sm text-green-700">Schedule the appointment date and time</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Appointment Date *</Label>
                      <Input
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <Label>Appointment Time *</Label>
                      <Input
                        type="time"
                        value={formData.appointmentTime}
                        onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes) *</Label>
                      <select
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <Label>Appointment Type *</Label>
                      <select
                        value={formData.appointmentType}
                        onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {appointmentTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Reason for Visit */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-l-4 border-orange-600">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Reason for Visit
                </h3>
                <p className="text-sm text-orange-700">Describe the patient's condition and reason for appointment</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Chief Complaint *</Label>
                    <Input
                      value={formData.chiefComplaint}
                      onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                      placeholder="e.g., Chest pain, Headache, Fever"
                      required
                    />
                  </div>
                  <div>
                    <Label>Symptoms Description *</Label>
                    <Textarea
                      value={formData.symptoms}
                      onChange={(e) => handleInputChange('symptoms', e.target.value)}
                      placeholder="Describe the symptoms in detail..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Previous Visit for Same Issue?</Label>
                      <select
                        value={formData.previousVisit}
                        onChange={(e) => handleInputChange('previousVisit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {formData.previousVisit === 'yes' && (
                      <div>
                        <Label>Previous Visit Date</Label>
                        <Input
                          type="date"
                          value={formData.previousVisitDate}
                          onChange={(e) => handleInputChange('previousVisitDate', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Status Tracking */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-600">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Status Tracking
                </h3>
                <p className="text-sm text-blue-700">Set the appointment status and priority level</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Appointment Status *</Label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Rescheduled">Rescheduled</option>
                      </select>
                    </div>
                      <div>
                        <Label>Priority Level *</Label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                      </div>
                    </div>

                    <div>
                      <Label>Patient Arrival Flow *</Label>
                      <select
                        value={formData.arrivalFlow}
                        onChange={(e) => handleInputChange('arrivalFlow', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="scheduled">Book for later appointment</option>
                        <option value="immediate">Patient is here now, send to Vital Signs</option>
                      </select>
                      <p className="mt-2 text-xs text-gray-500">
                        Choose `Patient is here now` to send the patient straight into the `Vital Signs` queue immediately after booking.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className={`font-semibold mt-1 ${
                          formData.status === 'Scheduled' ? 'text-blue-600' :
                          formData.status === 'Confirmed' ? 'text-green-600' :
                          formData.status === 'Pending' ? 'text-yellow-600' :
                          'text-orange-600'
                        }`}>
                          {formData.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Priority</p>
                        <p className={`font-semibold mt-1 ${
                          formData.priority === 'Normal' ? 'text-gray-600' :
                          formData.priority === 'High' ? 'text-orange-600' :
                          formData.priority === 'Urgent' ? 'text-red-600' :
                          'text-red-700'
                        }`}>
                          {formData.priority}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Arrival Flow</p>
                        <p className={`font-semibold mt-1 ${
                          formData.arrivalFlow === 'immediate' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {formData.arrivalFlow === 'immediate' ? 'Send to Vital Signs Now' : 'Scheduled for Later'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 6: Payment & Insurance */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border-l-4 border-indigo-600">
                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment & Insurance
                </h3>
                <p className="text-sm text-indigo-700">Configure payment method and insurance details</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Method *</Label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Insurance">Insurance/HMO</option>
                      </select>
                    </div>
                    <div>
                      <Label>Consultation Fee *</Label>
                      <Input
                        type="number"
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                        placeholder="₦5,000"
                        required
                      />
                    </div>
                  </div>

                  {formData.paymentMethod === 'Insurance' && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-900">Insurance Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Insurance Provider *</Label>
                          <select
                            value={formData.insuranceProvider}
                            onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Provider</option>
                            {insuranceProviders.map((provider) => (
                              <option key={provider} value={provider}>{provider}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Insurance Number *</Label>
                          <Input
                            value={formData.insuranceNumber}
                            onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                            placeholder="INS-123456789"
                            required
                          />
                        </div>
                        <div>
                          <Label>Policy Number *</Label>
                          <Input
                            value={formData.policyNumber}
                            onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                            placeholder="POL-987654321"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 7: Notes & Follow-up */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border-l-4 border-teal-600">
                <h3 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes & Follow-up
                </h3>
                <p className="text-sm text-teal-700">Add special instructions and follow-up requirements</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Special Instructions</Label>
                    <Textarea
                      value={formData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      placeholder="Any special instructions for the doctor or patient..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Follow-up Required?</Label>
                      <select
                        value={formData.followUpRequired}
                        onChange={(e) => handleInputChange('followUpRequired', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {formData.followUpRequired === 'yes' && (
                      <div>
                        <Label>Follow-up Date</Label>
                        <Input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      placeholder="Any additional notes or comments..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary Preview */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Appointment Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-blue-600">Patient</p>
                      <p className="font-medium text-blue-900">{formData.patientName || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Doctor</p>
                      <p className="font-medium text-blue-900">{formData.doctorName || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Date & Time</p>
                      <p className="font-medium text-blue-900">
                        {formData.appointmentDate && formData.appointmentTime
                          ? `${formData.appointmentDate} at ${formData.appointmentTime}`
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Type</p>
                      <p className="font-medium text-blue-900">{formData.appointmentType}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Status</p>
                      <p className="font-medium text-blue-900">{formData.status}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Payment</p>
                      <p className="font-medium text-blue-900">
                        {formData.paymentMethod} {formData.consultationFee && `- ₦${formData.consultationFee}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
