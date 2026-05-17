import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { QrCode, User, Phone, Calendar, CreditCard, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PatientData {
  cardNumber: string;
  cardType: 'personal' | 'family';
  name: string;
  phone: string;
  dateOfBirth: string;
  registrationDate: string;
  familyMembers?: number;
}

export function QRScanner() {
  const [qrData, setQrData] = useState<string>('');
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [error, setError] = useState<string>('');

  const handleScanSimulation = () => {
    try {
      setError('');
      const parsed = JSON.parse(qrData);
      
      // Validate required fields
      if (!parsed.cardNumber || !parsed.name) {
        setError('Invalid QR code data: Missing required fields');
        toast.error('Invalid QR code data');
        return;
      }

      setPatientData(parsed);
      toast.success(`Patient loaded: ${parsed.name}`);
    } catch (err) {
      setError('Invalid QR code format. Please scan a valid patient QR code.');
      toast.error('Invalid QR code format');
      setPatientData(null);
    }
  };

  const handleClear = () => {
    setQrData('');
    setPatientData(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            QR Code Scanner
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Scan a patient QR code to instantly load their information
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Scanner Area */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border-4 border-blue-200">
                <QrCode className="w-20 h-20 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Position QR Code Here</p>
                <p className="text-sm text-gray-500 mt-1">
                  In production, this would use a camera to scan QR codes
                </p>
              </div>
            </div>
          </div>

          {/* Manual Input for Demo */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual QR Data Input (For Testing)
            </label>
            <Textarea
              placeholder="Paste QR code data here (JSON format) or scan with camera..."
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleScanSimulation}
              disabled={!qrData.trim()}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Load Patient Data
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information Display */}
      {patientData && (
        <Card className={`${
          patientData.cardType === 'family'
            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
            : 'border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  patientData.cardType === 'family' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <CreditCard className={`w-5 h-5 ${
                    patientData.cardType === 'family' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Card Number</p>
                  <p className="font-semibold text-lg">{patientData.cardNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {patientData.cardType === 'family' ? 'Family Card' : 'Personal Card'}
                    {patientData.familyMembers && (
                      <span className="ml-1">({patientData.familyMembers} members)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  patientData.cardType === 'family' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <User className={`w-5 h-5 ${
                    patientData.cardType === 'family' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold text-lg">{patientData.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  patientData.cardType === 'family' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Phone className={`w-5 h-5 ${
                    patientData.cardType === 'family' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold">{patientData.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  patientData.cardType === 'family' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    patientData.cardType === 'family' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-semibold">{patientData.dateOfBirth}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  patientData.cardType === 'family' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    patientData.cardType === 'family' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Date</p>
                  <p className="font-semibold">
                    {new Date(patientData.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t flex flex-wrap gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <User className="w-4 h-4 mr-2" />
                Assign Doctor
              </Button>
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                View Full Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            How to Use QR Scanner
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Position the patient's QR code in front of the camera scanner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>The system will automatically detect and load patient information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Use quick actions to book appointments, assign doctors, or view full profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>For testing: Copy QR data from registered patient and paste in manual input field</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
