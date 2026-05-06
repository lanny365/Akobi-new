import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Plus, Search, Filter, Info, Calendar, Clock, QrCode, Scan, Activity, ArrowRight, Send, UserCircle, Phone, Mail, MapPin, AlertTriangle, Wallet, CheckCircle2 } from 'lucide-react';
import { PatientRegistrationForm } from './PatientRegistrationForm';
import { PatientCardPreview } from './PatientCardPreview';
import { QRScanner } from './QRScanner';
import { FaceRecognition } from './FaceRecognition';
import { DoctorAppointmentForm, type BookedAppointmentData } from './DoctorAppointmentForm';
import { PatientMedLedger } from './PatientMedLedger';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { useEmergency } from '../context/EmergencyContext';
import { useVitalSigns } from '../context/VitalSignsContext';
import { createVisit, resolveDepartmentId, searchPatients } from '../utils/api';

export function PatientManagement() {
  const { addEmergencyPatient } = useEmergency();
  const { addToVitalSignsQueue, refreshQueue } = useVitalSigns();
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [showCardInfo, setShowCardInfo] = useState(true);
  const [activeView, setActiveView] = useState<'register' | 'book-appointment' | 'route-to-vital' | 'view-availability' | 'qr-scanner' | 'face-recognition' | 'emergency-alert' | 'medledger'>('register');
  const [routingQueue, setRoutingQueue] = useState<any[]>([]);
  const [emergencyAlertOpen, setEmergencyAlertOpen] = useState(false);
  const [emergencyPatientData, setEmergencyPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    emergencyType: '',
    severity: 'critical' as 'critical' | 'severe' | 'moderate',
    chiefComplaint: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
  });
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [alertAllDoctors, setAlertAllDoctors] = useState(true);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  // Available doctors database
  const availableDoctors = [
    {
      id: 'DOC-001',
      name: 'Dr. Sarah Williams',
      specialty: 'Cardiology',
      status: 'available',
      currentPatients: 3,
      maxPatients: 10,
      photo: null,
    },
    {
      id: 'DOC-002',
      name: 'Dr. Michael Chen',
      specialty: 'Emergency Medicine',
      status: 'available',
      currentPatients: 2,
      maxPatients: 8,
      photo: null,
    },
    {
      id: 'DOC-003',
      name: 'Dr. Amaka Okonkwo',
      specialty: 'General Practice',
      status: 'available',
      currentPatients: 5,
      maxPatients: 12,
      photo: null,
    },
    {
      id: 'DOC-004',
      name: 'Dr. James Anderson',
      specialty: 'Neurology',
      status: 'busy',
      currentPatients: 8,
      maxPatients: 10,
      photo: null,
    },
    {
      id: 'DOC-005',
      name: 'Dr. Fatima Ibrahim',
      specialty: 'Cardiology',
      status: 'available',
      currentPatients: 4,
      maxPatients: 10,
      photo: null,
    },
    {
      id: 'DOC-006',
      name: 'Dr. David Okonjo',
      specialty: 'Orthopedics',
      status: 'available',
      currentPatients: 2,
      maxPatients: 8,
      photo: null,
    },
    {
      id: 'DOC-007',
      name: 'Dr. Grace Eze',
      specialty: 'Pediatrics',
      status: 'busy',
      currentPatients: 6,
      maxPatients: 8,
      photo: null,
    },
    {
      id: 'DOC-008',
      name: 'Dr. Peter Adebayo',
      specialty: 'Emergency Medicine',
      status: 'available',
      currentPatients: 1,
      maxPatients: 8,
      photo: null,
    },
    {
      id: 'DOC-009',
      name: 'Dr. Aisha Bello',
      specialty: 'Internal Medicine',
      status: 'available',
      currentPatients: 3,
      maxPatients: 10,
      photo: null,
    },
    {
      id: 'DOC-010',
      name: 'Dr. Emmanuel Nwosu',
      specialty: 'Surgery',
      status: 'in-surgery',
      currentPatients: 1,
      maxPatients: 6,
      photo: null,
    },
  ];

  const specialties = ['all', 'Emergency Medicine', 'Cardiology', 'General Practice', 'Neurology', 'Orthopedics', 'Pediatrics', 'Internal Medicine', 'Surgery'];

  // Filter doctors based on search and specialty
  const filteredDoctors = availableDoctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'all' || doctor.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  const handlePatientRegistered = (patient: any) => {
    void refreshQueue();
    toast.success(`${patient.name} has been sent to the Vital Signs queue in the backend`);
    setActiveView('route-to-vital');
  };

  const handleAppointmentBooked = async (appointment: BookedAppointmentData) => {
    if (!appointment.requiresImmediateRouting || !appointment.backendPatientId) {
      return;
    }

    const visit = await createVisit({
      patient_id: appointment.backendPatientId,
      department_id: await resolveDepartmentId('general'),
      chief_complaint: appointment.chiefComplaint || `${appointment.appointmentType} appointment`,
      reason_to_see_doctor: 'Consultation',
      consultation_type: appointment.appointmentType || 'Consultation',
    });

    addToVitalSignsQueue({
      id: String(visit.id),
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      age: appointment.age,
      gender: appointment.gender,
      assignedDoctor: appointment.doctorName || 'Doctor not assigned',
      appointmentTime: appointment.appointmentTime || 'Walk-in',
      chiefComplaint: visit.chief_complaint,
      reasonToSeeDoctor: 'Consultation',
      consultationType: visit.consultation_type || appointment.appointmentType || 'Consultation',
      status: 'pending',
      routedFrom: 'Reception Appointment',
      routedBy: 'Reception Staff',
      routedAt: visit.queued_at || new Date().toISOString(),
    });

    setRoutingQueue((prev) =>
      prev.filter((patient) => patient.backendPatientId !== appointment.backendPatientId),
    );
    setActiveView('route-to-vital');
    await refreshQueue();
  };

  const handleToggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctors(prev => 
      prev.includes(doctorId) 
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const handleSelectAllAvailableDoctors = () => {
    const availableDoctorIds = availableDoctors
      .filter(d => d.status === 'available')
      .map(d => d.id);
    setSelectedDoctors(availableDoctorIds);
  };

  const handleEmergencyAlert = () => {
    // Validate emergency form
    if (!emergencyPatientData.name || !emergencyPatientData.age || !emergencyPatientData.phone || 
        !emergencyPatientData.emergencyType || !emergencyPatientData.chiefComplaint) {
      toast.error('Please fill in all required emergency patient details');
      return;
    }

    // Validate doctor selection
    if (!alertAllDoctors && selectedDoctors.length === 0) {
      toast.error('Please select at least one doctor to alert');
      return;
    }

    // Get alerted doctors
    const alertedDoctors = alertAllDoctors 
      ? availableDoctors
      : availableDoctors.filter(d => selectedDoctors.includes(d.id));

    // In real application, this would send alert to selected doctors
    const doctorNames = alertedDoctors.map(d => d.name).join(', ');
    const alertMessage = alertAllDoctors
      ? `🚨 EMERGENCY ALERT sent to ALL active doctors (${alertedDoctors.length} doctors)!`
      : `🚨 EMERGENCY ALERT sent to: ${doctorNames}`;

    toast.success(alertMessage, {
      duration: 5000,
    });

    // Show success message
    toast.info(`Emergency patient ${emergencyPatientData.name} registered and alerted`, {
      duration: 4000,
    });

    // Close form and reset
    setEmergencyAlertOpen(false);
    setEmergencyPatientData({
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      emergencyType: '',
      severity: 'critical',
      chiefComplaint: '',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
    });
    setSelectedDoctors([]);
    setAlertAllDoctors(true);
    setDoctorSearchQuery('');
    setSpecialtyFilter('all');

    // Add emergency patient to context
    addEmergencyPatient(emergencyPatientData);
  };

  const stats = [
    { label: 'Total Patients', value: '2,847', color: 'bg-blue-500' },
    { label: 'New Today', value: '23', color: 'bg-green-500' },
    { label: 'Active Cases', value: '156', color: 'bg-orange-500' },
    { label: 'Discharged', value: '2,691', color: 'bg-purple-500' },
  ];

  const menuItems = [
    { id: 'register' as const, label: 'Register New Patient', icon: Plus },
    { id: 'medledger' as const, label: 'Medledger', icon: Wallet },
    { id: 'route-to-vital' as const, label: 'Route to Vital Signs', icon: Activity },
    { id: 'book-appointment' as const, label: 'Book Doctor\'s Appointment', icon: Calendar },
    { id: 'view-availability' as const, label: 'View Doctor Availability', icon: Clock },
    { id: 'qr-scanner' as const, label: 'QR Code Scanner', icon: QrCode },
    { id: 'face-recognition' as const, label: 'Face Recognition', icon: Scan },
    { id: 'emergency-alert' as const, label: 'Emergency Alert', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Registration Form Modal */}
      <PatientRegistrationForm
        open={registrationFormOpen}
        onClose={() => setRegistrationFormOpen(false)}
        onPatientRegistered={handlePatientRegistered}
      />

      {/* Doctor Appointment Form Modal */}
      <DoctorAppointmentForm
        open={appointmentFormOpen}
        onClose={() => setAppointmentFormOpen(false)}
        onAppointmentBooked={handleAppointmentBooked}
      />

      {/* Card Type Information */}
      {showCardInfo && activeView === 'register' && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Patient Card Types</h3>
              </div>
              <button
                onClick={() => setShowCardInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AKOBI SPECIALIST HOSPITAL offers two types of patient cards. Choose the appropriate card type during registration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PatientCardPreview type="personal" />
              <PatientCardPreview type="family" />
            </div>
          </CardContent>
        </Card>
      )}

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
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patient Management Card with Dropdown Navigation */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-2xl">Patient Management</CardTitle>
              </div>
              <p className="text-sm text-gray-600">
                Manage patient records, registrations, appointments, and doctor assignments
              </p>
            </div>
          </div>
          
          {/* Dropdown Navigation Menu */}
          <div className="mt-4 flex flex-wrap gap-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => {
                  if (item.id === 'register') {
                    setRegistrationFormOpen(true);
                  } else if (item.id === 'book-appointment') {
                    setAppointmentFormOpen(true);
                    setActiveView(item.id);
                  } else if (item.id === 'emergency-alert') {
                    setEmergencyAlertOpen(true);
                  } else {
                    setActiveView(item.id);
                  }
                }}
                variant={activeView === item.id ? 'default' : 'outline'}
                className={activeView === item.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'register' && <RegisterPatientView />}
          {activeView === 'medledger' && <PatientMedLedger />}
          {activeView === 'book-appointment' && <BookAppointmentView />}
          {activeView === 'route-to-vital' && <RouteToVitalView routingQueue={routingQueue} setRoutingQueue={setRoutingQueue} />}
          {activeView === 'view-availability' && <ViewAvailabilityView />}
          {activeView === 'qr-scanner' && <QRScannerView />}
          {activeView === 'face-recognition' && <FaceRecognitionView />}
        </CardContent>
      </Card>

      {/* Emergency Alert Form */}
      <Dialog open={emergencyAlertOpen} onOpenChange={setEmergencyAlertOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-800 bg-clip-text text-transparent">
              Emergency Alert
            </DialogTitle>
            <DialogDescription>
              Register and alert emergency patients to all active doctors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Information */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-blue-900">
                  Patient Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Name
                    </label>
                    <Input
                      value={emergencyPatientData.name}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, name: e.target.value })}
                      placeholder="Patient's full name..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Age
                    </label>
                    <Input
                      value={emergencyPatientData.age}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, age: e.target.value })}
                      placeholder="Patient's age..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Gender
                    </label>
                    <select
                      value={emergencyPatientData.gender}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, gender: e.target.value as 'Male' | 'Female' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Phone Number
                    </label>
                    <Input
                      value={emergencyPatientData.phone}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, phone: e.target.value })}
                      placeholder="Patient's phone number..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Emergency Type
                    </label>
                    <select
                      value={emergencyPatientData.emergencyType}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, emergencyType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select emergency type...</option>
                      <option value="Cardiac">Cardiac</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Neurological">Neurological</option>
                      <option value="Traumatic">Traumatic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Severity
                    </label>
                    <select
                      value={emergencyPatientData.severity}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, severity: e.target.value as 'critical' | 'severe' | 'moderate' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="critical">Critical</option>
                      <option value="severe">Severe</option>
                      <option value="moderate">Moderate</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Chief Complaint
                    </label>
                    <Input
                      value={emergencyPatientData.chiefComplaint}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, chiefComplaint: e.target.value })}
                      placeholder="Patient's chief complaint..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Blood Pressure
                    </label>
                    <Input
                      value={emergencyPatientData.bloodPressure}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, bloodPressure: e.target.value })}
                      placeholder="Patient's blood pressure..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Heart Rate
                    </label>
                    <Input
                      value={emergencyPatientData.heartRate}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, heartRate: e.target.value })}
                      placeholder="Patient's heart rate..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Temperature
                    </label>
                    <Input
                      value={emergencyPatientData.temperature}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, temperature: e.target.value })}
                      placeholder="Patient's temperature..."
                      className="text-base py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Oxygen Saturation
                    </label>
                    <Input
                      value={emergencyPatientData.oxygenSaturation}
                      onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, oxygenSaturation: e.target.value })}
                      placeholder="Patient's oxygen saturation..."
                      className="text-base py-6"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Selection */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mt-4">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-blue-900">
                  Select Doctors to Alert
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertAllDoctors}
                      onChange={() => setAlertAllDoctors(!alertAllDoctors)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-semibold">
                      Alert All Available Doctors
                    </label>
                  </div>
                  {!alertAllDoctors && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedDoctors.length === availableDoctors.filter(d => d.status === 'available').length}
                          onChange={handleSelectAllAvailableDoctors}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-semibold">
                          Select All Available Doctors
                        </label>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Search doctors by name or specialty..."
                          className="pl-11 text-base py-6"
                          value={doctorSearchQuery}
                          onChange={(e) => setDoctorSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={specialtyFilter}
                          onChange={(e) => setSpecialtyFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          {specialties.map(specialty => (
                            <option key={specialty} value={specialty}>
                              {specialty}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredDoctors.map((doctor) => {
                          const getStatusBadge = () => {
                            switch (doctor.status) {
                              case 'available':
                                return <Badge className="bg-green-100 text-green-800 text-xs">Available</Badge>;
                              case 'busy':
                                return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Busy</Badge>;
                              case 'in-surgery':
                                return <Badge className="bg-red-100 text-red-800 text-xs">In Surgery</Badge>;
                              default:
                                return <Badge className="bg-gray-100 text-gray-800 text-xs">Offline</Badge>;
                            }
                          };

                          return (
                            <div
                              key={doctor.id}
                              className={`flex items-center gap-3 p-3 bg-white rounded-lg border-2 transition-all ${
                                selectedDoctors.includes(doctor.id) 
                                  ? 'border-blue-500 shadow-md' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                                {doctor.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm">{doctor.name}</p>
                                  {getStatusBadge()}
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{doctor.specialty}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>Patients: {doctor.currentPatients}/{doctor.maxPatients}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        (doctor.currentPatients / doctor.maxPatients) > 0.8 ? 'bg-red-500' :
                                        (doctor.currentPatients / doctor.maxPatients) > 0.5 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${(doctor.currentPatients / doctor.maxPatients) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedDoctors.includes(doctor.id)}
                                onChange={() => handleToggleDoctorSelection(doctor.id)}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleEmergencyAlert}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white py-6 text-base"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Emergency Alert
              </Button>
              <Button
                onClick={() => setEmergencyAlertOpen(false)}
                variant="outline"
                className="px-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Register Patient View
function RegisterPatientView() {
  return (
    <div>
      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patients by name, ID, or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Patient List Placeholder */}
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Patient Management System</h3>
        <p className="text-sm text-gray-500">
          Register and manage patient records, appointments, and medical history
        </p>
      </div>
    </div>
  );
}

// Book Appointment View (placeholder for now, will be implemented)
function BookAppointmentView() {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <Calendar className="w-16 h-16 text-blue-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">Book Doctor's Appointment</h3>
      <p className="text-sm text-gray-500">
        Use the appointment form to schedule patients for later or mark patients already on ground so they enter the actual `Vital Signs` queue immediately.
      </p>
    </div>
  );
}

// Route to Vital Signs View
type RoutingPatient = {
  id: string;
  backendPatientId: number;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  chiefComplaint: string;
  status: 'waiting' | 'in-vitals' | 'routed';
  registrationTime: string;
  routeSource?: 'search' | 'appointment';
  preferredConsultationType?: string;
  assignedDoctorName?: string;
};

function RouteToVitalView({ routingQueue, setRoutingQueue }: { routingQueue: RoutingPatient[], setRoutingQueue: Dispatch<SetStateAction<RoutingPatient[]>> }) {
  const { refreshQueue, vitalSignsQueue, isLoading } = useVitalSigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RoutingPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [routeNotes, setRouteNotes] = useState('');
  const [patientReasons, setPatientReasons] = useState<Record<string, 'Consultation' | 'Treatment'>>({});
  const [consultationTypes, setConsultationTypes] = useState<Record<string, string>>({});
  const [treatmentTypes, setTreatmentTypes] = useState<Record<string, string>>({});
  const [savingPatientIds, setSavingPatientIds] = useState<string[]>([]);

  const consultationOptions = [
    'General Consultation',
    'Follow-up Consultation',
    'Specialist Consultation',
    'Pre-operative Consultation',
    'Post-operative Consultation',
    'Emergency Consultation',
    'Pediatric Consultation',
    'Geriatric Consultation',
    'Antenatal Consultation',
    'Postnatal Consultation',
    'Psychiatric Consultation',
    'Nutritional Consultation',
  ];

  const treatmentOptions = [
    'Wound Dressing',
    'Injection Administration',
    'IV Therapy',
    'Nebulization',
    'Catheterization',
    'Suture Removal',
    'Blood Draw/Sampling',
    'ECG Monitoring',
    'Oxygen Therapy',
    'Physiotherapy Session',
    'Minor Procedure',
    'Pain Management',
    'Medication Administration',
    'Dialysis',
  ];

  const calculateAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) {
      return 0;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge -= 1;
    }

    return calculatedAge;
  };

  const formatRegistrationTime = (dateValue?: string | null) => {
    if (!dateValue) {
      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    return new Date(dateValue).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mapPatientToRoutingPatient = (patient: any): RoutingPatient => ({
    id: patient.patient_number,
    backendPatientId: patient.id,
    patientId: patient.patient_number,
    name: patient.full_name,
    age: calculateAge(patient.date_of_birth),
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email || '',
    chiefComplaint: 'Awaiting consultation at reception',
    status: 'waiting',
    registrationTime: formatRegistrationTime(patient.created_at),
    routeSource: 'search',
  });

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const patients = await searchPatients(searchQuery);
        if (isActive) {
          setSearchResults(patients.map(mapPatientToRoutingPatient));
        }
      } catch (error) {
        if (isActive) {
          setSearchResults([]);
          toast.error(error instanceof Error ? error.message : 'Unable to search backend patients.');
        }
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const availableSearchResults = searchResults.filter(
    (patient) => !routingQueue.find((queuedPatient) => queuedPatient.backendPatientId === patient.backendPatientId),
  );

  const handleAddToQueue = (patient: RoutingPatient) => {
    if (routingQueue.find((queuedPatient) => queuedPatient.backendPatientId === patient.backendPatientId)) {
      toast.error('Patient already in queue');
      return;
    }

    setRoutingQueue((prev) => [...prev, patient]);
    toast.success(`${patient.name} added to routing queue`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveFromQueue = (patientId: string) => {
    setRoutingQueue(routingQueue.filter((patient) => patient.id !== patientId));
    toast.info('Patient removed from queue');
  };

  const handleRouteAll = () => {
    if (routingQueue.length === 0) {
      toast.error('No patients in queue');
      return;
    }

    const initialReasons: Record<string, 'Consultation' | 'Treatment'> = {};
    const initialConsultations: Record<string, string> = {};
    const initialTreatments: Record<string, string> = {};

    routingQueue.forEach((patient) => {
      initialReasons[patient.id] = 'Consultation';
      initialConsultations[patient.id] = patient.preferredConsultationType || 'General Consultation';
      initialTreatments[patient.id] = '';
    });

    setPatientReasons(initialReasons);
    setConsultationTypes(initialConsultations);
    setTreatmentTypes(initialTreatments);
    setIsRouteDialogOpen(true);
  };

  const handleReasonChange = (patientId: string, reason: 'Consultation' | 'Treatment') => {
    setPatientReasons((prev) => ({
      ...prev,
      [patientId]: reason,
    }));

    if (reason === 'Consultation') {
      setConsultationTypes((prev) => ({
        ...prev,
        [patientId]: 'General Consultation',
      }));
      setTreatmentTypes((prev) => ({
        ...prev,
        [patientId]: '',
      }));
    } else {
      setTreatmentTypes((prev) => ({
        ...prev,
        [patientId]: treatmentOptions[0],
      }));
      setConsultationTypes((prev) => ({
        ...prev,
        [patientId]: '',
      }));
    }
  };

  const handleConsultationTypeChange = (patientId: string, consultationType: string) => {
    setConsultationTypes((prev) => ({
      ...prev,
      [patientId]: consultationType,
    }));
  };

  const handleTreatmentTypeChange = (patientId: string, treatmentType: string) => {
    setTreatmentTypes((prev) => ({
      ...prev,
      [patientId]: treatmentType,
    }));
  };

  const queuePatientInBackend = async (patient: RoutingPatient) => {
    const reason = patientReasons[patient.id] || 'Consultation';

    setSavingPatientIds((prev) => [...prev, patient.id]);

    try {
      await createVisit({
        patient_id: patient.backendPatientId,
        department_id: await resolveDepartmentId('general'),
        chief_complaint: patient.chiefComplaint,
        reason_to_see_doctor: reason,
        consultation_type: reason === 'Consultation'
          ? (consultationTypes[patient.id] || 'General Consultation')
          : undefined,
        treatment_type: reason === 'Treatment'
          ? (treatmentTypes[patient.id] || treatmentOptions[0])
          : undefined,
      });

      setRoutingQueue((prev) => prev.filter((queuedPatient) => queuedPatient.id !== patient.id));
      await refreshQueue();
      toast.success(`${patient.name} saved to Vital Signs & Injection Unit`);
    } finally {
      setSavingPatientIds((prev) => prev.filter((id) => id !== patient.id));
    }
  };

  const handleSaveIndividualPatient = async (patient: RoutingPatient) => {
    try {
      await queuePatientInBackend(patient);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to route patient to the backend queue.');
    }
  };

  const handleConfirmRouteAll = async () => {
    const results = await Promise.allSettled(routingQueue.map((patient) => queuePatientInBackend(patient)));
    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(`${successCount} patient(s) routed to Vital Signs & Injection Unit`);
    }

    if (failureCount > 0) {
      toast.error(`${failureCount} patient(s) could not be routed. Please retry them individually.`);
    }

    setIsRouteDialogOpen(false);
    setRouteNotes('');
    setPatientReasons({});
    setConsultationTypes({});
    setTreatmentTypes({});
  };

  const routedTodayCount = vitalSignsQueue.filter((patient) => {
    if (!patient.routedAt) {
      return false;
    }

    return new Date(patient.routedAt).toDateString() === new Date().toDateString();
  }).length;
  const inVitalsCount = vitalSignsQueue.filter((patient) => patient.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-1">Route Patients to Vital Signs & Injection Unit</h3>
            <p className="text-xs text-red-700">
              Search for patients by card number, name, or phone number. Patients booked as `coming immediately` from appointments are sent straight to the Vital Signs queue and will also be shown below.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Queue</p>
                <p className="text-3xl font-bold mt-1">{routingQueue.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Vitals Unit</p>
                <p className="text-3xl font-bold mt-1">{inVitalsCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Routed Today</p>
                <p className="text-3xl font-bold mt-1">{routedTodayCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Patient */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Search Patient by Card Number, Name, or Phone Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Type patient card number (e.g., PT-2026-0001), name, or phone number..."
                  className="pl-11 text-base py-6"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Type at least 2 characters to search. Works with both new and existing patients.
              </p>
            </div>

            {/* Search Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-4">
                {isSearching ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                    Searching backend patients...
                  </div>
                ) : availableSearchResults.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Found {availableSearchResults.length} patient(s)
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {availableSearchResults.map((patient) => (
                        <Card
                          key={patient.id}
                          className="hover:shadow-md transition-shadow border-l-4 border-blue-500"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <UserCircle className="w-10 h-10 text-blue-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {patient.name}
                                  </h3>
                                  <p className="text-sm text-blue-600 font-medium">
                                    Card: {patient.patientId}
                                  </p>
                                  {patient.routeSource === 'appointment' && (
                                    <p className="mt-1 text-xs font-medium text-purple-600">
                                      Immediate doctor appointment for {patient.assignedDoctorName}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <UserCircle className="w-3 h-3" />
                                      {patient.age}y, {patient.gender}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {patient.phone}
                                    </div>
                                  </div>
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                    <span className="font-semibold text-gray-700">Chief Complaint:</span>
                                    <p className="text-gray-600 mt-0.5">{patient.chiefComplaint}</p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleAddToQueue(patient)}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white whitespace-nowrap"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Queue
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No patients found matching "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching by card number, patient name, or phone number
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Routing Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                Routing Queue ({routingQueue.length})
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Patients ready to be routed to Vital Signs & Injection Unit
              </p>
            </div>
            {routingQueue.length > 0 && (
              <Button
                onClick={handleRouteAll}
                className="bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Route All ({routingQueue.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {routingQueue.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {routingQueue.map((patient, index) => (
                <Card
                  key={patient.id}
                  className="border-l-4 border-red-500 bg-red-50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-xs text-red-600 font-medium">{patient.patientId}</p>
                          {patient.routeSource === 'appointment' && (
                            <p className="mt-1 text-xs font-medium text-purple-700">
                              Booked appointment for {patient.assignedDoctorName}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveFromQueue(patient.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-100"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <UserCircle className="w-3 h-3" />
                          {patient.age}y, {patient.gender}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded text-xs">
                        <span className="font-semibold text-gray-700">Chief Complaint:</span>
                        <p className="text-gray-600 mt-1">{patient.chiefComplaint}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Queue is Empty</h3>
              <p className="text-sm text-gray-500">
                Search for patients above and add them to the queue. Patients already sent to Vital Signs are listed below.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Already in Vital Signs ({vitalSignsQueue.length})
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Patients already received inside the Vital Signs & Injection Unit
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Loading patients already sent to Vital Signs...
            </div>
          ) : vitalSignsQueue.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vitalSignsQueue.map((patient) => (
                <Card
                  key={patient.id}
                  className="border-l-4 border-blue-500 bg-blue-50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{patient.patientName}</h3>
                        <p className="text-xs text-blue-600 font-medium">{patient.patientId}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                          <Badge className="bg-blue-600 text-white">
                            {patient.status === 'sent-to-doctor' ? 'Sent to Doctor' : patient.status === 'completed' ? 'Vitals Recorded' : 'Pending in Vital Signs'}
                          </Badge>
                          {patient.consultationType && (
                            <Badge className="bg-white text-blue-700 border border-blue-200">
                              {patient.consultationType}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <UserCircle className="w-3 h-3" />
                            {patient.age}y, {patient.gender}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {patient.appointmentTime}
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded text-xs">
                          <span className="font-semibold text-gray-700">Chief Complaint:</span>
                          <p className="text-gray-600 mt-1">{patient.chiefComplaint}</p>
                        </div>
                        <p className="mt-2 text-xs text-blue-700">
                          Assigned Doctor: {patient.assignedDoctor}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Patients in Vital Signs Yet</h3>
              <p className="text-sm text-gray-500">
                Immediate appointments and routed patients will appear here after they enter the Vital Signs queue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Confirmation Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-800 bg-clip-text text-transparent">
              Route Patients to Vital Signs & Injection Unit
            </DialogTitle>
            <DialogDescription>
              Confirm routing {routingQueue.length} patient(s) to the Vital Signs & Injection Unit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-blue-900">
                  Patients to be Routed ({routingQueue.length})
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {routingQueue.map((patient, index) => (
                    <div
                      key={patient.id}
                      className="flex items-start gap-3 p-3 bg-white rounded border border-gray-200"
                    >
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="font-semibold text-sm">{patient.name}</p>
                          <p className="text-xs text-gray-600">{patient.patientId}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 block">
                              Reason to See Doctor
                            </label>
                            <select
                              value={patientReasons[patient.id] || 'Consultation'}
                              onChange={(e) => handleReasonChange(patient.id, e.target.value as 'Consultation' | 'Treatment')}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Consultation">Consultation</option>
                              <option value="Treatment">Treatment</option>
                            </select>
                          </div>

                          {/* Consultation Type Dropdown */}
                          {patientReasons[patient.id] === 'Consultation' && (
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-700 block">
                                Consultation Type
                              </label>
                              <select
                                value={consultationTypes[patient.id] || 'General Consultation'}
                                onChange={(e) => handleConsultationTypeChange(patient.id, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                              >
                                {consultationOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Treatment Type Dropdown */}
                          {patientReasons[patient.id] === 'Treatment' && (
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-700 block">
                                Treatment Type
                              </label>
                              <select
                                value={treatmentTypes[patient.id] || treatmentOptions[0]}
                                onChange={(e) => handleTreatmentTypeChange(patient.id, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                              >
                                {treatmentOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {/* Save Button */}
                        <Button
                          onClick={() => handleSaveIndividualPatient(patient)}
                          disabled={savingPatientIds.includes(patient.id)}
                          className="w-full mt-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xs"
                          size="sm"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {savingPatientIds.includes(patient.id) ? 'Saving...' : 'Save to Vital Signs'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Routing Instructions */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Routing Instructions
              </h4>
              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                <li>All patients will be sent to the Vital Signs & Injection Unit queue</li>
                <li>Nurses will record vital signs and administer injections if needed</li>
                <li>After vitals, nurses will route patients to the assigned doctors</li>
              </ul>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Notes for Nursing Staff (Optional)
              </label>
              <textarea
                value={routeNotes}
                onChange={(e) => setRouteNotes(e.target.value)}
                placeholder="Add any special instructions or notes for the nursing staff..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleConfirmRouteAll}
                disabled={savingPatientIds.length > 0}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white py-6 text-base"
              >
                <Send className="w-5 h-5 mr-2" />
                {savingPatientIds.length > 0
                  ? 'Saving to Backend...'
                  : `Confirm - Route ${routingQueue.length} Patient(s)`}
              </Button>
              <Button
                onClick={() => setIsRouteDialogOpen(false)}
                variant="outline"
                className="px-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// View Availability View (placeholder for now, will be implemented)
function ViewAvailabilityView() {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <Clock className="w-16 h-16 text-orange-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">View Doctor Availability</h3>
      <p className="text-sm text-gray-500">
        Check doctor schedules and availability for appointments
      </p>
    </div>
  );
}

// QR Scanner View
function QRScannerView() {
  return <QRScanner />;
}

// Face Recognition View
function FaceRecognitionView() {
  return <FaceRecognition />;
}
