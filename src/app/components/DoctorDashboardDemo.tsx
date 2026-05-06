import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { EmergencyAlert } from './EmergencyAlert';
import { Users, Calendar, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useEmergency } from '../context/EmergencyContext';

export function DoctorDashboardDemo() {
  const { emergencyPatients, removeEmergencyPatient } = useEmergency();

  const handleAcceptEmergency = (patientId: string) => {
    removeEmergencyPatient(patientId);
    toast.success('Emergency patient accepted. Redirecting to emergency consultation...');
  };

  const handleDismissAlert = (patientId: string) => {
    removeEmergencyPatient(patientId);
    toast.info('Emergency alert dismissed. Patient will be assigned to another available doctor.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Emergency Alert Overlay */}
      <EmergencyAlert
        emergencyPatients={emergencyPatients}
        onAcceptEmergency={handleAcceptEmergency}
        onDismissAlert={handleDismissAlert}
      />

      {/* Doctor Dashboard */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">Welcome, Dr. Sarah Williams - General Practitioner</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Patients</p>
                  <p className="text-3xl font-bold mt-1">12</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-3xl font-bold mt-1">8</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reports</p>
                  <p className="text-3xl font-bold mt-1">5</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Wait Time</p>
                  <p className="text-3xl font-bold mt-1">15m</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Patient */}
        <Card>
          <CardHeader>
            <CardTitle>Current Consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">James Anderson</h3>
                  <p className="text-sm text-blue-600 font-medium">PT-2026-0045</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Age: 45 years</p>
                  <p className="text-sm text-gray-600">Gender: Male</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Chief Complaint:</p>
                <p className="text-gray-900">Fever and headache for 3 days</p>
              </div>
              <div className="mt-4 flex gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Continue Consultation
                </Button>
                <Button variant="outline">View Medical History</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        {emergencyPatients.length === 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-blue-900 mb-2">✅ Emergency Alert System Active</h3>
              <p className="text-sm text-blue-700">
                You are connected to the emergency alert system. When reception sends an emergency alert, you will receive a full-screen override notification with patient details and must either accept or dismiss the emergency.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}