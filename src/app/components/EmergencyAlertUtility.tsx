import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { AlertTriangle, Send, Search, Filter, Heart, User, Phone, Activity } from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';
import { toast } from 'sonner';

export function EmergencyAlertUtility() {
  const { addEmergencyPatient } = useEmergency();
  
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
    },
    {
      id: 'DOC-002',
      name: 'Dr. Michael Chen',
      specialty: 'Emergency Medicine',
      status: 'available',
      currentPatients: 2,
      maxPatients: 8,
    },
    {
      id: 'DOC-003',
      name: 'Dr. Amaka Okonkwo',
      specialty: 'General Practice',
      status: 'available',
      currentPatients: 5,
      maxPatients: 12,
    },
    {
      id: 'DOC-004',
      name: 'Dr. James Anderson',
      specialty: 'Neurology',
      status: 'busy',
      currentPatients: 8,
      maxPatients: 10,
    },
    {
      id: 'DOC-005',
      name: 'Dr. Fatima Ibrahim',
      specialty: 'Cardiology',
      status: 'available',
      currentPatients: 4,
      maxPatients: 10,
    },
    {
      id: 'DOC-006',
      name: 'Dr. David Okonjo',
      specialty: 'Orthopedics',
      status: 'available',
      currentPatients: 2,
      maxPatients: 8,
    },
    {
      id: 'DOC-007',
      name: 'Dr. Grace Eze',
      specialty: 'Pediatrics',
      status: 'busy',
      currentPatients: 6,
      maxPatients: 8,
    },
    {
      id: 'DOC-008',
      name: 'Dr. Peter Adebayo',
      specialty: 'Emergency Medicine',
      status: 'available',
      currentPatients: 1,
      maxPatients: 8,
    },
    {
      id: 'DOC-009',
      name: 'Dr. Aisha Bello',
      specialty: 'Internal Medicine',
      status: 'available',
      currentPatients: 3,
      maxPatients: 10,
    },
    {
      id: 'DOC-010',
      name: 'Dr. Emmanuel Nwosu',
      specialty: 'Surgery',
      status: 'in-surgery',
      currentPatients: 1,
      maxPatients: 6,
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

    // Create emergency patient object
    const emergencyPatient = {
      id: `EMERG-${Date.now()}`,
      patientId: `PT-2026-EMG-${String(Date.now()).slice(-4)}`,
      name: emergencyPatientData.name,
      age: parseInt(emergencyPatientData.age),
      gender: emergencyPatientData.gender,
      phone: emergencyPatientData.phone,
      emergencyType: emergencyPatientData.emergencyType,
      severity: emergencyPatientData.severity,
      chiefComplaint: emergencyPatientData.chiefComplaint,
      vitalSigns: {
        bloodPressure: emergencyPatientData.bloodPressure || undefined,
        heartRate: emergencyPatientData.heartRate || undefined,
        temperature: emergencyPatientData.temperature || undefined,
        oxygenSaturation: emergencyPatientData.oxygenSaturation || undefined,
      },
      timestamp: new Date().toISOString(),
      alertedAt: new Date(),
      alertedDoctors: alertedDoctors.map(d => d.id),
    };

    // Add emergency patient to global context
    addEmergencyPatient(emergencyPatient);

    // Success messages
    const doctorNames = alertedDoctors.map(d => d.name).join(', ');
    const alertMessage = alertAllDoctors
      ? `🚨 EMERGENCY ALERT sent to ALL active doctors (${alertedDoctors.length} doctors)!`
      : `🚨 EMERGENCY ALERT sent to: ${doctorNames}`;

    toast.success(alertMessage, {
      duration: 5000,
    });

    toast.info(`Emergency patient ${emergencyPatientData.name} registered and alerted`, {
      duration: 4000,
    });

    // Reset form
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          Emergency Alert to Doctors
        </h3>
        <p className="text-sm text-gray-600">
          Register emergency patient and send immediate alert to available doctors
        </p>
      </div>

      {/* Patient Information */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 text-red-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Emergency Patient Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Patient Name <span className="text-red-600">*</span>
              </label>
              <Input
                value={emergencyPatientData.name}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, name: e.target.value })}
                placeholder="Enter patient's full name..."
                className="text-base py-6"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Age <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                value={emergencyPatientData.age}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, age: e.target.value })}
                placeholder="Patient's age..."
                className="text-base py-6"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Gender <span className="text-red-600">*</span>
              </label>
              <select
                value={emergencyPatientData.gender}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <Input
                value={emergencyPatientData.phone}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, phone: e.target.value })}
                placeholder="Patient's phone number..."
                className="text-base py-6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Details */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 text-orange-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Emergency Type <span className="text-red-600">*</span>
              </label>
              <select
                value={emergencyPatientData.emergencyType}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, emergencyType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
              >
                <option value="">Select Emergency Type...</option>
                <option value="Cardiac">Cardiac Emergency</option>
                <option value="Respiratory">Respiratory Emergency</option>
                <option value="Neurological">Neurological Emergency</option>
                <option value="Traumatic">Traumatic Injury</option>
                <option value="Other">Other Emergency</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Severity Level <span className="text-red-600">*</span>
              </label>
              <select
                value={emergencyPatientData.severity}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, severity: e.target.value as 'critical' | 'severe' | 'moderate' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
              >
                <option value="critical">Critical</option>
                <option value="severe">Severe</option>
                <option value="moderate">Moderate</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold mb-2 block">
                Chief Complaint <span className="text-red-600">*</span>
              </label>
              <textarea
                value={emergencyPatientData.chiefComplaint}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, chiefComplaint: e.target.value })}
                placeholder="Describe the emergency situation..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs (Optional) */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vital Signs (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Blood Pressure
              </label>
              <Input
                value={emergencyPatientData.bloodPressure}
                onChange={(e) => setEmergencyPatientData({ ...emergencyPatientData, bloodPressure: e.target.value })}
                placeholder="e.g., 120/80 mmHg"
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
                placeholder="e.g., 75 bpm"
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
                placeholder="e.g., 37.5°C"
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
                placeholder="e.g., 98%"
                className="text-base py-6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Selection */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Select Doctors to Alert
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-blue-300">
              <input
                type="checkbox"
                checked={alertAllDoctors}
                onChange={() => setAlertAllDoctors(!alertAllDoctors)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label className="text-base font-bold text-blue-900 cursor-pointer">
                🚨 Alert All Available Doctors (Recommended for Critical Emergencies)
              </label>
            </div>
            
            {!alertAllDoctors && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedDoctors.length === availableDoctors.filter(d => d.status === 'available').length}
                    onChange={handleSelectAllAvailableDoctors}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label className="text-sm font-semibold cursor-pointer">
                    Select All Available Doctors
                  </label>
                </div>

                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      className="w-full pl-11 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      {specialties.map(specialty => (
                        <option key={specialty} value={specialty}>
                          {specialty === 'all' ? 'All Specialties' : specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Doctor List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        className={`flex items-center gap-3 p-4 bg-white rounded-lg border-2 transition-all cursor-pointer ${
                          selectedDoctors.includes(doctor.id) 
                            ? 'border-blue-500 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleDoctorSelection(doctor.id)}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {doctor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-base">{doctor.name}</p>
                            {getStatusBadge()}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{doctor.specialty}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Patients: {doctor.currentPatients}/{doctor.maxPatients}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
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
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>

                {filteredDoctors.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No doctors found matching your search criteria</p>
                  </div>
                )}

                {!alertAllDoctors && selectedDoctors.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">
                      ✓ {selectedDoctors.length} doctor(s) selected for alert
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleEmergencyAlert}
          className="flex-1 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white py-7 text-lg font-bold shadow-lg"
        >
          <Send className="w-6 h-6 mr-2" />
          Send Emergency Alert Now
        </Button>
        <Button
          variant="outline"
          onClick={() => {
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
          }}
          className="px-8 py-7 text-base font-semibold"
        >
          Clear Form
        </Button>
      </div>
    </div>
  );
}
