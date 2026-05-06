import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Stethoscope,
  UserCog,
  Users,
  UserPlus,
  Search,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Award,
  Briefcase,
  BookOpen,
  Building2,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  yearsOfExperience: number;
  status: 'active' | 'inactive' | 'on-leave';
  type: 'residential' | 'visiting-consultant';
  department: string;
  consultationFee?: number;
  availability?: string;
  joinDate: string;
}

interface MedicalOfficer {
  id: string;
  fullName: string;
  qualification: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  yearsOfExperience: number;
  status: 'active' | 'inactive' | 'on-leave';
  department: string;
  joinDate: string;
  shift?: string;
}

export function DoctorsUnit() {
  const [activeSection, setActiveSection] = useState<'doctors' | 'medical-officers'>('doctors');
  const [doctorType, setDoctorType] = useState<'all' | 'residential' | 'visiting-consultant'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddMOOpen, setIsAddMOOpen] = useState(false);

  // Mock Data - Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: 'DR-001',
      fullName: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology)',
      licenseNumber: 'MDC-12345',
      phoneNumber: '08012345678',
      email: 'sarah.johnson@akobi.com',
      address: 'Plot 12, Victoria Island, Lagos',
      yearsOfExperience: 12,
      status: 'active',
      type: 'residential',
      department: 'Cardiology',
      joinDate: '2020-01-15',
    },
    {
      id: 'DR-002',
      fullName: 'Dr. Michael Chen',
      specialization: 'General Medicine',
      qualification: 'MBBS, FWACP',
      licenseNumber: 'MDC-23456',
      phoneNumber: '08087654321',
      email: 'michael.chen@akobi.com',
      address: 'Plot 8, Lekki Phase 1, Lagos',
      yearsOfExperience: 15,
      status: 'active',
      type: 'residential',
      department: 'Internal Medicine',
      joinDate: '2018-06-01',
    },
    {
      id: 'DR-003',
      fullName: 'Dr. Fatima Ibrahim (Consultant)',
      specialization: 'Obstetrics & Gynecology',
      qualification: 'MBBS, FRCOG',
      licenseNumber: 'MDC-34567',
      phoneNumber: '08098765432',
      email: 'fatima.ibrahim@consultant.com',
      address: 'Plot 5, Ikoyi, Lagos',
      yearsOfExperience: 20,
      status: 'active',
      type: 'visiting-consultant',
      department: 'Obstetrics & Gynecology',
      consultationFee: 25000,
      availability: 'Mon, Wed, Fri (2PM - 6PM)',
      joinDate: '2019-03-10',
    },
    {
      id: 'DR-004',
      fullName: 'Dr. Amina Yusuf',
      specialization: 'Pediatrics',
      qualification: 'MBBS, MPH',
      licenseNumber: 'MDC-45678',
      phoneNumber: '08023456789',
      email: 'amina.yusuf@akobi.com',
      address: 'Plot 20, Ikeja GRA, Lagos',
      yearsOfExperience: 8,
      status: 'active',
      type: 'residential',
      department: 'Pediatrics',
      joinDate: '2021-09-01',
    },
    {
      id: 'DR-005',
      fullName: 'Dr. James Okafor (Consultant)',
      specialization: 'Surgery',
      qualification: 'MBBS, FWACS',
      licenseNumber: 'MDC-56789',
      phoneNumber: '08034567890',
      email: 'james.okafor@consultant.com',
      address: 'Plot 15, VI, Lagos',
      yearsOfExperience: 25,
      status: 'active',
      type: 'visiting-consultant',
      department: 'Surgery',
      consultationFee: 30000,
      availability: 'Tue, Thu (3PM - 7PM)',
      joinDate: '2017-11-20',
    },
  ]);

  // Mock Data - Medical Officers
  const [medicalOfficers, setMedicalOfficers] = useState<MedicalOfficer[]>([
    {
      id: 'MO-001',
      fullName: 'MO. David Adeyemi',
      qualification: 'MBBS',
      licenseNumber: 'MDC-67890',
      phoneNumber: '08045678901',
      email: 'david.adeyemi@akobi.com',
      address: 'Plot 7, Surulere, Lagos',
      yearsOfExperience: 5,
      status: 'active',
      department: 'Emergency',
      joinDate: '2022-02-01',
      shift: 'Morning (8AM - 4PM)',
    },
    {
      id: 'MO-002',
      fullName: 'MO. Grace Eze',
      qualification: 'MBBS',
      licenseNumber: 'MDC-78901',
      phoneNumber: '08056789012',
      email: 'grace.eze@akobi.com',
      address: 'Plot 3, Yaba, Lagos',
      yearsOfExperience: 3,
      status: 'active',
      department: 'Outpatient',
      joinDate: '2023-05-15',
      shift: 'Evening (4PM - 12AM)',
    },
    {
      id: 'MO-003',
      fullName: 'MO. Emmanuel Okon',
      qualification: 'MBBS',
      licenseNumber: 'MDC-89012',
      phoneNumber: '08067890123',
      email: 'emmanuel.okon@akobi.com',
      address: 'Plot 11, Festac, Lagos',
      yearsOfExperience: 4,
      status: 'active',
      department: 'Inpatient Ward',
      joinDate: '2022-08-20',
      shift: 'Night (12AM - 8AM)',
    },
  ]);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesType = doctorType === 'all' || doctor.type === doctorType;
    const matchesSearch =
      doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredMedicalOfficers = medicalOfficers.filter((mo) =>
    mo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mo.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mo.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const doctorStats = {
    total: doctors.length,
    residential: doctors.filter(d => d.type === 'residential').length,
    visiting: doctors.filter(d => d.type === 'visiting-consultant').length,
    active: doctors.filter(d => d.status === 'active').length,
  };

  const moStats = {
    total: medicalOfficers.length,
    active: medicalOfficers.filter(mo => mo.status === 'active').length,
    morning: medicalOfficers.filter(mo => mo.shift?.includes('Morning')).length,
    evening: medicalOfficers.filter(mo => mo.shift?.includes('Evening')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Doctors Unit / Medical Officers</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage doctors, consultants, and medical officers
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeSection === 'doctors' ? 'default' : 'outline'}
              onClick={() => {
                setActiveSection('doctors');
                setSearchQuery('');
              }}
              className={activeSection === 'doctors' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Doctors ({doctorStats.total})
            </Button>
            <Button
              variant={activeSection === 'medical-officers' ? 'default' : 'outline'}
              onClick={() => {
                setActiveSection('medical-officers');
                setSearchQuery('');
              }}
              className={activeSection === 'medical-officers' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Medical Officers ({moStats.total})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Section */}
      {activeSection === 'doctors' && (
        <div className="space-y-6">
          {/* Doctor Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Doctors</p>
                    <p className="text-3xl font-bold text-blue-600">{doctorStats.total}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Residential</p>
                    <p className="text-3xl font-bold text-green-600">{doctorStats.residential}</p>
                  </div>
                  <Building2 className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Visiting Consultants</p>
                    <p className="text-3xl font-bold text-purple-600">{doctorStats.visiting}</p>
                  </div>
                  <Award className="w-10 h-10 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-3xl font-bold text-orange-600">{doctorStats.active}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search doctors by name, specialization, or license..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={doctorType === 'all' ? 'default' : 'outline'}
                    onClick={() => setDoctorType('all')}
                    size="sm"
                  >
                    All Doctors
                  </Button>
                  <Button
                    variant={doctorType === 'residential' ? 'default' : 'outline'}
                    onClick={() => setDoctorType('residential')}
                    size="sm"
                  >
                    Residential
                  </Button>
                  <Button
                    variant={doctorType === 'visiting-consultant' ? 'default' : 'outline'}
                    onClick={() => setDoctorType('visiting-consultant')}
                    size="sm"
                  >
                    Visiting Consultants
                  </Button>
                </div>
                <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Doctor</DialogTitle>
                      <DialogDescription>
                        Register a new doctor or consultant to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="text-center py-8 text-gray-500">
                      <p>Doctor registration form would go here</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Doctors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{doctor.fullName}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <p className="text-xs text-gray-500 mt-1">{doctor.licenseNumber}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        doctor.type === 'residential'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }
                    >
                      {doctor.type === 'residential' ? 'Residential' : 'Visiting Consultant'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span>{doctor.qualification}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{doctor.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{doctor.yearsOfExperience} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{doctor.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">{doctor.email}</span>
                    </div>
                  </div>

                  {doctor.type === 'visiting-consultant' && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                      <div className="flex items-center gap-2 text-sm text-purple-900 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">Availability:</span>
                      </div>
                      <p className="text-sm text-purple-700">{doctor.availability}</p>
                      <p className="text-sm text-purple-900 font-bold mt-2">
                        Consultation Fee: ₦{doctor.consultationFee?.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Badge
                      className={
                        doctor.status === 'active'
                          ? 'bg-green-500 text-white'
                          : doctor.status === 'on-leave'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-500 text-white'
                      }
                    >
                      {doctor.status.toUpperCase()}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No doctors found</p>
            </div>
          )}
        </div>
      )}

      {/* Medical Officers Section */}
      {activeSection === 'medical-officers' && (
        <div className="space-y-6">
          {/* MO Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Medical Officers</p>
                    <p className="text-3xl font-bold text-blue-600">{moStats.total}</p>
                  </div>
                  <UserCog className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-3xl font-bold text-green-600">{moStats.active}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Morning Shift</p>
                    <p className="text-3xl font-bold text-orange-600">{moStats.morning}</p>
                  </div>
                  <Clock className="w-10 h-10 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Evening Shift</p>
                    <p className="text-3xl font-bold text-purple-600">{moStats.evening}</p>
                  </div>
                  <Clock className="w-10 h-10 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search medical officers by name, department, or license..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Dialog open={isAddMOOpen} onOpenChange={setIsAddMOOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Medical Officer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Medical Officer</DialogTitle>
                      <DialogDescription>
                        Register a new medical officer to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="text-center py-8 text-gray-500">
                      <p>Medical Officer registration form would go here</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Medical Officers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedicalOfficers.map((mo) => (
              <Card key={mo.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCog className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{mo.fullName}</h3>
                        <p className="text-sm text-gray-600">{mo.qualification}</p>
                        <p className="text-xs text-gray-500 mt-1">{mo.licenseNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{mo.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{mo.yearsOfExperience} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{mo.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">{mo.email}</span>
                    </div>
                  </div>

                  {mo.shift && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">Shift:</span>
                        <span>{mo.shift}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Badge
                      className={
                        mo.status === 'active'
                          ? 'bg-green-500 text-white'
                          : mo.status === 'on-leave'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-500 text-white'
                      }
                    >
                      {mo.status.toUpperCase()}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMedicalOfficers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No medical officers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
