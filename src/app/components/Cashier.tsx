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
} from 'lucide-react';
import { toast } from 'sonner';
import { LabWalletViewer } from './LabWalletViewer';
import { PatientMedLedger } from './PatientMedLedger';
import { useCashier } from '../context/CashierContext';
import { useStaffAuth } from '../context/StaffAuthContext';

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

export function Cashier() {
  const { payments, processPayment, tillBalance, cashTellerEntries } = useCashier();
  const { currentStaff } = useStaffAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'payments' | 'teller' | 'medledger' | 'lab-wallet'>('payments');
  const [paymentTab, setPaymentTab] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [transactionReference, setTransactionReference] = useState('');

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

  const handleProcessSelectedPayment = () => {
    if (!selectedPayment) {
      return;
    }

    if (selectedPayment.balance <= 0) {
      toast.info('This patient billing has already been fully cleared.');
      return;
    }

    processPayment(selectedPayment.id, selectedMethodLabel, currentCashierName, transactionReference);
    toast.success(`${selectedPayment.patientName} billing cleared successfully via ${selectedMethodLabel}.`);
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
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border-l-4 border-amber-500">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Cash Teller Balance</h3>
            <p className="text-xs text-amber-700">
              Every cashier payment processed with the `Cash` option is posted here and added to the running till balance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Till Balance</p>
                    <p className="text-2xl font-bold mt-1 text-amber-700">₦{tillBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-500 p-3 rounded-lg">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cash Receipts</p>
                    <p className="text-2xl font-bold mt-1">{cashTellerEntries.length}</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Latest Cashier</p>
                    <p className="text-lg font-bold mt-1">{cashTellerEntries[0]?.receivedBy || currentCashierName}</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <History className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Teller Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {cashTellerEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Receipt ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Ref</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Received By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cash Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cashTellerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div>
                              <p className="font-medium">{entry.patientName}</p>
                              <p className="text-xs text-gray-500">{entry.cardNumber}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.reference}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.receivedBy}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.receivedAt}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">₦{entry.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Banknote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No cash payments recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Amount to Clear</Label>
                              <Input value={formatCurrency(selectedPayment.balance)} disabled className="mt-1" />
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
