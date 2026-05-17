import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  UserMinus, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  Clock,
  Bed,
  Stethoscope,
  DollarSign,
  ClipboardCheck,
  Pill,
  Phone,
  Activity
} from 'lucide-react';
import { useCashier } from '../context/CashierContext';
import { useDischarge } from '../context/DischargeContext';
import { toast } from 'sonner';

export function DischargePatientReception() {
  const { getPendingDischarges, completeFinalDischarge } = useDischarge();
  const { payments } = useCashier();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [receptionNotes, setReceptionNotes] = useState('');
  const [finalDischargedBy, setFinalDischargedBy] = useState('');
  const [documentationComplete, setDocumentationComplete] = useState(false);
  const [belongingsReturned, setBelongingsReturned] = useState(false);
  const [transportArranged, setTransportArranged] = useState(false);
  const [exitTime, setExitTime] = useState('');

  const pendingPatients = getPendingDischarges();
  const selectedPatient = pendingPatients.find(p => p.patientId === selectedPatientId);
  const selectedPatientPayment = selectedPatient
    ? payments.find((payment) => payment.cardNumber === (selectedPatient.cardNumber || selectedPatient.patientId))
    : undefined;
  const selectedPatientBalance = selectedPatientPayment?.balance ?? selectedPatient?.totalCharges ?? 0;
  const paymentFullyCleared = Boolean(selectedPatientPayment && selectedPatientPayment.balance <= 0);
  const awaitingPaymentVerificationCount = pendingPatients.filter(
    (patient) => patient.status === 'pending-payment-verification'
  ).length;
  const readyForFinalDischargeCount = pendingPatients.filter(
    (patient) => patient.status === 'pending-final-discharge'
  ).length;

  const handleFinalDischarge = () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient to discharge');
      return;
    }

    if (selectedPatient?.status === 'pending-payment-verification') {
      toast.error('This patient is still awaiting payment verification.');
      return;
    }

    if (!paymentFullyCleared) {
      toast.error('This patient cannot be discharged until the cashier balance is fully cleared.');
      return;
    }

    if (!finalDischargedBy.trim()) {
      toast.error('Please enter your name as the reception officer');
      return;
    }

    if (!exitTime) {
      toast.error('Please select the exit time');
      return;
    }

    if (!documentationComplete) {
      toast.error('Please confirm all documentation is complete');
      return;
    }

    completeFinalDischarge(selectedPatientId, receptionNotes, finalDischargedBy);

    toast.success(`Patient ${selectedPatient?.patientName} has been finally discharged!`, {
      description: 'Patient has left the hospital. All records updated.',
      duration: 5000
    });

    // Reset form
    setSelectedPatientId('');
    setReceptionNotes('');
    setFinalDischargedBy('');
    setDocumentationComplete(false);
    setBelongingsReturned(false);
    setTransportArranged(false);
    setExitTime('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-pink-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <UserMinus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Final Patient Discharge</h1>
              <p className="text-red-100 mt-1">
              Complete final discharge only after Nursing clearance and cashier payment verification
              </p>
            </div>
          </div>
        </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready for Final Discharge</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{readyForFinalDischargeCount}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting Cashier Verification</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{awaitingPaymentVerificationCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reception Queue</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{pendingPatients.length}</p>
              </div>
              <ClipboardCheck className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Discharge Form */}
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-red-600" />
            Final Discharge Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Patient Selection */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Select Patient From Reception Queue *
              </Label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">-- Select Patient from Pending Discharge Queue --</option>
                {pendingPatients.map(patient => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.patientName} ({patient.patientId}) - {patient.ward} - Bed {patient.bedNumber} - {patient.status === 'pending-payment-verification' ? 'Payment Not Verified' : 'Pending Final Discharge'}
                  </option>
                ))}
              </select>
              {pendingPatients.length === 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No patients pending final discharge</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Patients appear here after Nursing saves the discharge summary and move to final discharge once Cashier payment is verified in Utility.
                  </p>
                </div>
              )}
            </div>

            {/* Patient Details Card */}
            {selectedPatient && (
              <>
                <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 rounded-lg border-2 border-red-200 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-lg text-gray-900">Patient Discharge Summary</h3>
                    <Badge className={`ml-auto text-white ${selectedPatient.status === 'pending-payment-verification' ? 'bg-yellow-500' : 'bg-orange-500'}`}>
                      {selectedPatient.status === 'pending-payment-verification' ? 'Payment Not Verified' : 'Pending Final Discharge'}
                    </Badge>
                  </div>

                  {selectedPatient.status === 'pending-payment-verification' && (
                    <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                      <p className="font-medium text-yellow-900">
                        This patient is already in the queue, but payment has not been verified yet.
                      </p>
                      <p className="mt-1 text-sm text-yellow-800">
                        Go back to Utility &gt; Verify Payment and complete verification before final discharge.
                      </p>
                    </div>
                  )}

                  {!paymentFullyCleared && (
                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
                      <p className="font-medium text-red-900">
                        Final discharge is locked until the patient bill is fully paid.
                      </p>
                      <p className="mt-1 text-sm text-red-800">
                        Outstanding cashier balance: ₦{selectedPatientBalance.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <User className="w-4 h-4" />
                        Patient Name
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.patientName}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <FileText className="w-4 h-4" />
                        Patient ID
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.patientId}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <Bed className="w-4 h-4" />
                        Ward / Bed
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.ward} - {selectedPatient.bedNumber}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        Days Admitted
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.daysAdmitted} days</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <Stethoscope className="w-4 h-4" />
                        Attending Doctor
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.attendingDoctor}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <DollarSign className="w-4 h-4" />
                        Total Charges
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        ₦{selectedPatient.totalCharges.toLocaleString()}
                      </p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        Admission Diagnosis
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.diagnosis}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        Discharge Diagnosis
                      </div>
                      <p className="font-semibold text-gray-900">{selectedPatient.dischargeDiagnosis}</p>
                    </div>
                  </div>

                  {/* Nursing Discharge Details */}
                  <div className="mt-6 pt-6 border-t-2 border-red-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Clearance Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Cleared By:</span>
                        <p className="font-medium text-gray-900">{selectedPatient.dischargedBy}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Discharge Time:</span>
                        <p className="font-medium text-gray-900">{selectedPatient.dischargeTime}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Treatment Summary:</span>
                        <p className="font-medium text-gray-900">{selectedPatient.treatmentSummary}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Home Care Instructions:</span>
                        <p className="font-medium text-gray-900">{selectedPatient.homeCareInstructions}</p>
                      </div>
                      {selectedPatient.prescriptionDetails && (
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Pill className="w-4 h-4" />
                            Prescription Details:
                          </div>
                          <p className="font-medium text-gray-900">{selectedPatient.prescriptionDetails}</p>
                        </div>
                      )}
                      {selectedPatient.followUpRequired && (
                        <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-900">Follow-up Required</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-blue-700">Date:</span>
                              <p className="font-medium text-gray-900">{selectedPatient.followUpDate}</p>
                            </div>
                            <div>
                              <span className="text-blue-700">Doctor:</span>
                              <p className="font-medium text-gray-900">{selectedPatient.followUpDoctor}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reception Checklist */}
                <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                    Reception Final Clearance Checklist
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={documentationComplete}
                        onChange={(e) => setDocumentationComplete(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="flex-1 text-gray-700">
                        All discharge documentation verified and complete
                      </span>
                      {documentationComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={belongingsReturned}
                        onChange={(e) => setBelongingsReturned(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="flex-1 text-gray-700">
                        Personal belongings returned to patient
                      </span>
                      {belongingsReturned && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={transportArranged}
                        onChange={(e) => setTransportArranged(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="flex-1 text-gray-700">
                        Transportation arranged (if required)
                      </span>
                      {transportArranged && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </label>

                    {selectedPatient.medicationCollected && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Medications collected from pharmacy</span>
                        </div>
                      </div>
                    )}

                    {selectedPatient.nextOfKinNotified && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Next of kin notified about discharge</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reception Notes */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Reception Final Notes (Optional)
                  </Label>
                  <Textarea
                    value={receptionNotes}
                    onChange={(e) => setReceptionNotes(e.target.value)}
                    placeholder="Enter any additional notes or observations from reception..."
                    rows={3}
                    className="border-2 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Final Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Reception Officer Name *
                    </Label>
                    <Input
                      value={finalDischargedBy}
                      onChange={(e) => setFinalDischargedBy(e.target.value)}
                      placeholder="Enter your name"
                      className="border-2 focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Patient Exit Time *
                    </Label>
                    <Input
                      type="time"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="border-2 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Final Discharge Button */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <Button
                    onClick={handleFinalDischarge}
                    disabled={
                      !documentationComplete ||
                      selectedPatient.status === 'pending-payment-verification' ||
                      !paymentFullyCleared
                    }
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-700 hover:via-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 shadow-lg"
                  >
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Complete Final Discharge
                  </Button>
                  {!documentationComplete && (
                    <p className="text-sm text-red-600 text-center mt-2 font-medium">
                      Please verify all documentation is complete before final discharge
                    </p>
                  )}
                  {documentationComplete && !paymentFullyCleared && (
                    <p className="text-sm text-red-600 text-center mt-2 font-medium">
                      Final discharge stays disabled until cashier clears the full outstanding balance.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
