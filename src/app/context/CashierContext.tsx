import { createContext, useContext, useState, type ReactNode } from 'react';

export interface PaymentService {
  id: string;
  type: string;
  description: string;
  amount: number;
  paid: boolean;
  method: string;
  source: 'doctor' | 'cashier' | 'system';
  billedBy?: string;
  billedAt: string;
}

export interface Payment {
  id: string;
  patientId?: string;
  patientName: string;
  cardNumber: string;
  services: PaymentService[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: 'pending' | 'paid' | 'partial';
  paymentMethod?: string;
  transactionDate: string;
  cashierName: string;
  cashierTime: string;
  sourceModule: 'doctor' | 'cashier' | 'system';
  routedBy?: string;
  ledgerReference?: string;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  reference: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'prescription' | 'lab-test' | 'admission' | 'billing';
  doctor: string;
  diagnosis?: string;
  prescription?: string;
  labTests?: string[];
  notes: string;
}

export interface LedgerPatientAccount {
  id: string;
  personalCardNumber: string;
  familyCardNumber: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  walletBalance: number;
  totalPaid: number;
  totalCharges: number;
  registrationDate: string;
  transactions: LedgerTransaction[];
  medicalHistory: MedicalRecord[];
}

export interface CashTellerEntry {
  id: string;
  paymentId: string;
  patientName: string;
  cardNumber: string;
  amount: number;
  reference: string;
  receivedBy: string;
  receivedAt: string;
}

export interface GeneralLedgerAccount {
  id: string;
  name: string;
  code: string;
  accountClass: 'asset' | 'liability' | 'income' | 'expense';
  accountCategory?: string;
  chartOfAccount?: string;
  accountDetail?: string;
  normalBalance: 'debit' | 'credit';
  balance: number;
  debitTotal: number;
  creditTotal: number;
  protected?: boolean;
}

export interface GeneralLedgerEntryLine {
  accountId: string;
  accountName: string;
  type: 'debit' | 'credit';
  amount: number;
}

export interface GeneralLedgerEntry {
  id: string;
  paymentId: string;
  patientName: string;
  cardNumber: string;
  reference: string;
  narration: string;
  postedBy: string;
  postedAt: string;
  lines: GeneralLedgerEntryLine[];
}

interface DoctorBillingPayload {
  patientId?: string;
  patientName: string;
  cardNumber: string;
  age?: number;
  gender?: string;
  phone?: string;
  doctorName: string;
  services: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
}

interface CashierContextType {
  payments: Payment[];
  patientLedgers: LedgerPatientAccount[];
  tillBalance: number;
  cashTellerEntries: CashTellerEntry[];
  generalLedgerAccounts: GeneralLedgerAccount[];
  generalLedgerEntries: GeneralLedgerEntry[];
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  submitDoctorBilling: (payload: DoctorBillingPayload) => {
    paymentId: string;
    ledgerReference: string;
    totalAmount: number;
  };
  addGeneralLedgerAccount: (payload: {
    name: string;
    code: string;
    accountClass: 'asset' | 'liability' | 'income' | 'expense';
    accountCategory?: string;
    chartOfAccount?: string;
    accountDetail?: string;
  }) => void;
  removeGeneralLedgerAccount: (accountId: string) => void;
  processPayment: (paymentId: string, method: string, cashierName: string, reference?: string) => void;
  getPatientLedgerByCardNumber: (cardNumber: string) => LedgerPatientAccount | undefined;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

const formatDateTime = (value: Date) =>
  `${value.toISOString().split('T')[0]} ${value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

const formatClockTime = (value: Date) =>
  value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const initialPayments: Payment[] = [
  {
    id: 'PAY-001',
    patientId: '1',
    patientName: 'James Anderson',
    cardNumber: 'PT-2026-0001',
    services: [
      { id: 'SRV-001', type: 'Consultation', description: 'Doctor consultation', amount: 5000, paid: true, method: 'Cash', source: 'system', billedBy: 'Reception', billedAt: '2026-04-24 10:00' },
      { id: 'SRV-002', type: 'Lab Test', description: 'CBC, Malaria Test', amount: 8000, paid: true, method: 'Card', source: 'system', billedBy: 'Laboratory', billedAt: '2026-04-24 10:00' },
      { id: 'SRV-003', type: 'Pharmacy', description: 'Medications', amount: 3500, paid: true, method: 'Cash', source: 'system', billedBy: 'Pharmacy', billedAt: '2026-04-24 10:00' },
    ],
    totalAmount: 16500,
    amountPaid: 16500,
    balance: 0,
    status: 'paid',
    paymentMethod: 'Cash/Card',
    transactionDate: '2026-04-24 10:00',
    cashierName: 'Lisa Anderson',
    cashierTime: '10:00 AM',
    sourceModule: 'system',
    routedBy: 'Reception',
    ledgerReference: 'BILL-001',
  },
  {
    id: 'PAY-002',
    patientId: '2',
    patientName: 'Grace Okonkwo',
    cardNumber: 'PT-2026-0002',
    services: [
      { id: 'SRV-004', type: 'Consultation', description: 'Doctor consultation', amount: 5000, paid: true, method: 'Card', source: 'system', billedBy: 'Reception', billedAt: '2026-04-24 09:45' },
      { id: 'SRV-005', type: 'Pharmacy', description: 'Medications', amount: 2000, paid: true, method: 'Card', source: 'system', billedBy: 'Pharmacy', billedAt: '2026-04-24 09:45' },
    ],
    totalAmount: 7000,
    amountPaid: 7000,
    balance: 0,
    status: 'paid',
    paymentMethod: 'Card',
    transactionDate: '2026-04-24 09:45',
    cashierName: 'Lisa Anderson',
    cashierTime: '09:45 AM',
    sourceModule: 'system',
    routedBy: 'Reception',
    ledgerReference: 'BILL-002',
  },
  {
    id: 'PAY-003',
    patientId: '3',
    patientName: 'Mohammed Ibrahim',
    cardNumber: 'PT-2025-1234',
    services: [
      { id: 'SRV-006', type: 'Consultation', description: 'Doctor consultation', amount: 5000, paid: true, method: 'Cash', source: 'system', billedBy: 'Reception', billedAt: '2026-04-24 09:20' },
      { id: 'SRV-007', type: 'Lab Test', description: 'Blood Sugar, HbA1c', amount: 6000, paid: true, method: 'Cash', source: 'system', billedBy: 'Laboratory', billedAt: '2026-04-24 09:20' },
    ],
    totalAmount: 11000,
    amountPaid: 11000,
    balance: 0,
    status: 'paid',
    paymentMethod: 'Cash',
    transactionDate: '2026-04-24 09:20',
    cashierName: 'Lisa Anderson',
    cashierTime: '09:20 AM',
    sourceModule: 'system',
    routedBy: 'Reception',
    ledgerReference: 'BILL-003',
  },
  {
    id: 'PAY-004',
    patientId: '4',
    patientName: 'Sarah Williams',
    cardNumber: 'PT-2026-0015',
    services: [
      { id: 'SRV-008', type: 'Consultation', description: 'Doctor consultation', amount: 5000, paid: true, method: 'Transfer', source: 'system', billedBy: 'Reception', billedAt: '2026-04-24 11:15' },
      { id: 'SRV-009', type: 'X-Ray', description: 'Chest X-Ray', amount: 12000, paid: true, method: 'Transfer', source: 'system', billedBy: 'Radiology', billedAt: '2026-04-24 11:15' },
    ],
    totalAmount: 17000,
    amountPaid: 17000,
    balance: 0,
    status: 'paid',
    paymentMethod: 'Bank Transfer',
    transactionDate: '2026-04-24 11:15',
    cashierName: 'Lisa Anderson',
    cashierTime: '11:15 AM',
    sourceModule: 'system',
    routedBy: 'Reception',
    ledgerReference: 'BILL-004',
  },
  {
    id: 'PAY-005',
    patientId: '5',
    patientName: 'David Chen',
    cardNumber: 'PT-2026-0032',
    services: [
      { id: 'SRV-010', type: 'Consultation', description: 'Specialist consultation', amount: 8000, paid: true, method: 'Card', source: 'system', billedBy: 'Reception', billedAt: '2026-04-24 08:30' },
      { id: 'SRV-011', type: 'Lab Test', description: 'Lipid profile, Liver function', amount: 10000, paid: true, method: 'Card', source: 'system', billedBy: 'Laboratory', billedAt: '2026-04-24 08:30' },
      { id: 'SRV-012', type: 'Pharmacy', description: 'Medications', amount: 5500, paid: true, method: 'Card', source: 'system', billedBy: 'Pharmacy', billedAt: '2026-04-24 08:30' },
    ],
    totalAmount: 23500,
    amountPaid: 23500,
    balance: 0,
    status: 'paid',
    paymentMethod: 'Card',
    transactionDate: '2026-04-24 08:30',
    cashierName: 'Lisa Anderson',
    cashierTime: '08:30 AM',
    sourceModule: 'system',
    routedBy: 'Reception',
    ledgerReference: 'BILL-005',
  },
];

const initialLedgers: LedgerPatientAccount[] = [
  {
    id: '1',
    personalCardNumber: 'PT-2026-0001',
    familyCardNumber: 'FAM-2026-001',
    fullName: 'James Anderson',
    age: 45,
    gender: 'Male',
    phone: '08012345678',
    address: 'Plot 12, Victoria Island, Lagos',
    walletBalance: 45000,
    totalPaid: 150000,
    totalCharges: 105000,
    registrationDate: '2026-01-15',
    transactions: [
      { id: 'TXN-001', date: '2026-04-25 09:00', description: 'Initial Deposit', type: 'credit', amount: 50000, balance: 50000, reference: 'CASH-001' },
      { id: 'TXN-002', date: '2026-04-25 10:30', description: 'Consultation Fee - Dr. Sarah Johnson', type: 'debit', amount: 15000, balance: 35000, reference: 'BILL-001' },
      { id: 'TXN-003', date: '2026-04-25 11:00', description: 'Pharmacy - Medication Dispensed', type: 'debit', amount: 8500, balance: 26500, reference: 'BILL-002' },
      { id: 'TXN-004', date: '2026-04-25 14:00', description: 'Payment - Bank Transfer', type: 'credit', amount: 100000, balance: 126500, reference: 'TRNF-001' },
      { id: 'TXN-005', date: '2026-04-25 15:30', description: 'Laboratory Tests - CBC, Malaria Test', type: 'debit', amount: 12000, balance: 114500, reference: 'BILL-003' },
      { id: 'TXN-006', date: '2026-04-25 16:00', description: 'Ward Admission Fee', type: 'debit', amount: 25000, balance: 89500, reference: 'BILL-004' },
      { id: 'TXN-007', date: '2026-04-26 10:00', description: 'Surgical Procedure Fee', type: 'debit', amount: 44500, balance: 45000, reference: 'BILL-005' },
    ],
    medicalHistory: [
      { id: 'MED-001', date: '2026-04-25 10:30', type: 'consultation', doctor: 'Dr. Sarah Johnson', diagnosis: 'Acute Upper Respiratory Infection', notes: 'Patient presented with fever and cough. Prescribed antibiotics and rest.' },
      { id: 'MED-002', date: '2026-04-25 11:00', type: 'prescription', doctor: 'Dr. Sarah Johnson', prescription: 'Amoxicillin 500mg (3x daily for 5 days), Paracetamol 500mg (as needed)', notes: 'Medication counseling provided. Patient advised to complete full course.' },
      { id: 'MED-003', date: '2026-04-25 15:30', type: 'lab-test', doctor: 'Dr. Sarah Johnson', labTests: ['Complete Blood Count (CBC)', 'Malaria Test'], notes: 'CBC shows slight elevation in WBC. Malaria test negative.' },
      { id: 'MED-004', date: '2026-04-25 16:00', type: 'admission', doctor: 'Dr. Sarah Johnson', diagnosis: 'Observation for possible complications', notes: 'Patient admitted to general ward for 24-hour observation.' },
    ],
  },
  {
    id: '2',
    personalCardNumber: 'PT-2026-0002',
    familyCardNumber: 'FAM-2026-001',
    fullName: 'Grace Okonkwo',
    age: 42,
    gender: 'Female',
    phone: '08012345679',
    address: 'Plot 12, Victoria Island, Lagos',
    walletBalance: 75000,
    totalPaid: 100000,
    totalCharges: 25000,
    registrationDate: '2026-01-15',
    transactions: [
      { id: 'TXN-008', date: '2026-04-20 09:00', description: 'Initial Deposit', type: 'credit', amount: 100000, balance: 100000, reference: 'CASH-002' },
      { id: 'TXN-009', date: '2026-04-22 10:00', description: 'Consultation Fee - Dr. Michael Chen', type: 'debit', amount: 15000, balance: 85000, reference: 'BILL-006' },
      { id: 'TXN-010', date: '2026-04-22 11:30', description: 'Pharmacy - Medication', type: 'debit', amount: 10000, balance: 75000, reference: 'BILL-007' },
    ],
    medicalHistory: [
      { id: 'MED-005', date: '2026-04-22 10:00', type: 'consultation', doctor: 'Dr. Michael Chen', diagnosis: 'Routine Checkup', notes: 'All vitals normal. General health good.' },
    ],
  },
  {
    id: '3',
    personalCardNumber: 'PT-2025-1234',
    familyCardNumber: 'FAM-2026-002',
    fullName: 'Mohammed Ibrahim',
    age: 58,
    gender: 'Male',
    phone: '08098765432',
    address: 'Plot 45, Ikoyi, Lagos',
    walletBalance: 120000,
    totalPaid: 200000,
    totalCharges: 80000,
    registrationDate: '2026-02-10',
    transactions: [
      { id: 'TXN-011', date: '2026-04-15 14:00', description: 'Payment - Cash Deposit', type: 'credit', amount: 200000, balance: 200000, reference: 'CASH-003' },
      { id: 'TXN-012', date: '2026-04-18 09:00', description: 'Diabetes Management Consultation', type: 'debit', amount: 20000, balance: 180000, reference: 'BILL-008' },
      { id: 'TXN-013', date: '2026-04-18 10:00', description: 'HbA1c Test & Blood Sugar Monitoring', type: 'debit', amount: 15000, balance: 165000, reference: 'BILL-009' },
      { id: 'TXN-014', date: '2026-04-18 11:00', description: 'Diabetic Medications - 3 Months Supply', type: 'debit', amount: 45000, balance: 120000, reference: 'BILL-010' },
    ],
    medicalHistory: [
      { id: 'MED-006', date: '2026-04-18 09:00', type: 'consultation', doctor: 'Dr. Amina Yusuf', diagnosis: 'Type 2 Diabetes Mellitus - Well Controlled', notes: 'Patient compliance excellent. Blood sugar levels stable. Continue current regimen.' },
      { id: 'MED-007', date: '2026-04-18 10:00', type: 'lab-test', doctor: 'Dr. Amina Yusuf', labTests: ['HbA1c', 'Fasting Blood Sugar', 'Lipid Profile'], notes: 'HbA1c: 6.8% (improved from 7.5%). FBS: 110 mg/dL. Lipid profile normal.' },
      { id: 'MED-008', date: '2026-04-18 11:00', type: 'prescription', doctor: 'Dr. Amina Yusuf', prescription: 'Metformin 500mg (2x daily), Glimepiride 2mg (1x daily before breakfast)', notes: '3-month supply dispensed. Next review in 3 months or sooner if issues arise.' },
    ],
  },
  {
    id: '4',
    personalCardNumber: 'PT-2026-0015',
    familyCardNumber: 'FAM-2026-004',
    fullName: 'Sarah Williams',
    age: 36,
    gender: 'Female',
    phone: '08045671234',
    address: '7 Admiralty Way, Lekki, Lagos',
    walletBalance: 68000,
    totalPaid: 90000,
    totalCharges: 22000,
    registrationDate: '2026-03-08',
    transactions: [
      { id: 'TXN-015', date: '2026-04-20 08:00', description: 'Wallet Top-up', type: 'credit', amount: 90000, balance: 90000, reference: 'CASH-004' },
      { id: 'TXN-016', date: '2026-04-24 11:15', description: 'Chest X-Ray and consultation charges', type: 'debit', amount: 22000, balance: 68000, reference: 'BILL-011' },
    ],
    medicalHistory: [
      { id: 'MED-009', date: '2026-04-24 11:15', type: 'lab-test', doctor: 'Dr. Sarah Johnson', notes: 'Chest imaging requested for persistent cough.', labTests: ['Chest X-Ray'] },
    ],
  },
  {
    id: '5',
    personalCardNumber: 'PT-2026-0032',
    familyCardNumber: 'FAM-2026-006',
    fullName: 'David Chen',
    age: 51,
    gender: 'Male',
    phone: '08033445566',
    address: '18 Bourdillon Road, Ikoyi, Lagos',
    walletBalance: 102000,
    totalPaid: 160000,
    totalCharges: 58000,
    registrationDate: '2026-02-28',
    transactions: [
      { id: 'TXN-017', date: '2026-04-19 08:30', description: 'Card Deposit', type: 'credit', amount: 160000, balance: 160000, reference: 'CARD-005' },
      { id: 'TXN-018', date: '2026-04-24 08:30', description: 'Specialist consultation, lab tests and medications', type: 'debit', amount: 58000, balance: 102000, reference: 'BILL-012' },
    ],
    medicalHistory: [
      { id: 'MED-010', date: '2026-04-24 08:30', type: 'consultation', doctor: 'Dr. Michael Chen', diagnosis: 'Metabolic syndrome review', notes: 'Follow-up consultation with medication review and ordered lipid profile.' },
    ],
  },
];

const initialCashTellerEntries: CashTellerEntry[] = [
  {
    id: 'TILL-001',
    paymentId: 'PAY-003',
    patientName: 'Mohammed Ibrahim',
    cardNumber: 'PT-2025-1234',
    amount: 11000,
    reference: 'CASH-003',
    receivedBy: 'Lisa Anderson',
    receivedAt: '2026-04-24 09:20',
  },
];

const initialGeneralLedgerAccounts: GeneralLedgerAccount[] = [
  {
    id: 'GL-CASHIER',
    name: 'Cashier General Ledger',
    code: 'GL-101',
    accountClass: 'asset',
    accountCategory: 'Current Assets',
    chartOfAccount: 'Cash and Cash Equivalent',
    accountDetail: 'Cashier General Ledger',
    normalBalance: 'debit',
    balance: 11000,
    debitTotal: 11000,
    creditTotal: 0,
    protected: true,
  },
  {
    id: 'GL-WALLET',
    name: 'Wallet General Ledger',
    code: 'GL-202',
    accountClass: 'liability',
    accountCategory: 'Current Liabilities',
    chartOfAccount: 'Patient Wallet Control',
    accountDetail: 'Wallet General Ledger',
    normalBalance: 'credit',
    balance: 11000,
    debitTotal: 0,
    creditTotal: 11000,
    protected: true,
  },
];

const initialGeneralLedgerEntries: GeneralLedgerEntry[] = [
  {
    id: 'GLE-001',
    paymentId: 'PAY-003',
    patientName: 'Mohammed Ibrahim',
    cardNumber: 'PT-2025-1234',
    reference: 'CASH-003',
    narration: 'Cash payment received for patient billing',
    postedBy: 'Lisa Anderson',
    postedAt: '2026-04-24 09:20',
    lines: [
      {
        accountId: 'GL-CASHIER',
        accountName: 'Cashier General Ledger',
        type: 'debit',
        amount: 11000,
      },
      {
        accountId: 'GL-WALLET',
        accountName: 'Wallet General Ledger',
        type: 'credit',
        amount: 11000,
      },
    ],
  },
];

export function CashierProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [patientLedgers, setPatientLedgers] = useState<LedgerPatientAccount[]>(initialLedgers);
  const [cashTellerEntries, setCashTellerEntries] = useState<CashTellerEntry[]>(initialCashTellerEntries);
  const [generalLedgerAccounts, setGeneralLedgerAccounts] = useState<GeneralLedgerAccount[]>(initialGeneralLedgerAccounts);
  const [generalLedgerEntries, setGeneralLedgerEntries] = useState<GeneralLedgerEntry[]>(initialGeneralLedgerEntries);
  const [tillBalance, setTillBalance] = useState(
    initialCashTellerEntries.reduce((sum, entry) => sum + entry.amount, 0),
  );

  const addPayment = (payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setPayments((prev) => prev.map((payment) => (payment.id === id ? { ...payment, ...updates } : payment)));
  };

  const addGeneralLedgerAccount = ({
    name,
    code,
    accountClass,
    accountCategory,
    chartOfAccount,
    accountDetail,
  }: {
    name: string;
    code: string;
    accountClass: 'asset' | 'liability' | 'income' | 'expense';
    accountCategory?: string;
    chartOfAccount?: string;
    accountDetail?: string;
  }) => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) {
      return;
    }

    const normalBalance = accountClass === 'asset' || accountClass === 'expense' ? 'debit' : 'credit';

    setGeneralLedgerAccounts((prev) => {
      const duplicateExists = prev.some(
        (account) =>
          account.name.toLowerCase() === trimmedName.toLowerCase() ||
          account.code.toLowerCase() === trimmedCode.toLowerCase(),
      );

      if (duplicateExists) {
        return prev;
      }

      return [
        {
          id: `GL-${Date.now()}`,
          name: trimmedName,
          code: trimmedCode,
          accountClass,
          accountCategory,
          chartOfAccount,
          accountDetail,
          normalBalance,
          balance: 0,
          debitTotal: 0,
          creditTotal: 0,
          protected: false,
        },
        ...prev,
      ];
    });
  };

  const removeGeneralLedgerAccount = (accountId: string) => {
    setGeneralLedgerAccounts((prev) =>
      prev.filter((account) => account.id !== accountId || account.protected),
    );
  };

  const submitDoctorBilling = (payload: DoctorBillingPayload) => {
    const now = new Date();
    const totalAmount = payload.services.reduce((sum, service) => sum + service.amount, 0);
    const paymentId = `PAY-${Date.now()}`;
    const ledgerReference = `BILL-${Date.now().toString().slice(-6)}`;

    const routedServices: PaymentService[] = payload.services.map((service, index) => ({
      id: `${paymentId}-SRV-${index + 1}`,
      type: service.type,
      description: service.description,
      amount: service.amount,
      paid: false,
      method: '',
      source: 'doctor',
      billedBy: payload.doctorName,
      billedAt: formatDateTime(now),
    }));

    setPatientLedgers((prev) => {
      const existingLedger = prev.find((patient) => patient.personalCardNumber === payload.cardNumber);
      const debitTransaction: LedgerTransaction = {
        id: `TXN-${Date.now()}`,
        date: formatDateTime(now),
        description: `Doctor billing routed by ${payload.doctorName}`,
        type: 'debit',
        amount: totalAmount,
        balance: (existingLedger?.walletBalance || 0) - totalAmount,
        reference: ledgerReference,
      };

      if (existingLedger) {
        return prev.map((patient) =>
          patient.personalCardNumber === payload.cardNumber
            ? {
                ...patient,
                walletBalance: debitTransaction.balance,
                totalCharges: patient.totalCharges + totalAmount,
                transactions: [debitTransaction, ...patient.transactions],
                medicalHistory: [
                  {
                    id: `MED-${Date.now()}`,
                    date: formatDateTime(now),
                    type: 'billing',
                    doctor: payload.doctorName,
                    notes: payload.services.map((service) => `${service.type}: ${service.description}`).join('; '),
                  },
                  ...patient.medicalHistory,
                ],
              }
            : patient,
        );
      }

      return [
        {
          id: payload.patientId || payload.cardNumber,
          personalCardNumber: payload.cardNumber,
          familyCardNumber: `FAM-${payload.cardNumber.slice(-4)}`,
          fullName: payload.patientName,
          age: payload.age || 0,
          gender: payload.gender || 'Unknown',
          phone: payload.phone || 'Not provided',
          address: 'Address not captured yet',
          walletBalance: debitTransaction.balance,
          totalPaid: 0,
          totalCharges: totalAmount,
          registrationDate: now.toISOString().split('T')[0],
          transactions: [debitTransaction],
          medicalHistory: [
            {
              id: `MED-${Date.now()}`,
              date: formatDateTime(now),
              type: 'billing',
              doctor: payload.doctorName,
              notes: payload.services.map((service) => `${service.type}: ${service.description}`).join('; '),
            },
          ],
        },
        ...prev,
      ];
    });

    setPayments((prev) => {
      const existingPayment = prev.find((payment) => payment.cardNumber === payload.cardNumber);

      if (existingPayment) {
        return prev.map((payment) =>
          payment.cardNumber === payload.cardNumber
            ? {
                ...payment,
                patientId: payload.patientId || payment.patientId,
                patientName: payload.patientName,
                services: [...payment.services, ...routedServices],
                totalAmount: payment.totalAmount + totalAmount,
                balance: payment.balance + totalAmount,
                status: payment.amountPaid > 0 ? 'partial' : 'pending',
                transactionDate: formatDateTime(now),
                cashierName: payment.balance + totalAmount > 0 ? 'Pending Cashier Desk' : payment.cashierName,
                cashierTime: payment.balance + totalAmount > 0 ? 'Pending' : payment.cashierTime,
                sourceModule: 'doctor',
                routedBy: payload.doctorName,
                ledgerReference,
              }
            : payment,
        );
      }

      return [
        {
          id: paymentId,
          patientId: payload.patientId,
          patientName: payload.patientName,
          cardNumber: payload.cardNumber,
          services: routedServices,
          totalAmount,
          amountPaid: 0,
          balance: totalAmount,
          status: 'pending',
          transactionDate: formatDateTime(now),
          cashierName: 'Pending Cashier Desk',
          cashierTime: 'Pending',
          sourceModule: 'doctor',
          routedBy: payload.doctorName,
          ledgerReference,
        },
        ...prev,
      ];
    });

    return {
      paymentId,
      ledgerReference,
      totalAmount,
    };
  };

  const processPayment = (paymentId: string, method: string, cashierName: string, reference?: string) => {
    const targetPayment = payments.find((payment) => payment.id === paymentId);
    if (!targetPayment || targetPayment.balance <= 0) {
      return;
    }

    const now = new Date();
    const paymentReference = reference?.trim() || `${method.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`;

    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              services: payment.services.map((service) =>
                service.paid
                  ? service
                  : {
                      ...service,
                      paid: true,
                      method,
                    },
              ),
              amountPaid: payment.totalAmount,
              balance: 0,
              status: 'paid',
              paymentMethod: method,
              transactionDate: formatDateTime(now),
              cashierName,
              cashierTime: formatClockTime(now),
            }
          : payment,
      ),
    );

    setPatientLedgers((prev) =>
      prev.map((patient) =>
        patient.personalCardNumber === targetPayment.cardNumber
          ? {
              ...patient,
              walletBalance: patient.walletBalance + targetPayment.balance,
              totalPaid: patient.totalPaid + targetPayment.balance,
              transactions: [
                {
                  id: `TXN-${Date.now()}`,
                  date: formatDateTime(now),
                  description: `Cashier payment received via ${method}`,
                  type: 'credit',
                  amount: targetPayment.balance,
                  balance: patient.walletBalance + targetPayment.balance,
                  reference: paymentReference,
                },
                ...patient.transactions,
              ],
            }
          : patient,
      ),
    );

    if (method === 'Cash') {
      const cashEntry: CashTellerEntry = {
        id: `TILL-${Date.now()}`,
        paymentId,
        patientName: targetPayment.patientName,
        cardNumber: targetPayment.cardNumber,
        amount: targetPayment.balance,
        reference: paymentReference,
        receivedBy: cashierName,
        receivedAt: formatDateTime(now),
      };

      setCashTellerEntries((prev) => [cashEntry, ...prev]);
      setTillBalance((prev) => prev + targetPayment.balance);

      const glEntry: GeneralLedgerEntry = {
        id: `GLE-${Date.now()}`,
        paymentId,
        patientName: targetPayment.patientName,
        cardNumber: targetPayment.cardNumber,
        reference: paymentReference,
        narration: 'Cash payment received for patient billing',
        postedBy: cashierName,
        postedAt: formatDateTime(now),
        lines: [
          {
            accountId: 'GL-CASHIER',
            accountName: 'Cashier General Ledger',
            type: 'debit',
            amount: targetPayment.balance,
          },
          {
            accountId: 'GL-WALLET',
            accountName: 'Wallet General Ledger',
            type: 'credit',
            amount: targetPayment.balance,
          },
        ],
      };

      setGeneralLedgerEntries((prev) => [glEntry, ...prev]);
      setGeneralLedgerAccounts((prev) =>
        prev.map((account) => {
          if (account.id === 'GL-CASHIER') {
            return {
              ...account,
              balance: account.balance + targetPayment.balance,
              debitTotal: account.debitTotal + targetPayment.balance,
            };
          }

          if (account.id === 'GL-WALLET') {
            return {
              ...account,
              balance: account.balance + targetPayment.balance,
              creditTotal: account.creditTotal + targetPayment.balance,
            };
          }

          return account;
        }),
      );
    }
  };

  const getPatientLedgerByCardNumber = (cardNumber: string) =>
    patientLedgers.find((patient) => patient.personalCardNumber === cardNumber);

  return (
    <CashierContext.Provider
      value={{
        payments,
        patientLedgers,
        tillBalance,
        cashTellerEntries,
        generalLedgerAccounts,
        generalLedgerEntries,
        addPayment,
        updatePayment,
        submitDoctorBilling,
        addGeneralLedgerAccount,
        removeGeneralLedgerAccount,
        processPayment,
        getPatientLedgerByCardNumber,
      }}
    >
      {children}
    </CashierContext.Provider>
  );
}

export function useCashier() {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error('useCashier must be used within CashierProvider');
  }
  return context;
}
