import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Scan, User, Phone, Calendar, CreditCard, Camera, AlertCircle, Check } from 'lucide-react';
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

export function FaceRecognition() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [faceData, setFaceData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartScanning = async () => {
    setIsScanning(true);
    toast.info('Face recognition activated');
    
    // In production, this would activate the camera and use face recognition AI
    // For demo purposes, we'll simulate the scanning process
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    toast.info('Face scanning stopped');
  };

  const handleManualRecognition = () => {
    try {
      setError('');
      const parsed = JSON.parse(faceData);
      
      // Validate required fields
      if (!parsed.cardNumber || !parsed.name) {
        setError('Invalid data: Missing required fields');
        toast.error('Invalid patient data');
        return;
      }

      setPatientData(parsed);
      toast.success(`Patient recognized: ${parsed.name}`);
    } catch (err) {
      setError('Invalid format. Please enter valid patient data.');
      toast.error('Invalid data format');
      setPatientData(null);
    }
  };

  const handleClear = () => {
    setFaceData('');
    setPatientData(null);
    setError('');
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-purple-600" />
            Face Recognition Scanner
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Use facial recognition to instantly identify and load patient information
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Face Scanner Area */}
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isScanning 
              ? 'border-purple-500 bg-purple-100 animate-pulse' 
              : 'border-purple-300 bg-purple-50'
          }`}>
            <div className="flex flex-col items-center gap-4">
              <div className={`w-48 h-48 bg-white rounded-lg shadow-lg flex items-center justify-center border-4 transition-all ${
                isScanning ? 'border-purple-500' : 'border-purple-200'
              }`}>
                {isScanning ? (
                  <div className="relative">
                    <Camera className="w-24 h-24 text-purple-500" />
                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                ) : (
                  <Scan className="w-24 h-24 text-purple-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-700">
                  {isScanning ? 'Scanning Face...' : 'Position Face Here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isScanning 
                    ? 'Please look at the camera and remain still' 
                    : 'In production, this would use AI face recognition technology'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button
                onClick={handleStartScanning}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Face Scan
              </Button>
            ) : (
              <Button
                onClick={handleStopScanning}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 flex-1"
              >
                Stop Scanning
              </Button>
            )}
          </div>

          {/* Manual Input for Demo */}
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual Patient Data Input (For Testing)
            </label>
            <Textarea
              placeholder="Paste patient data here (JSON format) to simulate face recognition...\n\nExample:\n{\n  &quot;cardNumber&quot;: &quot;AKB-2024-001&quot;,\n  &quot;cardType&quot;: &quot;personal&quot;,\n  &quot;name&quot;: &quot;John Doe&quot;,\n  &quot;phone&quot;: &quot;+234 xxx xxx xxxx&quot;,\n  &quot;dateOfBirth&quot;: &quot;1990-01-15&quot;,\n  &quot;registrationDate&quot;: &quot;2024-04-23&quot;\n}"
              value={faceData}
              onChange={(e) => setFaceData(e.target.value)}
              rows={6}
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
              onClick={handleManualRecognition}
              disabled={!faceData.trim()}
              className="bg-purple-600 hover:bg-purple-700 flex-1"
            >
              <Scan className="w-4 h-4 mr-2" />
              Recognize Patient
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
              <Check className="w-5 h-5 text-green-600" />
              Patient Recognized Successfully
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
                Route to Doctor
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
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            How to Use Face Recognition
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">1.</span>
              <span>Click "Start Face Scan" to activate the camera and AI recognition system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">2.</span>
              <span>Position the patient's face in front of the camera and wait for recognition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">3.</span>
              <span>The system will automatically identify and load patient information from the database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">4.</span>
              <span>Use quick actions to book appointments, route patients, or view full profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">5.</span>
              <span>For testing: Use the manual input field to simulate face recognition by pasting patient data</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
            <p className="text-xs text-gray-600">
              <strong className="text-purple-600">Note:</strong> Face recognition requires patient facial data to be registered during initial enrollment. The system uses advanced AI algorithms to ensure accurate patient identification and maintain privacy compliance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
