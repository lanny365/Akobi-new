import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowRight, AlertCircle, RefreshCw, User, Calendar, Clock, Stethoscope, Building2, Home, Activity, Search } from 'lucide-react';
import { toast } from 'sonner';

export function RouteToDoctor() {
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    patientId: '',
    visitId: '',
    date: currentDate.toISOString().split('T')[0],
    time: currentDate.toTimeString().slice(0, 5),
    visitType: 'new',
    doctor: '',
    department: '',
    consultingRoom: '',
    status: 'routed'
  });

  const visitTypes = [
    { value: 'new', label: 'New Visit', color: 'bg-blue-500' },
    { value: 'follow-up', label: 'Follow-up', color: 'bg-green-500' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-500' }
  ];

  const doctors = [
    { id: 'DR001', name: 'Dr. Sarah Johnson', department: 'Cardiology', room: 'CR-101' },
    { id: 'DR002', name: 'Dr. Michael Chen', department: 'Orthopedics', room: 'CR-205' },
    { id: 'DR003', name: 'Dr. Amina Yusuf', department: 'Pediatrics', room: 'CR-103' },
    { id: 'DR004', name: 'Dr. James Anderson', department: 'General Surgery', room: 'CR-301' },
    { id: 'DR005', name: 'Dr. Fatima Ibrahim', department: 'Obstetrics & Gynecology', room: 'CR-202' },
    { id: 'DR006', name: 'Dr. David Williams', department: 'Neurology', room: 'CR-104' },
  ];

  const departments = [
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'General Surgery',
    'Obstetrics & Gynecology',
    'Neurology',
    'Dermatology',
    'Ophthalmology',
    'ENT',
    'Internal Medicine'
  ];

  const consultingRooms = [
    'CR-101', 'CR-102', 'CR-103', 'CR-104', 'CR-105',
    'CR-201', 'CR-202', 'CR-203', 'CR-204', 'CR-205',
    'CR-301', 'CR-302', 'CR-303', 'CR-304', 'CR-305'
  ];

  const statuses = [
    { value: 'routed', label: 'Routed', color: 'bg-blue-500', icon: ArrowRight },
    { value: 'waiting', label: 'Waiting', color: 'bg-yellow-500', icon: Clock },
    { value: 'in-consultation', label: 'In Consultation', color: 'bg-green-500', icon: Activity },
    { value: 'completed', label: 'Completed', color: 'bg-gray-500', icon: User }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill department and room when doctor is selected
    if (field === 'doctor') {
      const selectedDoctor = doctors.find(d => d.id === value || d.name === value);
      if (selectedDoctor) {
        setFormData(prev => ({
          ...prev,
          doctor: value,
          department: selectedDoctor.department,
          consultingRoom: selectedDoctor.room
        }));
      }
    }
  };

  const handleSearchPatient = () => {
    if (!formData.patientId.trim()) {
      toast.error('Please enter Patient ID or Hospital Number');
      return;
    }

    // Simulate patient search
    toast.success('Patient found: John Doe');
    setFormData(prev => ({
      ...prev,
      visitId: `VID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }));
  };

  const handleRouteToDoctor = () => {
    if (!formData.patientId || !formData.doctor) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success(`Patient routed to ${formData.doctor} successfully!`);

    // Reset form
    const resetDate = new Date();
    setFormData({
      patientId: '',
      visitId: '',
      date: resetDate.toISOString().split('T')[0],
      time: resetDate.toTimeString().slice(0, 5),
      visitType: 'new',
      doctor: '',
      department: '',
      consultingRoom: '',
      status: 'routed'
    });
  };

  const handleEmergencyRoute = () => {
    if (!formData.patientId) {
      toast.error('Please enter Patient ID');
      return;
    }

    setFormData(prev => ({ ...prev, visitType: 'emergency', status: 'routed' }));
    toast.warning('Emergency routing initiated!', {
      description: 'Patient will be prioritized for immediate consultation'
    });
  };

  const handleReassignDoctor = () => {
    if (!formData.visitId) {
      toast.error('No active visit to reassign');
      return;
    }

    toast.info('Doctor reassignment mode activated', {
      description: 'Select a new doctor to reassign the patient'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-0 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            Route Patient to Doctor
          </CardTitle>
          <p className="text-blue-100 mt-2">Direct patients to the appropriate consulting doctor</p>
        </CardHeader>
      </Card>

      {/* Main Form */}
      <Card className="shadow-xl border-2 border-blue-100">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Patient Identification */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Identification
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patientId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Patient ID / Hospital Number *
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="patientId"
                        value={formData.patientId}
                        onChange={(e) => handleInputChange('patientId', e.target.value)}
                        placeholder="Enter Patient ID or Hospital Number"
                        className="flex-1 border-2 border-blue-200 focus:border-blue-500"
                      />
                      <Button
                        onClick={handleSearchPatient}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="visitId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      Visit ID
                    </Label>
                    <Input
                      id="visitId"
                      value={formData.visitId}
                      readOnly
                      placeholder="Auto-generated after patient search"
                      className="mt-1 bg-gray-50 border-2 border-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                <h3 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Routing Schedule
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="mt-1 border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Time of Routing *
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="mt-1 border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Visit Type */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200">
                <h3 className="font-bold text-lg text-orange-900 mb-4">Visit Type *</h3>

                <div className="grid grid-cols-3 gap-3">
                  {visitTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleInputChange('visitType', type.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.visitType === type.value
                          ? `${type.color} text-white border-transparent shadow-lg transform scale-105`
                          : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${formData.visitType === type.value ? 'text-white' : 'text-gray-700'}`}>
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctor & Location Details */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                <h3 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Doctor Assignment
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="doctor" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-green-600" />
                      Select Doctor *
                    </Label>
                    <select
                      id="doctor"
                      value={formData.doctor}
                      onChange={(e) => handleInputChange('doctor', e.target.value)}
                      className="mt-1 w-full px-4 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    >
                      <option value="">-- Select Doctor --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name} - {doc.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      Department
                    </Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="mt-1 w-full px-4 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="consultingRoom" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Home className="w-4 h-4 text-green-600" />
                      Consulting Room
                    </Label>
                    <select
                      id="consultingRoom"
                      value={formData.consultingRoom}
                      onChange={(e) => handleInputChange('consultingRoom', e.target.value)}
                      className="mt-1 w-full px-4 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    >
                      <option value="">-- Select Room --</option>
                      {consultingRooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Tracking */}
              <div className="bg-gradient-to-r from-cyan-50 to-sky-50 p-4 rounded-xl border-2 border-cyan-200">
                <h3 className="font-bold text-lg text-cyan-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status Tracking
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {statuses.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleInputChange('status', status.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.status === status.value
                            ? `${status.color} text-white border-transparent shadow-lg transform scale-105`
                            : 'bg-white border-gray-200 hover:border-cyan-300 hover:shadow-md'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-2 ${formData.status === status.value ? 'text-white' : 'text-gray-600'}`} />
                        <div className={`text-sm font-semibold ${formData.status === status.value ? 'text-white' : 'text-gray-700'}`}>
                          {status.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Status Display */}
              {formData.visitId && (
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-xl border-2 border-indigo-300">
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-indigo-700 animate-pulse" />
                    <div>
                      <div className="text-sm text-indigo-700 font-medium">Current Status</div>
                      <div className="text-lg font-bold text-indigo-900 capitalize">{formData.status.replace('-', ' ')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleRouteToDoctor}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Route to Doctor
              </Button>

              <Button
                onClick={handleEmergencyRoute}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Emergency Route
              </Button>

              <Button
                onClick={handleReassignDoctor}
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Reassign Doctor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="text-3xl font-bold">23</div>
            <div className="text-blue-100 text-sm mt-1">Patients Routed Today</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="text-3xl font-bold">12</div>
            <div className="text-green-100 text-sm mt-1">In Consultation</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="text-3xl font-bold">8</div>
            <div className="text-yellow-100 text-sm mt-1">Waiting</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="text-3xl font-bold">2</div>
            <div className="text-red-100 text-sm mt-1">Emergency Cases</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
