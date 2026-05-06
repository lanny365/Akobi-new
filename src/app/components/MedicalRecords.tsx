import { useState } from 'react';
import { FileText, Download, Upload, Search } from 'lucide-react';

interface MedicalRecord {
  id: string;
  patientName: string;
  patientId: string;
  recordType: string;
  date: string;
  doctor: string;
  diagnosis: string;
  status: 'Active' | 'Archived';
}

export function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('');

  const records: MedicalRecord[] = [
    { id: 'MR-5001', patientName: 'John Anderson', patientId: 'P-2847', recordType: 'Lab Results', date: '2026-04-20', doctor: 'Dr. Smith', diagnosis: 'Type 2 Diabetes', status: 'Active' },
    { id: 'MR-5002', patientName: 'Maria Garcia', patientId: 'P-2846', recordType: 'X-Ray', date: '2026-04-19', doctor: 'Dr. Johnson', diagnosis: 'Fractured Wrist', status: 'Active' },
    { id: 'MR-5003', patientName: 'Robert Chen', patientId: 'P-2845', recordType: 'Prescription', date: '2026-04-18', doctor: 'Dr. Davis', diagnosis: 'Hypertension', status: 'Active' },
    { id: 'MR-5004', patientName: 'Emily Brown', patientId: 'P-2844', recordType: 'Discharge Summary', date: '2026-04-15', doctor: 'Dr. Wilson', diagnosis: 'Appendicitis', status: 'Archived' },
    { id: 'MR-5005', patientName: 'David Wilson', patientId: 'P-2843', recordType: 'MRI Scan', date: '2026-04-14', doctor: 'Dr. Martinez', diagnosis: 'Herniated Disc', status: 'Active' },
  ];

  const filteredRecords = records.filter(record =>
    record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, ID, or record ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-5 h-5" />
          Upload Record
        </button>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Record ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Patient ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Record Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Diagnosis</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.patientName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.patientId}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      {record.recordType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.doctor}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.diagnosis}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{records.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">Active Records</p>
          <p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Active').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">Archived Records</p>
          <p className="text-2xl font-bold text-gray-600">{records.filter(r => r.status === 'Archived').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-2xl font-bold text-blue-600">23</p>
        </div>
      </div>
    </div>
  );
}
