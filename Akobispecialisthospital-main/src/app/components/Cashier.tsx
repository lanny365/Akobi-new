import { useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  History,
  Printer,
  Receipt,
  Search,
  Stethoscope,
  Wallet,
  Plus,
  ArrowUpCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { LabWalletViewer } from './LabWalletViewer';
import { PatientMedLedger } from './PatientMedLedger';
import { useCashier } from '../context/CashierContext';
import { usePatientQueue } from '../context/PatientQueueContext';
import { useStaffAuth } from '../context/StaffAuthContext';
import { useVitalSigns } from '../context/VitalSignsContext';

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

export function Cashier() {
  const { payments, processPayment, tillBalance, cashTellerEntries, directFundWallet, patientLedgers } = useCashier();
  const { removeFromQueue: removeFromDoctorQueue } = usePatientQueue();
  const { currentStaff } = useStaffAuth();
  const { removeFromQueue: removeFromVitalSignsQueue } = useVitalSigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'payments' | 'teller' | 'medledger' | 'lab-wallet'>('payments');
  const [paymentTab, setPaymentTab] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [transactionReference, setTransactionReference] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState('');

  // Teller direct-fund state
  const [tellerCardNumber, setTellerCardNumber] = useState('');
  const [tellerPatientName, setTellerPatientName] = useState('');
  const [tellerAmount, setTellerAmount] = useState('');
  const [tellerMethod, setTellerMethod] = useState<'Cash' | 'Card/POS' | 'Bank Transfer'>('Cash');
  const [tellerReference, setTellerReference] = useState('');
  const [tellerSearchQuery, setTellerSearchQuery] = useState('');

  const sortedPayments = useMemo(
    () =>
      [...payments].sort((left, right) => {
        const leftPriority = left.balance > 0 ? 0 : 1;
        const rightPriority = right.balance > 0 ? 0 : 1;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return right.transactionDate.localeCompare(left.transactionDate);
      }),
    [payments],
  );

  const queuePayments = sortedPayments.filter((payment) => payment.balance > 0);

  const filteredPayments = queuePayments.filter((payment) =>
    payment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payment.routedBy || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedPayment =
    filteredPayments.find((payment) => payment.id === selectedPaymentId) ||
    queuePayments.find((payment) => payment.id === selectedPaymentId) ||
    null;

  useEffect(() => {
    if (!selectedPaymentId && filteredPayments.length > 0) {
      setSelectedPaymentId(filteredPayments[0].id);
      return;
    }

    if (selectedPaymentId && !queuePayments.find((payment) => payment.id === selectedPaymentId) && filteredPayments.length > 0) {
      setSelectedPaymentId(filteredPayments[0].id);
      return;
    }

    if (selectedPaymentId && queuePayments.length === 0) {
      setSelectedPaymentId(null);
    }
  }, [filteredPayments, queuePayments, selectedPaymentId]);

  useEffect(() => {
    if (!selectedPayment) {
      setAmountPaidInput('');
      return;
    }

    setAmountPaidInput(String(selectedPayment.balance));
  }, [selectedPayment?.id, selectedPayment?.balance]);

  const pendingCount = payments.filter((payment) => payment.balance > 0).length;
  const totalOutstanding = payments.reduce((sum, payment) => sum + payment.balance, 0);
  const doctorRoutedCount = payments.filter((payment) => payment.sourceModule === 'doctor').length;
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  const stats = [
    { label: 'Collected Revenue', value: formatCurrency(totalPaid), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Outstanding Bills', value: formatCurrency(totalOutstanding), icon: Receipt, color: 'bg-orange-500' },
    { label: 'Pending Queue', value: pendingCount.toString(), icon: Clock, color: 'bg-blue-500' },
    { label: 'Doctor Routed', value: doctorRoutedCount.toString(), icon: Stethoscope, color: 'bg-purple-500' },
  ];

  const currentCashierName = currentStaff?.fullName || 'Cashier Desk';
  const selectedMethodLabel =
    paymentTab === 'cash' ? 'Cash' : paymentTab === 'card' ? 'Card/POS' : 'Bank Transfer';

  const handleProcessSelectedPayment = async () => {
    if (!selectedPayment) {
      return;
    }

    if (selectedPayment.balance <= 0) {
      toast.info('This patient billing has already been fully cleared.');
      return;
    }

    const amountToPay = Number(amountPaidInput);
    if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
      toast.error('Enter a valid amount paid.');
      return;
    }

    if (amountToPay > selectedPayment.balance) {
      toast.error('Amount paid cannot be more than the outstanding balance.');
      return;
    }

    const paymentResult = processPayment(
      selectedPayment.id,
      selectedMethodLabel,
      currentCashierName,
      transactionReference,
      amountToPay,
    );

    if (!paymentResult) {
      toast.error('Unable to process this payment right now.');
      return;
    }

    if (selectedPayment.sourceModule === 'doctor' && paymentResult.fullyPaid) {
      const patientQueueKey = selectedPayment.patientId || selectedPayment.cardNumber;
      await removeFromDoctorQueue(patientQueueKey);
      removeFromVitalSignsQueue(patientQueueKey);

      if (selectedPayment.patientId && selectedPayment.patientId !== selectedPayment.cardNumber) {
        await removeFromDoctorQueue(selectedPayment.cardNumber);
        removeFromVitalSignsQueue(selectedPayment.cardNumber);
      }
    }

    toast.success(
      paymentResult.fullyPaid
        ? `${selectedPayment.patientName} billing fully cleared via ${selectedMethodLabel}.`
        : `${selectedPayment.patientName} partial payment of ${formatCurrency(paymentResult.appliedAmount)} recorded via ${selectedMethodLabel}.`,
    );
    setAmountPaidInput(paymentResult.fullyPaid ? '' : String(selectedPayment.balance - paymentResult.appliedAmount));
    setTransactionReference('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-sm p-2">
        <div className="flex gap-2">
          <Button
            variant={activeView === 'payments' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveView('payments')}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Patient Billing
          </Button>
          <Button
            variant={activeView === 'teller' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveView('teller')}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Teller Page
          </Button>
          <Button
            variant={activeView === 'medledger' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveView('medledger')}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Patient Medledger
          </Button>
          <Button
            variant={activeView === 'lab-wallet' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveView('lab-wallet')}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Lab Wallet Monitor
          </Button>
        </div>
      </div>

      {activeView === 'lab-wallet' ? (
        <LabWalletViewer />
      ) : activeView === 'teller' ? (
        <div className="space-y-6">
          {/* Header banner */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-6 py-6 text-white shadow-lg">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">Teller Workspace</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">Cash Teller</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Fund any patient wallet directly — no billing queue required. Enter the patient card number, amount, and payment method to post instantly.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-300">Till Balance</p>
                  <p className="mt-2 text-2xl font-bold text-amber-300">₦{tillBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-300">Receipts Today</p>
                  <p className="mt-2 text-2xl font-bold">{cashTellerEntries.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-300">Teller</p>
                  <p className="mt-2 text-sm font-semibold truncate">{currentCashierName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left: Fund Wallet Form */}
            <div className="xl:col-span-2 space-y-4">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-slate-50 to-amber-50 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-semibold text-slate-900">Fund Patient Wallet</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Post funds to any patient wallet independently of the billing queue.</p>
                </div>
                <CardContent className="p-5 space-y-4">
                  {/* Card number lookup */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Patient Card Number <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter or search card number…"
                        value={tellerCardNumber}
                        onChange={(e) => {
                          setTellerCardNumber(e.target.value);
                          const match = patientLedgers.find((p) => p.personalCardNumber.toLowerCase() === e.target.value.toLowerCase());
                          if (match) setTellerPatientName(match.patientName);
                          else setTellerPatientName('');
                        }}
                      />
                    </div>
                    {/* Patient match hint */}
                    {tellerCardNumber && (() => {
                      const match = patientLedgers.find((p) => p.personalCardNumber.toLowerCase() === tellerCardNumber.toLowerCase());
                      return match ? (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span><span className="font-semibold">{match.patientName}</span> — Wallet: ₦{match.walletBalance.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>New patient — a wallet will be created on funding.</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Patient name (auto-filled or manual) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Patient Name <span className="text-red-500">*</span></Label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Auto-filled or type manually"
                      value={tellerPatientName}
                      onChange={(e) => setTellerPatientName(e.target.value)}
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Amount (₦) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">₦</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="0.00"
                        value={tellerAmount}
                        onChange={(e) => setTellerAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Cash', 'Card/POS', 'Bank Transfer'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setTellerMethod(m)}
                          className={`rounded-lg border py-2 text-xs font-medium transition-colors ${tellerMethod === m ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Reference / Teller Slip <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="POS slip, transfer ref, or teller number"
                      value={tellerReference}
                      onChange={(e) => setTellerReference(e.target.value)}
                    />
                  </div>

                  {/* Processed by */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                    Processed by: <span className="font-semibold text-slate-800">{currentCashierName}</span>
                  </div>

                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      const amt = parseFloat(tellerAmount);
                      if (!tellerCardNumber.trim()) { toast.error('Enter the patient card number.'); return; }
                      if (!tellerPatientName.trim()) { toast.error('Enter the patient name.'); return; }
                      if (!Number.isFinite(amt) || amt <= 0) { toast.error('Enter a valid amount.'); return; }
                      const result = directFundWallet({ cardNumber: tellerCardNumber.trim(), patientName: tellerPatientName.trim(), amount: amt, method: tellerMethod, reference: tellerReference, cashierName: currentCashierName });
                      if (result.success) {
                        toast.success(`₦${amt.toLocaleString()} funded to ${tellerPatientName} (${tellerCardNumber}) via ${tellerMethod}.`);
                        setTellerCardNumber(''); setTellerPatientName(''); setTellerAmount(''); setTellerReference('');
                      } else {
                        toast.error('Failed to fund wallet. Check the amount and try again.');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Fund Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Transactions log */}
            <div className="xl:col-span-3 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Search by patient name, card number, or receipt ID…"
                  value={tellerSearchQuery}
                  onChange={(e) => setTellerSearchQuery(e.target.value)}
                />
              </div>

              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Teller Transaction Log</h4>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{cashTellerEntries.length} entries</span>
                </div>
                <CardContent className="p-0">
                  {cashTellerEntries.length > 0 ? (() => {
                    const filtered = cashTellerEntries.filter((e) =>
                      !tellerSearchQuery ||
                      e.patientName.toLowerCase().includes(tellerSearchQuery.toLowerCase()) ||
                      e.cardNumber.toLowerCase().includes(tellerSearchQuery.toLowerCase()) ||
                      e.id.toLowerCase().includes(tellerSearchQuery.toLowerCase()),
                    );
                    return filtered.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                              <th className="px-4 py-3 text-left font-medium text-slate-600">Receipt ID</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-600">Patient</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-600">Reference</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-600">Received By</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-600">Time</th>
                              <th className="px-4 py-3 text-right font-medium text-slate-600">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filtered.map((entry) => (
                              <tr key={entry.id} className="hover:bg-amber-50/40 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-900">{entry.id}</td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800">{entry.patientName}</div>
                                  <div className="text-xs text-slate-500">{entry.cardNumber}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{entry.reference || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{entry.receivedBy}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs">{entry.receivedAt}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-700">₦{entry.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-sm">No entries match your search.</div>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Banknote className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="text-sm font-medium">No teller entries yet</p>
                      <p className="text-xs mt-1">Fund a wallet using the form to record your first entry.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : activeView === 'medledger' ? (
        <PatientMedLedger />
      ) : (
        <>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-green-900 mb-1">Cashier Billing Queue</h3>
            <p className="text-xs text-green-700">
              Only unpaid patient bills remain in this queue. Cleared bills drop out automatically after payment is completed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Billing Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search patient billings..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[680px] overflow-y-auto">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <div
                        key={payment.id}
                        onClick={() => setSelectedPaymentId(payment.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPayment?.id === payment.id
                            ? 'border-green-500 bg-green-50'
                            : 'hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{payment.patientName}</h4>
                            <p className="text-sm text-gray-600">{payment.cardNumber}</p>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Pending
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                          <Badge className={payment.sourceModule === 'doctor' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}>
                            {payment.sourceModule === 'doctor' ? 'Doctor Routed' : 'Service Billing'}
                          </Badge>
                          {payment.routedBy && (
                            <Badge className="bg-white text-gray-700 border border-gray-200">
                              {payment.routedBy}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm mt-3">
                          <span className="text-gray-600">Outstanding</span>
                          <span className="font-bold text-orange-600">{formatCurrency(payment.balance)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>Total Bill: {formatCurrency(payment.totalAmount)}</span>
                          <span>{payment.transactionDate}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                      <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium text-slate-700">No unpaid bills in queue</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Cleared patient bills are removed automatically from this pending queue.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedPayment ? `Process Billing - ${selectedPayment.patientName}` : 'Select a Billing Request'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPayment ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Patient Name</p>
                        <p className="font-semibold">{selectedPayment.patientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Card Number</p>
                        <p className="font-semibold">{selectedPayment.cardNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Billing ID</p>
                        <p className="font-semibold">{selectedPayment.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ledger Reference</p>
                        <p className="font-semibold">{selectedPayment.ledgerReference || 'Not linked yet'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Routed By</p>
                        <p className="font-semibold">{selectedPayment.routedBy || 'Hospital Service Desk'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Queue Status</p>
                        <p className="font-semibold">{selectedPayment.balance > 0 ? 'Awaiting Cashier Clearance' : 'Fully Cleared'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600">Total Bill</p>
                          <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(selectedPayment.totalAmount)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600">Amount Paid</p>
                          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(selectedPayment.amountPaid)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600">Outstanding Balance</p>
                          <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(selectedPayment.balance)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">Services Routed to Cashier</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Service</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Source</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedPayment.services.map((service) => (
                              <tr key={service.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{service.type}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  <p>{service.description}</p>
                                  {service.billedBy && (
                                    <p className="text-xs text-gray-500 mt-1">Billed by {service.billedBy}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge className={service.source === 'doctor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                                    {service.source === 'doctor' ? 'Doctor Billing' : 'Hospital Service'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(service.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">Patient MedLedger Impact</p>
                      <p className="text-xs text-slate-600 mt-1">
                        This billing has already been posted as a debit to the patient MedLedger. Cashier clearance here records the matching payment and settles the outstanding balance.
                      </p>
                    </div>

                    {selectedPayment.balance > 0 ? (
                      <Tabs value={paymentTab} onValueChange={(value) => setPaymentTab(value as 'cash' | 'card' | 'transfer')}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="cash">Cash</TabsTrigger>
                          <TabsTrigger value="card">Card/POS</TabsTrigger>
                          <TabsTrigger value="transfer">Transfer</TabsTrigger>
                        </TabsList>

                        <TabsContent value={paymentTab} className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Processed By</Label>
                              <Input value={currentCashierName} disabled className="mt-1" />
                            </div>
                            <div>
                              <Label>Payment Method</Label>
                              <Select value={selectedMethodLabel} disabled>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={selectedMethodLabel}>{selectedMethodLabel}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Amount to Clear</Label>
                              <Input value={formatCurrency(selectedPayment.balance)} disabled className="mt-1" />
                            </div>
                            <div>
                              <Label>Amount Paid</Label>
                              <Input
                                type="number"
                                min="0"
                                max={selectedPayment.balance}
                                step="0.01"
                                value={amountPaidInput}
                                onChange={(event) => setAmountPaidInput(event.target.value)}
                                placeholder="Enter amount received"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Reference / Teller / POS Slip</Label>
                              <Input
                                value={transactionReference}
                                onChange={(event) => setTransactionReference(event.target.value)}
                                placeholder="Optional transaction reference"
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" onClick={handleProcessSelectedPayment}>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Complete Billing Clearance
                          </Button>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                          <p className="font-semibold text-green-900">Billing Fully Cleared</p>
                          <p className="text-sm text-green-700 mt-1">
                            Last payment method: {selectedPayment.paymentMethod || 'Not recorded'}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Processed by {selectedPayment.cashierName} at {selectedPayment.cashierTime}
                          </p>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Printer className="w-4 h-4 mr-2" />
                          Print Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a billing request from the queue to process</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
