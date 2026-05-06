import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Zap, CreditCard, UserMinus, AlertTriangle, FileText, Send, Search, Filter, Heart, User, Phone, Clock, Activity, CheckCircle, Printer, Download, FileSpreadsheet, Calendar, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useEmergency } from '../context/EmergencyContext';
import { useCashier } from '../context/CashierContext';
import { useDischarge } from '../context/DischargeContext';
import { toast } from 'sonner';
import { EmergencyAlertUtility } from './EmergencyAlertUtility';
import { DischargePatientReception } from './DischargePatientReception';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function Utility() {
  const [activeView, setActiveView] = useState<'verify-payment' | 'discharge-patient' | 'emergency-alert' | 'report'>('verify-payment');
  const [verifiedPatientData, setVerifiedPatientData] = useState<any>(null);

  const menuItems = [
    { id: 'verify-payment' as const, label: 'Verify Payment', icon: CreditCard },
    { id: 'discharge-patient' as const, label: 'Discharge Patient', icon: UserMinus },
    { id: 'emergency-alert' as const, label: 'Emergency Alert to Doctors', icon: AlertTriangle },
    { id: 'report' as const, label: 'Report', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Utility Tools Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-2xl">Reception Utilities</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Access common tools and utilities for reception operations
          </p>

          {/* Dropdown Navigation Menu */}
          <div className="mt-4 space-y-3">
            {verifiedPatientData && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  {verifiedPatientData.patientName} is cleared for final discharge
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {menuItems.map((item) => (
                <div key={item.id} className="relative">
                  <Button
                    onClick={() => setActiveView(item.id)}
                    variant={activeView === item.id ? 'default' : 'outline'}
                    className={activeView === item.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'verify-payment' && (
            <VerifyPaymentView
              onPaymentVerified={(patientData) => {
                setVerifiedPatientData(patientData);
              }}
              onPaymentUnverified={() => {
                setVerifiedPatientData(null);
              }}
            />
          )}
          {activeView === 'discharge-patient' && <DischargePatientView verifiedPatientData={verifiedPatientData} />}
          {activeView === 'emergency-alert' && <EmergencyAlertView />}
          {activeView === 'report' && <ReportView />}
        </CardContent>
      </Card>
    </div>
  );
}

// Verify Payment View
function VerifyPaymentView({
  onPaymentVerified,
  onPaymentUnverified
}: {
  onPaymentVerified: (patientData: any) => void;
  onPaymentUnverified: () => void;
}) {
  const { payments } = useCashier();
  const { getPendingDischarges, markPaymentVerified, nurseDischargedPatients } = useDischarge();
  const [selectedPatientCard, setSelectedPatientCard] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  const receptionQueuePatients = getPendingDischarges();

  const getQueueEntry = (cardNumber: string) =>
    nurseDischargedPatients.find(
      (patient) => patient.patientId === cardNumber && patient.status !== 'final-discharged'
    );

  const getQueueStatusLabel = (cardNumber: string) => {
    const queueEntry = getQueueEntry(cardNumber);

    if (!queueEntry) {
      return '';
    }

    return queueEntry.status === 'pending-final-discharge'
      ? 'Pending Final Discharge'
      : 'Awaiting Cashier Verification';
  };

  const handleLoadPatientData = () => {
    if (selectedPatientCard) {
      const selectedQueueEntry = getQueueEntry(selectedPatientCard);

      if (selectedQueueEntry) {
        const paymentLookupKey = selectedQueueEntry.cardNumber || selectedQueueEntry.patientId;
        const payment = payments.find((p) => p.cardNumber === paymentLookupKey);
        const paymentCleared = Boolean(payment && payment.status === 'paid' && payment.balance === 0);
        const data = {
          id: selectedQueueEntry.id,
          patientId: selectedQueueEntry.patientId,
          cardNumber: payment?.cardNumber || selectedQueueEntry.cardNumber || selectedQueueEntry.patientId,
          patientName: selectedQueueEntry.patientName,
          visitDate: payment ? payment.transactionDate.split(' ')[0] : new Date().toISOString().split('T')[0],
          services: payment
            ? payment.services.map((s) => ({
                name: s.type,
                description: s.description,
                amount: s.amount,
                paid: s.paid,
                method: s.method
              }))
            : [],
          totalCharges: payment?.totalAmount || selectedQueueEntry.totalCharges,
          totalPaid: payment?.amountPaid || 0,
          balance: payment ? payment.balance : selectedQueueEntry.totalCharges,
          paymentStatus: !payment ? 'No Cashier Record' : paymentCleared ? 'Fully Paid' : 'Outstanding Balance',
          cashierName: payment?.cashierName || 'No cashier record found',
          cashierTime: payment?.cashierTime || 'N/A',
          queueStatus: selectedQueueEntry.status,
          cashierRecordFound: Boolean(payment),
          paymentCleared,
        };

        setPatientData(data);
        if (selectedQueueEntry.status === 'pending-final-discharge') {
          setIsVerified(true);
          onPaymentVerified(data);
        } else {
          setIsVerified(false);
          onPaymentUnverified();
        }
      }
    }
  };

  const handleVerifyPayment = () => {
    if (!patientData) {
      return;
    }

    if (!patientData.cashierRecordFound) {
      toast.error('No cashier payment record was found for this patient.');
      return;
    }

    if (!patientData.paymentCleared) {
      toast.error('Payment cannot be verified until the bill is fully cleared.');
      return;
    }

    markPaymentVerified(patientData.patientId);

    setIsVerified(true);
    const nextPatientData = {
      ...patientData,
      queueStatus: 'pending-final-discharge',
      paymentStatus: 'Fully Paid',
      paymentCleared: true,
    };
    setPatientData(nextPatientData);
    onPaymentVerified(nextPatientData);
    toast.success('Payment verified successfully! Patient is now pending final discharge.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Payment</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select patient sent from Nursing, then confirm their cashier payment before final discharge
        </p>
      </div>

      {/* Patient Card Dropdown */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient From Reception Queue
              </label>
              <select
                value={selectedPatientCard}
                onChange={(e) => setSelectedPatientCard(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">Select a patient awaiting reception payment verification...</option>
                {receptionQueuePatients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.patientId} - {patient.patientName} - {patient.ward} - {getQueueStatusLabel(patient.patientId)}
                  </option>
                ))}
              </select>
              {receptionQueuePatients.length === 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  No patients from Nursing are waiting for reception payment verification
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleLoadPatientData}
                disabled={!selectedPatientCard}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Load Patient Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Payment Records */}
      {patientData && (
        <>
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Payment Records - {patientData.patientName}</span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  patientData.balance === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {patientData.paymentStatus}
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Card Number: {patientData.cardNumber} | Visit Date: {patientData.visitDate}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {!patientData.cashierRecordFound && (
                <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <p className="font-medium text-yellow-900">
                    No cashier payment record was found for this patient.
                  </p>
                  <p className="mt-1 text-sm text-yellow-800">
                    Reception cannot verify payment or complete final discharge until Cashier records and clears the bill.
                  </p>
                </div>
              )}
              {/* Services and Payments */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Services Rendered & Payments Made by Cashier</h4>
                <div className="space-y-3">
                  {patientData.services.map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">
                          {service.description} • Payment Method: <span className="font-medium">{service.method}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{service.amount.toLocaleString()}</p>
                        <p className={`text-sm ${
                          service.paid ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {service.paid ? '✓ Paid' : '✗ Unpaid'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Charges</p>
                    <p className="text-xl font-bold text-gray-900">₦{patientData.totalCharges.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Paid</p>
                    <p className="text-xl font-bold text-green-600">₦{patientData.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className={`text-xl font-bold ${
                      patientData.balance === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₦{patientData.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cashier Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Processed by:</strong> {patientData.cashierName} at {patientData.cashierTime}
                </p>
              </div>

              {/* Verification Actions */}
              <div className="space-y-3">
                {!isVerified ? (
                  <Button
                    onClick={handleVerifyPayment}
                    className="bg-green-600 hover:bg-green-700 w-full py-6 text-lg"
                    disabled={!patientData.cashierRecordFound || !patientData.paymentCleared}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {!patientData.cashierRecordFound
                      ? 'Cannot Verify - No Cashier Record'
                      : !patientData.paymentCleared
                        ? 'Cannot Verify - Outstanding Balance'
                        : 'Verify Cashier Payment & Enable Final Discharge'}
                  </Button>
                ) : (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                    <p className="text-green-700 font-semibold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Payment Verified. This patient is now ready for final discharge.
                    </p>
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Discharge Patient View
function DischargePatientView({ verifiedPatientData }: { verifiedPatientData: any }) {
  return (
    <div className="space-y-4">
      {verifiedPatientData && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                Payment Verified for: {verifiedPatientData.patientName}
              </p>
              <p className="text-sm text-green-700">
                Card: {verifiedPatientData.cardNumber} | Total: ₦{verifiedPatientData.totalCharges.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
      <DischargePatientReception />
    </div>
  );
}

// Emergency Alert View
function EmergencyAlertView() {
  return <EmergencyAlertUtility />;
}

// Report View
function ReportView() {
  const { payments } = useCashier();
  const { nurseDischargedPatients } = useDischarge();
  const { emergencies } = useEmergency();

  const [reportType, setReportType] = useState<'discharge' | 'emergency' | 'payment' | 'sms' | 'total-patient' | 'active-patient' | 'discharged-patient' | 'new-register'>('payment');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Mock data for patients (in a real app, this would come from a PatientContext)
  const mockPatients = [
    { id: 'PT-001', name: 'John Doe', cardNumber: 'HMO-2024-001', registrationDate: '2024-04-20', status: 'active', phoneNumber: '08012345678' },
    { id: 'PT-002', name: 'Jane Smith', cardNumber: 'HMO-2024-002', registrationDate: '2024-04-21', status: 'active', phoneNumber: '08087654321' },
    { id: 'PT-003', name: 'Mike Johnson', cardNumber: 'HMO-2024-003', registrationDate: '2024-04-22', status: 'discharged', phoneNumber: '08098765432' },
    { id: 'PT-004', name: 'Sarah Williams', cardNumber: 'HMO-2024-004', registrationDate: '2024-04-23', status: 'active', phoneNumber: '08023456789' },
    { id: 'PT-005', name: 'David Brown', cardNumber: 'HMO-2024-005', registrationDate: '2024-04-24', status: 'discharged', phoneNumber: '08034567890' },
  ];

  // Mock SMS data
  const mockSMS = [
    { id: 'SMS-001', patient: 'John Doe', phoneNumber: '08012345678', message: 'Appointment reminder', status: 'sent', sentDate: '2024-04-24 10:30' },
    { id: 'SMS-002', patient: 'Jane Smith', phoneNumber: '08087654321', message: 'Payment confirmation', status: 'sent', sentDate: '2024-04-24 11:15' },
    { id: 'SMS-003', patient: 'Invalid Number', phoneNumber: '0801234', message: 'Test message', status: 'rejected', sentDate: '2024-04-24 12:00' },
    { id: 'SMS-004', patient: 'Mike Johnson', phoneNumber: '08098765432', message: 'Discharge notice', status: 'sent', sentDate: '2024-04-24 14:20' },
    { id: 'SMS-005', patient: 'Network Error', phoneNumber: '08099999999', message: 'Reminder', status: 'rejected', sentDate: '2024-04-24 15:45' },
  ];

  // Filter data by date range
  const filterByDateRange = (data: any[], dateField: string) => {
    if (!dateFrom && !dateTo) return data;

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      if (from && to) {
        return itemDate >= from && itemDate <= to;
      } else if (from) {
        return itemDate >= from;
      } else if (to) {
        return itemDate <= to;
      }
      return true;
    });
  };

  // Get filtered data based on report type
  const getFilteredData = () => {
    switch (reportType) {
      case 'discharge':
        return filterByDateRange(nurseDischargedPatients, 'nurseDischargeDate');
      case 'emergency':
        return filterByDateRange(emergencies, 'createdAt');
      case 'payment':
        return filterByDateRange(payments, 'transactionDate');
      case 'sms':
        return filterByDateRange(mockSMS, 'sentDate');
      case 'total-patient':
        return filterByDateRange(mockPatients, 'registrationDate');
      case 'active-patient':
        return filterByDateRange(mockPatients.filter(p => p.status === 'active'), 'registrationDate');
      case 'discharged-patient':
        return filterByDateRange(mockPatients.filter(p => p.status === 'discharged'), 'registrationDate');
      case 'new-register':
        return filterByDateRange(mockPatients, 'registrationDate');
      default:
        return [];
    }
  };

  const exportToExcel = () => {
    const filteredData = getFilteredData();
    let data: any[] = [];
    let filename = '';
    let reportTitle = '';

    switch (reportType) {
      case 'discharge':
        data = (filteredData as any[]).map(p => ({
          'Patient ID': p.patientId,
          'Patient Name': p.patientName,
          'Ward': p.ward,
          'Bed Number': p.bedNumber,
          'Days Admitted': p.daysAdmitted,
          'Diagnosis': p.diagnosis,
          'Attending Doctor': p.attendingDoctor,
          'Total Charges': p.totalCharges,
          'Discharged By': p.dischargedBy,
          'Discharge Time': p.dischargeTime,
          'Status': p.status
        }));
        filename = 'Discharge_Patients_Report';
        reportTitle = 'Discharge Patients Report';
        break;

      case 'emergency':
        data = (filteredData as any[]).map(e => ({
          'Emergency ID': e.id,
          'Patient Name': e.patientName,
          'Emergency Type': e.emergencyType,
          'Priority': e.priority,
          'Doctor': e.doctorName,
          'Ward': e.ward,
          'Status': e.status,
          'Created At': e.createdAt
        }));
        filename = 'Emergency_Patients_Report';
        reportTitle = 'Emergency Patients Report';
        break;

      case 'payment':
        data = (filteredData as any[]).map(p => ({
          'Card Number': p.cardNumber,
          'Patient Name': p.patientName,
          'Total Amount': p.totalAmount,
          'Amount Paid': p.amountPaid,
          'Balance': p.balance,
          'Status': p.status,
          'Payment Method': p.services.map((s: any) => s.method).join(', '),
          'Transaction Date': p.transactionDate,
          'Cashier': p.cashierName
        }));
        filename = 'Payment_Report';
        reportTitle = 'Payment Report (Cash & Transfer)';
        break;

      case 'sms':
        data = (filteredData as any[]).map(s => ({
          'SMS ID': s.id,
          'Patient': s.patient,
          'Phone Number': s.phoneNumber,
          'Message': s.message,
          'Status': s.status,
          'Sent Date': s.sentDate
        }));
        filename = 'SMS_Report';
        reportTitle = 'SMS Report (Sent & Rejected)';
        break;

      case 'total-patient':
        data = (filteredData as any[]).map(p => ({
          'Patient ID': p.id,
          'Patient Name': p.name,
          'Card Number': p.cardNumber,
          'Registration Date': p.registrationDate,
          'Status': p.status,
          'Phone Number': p.phoneNumber
        }));
        filename = 'Total_Patients_Report';
        reportTitle = 'Total Patients Report';
        break;

      case 'active-patient':
        data = (filteredData as any[]).map(p => ({
          'Patient ID': p.id,
          'Patient Name': p.name,
          'Card Number': p.cardNumber,
          'Registration Date': p.registrationDate,
          'Phone Number': p.phoneNumber
        }));
        filename = 'Active_Patients_Report';
        reportTitle = 'Active Patients Report';
        break;

      case 'discharged-patient':
        data = (filteredData as any[]).map(p => ({
          'Patient ID': p.id,
          'Patient Name': p.name,
          'Card Number': p.cardNumber,
          'Registration Date': p.registrationDate,
          'Phone Number': p.phoneNumber
        }));
        filename = 'Discharged_Patients_Report';
        reportTitle = 'Discharged Patients Report';
        break;

      case 'new-register':
        data = (filteredData as any[]).map(p => ({
          'Patient ID': p.id,
          'Patient Name': p.name,
          'Card Number': p.cardNumber,
          'Registration Date': p.registrationDate,
          'Phone Number': p.phoneNumber
        }));
        filename = 'New_Registration_Report';
        reportTitle = 'New Registration Report';
        break;
    }

    // Create worksheet with letterhead
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['AKOBI SPECIALIST HOSPITAL'],
      ['Plot 5, Block WV Molipa Community Layout, Ijebu-Ode'],
      [''],
      [reportTitle],
      [`Generated: ${new Date().toLocaleString()}`],
      [''],
    ]);

    // Add data starting from row 7 (index 6)
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A7' });

    // Merge cells for hospital name and address
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Hospital name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Address
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Report title
      { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }  // Generated date
    );

    // Style the header rows
    const headerStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };
    worksheet['A1'].s = headerStyle;
    worksheet['A2'].s = { alignment: { horizontal: 'center' } };
    worksheet['A4'].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } };
    worksheet['A5'].s = { alignment: { horizontal: 'center' } };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel report exported successfully!');
  };

  const exportToPDF = () => {
    const filteredData = getFilteredData();
    const doc = new jsPDF();
    let title = '';
    let headers: string[][] = [];
    let data: any[][] = [];

    switch (reportType) {
      case 'discharge':
        title = 'Discharge Patients Report';
        headers = [['Patient ID', 'Name', 'Ward', 'Bed', 'Days', 'Diagnosis', 'Doctor', 'Charges', 'Status']];
        data = (filteredData as any[]).map(p => [
          p.patientId,
          p.patientName,
          p.ward,
          p.bedNumber,
          p.daysAdmitted.toString(),
          p.diagnosis,
          p.attendingDoctor,
          `₦${p.totalCharges.toLocaleString()}`,
          p.status
        ]);
        break;

      case 'emergency':
        title = 'Emergency Patients Report';
        headers = [['Emergency ID', 'Patient', 'Type', 'Priority', 'Doctor', 'Ward', 'Status']];
        data = (filteredData as any[]).map(e => [
          e.id,
          e.patientName,
          e.emergencyType,
          e.priority,
          e.doctorName,
          e.ward,
          e.status
        ]);
        break;

      case 'payment':
        title = 'Payment Report';
        headers = [['Card Number', 'Patient', 'Total', 'Paid', 'Balance', 'Status', 'Method']];
        data = (filteredData as any[]).map(p => [
          p.cardNumber,
          p.patientName,
          `₦${p.totalAmount.toLocaleString()}`,
          `₦${p.amountPaid.toLocaleString()}`,
          `₦${p.balance.toLocaleString()}`,
          p.status,
          p.services.map((s: any) => s.method).join(', ')
        ]);
        break;

      case 'sms':
        title = 'SMS Report';
        headers = [['SMS ID', 'Patient', 'Phone', 'Message', 'Status', 'Date']];
        data = (filteredData as any[]).map(s => [
          s.id,
          s.patient,
          s.phoneNumber,
          s.message.substring(0, 30) + '...',
          s.status,
          s.sentDate
        ]);
        break;

      case 'total-patient':
        title = 'Total Patients Report';
        headers = [['Patient ID', 'Name', 'Card Number', 'Registration Date', 'Status', 'Phone']];
        data = (filteredData as any[]).map(p => [p.id, p.name, p.cardNumber, p.registrationDate, p.status, p.phoneNumber]);
        break;

      case 'active-patient':
        title = 'Active Patients Report';
        headers = [['Patient ID', 'Name', 'Card Number', 'Registration Date', 'Phone']];
        data = (filteredData as any[]).map(p => [p.id, p.name, p.cardNumber, p.registrationDate, p.phoneNumber]);
        break;

      case 'discharged-patient':
        title = 'Discharged Patients Report';
        headers = [['Patient ID', 'Name', 'Card Number', 'Registration Date', 'Phone']];
        data = (filteredData as any[]).map(p => [p.id, p.name, p.cardNumber, p.registrationDate, p.phoneNumber]);
        break;

      case 'new-register':
        title = 'New Registration Report';
        headers = [['Patient ID', 'Name', 'Card Number', 'Registration Date', 'Phone']];
        data = (filteredData as any[]).map(p => [p.id, p.name, p.cardNumber, p.registrationDate, p.phoneNumber]);
        break;
    }

    // Hospital Letterhead
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue color
    doc.text('AKOBI SPECIALIST HOSPITAL', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Plot 5, Block WV Molipa Community Layout, Ijebu-Ode', 105, 22, { align: 'center' });

    // Horizontal line below letterhead
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 51, 102);
    doc.line(14, 26, 196, 26);

    // Report Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 105, 35, { align: 'center' });

    // Generated Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 42, { align: 'center' });

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 48,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { top: 48 }
    });

    doc.save(`${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report exported successfully!');
  };

  const getReportData = () => {
    return getFilteredData();
  };

  const getReportStats = () => {
    const filteredData = getFilteredData() as any[];

    switch (reportType) {
      case 'payment':
        const totalRevenue = filteredData.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
        const totalPaid = filteredData.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
        const cashPayments = filteredData.filter((p: any) => p.services.some((s: any) => s.method === 'cash')).length;
        const transferPayments = filteredData.filter((p: any) => p.services.some((s: any) => s.method === 'transfer')).length;
        return { totalRevenue, totalPaid, cashPayments, transferPayments };
      case 'sms':
        const sentSMS = filteredData.filter((s: any) => s.status === 'sent').length;
        const rejectedSMS = filteredData.filter((s: any) => s.status === 'rejected').length;
        return { sentSMS, rejectedSMS, totalSMS: filteredData.length };
      case 'total-patient':
        return { total: filteredData.length, active: filteredData.filter((p: any) => p.status === 'active').length, discharged: filteredData.filter((p: any) => p.status === 'discharged').length };
      default:
        return null;
    }
  };

  const stats = getReportStats();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Reports</h3>
        <p className="text-sm text-gray-600">
          Select report type and export to Excel or PDF
        </p>
      </div>

      {/* Report Type Selection */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Report Type
              </Label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="payment">Payment Report (Cash & Transfer)</option>
                <option value="discharge">Discharge Patient Report</option>
                <option value="emergency">Emergency Patient Report</option>
                <option value="sms">SMS Report (Sent & Rejected)</option>
                <option value="total-patient">Total Patients Report</option>
                <option value="active-patient">Active Patients Report</option>
                <option value="discharged-patient">Discharged Patients Report</option>
                <option value="new-register">New Registration Report</option>
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Date From
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-2"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Date To
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-2"
                />
              </div>
              {(dateFrom || dateTo) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      toast.success('Filters cleared');
                    }}
                    className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Indicator */}
          {(dateFrom || dateTo) && (
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-3 flex items-center gap-2 mt-4">
              <Filter className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Filters Active:
                  {dateFrom && ` From ${new Date(dateFrom).toLocaleDateString()}`}
                  {dateTo && ` To ${new Date(dateTo).toLocaleDateString()}`}
                </p>
                <p className="text-xs text-blue-700">
                  Showing {getReportData().length} filtered records
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 flex-1">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportType === 'payment' && (
            <>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">₦{(stats as any).totalRevenue.toLocaleString()}</p>
                    </div>
                    <CreditCard className="w-10 h-10 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cash Payments</p>
                      <p className="text-2xl font-bold text-blue-600">{(stats as any).cashPayments}</p>
                    </div>
                    <CreditCard className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Transfer Payments</p>
                      <p className="text-2xl font-bold text-purple-600">{(stats as any).transferPayments}</p>
                    </div>
                    <CreditCard className="w-10 h-10 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === 'sms' && (
            <>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total SMS</p>
                      <p className="text-2xl font-bold text-blue-600">{(stats as any).totalSMS}</p>
                    </div>
                    <Send className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sent SMS</p>
                      <p className="text-2xl font-bold text-green-600">{(stats as any).sentSMS}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rejected SMS</p>
                      <p className="text-2xl font-bold text-red-600">{(stats as any).rejectedSMS}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === 'total-patient' && (
            <>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Patients</p>
                      <p className="text-2xl font-bold text-blue-600">{(stats as any).total}</p>
                    </div>
                    <User className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Patients</p>
                      <p className="text-2xl font-bold text-green-600">{(stats as any).active}</p>
                    </div>
                    <Activity className="w-10 h-10 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-gray-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Discharged Patients</p>
                      <p className="text-2xl font-bold text-gray-600">{(stats as any).discharged}</p>
                    </div>
                    <UserMinus className="w-10 h-10 text-gray-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Report Preview */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Report Preview - {getReportData().length} Records
            </span>
            <Badge className="bg-blue-600">{reportType.replace('-', ' ').toUpperCase()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Letterhead */}
          <div className="mb-6 pb-4 border-b-2 border-blue-900 text-center">
            <h2 className="text-2xl font-bold text-blue-900">AKOBI SPECIALIST HOSPITAL</h2>
            <p className="text-sm text-gray-600 mt-1">Plot 5, Block WV Molipa Community Layout, Ijebu-Ode</p>
          </div>

          <div className="overflow-x-auto">
            {reportType === 'payment' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Card Number</th>
                    <th className="text-left p-3 font-semibold">Patient Name</th>
                    <th className="text-left p-3 font-semibold">Total Amount</th>
                    <th className="text-left p-3 font-semibold">Amount Paid</th>
                    <th className="text-left p-3 font-semibold">Balance</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {(getReportData() as any[]).map((payment, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">{payment.cardNumber}</td>
                      <td className="p-3">{payment.patientName}</td>
                      <td className="p-3">₦{payment.totalAmount.toLocaleString()}</td>
                      <td className="p-3">₦{payment.amountPaid.toLocaleString()}</td>
                      <td className="p-3">₦{payment.balance.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge className={payment.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="p-3">{payment.services.map((s: any) => s.method).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'discharge' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Patient ID</th>
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Ward</th>
                    <th className="text-left p-3 font-semibold">Days Admitted</th>
                    <th className="text-left p-3 font-semibold">Diagnosis</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(getReportData() as any[]).map((patient, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">{patient.patientId}</td>
                      <td className="p-3">{patient.patientName}</td>
                      <td className="p-3">{patient.ward}</td>
                      <td className="p-3">{patient.daysAdmitted} days</td>
                      <td className="p-3">{patient.diagnosis}</td>
                      <td className="p-3">
                        <Badge className={patient.status === 'final-discharged' ? 'bg-green-500' : 'bg-orange-500'}>
                          {patient.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'emergency' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Emergency ID</th>
                    <th className="text-left p-3 font-semibold">Patient</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Priority</th>
                    <th className="text-left p-3 font-semibold">Doctor</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(getReportData() as any[]).map((emergency, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">{emergency.id}</td>
                      <td className="p-3">{emergency.patientName}</td>
                      <td className="p-3">{emergency.emergencyType}</td>
                      <td className="p-3">
                        <Badge className={
                          emergency.priority === 'critical' ? 'bg-red-500' :
                          emergency.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                        }>
                          {emergency.priority}
                        </Badge>
                      </td>
                      <td className="p-3">{emergency.doctorName}</td>
                      <td className="p-3">
                        <Badge className={emergency.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}>
                          {emergency.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'sms' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">SMS ID</th>
                    <th className="text-left p-3 font-semibold">Patient</th>
                    <th className="text-left p-3 font-semibold">Phone Number</th>
                    <th className="text-left p-3 font-semibold">Message</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Sent Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(getReportData() as any[]).map((sms, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">{sms.id}</td>
                      <td className="p-3">{sms.patient}</td>
                      <td className="p-3">{sms.phoneNumber}</td>
                      <td className="p-3">{sms.message}</td>
                      <td className="p-3">
                        <Badge className={sms.status === 'sent' ? 'bg-green-500' : 'bg-red-500'}>
                          {sms.status}
                        </Badge>
                      </td>
                      <td className="p-3">{sms.sentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {(reportType === 'total-patient' || reportType === 'active-patient' || reportType === 'discharged-patient' || reportType === 'new-register') && (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Patient ID</th>
                    <th className="text-left p-3 font-semibold">Patient Name</th>
                    <th className="text-left p-3 font-semibold">Card Number</th>
                    <th className="text-left p-3 font-semibold">Registration Date</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Phone Number</th>
                  </tr>
                </thead>
                <tbody>
                  {(getReportData() as any[]).map((patient, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">{patient.id}</td>
                      <td className="p-3">{patient.name}</td>
                      <td className="p-3">{patient.cardNumber}</td>
                      <td className="p-3">{patient.registrationDate}</td>
                      <td className="p-3">
                        <Badge className={patient.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="p-3">{patient.phoneNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {getReportData().length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No data available for this report</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
