import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Activity,
  Heart,
  Thermometer,
  Weight,
  Droplet,
  Eye,
  Users,
  Send,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  AlertCircle,
  UserCircle,
  Calendar,
  Stethoscope,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { useVitalSigns } from '../context/VitalSignsContext';
import { fetchDoctors, type BackendUser } from '../utils/api';

interface Patient {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  assignedDoctor: string;
  appointmentTime: string;
  chiefComplaint: string;
  reasonToSeeDoctor?: 'Consultation' | 'Treatment';
  consultationType?: string;
  treatmentType?: string;
  status: 'pending' | 'completed' | 'sent-to-doctor';
  routedFrom?: string;
  routedBy?: string;
  routedAt?: string;
  vitalSigns?: VitalSignsData;
  injectionRecord?: InjectionData;
}

interface VitalSignsData {
  bloodPressure: string;
  temperature: string;
  pulse: string;
  respiratoryRate: string;
  weight: string;
  height: string;
  bmi?: string;
  oxygenSaturation: string;
  bloodSugar?: string;
  notes: string;
  recordedBy: string;
  recordedAt: string;
}

interface InjectionData {
  medicationName: string;
  dosage: string;
  routeToDoctor: string; // Changed from route
  injectionSite: string; // Changed from site
  batchNumber: string;
  administeredBy: string;
  administeredAt: string;
  notes: string;
}

export function VitalSigns() {
  const {
    vitalSignsQueue,
    isLoading,
    updatePatientVitalSigns,
    updatePatientRouting,
  } = useVitalSigns();
  const [patients, setPatients] = useState(vitalSignsQueue);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);

  // Route to Doctor State
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [consultingRoom, setConsultingRoom] = useState('');
  const [routeNotes, setRouteNotes] = useState('');
  const [doctors, setDoctors] = useState<BackendUser[]>([]);

  const buildConsultingRoom = (doctor: BackendUser) =>
    `${doctor.department?.code || 'CLIN'}-${String(doctor.id).padStart(3, '0')}`;

  // Vital Signs Form State
  const [vitalSignsForm, setVitalSignsForm] = useState<Partial<VitalSignsData>>({
    bloodPressure: '',
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    bloodSugar: '',
    notes: '',
  });

  useEffect(() => {
    setPatients(vitalSignsQueue);
  }, [vitalSignsQueue]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const availableDoctors = await fetchDoctors();
        setDoctors(availableDoctors);
      } catch (error) {
        console.error('Failed to load doctors', error);
      }
    };

    void loadDoctors();
  }, []);

  const calculateBMI = (weight: string, height: string) => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to meters
    if (w && h) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  const handleOpenDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    if (patient.vitalSigns) {
      setVitalSignsForm(patient.vitalSigns);
    } else {
      setVitalSignsForm({
        bloodPressure: '',
        temperature: '',
        pulse: '',
        respiratoryRate: '',
        weight: '',
        height: '',
        oxygenSaturation: '',
        bloodSugar: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveVitalSigns = async () => {
    if (!selectedPatient) return;

    // Calculate BMI if weight and height are provided
    const bmi = calculateBMI(vitalSignsForm.weight || '', vitalSignsForm.height || '');

    const updatedVitalSigns: VitalSignsData = {
      ...vitalSignsForm,
      bmi,
      recordedBy: 'Current Nurse', // In real app, get from logged-in user
      recordedAt: new Date().toISOString(),
    } as VitalSignsData;

    // Update the patients list
    setPatients(patients.map(p =>
      p.id === selectedPatient.id
        ? { ...p, vitalSigns: updatedVitalSigns, status: 'completed' as const }
        : p
    ));
    await updatePatientVitalSigns(selectedPatient.patientId, updatedVitalSigns);

    // IMPORTANT: Also update the selectedPatient state so validation works
    const updatedSelectedPatient = {
      ...selectedPatient,
      vitalSigns: updatedVitalSigns,
      status: 'completed' as const
    };
    setSelectedPatient(updatedSelectedPatient);

    toast.success('Vital signs recorded successfully');

    // Auto-open route to doctor dialog after saving
    const initialDoctor = doctors.find(d => d.name === updatedSelectedPatient.assignedDoctor);
    if (initialDoctor) {
      setSelectedDoctor(initialDoctor.name);
      setSelectedDepartment(initialDoctor.department?.name || 'General');
      setConsultingRoom(buildConsultingRoom(initialDoctor));
    }
    setIsRouteDialogOpen(true);
  };

  const handleOpenRouteDialog = () => {
    if (!selectedPatient) return;

    if (!selectedPatient.vitalSigns) {
      toast.error('Please record vital signs before routing to doctor');
      return;
    }

    // Pre-select the initially assigned doctor
    const initialDoctor = doctors.find(d => d.name === selectedPatient.assignedDoctor);
    if (initialDoctor) {
      setSelectedDoctor(initialDoctor.name);
      setSelectedDepartment(initialDoctor.department?.name || 'General');
      setConsultingRoom(buildConsultingRoom(initialDoctor));
    }

    setIsRouteDialogOpen(true);
  };

  const handleDoctorSelection = (doctorName: string) => {
    const doctor = doctors.find(d => d.name === doctorName);
    if (doctor) {
      setSelectedDoctor(doctorName);
      setSelectedDepartment(doctor.department?.name || 'General');
      setConsultingRoom(buildConsultingRoom(doctor));
    }
  };

  const handleRouteToDoctor = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    if (!selectedPatient.vitalSigns) {
      toast.error('Vital signs must be recorded before routing');
      return;
    }

    const routedAt = new Date().toISOString();

    // Find doctor details
    const doctor = doctors.find(d => d.name === selectedDoctor);
    if (!doctor) {
      toast.error('Selected doctor could not be loaded from the backend');
      return;
    }

    setPatients(patients.map(p =>
      p.id === selectedPatient.id
        ? { ...p, status: 'sent-to-doctor' as const, assignedDoctor: selectedDoctor }
        : p
    ));
    await updatePatientRouting(selectedPatient.patientId, {
      assignedDoctor: selectedDoctor,
      assignedDoctorId: doctor.id,
      status: 'sent-to-doctor',
      routedBy: 'Vital Signs Unit',
      routedAt,
      consultingRoom,
    }, routeNotes);

    toast.success(`Patient routed to ${selectedDoctor} successfully`, {
      description: `${selectedPatient.patientName} added to ${selectedDoctor}'s queue`,
    });
    setIsRouteDialogOpen(false);
    setIsDialogOpen(false);

    // Reset route form
    setSelectedDoctor('');
    setSelectedDepartment('');
    setConsultingRoom('');
    setRouteNotes('');
  };

  const filteredPatients = patients.filter(patient =>
    patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    {
      label: 'Pending Patients',
      value: patients.filter(p => p.status === 'pending').length.toString(),
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      label: 'Completed Today',
      value: patients.filter(p => p.status === 'completed' || p.status === 'sent-to-doctor').length.toString(),
      icon: CheckCircle2,
      color: 'bg-green-500',
    },
    {
      label: 'Sent to Doctor',
      value: patients.filter(p => p.status === 'sent-to-doctor').length.toString(),
      icon: Send,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Queue',
      value: patients.filter(p => p.status === 'pending').length.toString(),
      icon: Clock,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-700 rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Vital Signs Unit</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Record patient vital signs and route to assigned doctors for consultation
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info Banner - Patients from Reception */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Patient Queue from Reception - Route to Doctor</h3>
            <p className="text-xs text-blue-700">
              Below is the list of patients sent from the Reception desk. Record their vital signs and route them to their assigned doctors for consultation using the "Route Patient to Doctor" button.
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Queue Updates in Real-time
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <ArrowRight className="w-3 h-3" />
                Route patients after vitals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patient Queue
            </CardTitle>
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

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  Loading patients from the Laravel backend...
                </div>
              )}
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 border-2 rounded-lg transition-all cursor-pointer transform hover:scale-[1.02] ${
                    selectedPatient?.id === patient.id
                      ? 'border-red-500 bg-red-50 shadow-lg'
                      : 'border-gray-200 hover:border-red-400 hover:shadow-lg hover:bg-red-50/30'
                  }`}
                  onClick={() => handleOpenDialog(patient)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-gray-400" />
                      <h4 className="font-semibold text-gray-900">{patient.patientName}</h4>
                    </div>
                    <Badge
                      variant={
                        patient.status === 'pending' ? 'secondary' :
                        patient.status === 'completed' ? 'default' :
                        'outline'
                      }
                      className={
                        patient.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        patient.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }
                    >
                      {patient.status === 'sent-to-doctor' ? 'Sent' : patient.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {patient.patientId}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{patient.chiefComplaint}</p>
                  {patient.reasonToSeeDoctor && (
                    <div className="mb-2 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          className={patient.reasonToSeeDoctor === 'Consultation' 
                            ? 'bg-blue-100 text-blue-700 text-xs' 
                            : 'bg-purple-100 text-purple-700 text-xs'
                          }
                        >
                          {patient.reasonToSeeDoctor}
                        </Badge>
                        {patient.consultationType && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            {patient.consultationType}
                          </Badge>
                        )}
                        {patient.treatmentType && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            {patient.treatmentType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {patient.appointmentTime}
                    </span>
                    <span className="font-medium text-blue-600">{patient.assignedDoctor}</span>
                  </div>
                  {patient.vitalSigns && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-gray-600">BP: {patient.vitalSigns.bloodPressure}</span>
                        <span className="text-gray-600">Temp: {patient.vitalSigns.temperature}°C</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs & Injection Recording */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedPatient ? `${selectedPatient.patientName} - ${selectedPatient.patientId}` : 'Select a Patient'}
              </span>
              {selectedPatient && (
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  {selectedPatient.assignedDoctor}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => handleOpenDialog(selectedPatient)}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white shadow-md"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Record Vital Signs
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-800 bg-clip-text text-transparent">
                        Patient Card - {selectedPatient.patientName}
                      </DialogTitle>
                      <DialogDescription>
                        Record vital signs and injection details for {selectedPatient.patientId}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Patient Info Summary */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Age</p>
                          <p className="font-semibold">{selectedPatient.age} years</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Gender</p>
                          <p className="font-semibold">{selectedPatient.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Time</p>
                          <p className="font-semibold">{selectedPatient.appointmentTime}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reason to See Doctor</p>
                          <p className="font-semibold">
                            <Badge 
                              className={selectedPatient.reasonToSeeDoctor === 'Consultation' 
                                ? 'bg-blue-500 text-white text-xs' 
                                : 'bg-purple-500 text-white text-xs'
                              }
                            >
                              {selectedPatient.reasonToSeeDoctor || 'Consultation'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
                        <div>
                          <p className="text-gray-600 text-xs">Chief Complaint</p>
                          <p className="font-semibold text-red-600">{selectedPatient.chiefComplaint}</p>
                        </div>
                        {selectedPatient.consultationType && (
                          <div>
                            <p className="text-gray-600 text-xs">Consultation Type</p>
                            <Badge className="bg-blue-500 text-white text-xs mt-1">
                              {selectedPatient.consultationType}
                            </Badge>
                          </div>
                        )}
                        {selectedPatient.treatmentType && (
                          <div>
                            <p className="text-gray-600 text-xs">Treatment Type</p>
                            <Badge className="bg-purple-500 text-white text-xs mt-1">
                              {selectedPatient.treatmentType}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vital Signs Form */}
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Blood Pressure */}
                          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                            <Label htmlFor="bp" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Heart className="w-4 h-4 text-red-600" />
                              Blood Pressure (mmHg)
                            </Label>
                            <Input
                              id="bp"
                              value={vitalSignsForm.bloodPressure}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, bloodPressure: e.target.value })}
                              placeholder="e.g., 120/80"
                            />
                          </div>

                          {/* Temperature */}
                          <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <Label htmlFor="temp" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Thermometer className="w-4 h-4 text-orange-600" />
                              Temperature (°C)
                            </Label>
                            <Input
                              id="temp"
                              type="number"
                              step="0.1"
                              value={vitalSignsForm.temperature}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, temperature: e.target.value })}
                              placeholder="e.g., 36.5"
                            />
                          </div>

                          {/* Pulse */}
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <Label htmlFor="pulse" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-purple-600" />
                              Pulse (bpm)
                            </Label>
                            <Input
                              id="pulse"
                              type="number"
                              value={vitalSignsForm.pulse}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, pulse: e.target.value })}
                              placeholder="e.g., 72"
                            />
                          </div>

                          {/* Respiratory Rate */}
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                            <Label htmlFor="resp" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-blue-600" />
                              Respiratory Rate (per min)
                            </Label>
                            <Input
                              id="resp"
                              type="number"
                              value={vitalSignsForm.respiratoryRate}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, respiratoryRate: e.target.value })}
                              placeholder="e.g., 16"
                            />
                          </div>

                          {/* Weight */}
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <Label htmlFor="weight" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Weight className="w-4 h-4 text-green-600" />
                              Weight (kg)
                            </Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.1"
                              value={vitalSignsForm.weight}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, weight: e.target.value })}
                              placeholder="e.g., 70"
                            />
                          </div>

                          {/* Height */}
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <Label htmlFor="height" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-green-600" />
                              Height (cm)
                            </Label>
                            <Input
                              id="height"
                              type="number"
                              value={vitalSignsForm.height}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, height: e.target.value })}
                              placeholder="e.g., 170"
                            />
                            {vitalSignsForm.weight && vitalSignsForm.height && (
                              <p className="text-xs text-green-700 mt-1">
                                BMI: {calculateBMI(vitalSignsForm.weight, vitalSignsForm.height)}
                              </p>
                            )}
                          </div>

                          {/* Oxygen Saturation */}
                          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                            <Label htmlFor="oxygen" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Droplet className="w-4 h-4 text-indigo-600" />
                              Oxygen Saturation (%)
                            </Label>
                            <Input
                              id="oxygen"
                              type="number"
                              value={vitalSignsForm.oxygenSaturation}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, oxygenSaturation: e.target.value })}
                              placeholder="e.g., 98"
                            />
                          </div>

                          {/* Blood Sugar (Optional) */}
                          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <Label htmlFor="bloodSugar" className="text-sm font-semibold flex items-center gap-2 mb-2">
                              <Droplet className="w-4 h-4 text-yellow-600" />
                              Blood Sugar (mg/dL) - Optional
                            </Label>
                            <Input
                              id="bloodSugar"
                              type="number"
                              value={vitalSignsForm.bloodSugar}
                              onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, bloodSugar: e.target.value })}
                              placeholder="e.g., 95"
                            />
                          </div>
                        </div>

                        {/* Vital Signs Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="vitalNotes" className="text-sm font-semibold">
                            Clinical Notes
                          </Label>
                          <Textarea
                            id="vitalNotes"
                            value={vitalSignsForm.notes}
                            onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, notes: e.target.value })}
                            placeholder="Enter any observations, patient complaints, or additional notes..."
                            className="min-h-[100px]"
                          />
                        </div>

                        <Button
                          onClick={handleSaveVitalSigns}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Save Vital Signs
                        </Button>
                      </div>

                    {/* Route to Doctor Section */}
                    <div className="mt-6 pt-6 border-t-2 border-blue-200">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          Route Patient to Doctor
                        </h3>
                        <p className="text-xs text-blue-700">
                          {selectedPatient.vitalSigns
                            ? 'Vital signs recorded. You can now route this patient to their assigned doctor.'
                            : 'Record vital signs above, then route patient to doctor for consultation.'}
                        </p>
                      </div>
                      <Button
                        onClick={handleOpenRouteDialog}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg h-12 text-base font-semibold"
                        size="lg"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Route Patient to Doctor
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Patient Details Card */}
                <div className="mt-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Patient ID:</span>
                          <span className="font-semibold">{selectedPatient.patientId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-semibold">{selectedPatient.age} years</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-semibold">{selectedPatient.gender}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Assigned Doctor:</span>
                          <span className="font-semibold text-blue-600">{selectedPatient.assignedDoctor}</span>
                        </div>
                      </div>
                    </div>

                    {selectedPatient.vitalSigns && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recorded Vital Signs</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Blood Pressure:</span>
                            <span className="font-semibold">{selectedPatient.vitalSigns.bloodPressure} mmHg</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Temperature:</span>
                            <span className="font-semibold">{selectedPatient.vitalSigns.temperature}°C</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Pulse:</span>
                            <span className="font-semibold">{selectedPatient.vitalSigns.pulse} bpm</span>
                          </div>
                          {selectedPatient.vitalSigns.bmi && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">BMI:</span>
                              <span className="font-semibold">{selectedPatient.vitalSigns.bmi}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Patient Selected</h3>
                <p className="text-sm text-gray-500">
                  Select a patient from the queue to record vital signs
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Route to Doctor Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-800 bg-clip-text text-transparent">
              Route Patient to Doctor
            </DialogTitle>
            <DialogDescription>
              Select a doctor to route {selectedPatient?.patientName} to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label htmlFor="doctor" className="text-sm font-semibold">
                  Doctor
                </Label>
                <select
                  id="doctor"
                  value={selectedDoctor}
                  onChange={(e) => handleDoctorSelection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.name}>
                      {doctor.name} - {doctor.department?.name || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-semibold">
                  Department
                </Label>
                <Input
                  id="department"
                  value={selectedDepartment}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Consulting Room */}
              <div className="space-y-2">
                <Label htmlFor="room" className="text-sm font-semibold">
                  Consulting Room
                </Label>
                <Input
                  id="room"
                  value={consultingRoom}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Route Notes */}
              <div className="space-y-2">
                <Label htmlFor="routeNotes" className="text-sm font-semibold">
                  Route Notes
                </Label>
                <Textarea
                  id="routeNotes"
                  value={routeNotes}
                  onChange={(e) => setRouteNotes(e.target.value)}
                  placeholder="Enter any additional notes for routing..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleRouteToDoctor}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
          >
            <Send className="w-4 h-4 mr-2" />
            Route Patient to {selectedDoctor}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
