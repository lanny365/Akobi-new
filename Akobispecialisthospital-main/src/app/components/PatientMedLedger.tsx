import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  DollarSign,
  CreditCard,
  History,
  Activity,
  Stethoscope,
  Pill,
  FlaskConical
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useCashier, type LedgerPatientAccount as Patient } from '../context/CashierContext';

export function PatientMedLedger() {
  const { patientLedgers } = useCashier();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchType, setSearchType] = useState<'all' | 'personal' | 'family' | 'name'>('all');
  const patients = patientLedgers;

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    const latestPatient = patientLedgers.find((patient) => patient.id === selectedPatient.id);
    if (latestPatient && latestPatient !== selectedPatient) {
      setSelectedPatient(latestPatient);
    }
  }, [patientLedgers, selectedPatient]);

  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    switch (searchType) {
      case 'personal':
        return patient.personalCardNumber.toLowerCase().includes(query);
      case 'family':
        return patient.familyCardNumber.toLowerCase().includes(query);
      case 'name':
        return patient.fullName.toLowerCase().includes(query);
      case 'all':
      default:
        return (
          patient.personalCardNumber.toLowerCase().includes(query) ||
          patient.familyCardNumber.toLowerCase().includes(query) ||
          patient.fullName.toLowerCase().includes(query)
        );
    }
  });

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length.toString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'Total Wallet Balance',
      value: `₦${patients.reduce((sum, p) => sum + p.walletBalance, 0).toLocaleString()}`,
      icon: Wallet,
      color: 'bg-green-500'
    },
    {
      label: 'Total Revenue',
      value: `₦${patients.reduce((sum, p) => sum + p.totalCharges, 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      label: 'Active Accounts',
      value: patients.filter(p => p.walletBalance > 0).length.toString(),
      icon: CreditCard,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-lg flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Medledger</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive financial ledger and medical history for all patients
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
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

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={searchType === 'all' ? 'default' : 'outline'}
                onClick={() => setSearchType('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={searchType === 'personal' ? 'default' : 'outline'}
                onClick={() => setSearchType('personal')}
                size="sm"
              >
                Personal Card
              </Button>
              <Button
                variant={searchType === 'family' ? 'default' : 'outline'}
                onClick={() => setSearchType('family')}
                size="sm"
              >
                Family Card
              </Button>
              <Button
                variant={searchType === 'name' ? 'default' : 'outline'}
                onClick={() => setSearchType('name')}
                size="sm"
              >
                Name
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={`Search by ${searchType === 'all' ? 'card number or name' : searchType === 'personal' ? 'personal card number' : searchType === 'family' ? 'family card number' : 'patient name'}...`}
                className="pl-12 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Patients ({filteredPatients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-[1.02] ${
                    selectedPatient?.id === patient.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                      <p className="text-xs text-gray-600">Personal: {patient.personalCardNumber}</p>
                      <p className="text-xs text-gray-600">Family: {patient.familyCardNumber}</p>
                    </div>
                    <Badge
                      className={patient.walletBalance > 0 ? 'bg-green-500' : 'bg-gray-400'}
                    >
                      Active
                    </Badge>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Wallet:</span>
                      <span className="font-bold text-green-700">
                        ₦{patient.walletBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Ledger & History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPatient ? `${selectedPatient.fullName} - Medledger` : 'Select a Patient'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Summary */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Age / Gender</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.age} / {selectedPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Registered</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.registrationDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900 text-xs">{selectedPatient.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Wallet Balance</p>
                          <p className="text-xl font-bold text-green-700">
                            ₦{selectedPatient.walletBalance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Paid</p>
                          <p className="text-xl font-bold text-blue-700">
                            ₦{selectedPatient.totalPaid.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Charges</p>
                          <p className="text-xl font-bold text-red-700">
                            ₦{selectedPatient.totalCharges.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for Ledger and Medical History */}
                <Tabs defaultValue="ledger">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ledger">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Financial Ledger
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <Activity className="w-4 h-4 mr-2" />
                      Medical History
                    </TabsTrigger>
                  </TabsList>

                  {/* Financial Ledger Tab */}
                  <TabsContent value="ledger" className="mt-4">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {selectedPatient.transactions.map((txn) => (
                        <div
                          key={txn.id}
                          className={`border-l-4 p-4 rounded-r-lg ${
                            txn.type === 'credit'
                              ? 'border-l-green-500 bg-green-50'
                              : 'border-l-red-500 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {txn.type === 'credit' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <h4 className="font-semibold text-gray-900">{txn.description}</h4>
                              </div>
                              <p className="text-xs text-gray-600">{txn.date}</p>
                              <p className="text-xs text-gray-500 mt-1">Ref: {txn.reference}</p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-bold ${
                                  txn.type === 'credit' ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Balance: ₦{txn.balance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Medical History Tab */}
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {selectedPatient.medicalHistory.map((record) => (
                        <Card key={record.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                {record.type === 'consultation' && <Stethoscope className="w-5 h-5 text-blue-600" />}
                                {record.type === 'prescription' && <Pill className="w-5 h-5 text-green-600" />}
                                {record.type === 'lab-test' && <FlaskConical className="w-5 h-5 text-purple-600" />}
                                {record.type === 'admission' && <FileText className="w-5 h-5 text-orange-600" />}
                                {record.type === 'billing' && <DollarSign className="w-5 h-5 text-emerald-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900 capitalize">
                                    {record.type.replace('-', ' ')}
                                  </h4>
                                  <Badge variant="outline">{record.date}</Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  <span className="font-medium">Doctor:</span> {record.doctor}
                                </p>
                                {record.diagnosis && (
                                  <p className="text-sm text-gray-700 mb-2">
                                    <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                                  </p>
                                )}
                                {record.prescription && (
                                  <div className="bg-green-50 p-3 rounded-lg mb-2">
                                    <p className="text-sm font-medium text-green-900 mb-1">Prescription:</p>
                                    <p className="text-sm text-green-800">{record.prescription}</p>
                                  </div>
                                )}
                                {record.labTests && (
                                  <div className="bg-purple-50 p-3 rounded-lg mb-2">
                                    <p className="text-sm font-medium text-purple-900 mb-1">Lab Tests:</p>
                                    <div className="space-y-1">
                                      {record.labTests.map((test, idx) => (
                                        <p key={idx} className="text-sm text-purple-800">• {test}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 italic">{record.notes}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Select a patient to view Medledger</p>
                <p className="text-sm mt-2">Search by personal card, family card, or name</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
