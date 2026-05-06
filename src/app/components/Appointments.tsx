import { useState } from 'react';
import { Calendar, Clock, Plus, Filter } from 'lucide-react';
import { DoctorAppointmentForm } from './DoctorAppointmentForm';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  type: string;
}

export function Appointments() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);

  const appointments: Appointment[] = [
    { id: 'A-1001', patientName: 'Sarah Williams', doctorName: 'Dr. Smith', department: 'Cardiology', date: '2026-04-21', time: '09:00 AM', status: 'In Progress', type: 'Consultation' },
    { id: 'A-1002', patientName: 'James Taylor', doctorName: 'Dr. Johnson', department: 'Neurology', date: '2026-04-21', time: '10:30 AM', status: 'Scheduled', type: 'Follow-up' },
    { id: 'A-1003', patientName: 'Lisa Anderson', doctorName: 'Dr. Davis', department: 'Pediatrics', date: '2026-04-21', time: '11:15 AM', status: 'Scheduled', type: 'Check-up' },
    { id: 'A-1004', patientName: 'Michael Brown', doctorName: 'Dr. Wilson', department: 'Orthopedics', date: '2026-04-21', time: '02:00 PM', status: 'Scheduled', type: 'Surgery' },
    { id: 'A-1005', patientName: 'Jennifer Lee', doctorName: 'Dr. Martinez', department: 'Dermatology', date: '2026-04-21', time: '03:30 PM', status: 'Scheduled', type: 'Consultation' },
    { id: 'A-1006', patientName: 'Robert Taylor', doctorName: 'Dr. Smith', department: 'Cardiology', date: '2026-04-20', time: '10:00 AM', status: 'Completed', type: 'Follow-up' },
  ];

  const filteredAppointments = filterStatus === 'all'
    ? appointments
    : appointments.filter(apt => apt.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Doctor Appointment Form Modal */}
      <DoctorAppointmentForm
        open={appointmentFormOpen}
        onClose={() => setAppointmentFormOpen(false)}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span>Today: April 21, 2026</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
            <Filter className="w-4 h-4 text-gray-600 ml-2" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('Scheduled')}
              className={`px-3 py-1 rounded ${filterStatus === 'Scheduled' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilterStatus('In Progress')}
              className={`px-3 py-1 rounded ${filterStatus === 'In Progress' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('Completed')}
              className={`px-3 py-1 rounded ${filterStatus === 'Completed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Completed
            </button>
          </div>
        </div>

        <button
          onClick={() => setAppointmentFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Schedule Appointment
        </button>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAppointments.map((appointment) => (
          <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{appointment.patientName}</h3>
                <p className="text-sm text-gray-500">ID: {appointment.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                appointment.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {appointment.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">{appointment.date} at {appointment.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500">Doctor & Department</p>
                  <p className="font-medium text-gray-900">{appointment.doctorName} • {appointment.department}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {appointment.type}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                View Details
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
