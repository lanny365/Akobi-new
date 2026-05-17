import { Card, CardContent } from './ui/card';
import { User, Users, Phone, Calendar, CreditCard } from 'lucide-react';

interface PatientCardPreviewProps {
  type: 'personal' | 'family';
  patientData?: {
    name: string;
    id: string;
    bloodGroup: string;
    dateOfBirth: string;
    phone: string;
    familyMembers?: number;
  };
}

export function PatientCardPreview({ type, patientData }: PatientCardPreviewProps) {
  const defaultData = {
    name: type === 'family' ? 'Family Head Name' : 'Patient Name',
    id: type === 'family' ? 'FC-2025-0001' : 'P-2025-0001',
    bloodGroup: 'O+',
    dateOfBirth: '01/01/1990',
    phone: '+234 xxx xxx xxxx',
    familyMembers: 4,
  };

  const data = patientData || defaultData;

  return (
    <Card className={`w-full max-w-md ${
      type === 'family'
        ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-white'
        : 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white'
    }`}>
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-600">AKOBI SPECIALIST HOSPITAL</h3>
            <p className="text-lg font-bold text-gray-900">
              {type === 'family' ? 'FAMILY CARD' : 'PERSONAL CARD'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            type === 'family' ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {type === 'family' ? (
              <Users className="w-6 h-6 text-white" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Card Number */}
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Card Number</p>
          <p className="text-xl font-mono font-bold tracking-wider">{data.id}</p>
        </div>

        {/* Patient Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">
                {type === 'family' ? 'Family Head' : 'Patient Name'}
              </p>
              <p className="font-semibold text-gray-900">{data.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="font-semibold text-gray-900">{data.dateOfBirth}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Contact</p>
              <p className="font-semibold text-gray-900">{data.phone}</p>
            </div>
          </div>

          {type === 'family' && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Family Members</p>
                <p className="font-semibold text-gray-900">
                  {data.familyMembers} member{data.familyMembers > 1 ? 's' : ''} registered
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Blood Group</p>
              <p className="font-semibold text-red-600">{data.bloodGroup}</p>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className={`mt-4 pt-4 border-t ${
          type === 'family' ? 'border-green-200' : 'border-blue-200'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Issue Date: {new Date().toLocaleDateString()}</span>
            <span className={`font-semibold px-2 py-1 rounded ${
              type === 'family'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              ACTIVE
            </span>
          </div>
        </div>

        {type === 'family' && (
          <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800 text-center font-medium">
            Consolidated Billing • Shared Insurance
          </div>
        )}
      </CardContent>
    </Card>
  );
}