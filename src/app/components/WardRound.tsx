import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Clipboard,
  Clock,
  User,
  Heart,
  Thermometer,
  Activity,
  Droplet,
  Eye,
  Stethoscope,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface WardPatient {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  ward: string;
  bedNumber: string;
  admissionDate: string;
  diagnosis: string;
  attendingDoctor: string;
  status: 'stable' | 'critical' | 'recovering' | 'deteriorating';
  daysAdmitted: number;
  lastRoundCheck?: string;
  lastObservation?: string;
  vitalSigns?: {
    bloodPressure: string;
    temperature: string;
    pulse: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
}

interface WardRoundNote {
  id: string;
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  wardRoundTime: string;
  observations: string;
  vitalSigns: {
    bloodPressure: string;
    temperature: string;
    pulse: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  patientCondition: 'improved' | 'stable' | 'deteriorated' | 'no-change';
  actionsTaken: string;
  followUpRequired: boolean;
  followUpNotes: string;
  timestamp: string;
}

export function WardRound() {
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<WardPatient | null>(null);

  // Ward Round Form State
  const [wardRoundForm, setWardRoundForm] = useState({
    observations: '',
    bloodPressure: '',
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    patientCondition: 'stable' as 'improved' | 'stable' | 'deteriorated' | 'no-change',
    actionsTaken: '',
    followUpRequired: false,
    followUpNotes: '',
  });

  const [wardPatients, setWardPatients] = useState<WardPatient[]>([
    {
      id: '1',
      patientId: 'PT-2026-0045',
      patientName: 'James Anderson',
      age: 45,
      gender: 'Male',
      ward: 'ICU',
      bedNumber: 'ICU-03',
      admissionDate: '2026-04-20',
      diagnosis: 'Post-surgical monitoring - Cardiac surgery',
      attendingDoctor: 'Dr. Sarah Johnson',
      status: 'critical',
      daysAdmitted: 4,
      lastRoundCheck: '2026-04-24 06:00 AM',
      lastObservation: 'Patient showing signs of improvement, breathing stable',
      vitalSigns: {
        bloodPressure: '130/85',
        temperature: '37.2',
        pulse: '78',
        respiratoryRate: '18',
        oxygenSaturation: '96',
      },
    },
    {
      id: '2',
      patientId: 'PT-2026-0052',
      patientName: 'Grace Okonkwo',
      age: 32,
      gender: 'Female',
      ward: 'Maternity Ward',
      bedNumber: 'M-08',
      admissionDate: '2026-04-22',
      diagnosis: 'Post-delivery care - Normal delivery',
      attendingDoctor: 'Dr. Fatima Ibrahim',
      status: 'stable',
      daysAdmitted: 2,
      lastRoundCheck: '2026-04-24 08:00 AM',
      lastObservation: 'Mother and baby doing well, breastfeeding successfully',
      vitalSigns: {
        bloodPressure: '120/70',
        temperature: '36.8',
        pulse: '72',
        respiratoryRate: '16',
        oxygenSaturation: '98',
      },
    },
    {
      id: '3',
      patientId: 'PT-2026-0038',
      patientName: 'Mohammed Ibrahim',
      age: 58,
      gender: 'Male',
      ward: 'General Ward A',
      bedNumber: 'A-15',
      admissionDate: '2026-04-19',
      diagnosis: 'Diabetes management - Type 2 Diabetes',
      attendingDoctor: 'Dr. Michael Chen',
      status: 'recovering',
      daysAdmitted: 5,
      lastRoundCheck: '2026-04-24 07:30 AM',
      lastObservation: 'Blood sugar levels stabilizing, patient responding well to treatment',
      vitalSigns: {
        bloodPressure: '135/80',
        temperature: '36.5',
        pulse: '70',
        respiratoryRate: '16',
        oxygenSaturation: '97',
      },
    },
    {
      id: '4',
      patientId: 'PT-2026-0061',
      patientName: 'Blessing Adeyemi',
      age: 7,
      gender: 'Female',
      ward: 'Pediatric Ward',
      bedNumber: 'PED-12',
      admissionDate: '2026-04-21',
      diagnosis: 'Severe malaria with complications',
      attendingDoctor: 'Dr. Amina Yusuf',
      status: 'recovering',
      daysAdmitted: 3,
      lastRoundCheck: '2026-04-24 05:00 AM',
      lastObservation: 'Fever subsiding, appetite returning, child more alert',
      vitalSigns: {
        bloodPressure: '95/60',
        temperature: '37.8',
        pulse: '85',
        respiratoryRate: '20',
        oxygenSaturation: '95',
      },
    },
    {
      id: '5',
      patientId: 'PT-2026-0073',
      patientName: 'David Okonjo',
      age: 62,
      gender: 'Male',
      ward: 'General Ward A',
      bedNumber: 'A-22',
      admissionDate: '2026-04-23',
      diagnosis: 'Pneumonia - Community acquired',
      attendingDoctor: 'Dr. Sarah Johnson',
      status: 'stable',
      daysAdmitted: 1,
      lastRoundCheck: '2026-04-24 06:30 AM',
      lastObservation: 'Oxygen support ongoing, breathing improved overnight',
      vitalSigns: {
        bloodPressure: '140/90',
        temperature: '38.1',
        pulse: '82',
        respiratoryRate: '22',
        oxygenSaturation: '92',
      },
    },
    {
      id: '6',
      patientId: 'PT-2026-0067',
      patientName: 'Aisha Bello',
      age: 35,
      gender: 'Female',
      ward: 'Private Ward',
      bedNumber: 'P-05',
      admissionDate: '2026-04-22',
      diagnosis: 'Severe dehydration and gastroenteritis',
      attendingDoctor: 'Dr. Michael Chen',
      status: 'recovering',
      daysAdmitted: 2,
      lastRoundCheck: '2026-04-24 09:00 AM',
      lastObservation: 'IV fluids continuing, patient tolerating oral intake',
    },
    {
      id: '7',
      patientId: 'PT-2026-0089',
      patientName: 'Peter Eze',
      age: 41,
      gender: 'Male',
      ward: 'General Ward A',
      bedNumber: 'A-18',
      admissionDate: '2026-04-24',
      diagnosis: 'Hypertensive crisis',
      attendingDoctor: 'Dr. Fatima Ibrahim',
      status: 'critical',
      daysAdmitted: 0,
      lastObservation: 'Patient admitted overnight, BP monitoring every hour',
    },
    {
      id: '8',
      patientId: 'PT-2026-0055',
      patientName: 'Chinwe Okoro',
      age: 26,
      gender: 'Female',
      ward: 'Maternity Ward',
      bedNumber: 'M-12',
      admissionDate: '2026-04-23',
      diagnosis: 'C-Section post-operative care',
      attendingDoctor: 'Dr. Fatima Ibrahim',
      status: 'stable',
      daysAdmitted: 1,
      lastRoundCheck: '2026-04-24 07:00 AM',
      lastObservation: 'Wound healing well, pain management adequate',
      vitalSigns: {
        bloodPressure: '118/75',
        temperature: '37.0',
        pulse: '76',
        respiratoryRate: '16',
        oxygenSaturation: '99',
      },
    },
  ]);

  const [wardRoundHistory, setWardRoundHistory] = useState<WardRoundNote[]>([
    {
      id: '1',
      patientId: 'PT-2026-0045',
      patientName: 'James Anderson',
      nurseId: 'N-001',
      nurseName: 'Nurse Florence Adeboye',
      wardRoundTime: '06:00 AM',
      observations: 'Patient showing signs of improvement. Breathing stable without additional oxygen support. Incision site healing well with no signs of infection. Patient able to sit up and communicate clearly.',
      vitalSigns: {
        bloodPressure: '130/85',
        temperature: '37.2',
        pulse: '78',
        respiratoryRate: '18',
        oxygenSaturation: '96',
      },
      patientCondition: 'improved',
      actionsTaken: 'Continue current medication, encouraged patient to perform breathing exercises, monitored incision site',
      followUpRequired: true,
      followUpNotes: 'Monitor for any signs of post-surgical complications. Schedule follow-up with cardiologist.',
      timestamp: '2026-04-24 06:00 AM',
    },
  ]);

  const wards = [
    { id: 'all', name: 'All Wards' },
    { id: 'ICU', name: 'ICU (Intensive Care Unit)' },
    { id: 'General Ward A', name: 'General Ward A' },
    { id: 'Private Ward', name: 'Private Ward' },
    { id: 'Maternity Ward', name: 'Maternity Ward' },
    { id: 'Pediatric Ward', name: 'Pediatric Ward' },
  ];

  const filteredPatients = wardPatients.filter((patient) => {
    const matchesWard = selectedWard === 'all' || patient.ward === selectedWard;
    const matchesPatient = !selectedPatientId || patient.id === selectedPatientId;

    return matchesWard && matchesPatient;
  });

  const handleOpenCheckDialog = (patient: WardPatient) => {
    setSelectedPatient(patient);
    setWardRoundForm({
      observations: '',
      bloodPressure: patient.vitalSigns?.bloodPressure || '',
      temperature: patient.vitalSigns?.temperature || '',
      pulse: patient.vitalSigns?.pulse || '',
      respiratoryRate: patient.vitalSigns?.respiratoryRate || '',
      oxygenSaturation: patient.vitalSigns?.oxygenSaturation || '',
      patientCondition: 'stable',
      actionsTaken: '',
      followUpRequired: false,
      followUpNotes: '',
    });
    setIsCheckDialogOpen(true);
  };

  const handleSaveWardRound = () => {
    if (!selectedPatient) return;

    if (!wardRoundForm.observations || !wardRoundForm.bloodPressure || !wardRoundForm.temperature || !wardRoundForm.pulse) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newWardRoundNote: WardRoundNote = {
      id: Date.now().toString(),
      patientId: selectedPatient.patientId,
      patientName: selectedPatient.patientName,
      nurseId: 'N-001',
      nurseName: 'Nurse Florence Adeboye',
      wardRoundTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      observations: wardRoundForm.observations,
      vitalSigns: {
        bloodPressure: wardRoundForm.bloodPressure,
        temperature: wardRoundForm.temperature,
        pulse: wardRoundForm.pulse,
        respiratoryRate: wardRoundForm.respiratoryRate,
        oxygenSaturation: wardRoundForm.oxygenSaturation,
      },
      patientCondition: wardRoundForm.patientCondition,
      actionsTaken: wardRoundForm.actionsTaken,
      followUpRequired: wardRoundForm.followUpRequired,
      followUpNotes: wardRoundForm.followUpNotes,
      timestamp: new Date().toLocaleString(),
    };

    setWardRoundHistory([newWardRoundNote, ...wardRoundHistory]);

    // Update patient's last check information
    setWardPatients(wardPatients.map(p =>
      p.id === selectedPatient.id
        ? {
            ...p,
            lastRoundCheck: new Date().toLocaleString(),
            lastObservation: wardRoundForm.observations,
            vitalSigns: {
              bloodPressure: wardRoundForm.bloodPressure,
              temperature: wardRoundForm.temperature,
              pulse: wardRoundForm.pulse,
              respiratoryRate: wardRoundForm.respiratoryRate,
              oxygenSaturation: wardRoundForm.oxygenSaturation,
            },
            status: wardRoundForm.patientCondition === 'improved' || wardRoundForm.patientCondition === 'stable' 
              ? 'stable' 
              : wardRoundForm.patientCondition === 'deteriorated'
              ? 'critical'
              : p.status
          }
        : p
    ));

    toast.success(`Ward round check completed for ${selectedPatient.patientName}`);
    setIsCheckDialogOpen(false);
    setSelectedPatient(null);
  };

  const stats = [
    {
      label: 'Total Patients',
      value: wardPatients.length,
      icon: User,
      color: 'bg-blue-500',
    },
    {
      label: 'Critical',
      value: wardPatients.filter(p => p.status === 'critical').length,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
    {
      label: 'Stable',
      value: wardPatients.filter(p => p.status === 'stable').length,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Rounds Today',
      value: wardRoundHistory.filter(h => h.timestamp.includes('2026-04-24')).length,
      icon: Clipboard,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-md">
              <Clipboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Ward Round - Patient Observation</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Check on patients, record vital signs and observations during ward rounds
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px]">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Admitted Patient
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
                >
                  <option value="">-- All Admitted Patients ({wardPatients.filter(p => selectedWard === 'all' || p.ward === selectedWard).length}) --</option>
                  {wardPatients
                    .filter((patient) => selectedWard === 'all' || patient.ward === selectedWard)
                    .map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.patientName} ({patient.patientId}) - {patient.ward} - Bed {patient.bedNumber} - {patient.status.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Ward
              </Label>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedWard}
                  onChange={(e) => {
                    setSelectedWard(e.target.value);
                    setSelectedPatientId(''); // Reset patient selection when ward changes
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {selectedPatientId && (
            <div className="mt-3 bg-teal-50 border-2 border-teal-500 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <p className="text-sm font-medium text-teal-900">
                  Viewing: {wardPatients.find(p => p.id === selectedPatientId)?.patientName}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPatientId('')}
                className="border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                Clear Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => (
          <Card
            key={patient.id}
            className={`transition-all hover:shadow-lg ${
              patient.status === 'critical'
                ? 'border-l-4 border-red-500'
                : patient.status === 'recovering'
                ? 'border-l-4 border-green-500'
                : patient.status === 'deteriorating'
                ? 'border-l-4 border-orange-500'
                : 'border-l-4 border-blue-500'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{patient.patientName}</h3>
                    <p className="text-sm text-gray-500">{patient.patientId}</p>
                  </div>
                </div>
                <Badge
                  className={
                    patient.status === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : patient.status === 'recovering'
                      ? 'bg-green-100 text-green-700'
                      : patient.status === 'deteriorating'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }
                >
                  {patient.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-600">Ward / Bed:</span>
                  <p className="font-semibold">{patient.ward} - {patient.bedNumber}</p>
                </div>
                <div>
                  <span className="text-gray-600">Age / Gender:</span>
                  <p className="font-semibold">{patient.age}y / {patient.gender}</p>
                </div>
                <div>
                  <span className="text-gray-600">Attending Doctor:</span>
                  <p className="font-semibold text-xs">{patient.attendingDoctor}</p>
                </div>
                <div>
                  <span className="text-gray-600">Days Admitted:</span>
                  <p className="font-semibold">{patient.daysAdmitted} days</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg mb-3 text-sm">
                <span className="font-semibold text-gray-700">Diagnosis:</span>
                <p className="text-gray-600 mt-1">{patient.diagnosis}</p>
              </div>

              {patient.vitalSigns && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 bg-red-50 rounded text-center">
                    <Heart className="w-4 h-4 text-red-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">BP</div>
                    <div className="text-sm font-bold">{patient.vitalSigns.bloodPressure}</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded text-center">
                    <Thermometer className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Temp</div>
                    <div className="text-sm font-bold">{patient.vitalSigns.temperature}°C</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <Activity className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Pulse</div>
                    <div className="text-sm font-bold">{patient.vitalSigns.pulse} bpm</div>
                  </div>
                </div>
              )}

              {patient.lastRoundCheck && (
                <div className="p-2 bg-green-50 rounded-lg border border-green-200 mb-3">
                  <div className="flex items-center gap-2 text-xs text-green-700 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-semibold">Last Check: {patient.lastRoundCheck}</span>
                  </div>
                  {patient.lastObservation && (
                    <p className="text-xs text-green-600 line-clamp-2">{patient.lastObservation}</p>
                  )}
                </div>
              )}

              <Button
                onClick={() => handleOpenCheckDialog(patient)}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                Perform Ward Round Check
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No patients found in the selected ward</p>
        </div>
      )}

      {/* Ward Round Check Dialog */}
      <Dialog open={isCheckDialogOpen} onOpenChange={setIsCheckDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              Ward Round Check - Patient Observation
            </DialogTitle>
            <DialogDescription>
              Record patient observations, vital signs, and nursing notes
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Patient Name:</span>
                      <p className="font-semibold text-gray-900">{selectedPatient.patientName}</p>
                    </div>
                    <div>
                      <span className="text-blue-600">Patient ID:</span>
                      <p className="font-semibold text-gray-900">{selectedPatient.patientId}</p>
                    </div>
                    <div>
                      <span className="text-blue-600">Ward / Bed:</span>
                      <p className="font-semibold text-gray-900">{selectedPatient.ward} - {selectedPatient.bedNumber}</p>
                    </div>
                    <div>
                      <span className="text-blue-600">Days Admitted:</span>
                      <p className="font-semibold text-gray-900">{selectedPatient.daysAdmitted} days</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-600">Diagnosis:</span>
                      <p className="font-semibold text-gray-900">{selectedPatient.diagnosis}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-600">Attending Doctor:</span>
                      <p className="font-semibold text-gray-900">{selectedPatient.attendingDoctor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  Record Vital Signs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      Blood Pressure *
                    </Label>
                    <Input
                      value={wardRoundForm.bloodPressure}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, bloodPressure: e.target.value })}
                      placeholder="120/80"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-600" />
                      Temperature (°C) *
                    </Label>
                    <Input
                      value={wardRoundForm.temperature}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, temperature: e.target.value })}
                      placeholder="36.5"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      Pulse (bpm) *
                    </Label>
                    <Input
                      value={wardRoundForm.pulse}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, pulse: e.target.value })}
                      placeholder="72"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      Respiratory Rate (breaths/min)
                    </Label>
                    <Input
                      value={wardRoundForm.respiratoryRate}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, respiratoryRate: e.target.value })}
                      placeholder="16"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-cyan-600" />
                      Oxygen Saturation (%)
                    </Label>
                    <Input
                      value={wardRoundForm.oxygenSaturation}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, oxygenSaturation: e.target.value })}
                      placeholder="98"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Patient Condition *</Label>
                    <select
                      value={wardRoundForm.patientCondition}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, patientCondition: e.target.value as any })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="improved">Improved</option>
                      <option value="stable">Stable</option>
                      <option value="no-change">No Change</option>
                      <option value="deteriorated">Deteriorated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  Observations & Nursing Notes *
                </Label>
                <Textarea
                  value={wardRoundForm.observations}
                  onChange={(e) => setWardRoundForm({ ...wardRoundForm, observations: e.target.value })}
                  placeholder="Record what you notice about the patient: general appearance, consciousness level, pain level, mobility, appetite, fluid intake/output, wound condition, any concerns, etc."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be detailed and specific. Include any changes from previous observations.
                </p>
              </div>

              {/* Actions Taken */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Actions Taken
                </Label>
                <Textarea
                  value={wardRoundForm.actionsTaken}
                  onChange={(e) => setWardRoundForm({ ...wardRoundForm, actionsTaken: e.target.value })}
                  placeholder="Describe any actions taken: medications administered, dressing changes, patient repositioned, doctor notified, etc."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Follow-up */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={wardRoundForm.followUpRequired}
                    onChange={(e) => setWardRoundForm({ ...wardRoundForm, followUpRequired: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <Label htmlFor="followUpRequired" className="font-semibold cursor-pointer">
                    Follow-up Required
                  </Label>
                </div>

                {wardRoundForm.followUpRequired && (
                  <div>
                    <Label>Follow-up Notes</Label>
                    <Textarea
                      value={wardRoundForm.followUpNotes}
                      onChange={(e) => setWardRoundForm({ ...wardRoundForm, followUpNotes: e.target.value })}
                      placeholder="Specify follow-up actions needed, when to recheck, or concerns to monitor..."
                      rows={3}
                      className="mt-1 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveWardRound}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Ward Round Check
                </Button>
                <Button
                  onClick={() => setIsCheckDialogOpen(false)}
                  variant="outline"
                  className="px-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ward Round History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Today's Ward Round History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {wardRoundHistory.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{note.patientName}</h4>
                      <p className="text-sm text-gray-500">{note.patientId}</p>
                    </div>
                    <Badge
                      className={
                        note.patientCondition === 'improved'
                          ? 'bg-green-100 text-green-700'
                          : note.patientCondition === 'deteriorated'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }
                    >
                      {note.patientCondition === 'improved' ? (
                        <><TrendingUp className="w-3 h-3 mr-1 inline" /> Improved</>
                      ) : note.patientCondition === 'deteriorated' ? (
                        <><TrendingDown className="w-3 h-3 mr-1 inline" /> Deteriorated</>
                      ) : note.patientCondition === 'stable' ? (
                        <><CheckCircle className="w-3 h-3 mr-1 inline" /> Stable</>
                      ) : (
                        <><Minus className="w-3 h-3 mr-1 inline" /> No Change</>
                      )}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 text-xs">
                    <div className="p-2 bg-red-50 rounded text-center">
                      <div className="text-gray-600">BP</div>
                      <div className="font-bold">{note.vitalSigns.bloodPressure}</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded text-center">
                      <div className="text-gray-600">Temp</div>
                      <div className="font-bold">{note.vitalSigns.temperature}°C</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-center">
                      <div className="text-gray-600">Pulse</div>
                      <div className="font-bold">{note.vitalSigns.pulse}</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded text-center">
                      <div className="text-gray-600">RR</div>
                      <div className="font-bold">{note.vitalSigns.respiratoryRate || 'N/A'}</div>
                    </div>
                    <div className="p-2 bg-cyan-50 rounded text-center">
                      <div className="text-gray-600">O2 Sat</div>
                      <div className="font-bold">{note.vitalSigns.oxygenSaturation || 'N/A'}%</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg mb-2 text-sm">
                    <span className="font-semibold text-gray-700">Observations:</span>
                    <p className="text-gray-600 mt-1">{note.observations}</p>
                  </div>

                  {note.actionsTaken && (
                    <div className="p-3 bg-blue-50 rounded-lg mb-2 text-sm">
                      <span className="font-semibold text-blue-700">Actions Taken:</span>
                      <p className="text-blue-600 mt-1">{note.actionsTaken}</p>
                    </div>
                  )}

                  {note.followUpRequired && note.followUpNotes && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-2 text-sm">
                      <span className="font-semibold text-yellow-800 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Follow-up Required:
                      </span>
                      <p className="text-yellow-700 mt-1">{note.followUpNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {note.nurseName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.wardRoundTime}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {note.timestamp}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {wardRoundHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No ward rounds recorded today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
