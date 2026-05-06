import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Stethoscope,
  Users,
  ClipboardList,
  AlertCircle,
  Search,
  Plus,
  Send,
  FileText,
  Pill,
  FlaskConical,
  UserCog
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DoctorsUnit } from './DoctorsUnit';
import { usePatientQueue } from '../context/PatientQueueContext';
import { toast } from 'sonner';

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
  vitalSigns?: {
    bp: string;
    temp: string;
    pulse: string;
    weight: string;
  };
}

export function Clinical() {
  const { patientQueue, updatePatientStatus } = usePatientQueue();
  const [activeSection, setActiveSection] = useState<'consultations' | 'doctors-unit'>('consultations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Consultation | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');

  // List of available doctors from the system
  const availableDoctors = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Fatima Ibrahim',
    'Dr. Amina Yusuf',
    'Dr. James Okafor',
  ];

  // Filter consultations based on selected doctor
  const consultations: Consultation[] = patientQueue
    .filter(patient => selectedDoctor === 'all' || patient.assignedDoctor === selectedDoctor)
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
      vitalSigns: {
        bp: patient.vitalSigns.bp,
        temp: patient.vitalSigns.temp,
        pulse: patient.vitalSigns.pulse,
        weight: patient.vitalSigns.weight,
      }
    }));

  const [medications] = useState([
    { id: '1', name: 'Paracetamol 500mg', category: 'Analgesic' },
    { id: '2', name: 'Amoxicillin 500mg', category: 'Antibiotic' },
    { id: '3', name: 'Ibuprofen 400mg', category: 'NSAID' },
    { id: '4', name: 'Metformin 500mg', category: 'Antidiabetic' },
  ]);

  const [labTests] = useState([
    { id: '1', name: 'Complete Blood Count (CBC)', category: 'Hematology' },
    { id: '2', name: 'Blood Sugar (Fasting)', category: 'Biochemistry' },
    { id: '3', name: 'Malaria Test', category: 'Parasitology' },
    { id: '4', name: 'Urinalysis', category: 'Clinical Chemistry' },
  ]);

  const stats = [
    {
      label: 'Today\'s Consultations',
      value: consultations.length.toString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'Pending',
      value: consultations.filter(c => c.status === 'pending').length.toString(),
      icon: ClipboardList,
      color: 'bg-orange-500'
    },
    {
      label: 'In Progress',
      value: consultations.filter(c => c.status === 'in-progress').length.toString(),
      icon: Stethoscope,
      color: 'bg-green-500'
    },
    {
      label: 'Completed',
      value: consultations.filter(c => c.status === 'completed').length.toString(),
      icon: AlertCircle,
      color: 'bg-green-600'
    },
  ];

  const filteredConsultations = consultations.filter(consultation =>
    consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    consultation.cardNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Clinical Department</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage consultations, doctors, and medical staff
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeSection === 'consultations' ? 'default' : 'outline'}
              onClick={() => setActiveSection('consultations')}
              className={activeSection === 'consultations' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Consultations
            </Button>
            <Button
              variant={activeSection === 'doctors-unit' ? 'default' : 'outline'}
              onClick={() => setActiveSection('doctors-unit')}
              className={activeSection === 'doctors-unit' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Doctors Unit / Medical Officers
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Consultations Section */}
      {activeSection === 'consultations' && (
        <>
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

      {/* Doctor Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold whitespace-nowrap">Filter by Doctor:</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors ({patientQueue.length} patients)</SelectItem>
                {availableDoctors.map((doctor) => {
                  const count = patientQueue.filter(p => p.assignedDoctor === doctor).length;
                  return (
                    <SelectItem key={doctor} value={doctor}>
                      {doctor} ({count} {count === 1 ? 'patient' : 'patients'})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Patient Queue</CardTitle>
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
                  onClick={() => setSelectedPatient(consultation)}
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
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No patients in queue</p>
                  <p className="text-xs mt-1">
                    {selectedDoctor === 'all'
                      ? 'Patients routed from Vital Signs will appear here'
                      : `No patients assigned to ${selectedDoctor}`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consultation Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPatient ? `Consultation - ${selectedPatient.patientName}` : 'Select a Patient'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <Tabs defaultValue="consultation">
                <TabsList>
                  <TabsTrigger value="consultation">Consultation</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  <TabsTrigger value="lab-tests">Lab Tests</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="consultation" className="space-y-4 mt-4">
                  {/* Status Control */}
                  <div className="flex gap-2">
                    {selectedPatient.status === 'pending' && (
                      <Button
                        onClick={() => {
                          updatePatientStatus(selectedPatient.patientId, 'in-progress');
                          toast.success('Consultation started');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Consultation
                      </Button>
                    )}
                    {selectedPatient.status === 'in-progress' && (
                      <Badge className="bg-green-600 text-white px-4 py-2">
                        Consultation In Progress
                      </Badge>
                    )}
                    {selectedPatient.status === 'completed' && (
                      <Badge className="bg-blue-600 text-white px-4 py-2">
                        Consultation Completed
                      </Badge>
                    )}
                  </div>

                  {/* Patient Routing Info */}
                  {(() => {
                    const fullPatientData = patientQueue.find(p => p.id === selectedPatient.id);
                    if (fullPatientData) {
                      return (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Routing Information</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Department</p>
                                <p className="font-semibold text-gray-900">{fullPatientData.department}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Consulting Room</p>
                                <p className="font-semibold text-gray-900">{fullPatientData.consultingRoom}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Routed By</p>
                                <p className="font-semibold text-gray-900">{fullPatientData.routedBy}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Routed At</p>
                                <p className="font-semibold text-gray-900">
                                  {new Date(fullPatientData.routedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    return null;
                  })()}

                  {/* Vital Signs */}
                  {selectedPatient.vitalSigns && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Vital Signs</p>
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

                  <div>
                    <Label>Chief Complaint</Label>
                    <Textarea
                      defaultValue={selectedPatient.chiefComplaint}
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Symptoms / Clinical Notes</Label>
                    <Textarea
                      placeholder="Document symptoms, examination findings..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Diagnosis</Label>
                    <Textarea
                      placeholder="Enter diagnosis..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Treatment Plan</Label>
                    <Textarea
                      placeholder="Document treatment recommendations..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (selectedPatient) {
                        updatePatientStatus(selectedPatient.patientId, 'completed');
                        toast.success(`Consultation completed for ${selectedPatient.patientName}`);
                        setSelectedPatient(null);
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Save Consultation
                  </Button>
                </TabsContent>

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
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">Selected Medications (0)</p>
                    <p className="text-sm text-gray-600">No medications added yet</p>
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send to Pharmacy
                  </Button>
                </TabsContent>

                <TabsContent value="lab-tests" className="space-y-4 mt-4">
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
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-purple-800 mb-2">Selected Tests (0)</p>
                    <p className="text-sm text-gray-600">No tests requested yet</p>
                  </div>

                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send to Laboratory
                  </Button>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No previous consultations</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a patient from the queue to begin consultation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* Doctors Unit Section */}
      {activeSection === 'doctors-unit' && <DoctorsUnit />}
    </div>
  );
}
