import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Bed, UserPlus, Users, ArrowRightLeft, UserMinus, Activity, Search, Plus, AlertCircle, Building2, CheckCircle, Clipboard } from 'lucide-react';
import { toast } from 'sonner';
import { WardRound } from './WardRound';
import { useAdmission } from '../context/AdmissionContext';
import { useDischarge } from '../context/DischargeContext';

type WardSection =
  | 'ward-overview'
  | 'admit-patient'
  | 'inward-patients'
  | 'ward-transfer'
  | 'discharge-patient'
  | 'bed-management'
  | 'ward-round';

interface Ward {
  id: string;
  name: string;
  type: 'General' | 'Private' | 'ICU' | 'Maternity' | 'Pediatric' | 'Isolation';
  capacity: number;
  occupied: number;
  available: number;
  dailyRate: number;
  status: 'active' | 'maintenance';
  beds: Bed[];
}

interface Bed {
  id: string;
  bedNumber: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patientId?: string;
  patientName?: string;
  admissionDate?: string;
}

interface InwardPatient {
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
  status: 'stable' | 'critical' | 'recovering';
  daysAdmitted: number;
  totalCharges: number;
}

export function Nursing() {
  const [selectedSection, setSelectedSection] = useState<WardSection>('ward-overview');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { admittedWardPatients } = useAdmission();

  const [wards] = useState<Ward[]>([
    {
      id: 'W001',
      name: 'General Ward A',
      type: 'General',
      capacity: 30,
      occupied: 22,
      available: 8,
      dailyRate: 5000,
      status: 'active',
      beds: Array.from({ length: 30 }, (_, i) => ({
        id: `W001-B${i + 1}`,
        bedNumber: `A-${(i + 1).toString().padStart(2, '0')}`,
        status: i < 22 ? 'occupied' : 'available'
      }))
    },
    {
      id: 'W002',
      name: 'Private Ward',
      type: 'Private',
      capacity: 15,
      occupied: 10,
      available: 5,
      dailyRate: 15000,
      status: 'active',
      beds: Array.from({ length: 15 }, (_, i) => ({
        id: `W002-B${i + 1}`,
        bedNumber: `P-${(i + 1).toString().padStart(2, '0')}`,
        status: i < 10 ? 'occupied' : 'available'
      }))
    },
    {
      id: 'W003',
      name: 'ICU',
      type: 'ICU',
      capacity: 10,
      occupied: 7,
      available: 3,
      dailyRate: 50000,
      status: 'active',
      beds: Array.from({ length: 10 }, (_, i) => ({
        id: `W003-B${i + 1}`,
        bedNumber: `ICU-${(i + 1).toString().padStart(2, '0')}`,
        status: i < 7 ? 'occupied' : 'available'
      }))
    },
    {
      id: 'W004',
      name: 'Maternity Ward',
      type: 'Maternity',
      capacity: 20,
      occupied: 12,
      available: 8,
      dailyRate: 12000,
      status: 'active',
      beds: Array.from({ length: 20 }, (_, i) => ({
        id: `W004-B${i + 1}`,
        bedNumber: `M-${(i + 1).toString().padStart(2, '0')}`,
        status: i < 12 ? 'occupied' : 'available'
      }))
    },
    {
      id: 'W005',
      name: 'Pediatric Ward',
      type: 'Pediatric',
      capacity: 25,
      occupied: 15,
      available: 10,
      dailyRate: 8000,
      status: 'active',
      beds: Array.from({ length: 25 }, (_, i) => ({
        id: `W005-B${i + 1}`,
        bedNumber: `PED-${(i + 1).toString().padStart(2, '0')}`,
        status: i < 15 ? 'occupied' : 'available'
      }))
    }
  ]);

  const [inwardPatients] = useState<InwardPatient[]>([
    {
      id: '1',
      patientId: 'PT-2026-0045',
      patientName: 'James Anderson',
      age: 45,
      gender: 'Male',
      ward: 'ICU',
      bedNumber: 'ICU-03',
      admissionDate: '2026-04-20',
      diagnosis: 'Post-surgical monitoring',
      attendingDoctor: 'Dr. Sarah Johnson',
      status: 'critical',
      daysAdmitted: 3,
      totalCharges: 150000
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
      diagnosis: 'Post-delivery care',
      attendingDoctor: 'Dr. Fatima Ibrahim',
      status: 'stable',
      daysAdmitted: 1,
      totalCharges: 12000
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
      diagnosis: 'Diabetes management',
      attendingDoctor: 'Dr. Michael Chen',
      status: 'recovering',
      daysAdmitted: 4,
      totalCharges: 20000
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
      diagnosis: 'Severe malaria',
      attendingDoctor: 'Dr. Amina Yusuf',
      status: 'recovering',
      daysAdmitted: 2,
      totalCharges: 16000
    }
  ]);

  const wardSections = [
    { value: 'ward-overview', label: 'Ward Overview', icon: Building2, color: 'text-blue-600' },
    { value: 'admit-patient', label: 'Admit Patient (In-ward)', icon: UserPlus, color: 'text-green-600' },
    { value: 'inward-patients', label: 'Manage In-ward Patients', icon: Users, color: 'text-purple-600' },
    { value: 'ward-transfer', label: 'Ward Transfer', icon: ArrowRightLeft, color: 'text-orange-600' },
    { value: 'discharge-patient', label: 'Discharge Patient (Out-ward)', icon: UserMinus, color: 'text-red-600' },
    { value: 'bed-management', label: 'Bed Management', icon: Bed, color: 'text-indigo-600' },
    { value: 'ward-round', label: 'Ward Round', icon: Plus, color: 'text-gray-600' },
  ];

  const contextAdmittedPatients: InwardPatient[] = admittedWardPatients
    .filter((patient) => !inwardPatients.some((existingPatient) => existingPatient.patientId === patient.patientId))
    .map((patient) => ({
      id: `ADMIT-${patient.patientId}`,
      patientId: patient.patientId,
      patientName: patient.patientName,
      age: patient.age,
      gender: patient.gender,
      ward: patient.ward || 'Pending Ward',
      bedNumber: patient.bedNumber || 'Pending Bed',
      admissionDate: patient.admissionDate || new Date().toISOString().split('T')[0],
      diagnosis: patient.diagnosis,
      attendingDoctor: patient.requestingDoctor,
      status: patient.priority === 'critical' ? 'critical' : patient.priority === 'urgent' ? 'recovering' : 'stable',
      daysAdmitted: 0,
      totalCharges: 0
    }));

  const allInwardPatients = [...inwardPatients, ...contextAdmittedPatients];

  const renderSection = () => {
    switch (selectedSection) {
      case 'ward-overview':
        return <WardOverview wards={wards} />;
      case 'admit-patient':
        return <AdmitPatient wards={wards} />;
      case 'inward-patients':
        return <InwardPatients patients={allInwardPatients} />;
      case 'ward-transfer':
        return <WardTransfer patients={allInwardPatients} wards={wards} />;
      case 'discharge-patient':
        return <DischargePatient patients={allInwardPatients} />;
      case 'bed-management':
        return <BedManagement wards={wards} selectedWardId={selectedWardId} setSelectedWardId={setSelectedWardId} />;
      case 'ward-round':
        return <WardRound wards={wards} />;
      default:
        return <WardOverview wards={wards} />;
    }
  };

  const totalBeds = wards.reduce((acc, ward) => acc + ward.capacity, 0);
  const totalOccupied = wards.reduce((acc, ward) => acc + ward.occupied, 0);
  const totalAvailable = wards.reduce((acc, ward) => acc + ward.available, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Bed className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{totalBeds}</div>
                <div className="text-blue-100 text-sm mt-1">Total Beds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{totalAvailable}</div>
                <div className="text-green-100 text-sm mt-1">Available Beds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{totalOccupied}</div>
                <div className="text-orange-100 text-sm mt-1">Occupied Beds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{Math.round((totalOccupied / totalBeds) * 100)}%</div>
                <div className="text-purple-100 text-sm mt-1">Occupancy Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card with Dropdown Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Ward & Nursing Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage patient admissions, ward transfers, and bed allocations
              </p>
            </div>
          </div>

          {/* Section Selector Dropdown */}
          <div className="mt-4">
            <Label htmlFor="section-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select Management Section
            </Label>
            <select
              id="section-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as WardSection)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {wardSections.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      {/* Dynamic Content Area */}
      <div className="mt-6">
        {renderSection()}
      </div>
    </div>
  );
}

// Ward Overview Component
function WardOverview({ wards }: { wards: Ward[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wards.map((ward) => {
        const occupancyRate = Math.round((ward.occupied / ward.capacity) * 100);
        const getOccupancyColor = () => {
          if (occupancyRate >= 90) return 'text-red-600 bg-red-50';
          if (occupancyRate >= 70) return 'text-orange-600 bg-orange-50';
          return 'text-green-600 bg-green-50';
        };

        return (
          <Card key={ward.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{ward.name}</CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {ward.type}
                  </Badge>
                </div>
                <div className={`p-2 rounded-lg ${getOccupancyColor()}`}>
                  <Bed className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{ward.capacity}</div>
                  <div className="text-xs text-blue-600 mt-1">Total Beds</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{ward.available}</div>
                  <div className="text-xs text-green-600 mt-1">Available</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Occupancy</span>
                  <span className={`text-sm font-semibold ${getOccupancyColor()}`}>
                    {occupancyRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      occupancyRate >= 90 ? 'bg-red-500' :
                      occupancyRate >= 70 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Daily Rate</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₦{ward.dailyRate.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Admit Patient Component
function AdmitPatient({ wards }: { wards: Ward[] }) {
  const { assignWardAdmission, getPendingAdmissionRequests } = useAdmission();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [wardId, setWardId] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [admissionTime, setAdmissionTime] = useState(new Date().toTimeString().slice(0, 5));
  const [assignedByNurse, setAssignedByNurse] = useState('');

  const pendingAdmissionRequests = getPendingAdmissionRequests();
  const selectedRequest = pendingAdmissionRequests.find((patient) => patient.patientId === selectedRequestId);
  const selectedWard = wards.find((ward) => ward.id === wardId);
  const availableBeds = selectedWard?.beds.filter((bed) => bed.status === 'available') || [];

  const handleAdmit = () => {
    if (!selectedRequest) {
      toast.error('Please select a doctor-initiated admission request');
      return;
    }

    if (!selectedWard || !bedNumber) {
      toast.error('Please choose a ward and bed for this patient');
      return;
    }

    if (!assignedByNurse.trim()) {
      toast.error('Please enter the nurse completing the ward admission');
      return;
    }

    assignWardAdmission(selectedRequest.patientId, {
      ward: selectedWard.name,
      bedNumber,
      admissionDate,
      admissionTime,
      assignedByNurse
    });

    toast.success(`Patient ${selectedRequest.patientName} admitted to ${selectedWard.name} - Bed ${bedNumber}`);

    setSelectedRequestId('');
    setWardId('');
    setBedNumber('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setAdmissionTime(new Date().toTimeString().slice(0, 5));
    setAssignedByNurse('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-600" />
          <CardTitle>Doctor Admission Queue to Ward</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Doctor Admission Request</h3>

            <div>
              <Label>Select Doctor Admission Request *</Label>
              <select
                value={selectedRequestId}
                onChange={(e) => {
                  setSelectedRequestId(e.target.value);
                  setWardId('');
                  setBedNumber('');
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Doctor-Initiated Admission --</option>
                {pendingAdmissionRequests.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.patientName} ({patient.patientId}) - Requested by {patient.requestingDoctor}
                  </option>
                ))}
              </select>
              {pendingAdmissionRequests.length === 0 && (
                <p className="mt-2 text-sm text-orange-600">
                  No doctor-initiated admission requests are waiting for ward assignment.
                </p>
              )}
            </div>

            <div>
              <Label>Patient Name *</Label>
              <Input
                value={selectedRequest?.patientName || ''}
                readOnly
                placeholder="Patient name will load from doctor request"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={selectedRequest?.age || ''}
                  readOnly
                  placeholder="Age"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Input
                  value={selectedRequest?.gender || ''}
                  readOnly
                  placeholder="Gender"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Diagnosis *</Label>
              <Input
                value={selectedRequest?.diagnosis || ''}
                readOnly
                placeholder="Diagnosis from doctor request"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Requesting Doctor</Label>
              <Input
                value={selectedRequest?.requestingDoctor || ''}
                readOnly
                placeholder="Doctor name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Admission Reason</Label>
              <textarea
                value={selectedRequest?.admissionReason || ''}
                readOnly
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <Label>Treatment Plan</Label>
              <textarea
                value={selectedRequest?.treatmentPlan || ''}
                readOnly
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Ward & Bed Assignment</h3>

            <div>
              <Label>Select Ward *</Label>
              <select
                value={wardId}
                onChange={(e) => {
                  setWardId(e.target.value);
                  setBedNumber('');
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Ward --</option>
                {wards.map(ward => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name} ({ward.available} beds available)
                  </option>
                ))}
              </select>
            </div>

            {selectedWard && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-sm text-blue-600">Total Beds</div>
                      <div className="text-2xl font-bold text-blue-900">{selectedWard.capacity}</div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600">Available</div>
                      <div className="text-2xl font-bold text-green-900">{selectedWard.available}</div>
                    </div>
                    <div>
                      <div className="text-sm text-orange-600">Occupied</div>
                      <div className="text-2xl font-bold text-orange-900">{selectedWard.occupied}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Select Bed *</Label>
                  <select
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Bed --</option>
                    {availableBeds.map(bed => (
                      <option key={bed.id} value={bed.bedNumber}>
                        Bed {bed.bedNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-600 mb-1">Daily Ward Charge</div>
                  <div className="text-2xl font-bold text-orange-900">
                    ₦{selectedWard.dailyRate.toLocaleString()}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Admission Date</Label>
                <Input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Admission Time</Label>
                <Input
                  type="time"
                  value={admissionTime}
                  onChange={(e) => setAdmissionTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Admitting Nurse *</Label>
              <Input
                value={assignedByNurse}
                onChange={(e) => setAssignedByNurse(e.target.value)}
                placeholder="Enter nurse name"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={handleAdmit}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 text-lg font-semibold"
            disabled={!selectedRequest}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Assign Ward and Admit Patient
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// In-ward Patients Component
function InwardPatients({ patients }: { patients: InwardPatient[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWard = filterWard === 'all' || patient.ward === filterWard;
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesWard && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <CardTitle>In-ward Patients</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Wards</option>
            <option value="ICU">ICU</option>
            <option value="General Ward A">General Ward A</option>
            <option value="Private Ward">Private Ward</option>
            <option value="Maternity Ward">Maternity Ward</option>
            <option value="Pediatric Ward">Pediatric Ward</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="stable">Stable</option>
            <option value="critical">Critical</option>
            <option value="recovering">Recovering</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{patient.patientName}</h3>
                      <Badge variant={
                        patient.status === 'critical' ? 'destructive' :
                        patient.status === 'stable' ? 'default' :
                        'secondary'
                      }>
                        {patient.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Patient ID:</span>
                        <p className="font-medium">{patient.patientId}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Age / Gender:</span>
                        <p className="font-medium">{patient.age} / {patient.gender}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ward / Bed:</span>
                        <p className="font-medium">{patient.ward} - {patient.bedNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Admitted:</span>
                        <p className="font-medium">{patient.daysAdmitted} days</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Diagnosis:</span>
                        <p className="font-medium">{patient.diagnosis}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Attending Doctor:</span>
                        <p className="font-medium">{patient.attendingDoctor}</p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="text-sm text-gray-600 mb-1">Total Charges</div>
                    <div className="text-xl font-bold text-gray-900">
                      ₦{patient.totalCharges.toLocaleString()}
                    </div>
                    <Button size="sm" variant="outline" className="mt-3">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No patients found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Ward Transfer Component
function WardTransfer({ patients, wards }: { patients: InwardPatient[], wards: Ward[] }) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newWardId, setNewWardId] = useState('');
  const [newBedNumber, setNewBedNumber] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedWard = wards.find(w => w.id === newWardId);
  const availableBeds = selectedWard?.beds.filter(b => b.status === 'available') || [];

  const handleTransfer = () => {
    if (!selectedPatientId || !newWardId || !newBedNumber) {
      toast.error('Please complete all transfer details');
      return;
    }

    toast.success(`Patient transferred successfully to ${selectedWard?.name} - Bed ${newBedNumber}`);

    setSelectedPatientId('');
    setNewWardId('');
    setNewBedNumber('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-orange-600" />
          <CardTitle>Ward Transfer</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Select Patient to Transfer *</Label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.patientName} ({patient.patientId}) - Current: {patient.ward} - {patient.bedNumber}
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Current Assignment</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Patient:</span>
                  <p className="font-medium text-gray-900">{selectedPatient.patientName}</p>
                </div>
                <div>
                  <span className="text-blue-600">Patient ID:</span>
                  <p className="font-medium text-gray-900">{selectedPatient.patientId}</p>
                </div>
                <div>
                  <span className="text-blue-600">Current Ward:</span>
                  <p className="font-medium text-gray-900">{selectedPatient.ward}</p>
                </div>
                <div>
                  <span className="text-blue-600">Current Bed:</span>
                  <p className="font-medium text-gray-900">{selectedPatient.bedNumber}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Transfer to Ward *</Label>
            <select
              value={newWardId}
              onChange={(e) => {
                setNewWardId(e.target.value);
                setNewBedNumber('');
              }}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose New Ward --</option>
              {wards.map(ward => (
                <option key={ward.id} value={ward.id}>
                  {ward.name} ({ward.available} beds available)
                </option>
              ))}
            </select>
          </div>

          {selectedWard && (
            <>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-sm text-green-600">Available Beds</div>
                    <div className="text-2xl font-bold text-green-900">{selectedWard.available}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Ward Type</div>
                    <div className="text-lg font-bold text-blue-900">{selectedWard.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-orange-600">Daily Rate</div>
                    <div className="text-lg font-bold text-orange-900">₦{selectedWard.dailyRate.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Select New Bed *</Label>
                <select
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Bed --</option>
                  {availableBeds.map(bed => (
                    <option key={bed.id} value={bed.bedNumber}>
                      Bed {bed.bedNumber}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Button
            onClick={handleTransfer}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-6 text-lg font-semibold"
          >
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Transfer Patient to New Ward
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Discharge Patient Component
function DischargePatient({ patients }: { patients: InwardPatient[] }) {
  const { addNurseDischarge, getPendingNursingReview } = useDischarge();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [showDischargeForm, setShowDischargeForm] = useState(false);

  // Discharge form fields
  const [medicationCollected, setMedicationCollected] = useState(false);
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [treatmentSummary, setTreatmentSummary] = useState('');
  const [homeCareInstructions, setHomeCareInstructions] = useState('');
  const [prescriptionDetails, setPrescriptionDetails] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpDoctor, setFollowUpDoctor] = useState('');
  const [nextOfKinNotified, setNextOfKinNotified] = useState(false);
  const [dischargedBy, setDischargedBy] = useState('');
  const [dischargeTime, setDischargeTime] = useState('');

  const pendingDoctorDischarges = getPendingNursingReview();
  const selectedDischargeRequest = pendingDoctorDischarges.find((p) => p.patientId === selectedPatientId);
  const matchingInwardPatient = patients.find((p) => p.patientId === selectedPatientId);
  const selectedPatient = selectedDischargeRequest
    ? {
        ...selectedDischargeRequest,
        ward: matchingInwardPatient?.ward || selectedDischargeRequest.ward,
        bedNumber: matchingInwardPatient?.bedNumber || selectedDischargeRequest.bedNumber,
        daysAdmitted: matchingInwardPatient?.daysAdmitted ?? selectedDischargeRequest.daysAdmitted,
        totalCharges: matchingInwardPatient?.totalCharges ?? selectedDischargeRequest.totalCharges,
        attendingDoctor: matchingInwardPatient?.attendingDoctor || selectedDischargeRequest.attendingDoctor,
      }
    : undefined;

  const handleProceedToDischarge = () => {
    if (!selectedPatientId) {
      toast.error('Please select a doctor-initiated discharge first');
      return;
    }
    setShowDischargeForm(true);
    toast.info('Please review treatment and complete the nursing discharge form');
  };

  const handleDischarge = () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient to discharge');
      return;
    }

    if (!dischargeDiagnosis.trim()) {
      toast.error('Please enter discharge diagnosis');
      return;
    }

    if (!treatmentSummary.trim()) {
      toast.error('Please enter treatment summary');
      return;
    }

    if (!homeCareInstructions.trim()) {
      toast.error('Please enter home care instructions');
      return;
    }

    if (!dischargedBy.trim()) {
      toast.error('Please enter name of discharging nurse');
      return;
    }

    if (!dischargeTime) {
      toast.error('Please select discharge time');
      return;
    }

    // Add to discharge context for reception final discharge
    if (selectedPatient) {
      addNurseDischarge({
        id: selectedPatient.id,
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.patientName,
        cardNumber: selectedPatient.cardNumber,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        admissionDate: selectedPatient.admissionDate,
        ward: selectedPatient.ward,
        bedNumber: selectedPatient.bedNumber,
        daysAdmitted: selectedPatient.daysAdmitted,
        diagnosis: selectedPatient.diagnosis,
        attendingDoctor: selectedPatient.attendingDoctor,
        totalCharges: selectedPatient.totalCharges,
        dischargedBy,
        dischargeTime,
        dischargeDiagnosis,
        treatmentSummary,
        homeCareInstructions,
        prescriptionDetails,
        followUpRequired,
        followUpDate,
        followUpDoctor,
        nextOfKinNotified,
        medicationCollected,
        nurseDischargeDate: new Date().toISOString(),
        status: 'pending-payment-verification'
      });
    }

    toast.success(`Patient ${selectedPatient?.patientName} discharged by nurse successfully`, {
      description: 'Patient sent to Reception for payment verification and final discharge processing',
      duration: 5000
    });

    // Reset form
    setSelectedPatientId('');
    setDischargeNotes('');
    setShowDischargeForm(false);
    setMedicationCollected(false);
    setDischargeDiagnosis('');
    setTreatmentSummary('');
    setHomeCareInstructions('');
    setPrescriptionDetails('');
    setFollowUpRequired(false);
    setFollowUpDate('');
    setFollowUpDoctor('');
    setNextOfKinNotified(false);
    setDischargedBy('');
    setDischargeTime('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserMinus className="w-5 h-5 text-red-600" />
          <CardTitle>Discharge Patient (Out-ward)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Select Doctor-Initiated Discharge *</Label>
            <select
              value={selectedPatientId}
              onChange={(e) => {
                setSelectedPatientId(e.target.value);
                setShowDischargeForm(false);
              }}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Doctor-Initiated Discharge --</option>
              {pendingDoctorDischarges.map(patient => (
                <option key={patient.patientId} value={patient.patientId}>
                  {patient.patientName} ({patient.patientId}) - {patient.ward} - Initiated by: {patient.doctorInitiatedBy || patient.dischargedBy}
                </option>
              ))}
            </select>
            {pendingDoctorDischarges.length === 0 && (
              <p className="mt-2 text-sm text-orange-600">
                No doctor-initiated discharge requests are waiting for nursing review.
              </p>
            )}
          </div>

          {selectedPatient && (
            <>
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-4">Patient Discharge Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600">Patient Name:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.patientName}</p>
                  </div>
                  <div>
                    <span className="text-purple-600">Patient ID:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.patientId}</p>
                  </div>
                  <div>
                    <span className="text-purple-600">Ward / Bed:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.ward} - {selectedPatient.bedNumber}</p>
                  </div>
                  <div>
                    <span className="text-purple-600">Days Admitted:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.daysAdmitted} days</p>
                  </div>
                  <div>
                    <span className="text-purple-600">Admission Diagnosis:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.diagnosis}</p>
                  </div>
                  <div>
                    <span className="text-purple-600">Attending Doctor:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.attendingDoctor}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-purple-600">Total Charges:</span>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{selectedPatient.totalCharges.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-purple-600">Doctor Initiated By:</span>
                    <p className="font-medium text-gray-900">{selectedPatient.doctorInitiatedBy || selectedPatient.dischargedBy}</p>
                  </div>
                </div>
              </div>

              {/* Nursing Review Section */}
              <div className="p-4 border-2 rounded-lg bg-blue-50 border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Nursing Review Stage</h4>
                      <p className="text-sm text-gray-600">
                        Review treatment completion and save the nursing discharge summary before Reception handles payment verification.
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    Awaiting Nursing Review
                  </Badge>
                </div>
              </div>

              {/* Proceed to Discharge Form Button */}
              {!showDischargeForm && (
                <Button
                  onClick={handleProceedToDischarge}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-6 text-lg font-semibold"
                >
                  <Clipboard className="w-5 h-5 mr-2" />
                  Proceed to Nursing Discharge Form
                </Button>
              )}

              {/* Comprehensive Discharge Form */}
              {showDischargeForm && (
                <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-indigo-200">
                    <Clipboard className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-indigo-900">Patient Discharge Form</h3>
                  </div>

                  {/* Discharge Diagnosis */}
                  <div>
                    <Label className="text-gray-900 font-semibold">Discharge Diagnosis *</Label>
                    <Input
                      value={dischargeDiagnosis}
                      onChange={(e) => setDischargeDiagnosis(e.target.value)}
                      placeholder="Final diagnosis at discharge"
                      className="mt-1"
                    />
                  </div>

                  {/* Treatment Summary */}
                  <div>
                    <Label className="text-gray-900 font-semibold">Treatment Summary *</Label>
                    <textarea
                      value={treatmentSummary}
                      onChange={(e) => setTreatmentSummary(e.target.value)}
                      placeholder="Summary of treatments, procedures, and interventions during admission..."
                      rows={4}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Home Care Instructions */}
                  <div>
                    <Label className="text-gray-900 font-semibold">Home Care Instructions *</Label>
                    <textarea
                      value={homeCareInstructions}
                      onChange={(e) => setHomeCareInstructions(e.target.value)}
                      placeholder="Detailed instructions for patient care at home, activity restrictions, diet, etc..."
                      rows={4}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Prescription Details */}
                  <div>
                    <Label className="text-gray-900 font-semibold">Prescription & Medications</Label>
                    <textarea
                      value={prescriptionDetails}
                      onChange={(e) => setPrescriptionDetails(e.target.value)}
                      placeholder="List of medications prescribed, dosage, and duration..."
                      rows={3}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Medication Collection Status */}
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="medicationCollected"
                      checked={medicationCollected}
                      onChange={(e) => setMedicationCollected(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="medicationCollected" className="text-gray-900 font-medium cursor-pointer">
                      Medications collected from Pharmacy
                    </label>
                  </div>

                  {/* Follow-up Section */}
                  <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="followUpRequired"
                        checked={followUpRequired}
                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="followUpRequired" className="text-gray-900 font-medium cursor-pointer">
                        Follow-up appointment required
                      </label>
                    </div>

                    {followUpRequired && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <Label className="text-gray-900">Follow-up Date</Label>
                          <Input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-900">Follow-up Doctor</Label>
                          <Input
                            value={followUpDoctor}
                            onChange={(e) => setFollowUpDoctor(e.target.value)}
                            placeholder="Doctor's name"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next of Kin Notification */}
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="nextOfKinNotified"
                      checked={nextOfKinNotified}
                      onChange={(e) => setNextOfKinNotified(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="nextOfKinNotified" className="text-gray-900 font-medium cursor-pointer">
                      Next of kin notified and present
                    </label>
                  </div>

                  {/* Discharge Authorization */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <Label className="text-gray-900 font-semibold">Discharged By (Nurse Name) *</Label>
                      <Input
                        value={dischargedBy}
                        onChange={(e) => setDischargedBy(e.target.value)}
                        placeholder="Full name of discharging nurse"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 font-semibold">Discharge Time *</Label>
                      <Input
                        type="time"
                        value={dischargeTime}
                        onChange={(e) => setDischargeTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Label className="text-gray-900 font-semibold">Additional Discharge Notes</Label>
                    <textarea
                      value={dischargeNotes}
                      onChange={(e) => setDischargeNotes(e.target.value)}
                      placeholder="Any additional notes, warnings, or special instructions..."
                      rows={3}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Discharge Checklist */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-2">Pre-Discharge Checklist</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li className="text-green-700">
                            ✓ Doctor has initiated discharge
                          </li>
                          <li className={medicationCollected ? 'text-green-700' : ''}>
                            {medicationCollected ? '✓' : '○'} Medications collected from Pharmacy
                          </li>
                          <li className={dischargeDiagnosis ? 'text-green-700' : ''}>
                            {dischargeDiagnosis ? '✓' : '○'} Discharge diagnosis documented
                          </li>
                          <li className={treatmentSummary ? 'text-green-700' : ''}>
                            {treatmentSummary ? '✓' : '○'} Treatment summary completed
                          </li>
                          <li className={homeCareInstructions ? 'text-green-700' : ''}>
                            {homeCareInstructions ? '✓' : '○'} Home care instructions provided
                          </li>
                          <li className={dischargedBy && dischargeTime ? 'text-green-700' : ''}>
                            {dischargedBy && dischargeTime ? '✓' : '○'} Discharge authorization completed
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Discharge Button */}
                  <Button
                    onClick={handleDischarge}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-6 text-lg font-semibold shadow-lg"
                  >
                    <UserMinus className="w-5 h-5 mr-2" />
                    Complete Discharge & Release Patient
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Bed Management Component
function BedManagement({ wards, selectedWardId, setSelectedWardId }: {
  wards: Ward[],
  selectedWardId: string,
  setSelectedWardId: (id: string) => void
}) {
  const selectedWard = wards.find(w => w.id === selectedWardId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bed className="w-5 h-5 text-indigo-600" />
          <CardTitle>Bed Management</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Select Ward *</Label>
            <select
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Ward --</option>
              {wards.map(ward => (
                <option key={ward.id} value={ward.id}>
                  {ward.name} - {ward.type}
                </option>
              ))}
            </select>
          </div>

          {selectedWard && (
            <>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-indigo-600">Total Beds</div>
                    <div className="text-2xl font-bold text-indigo-900">{selectedWard.capacity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600">Available</div>
                    <div className="text-2xl font-bold text-green-900">{selectedWard.available}</div>
                  </div>
                  <div>
                    <div className="text-sm text-orange-600">Occupied</div>
                    <div className="text-2xl font-bold text-orange-900">{selectedWard.occupied}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Occupancy</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round((selectedWard.occupied / selectedWard.capacity) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {selectedWard.beds.map((bed) => (
                  <button
                    key={bed.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bed.status === 'available'
                        ? 'bg-green-50 border-green-300 hover:bg-green-100' :
                      bed.status === 'occupied'
                        ? 'bg-red-50 border-red-300 cursor-not-allowed' :
                      bed.status === 'maintenance'
                        ? 'bg-yellow-50 border-yellow-300' :
                        'bg-blue-50 border-blue-300'
                    }`}
                    disabled={bed.status === 'occupied'}
                  >
                    <Bed className={`w-6 h-6 mx-auto mb-1 ${
                      bed.status === 'available' ? 'text-green-600' :
                      bed.status === 'occupied' ? 'text-red-600' :
                      bed.status === 'maintenance' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div className="text-xs font-medium text-gray-700">{bed.bedNumber}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-6 justify-center pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-300 rounded"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-300 rounded"></div>
                  <span className="text-sm text-gray-600">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                  <span className="text-sm text-gray-600">Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-300 rounded"></div>
                  <span className="text-sm text-gray-600">Reserved</span>
                </div>
              </div>
            </>
          )}

          {!selectedWard && (
            <div className="text-center py-12 text-gray-500">
              <Bed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a ward to view bed management</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
