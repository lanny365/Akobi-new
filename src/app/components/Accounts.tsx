import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  BookOpen,
  Calendar,
  Trash2,
  DollarSign,
  Download,
  FileText,
  ClipboardList,
  Plus,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LabWalletViewer } from './LabWalletViewer';
import { useCashier } from '../context/CashierContext';

type AccountsLayer = 'accounting' | 'asset-management' | 'staff-payroll';
type AccountingView = 'overview' | 'general-ledger' | 'journal-management' | 'report' | 'lab-wallet';
type GeneralLedgerView = 'gl-setup' | 'transaction-view';
type GeneralLedgerClass = 'asset' | 'liability' | 'income' | 'expense';
type GlChartNode = { label: string; details: string[] };
type GlCategoryNode = { value: string; label: string; charts: GlChartNode[] };

const initialGeneralLedgerClassOptions: Array<{
  value: GeneralLedgerClass;
  label: string;
  codePrefix: string;
}> = [
  { value: 'asset', label: '1 - Asset', codePrefix: '1' },
  { value: 'liability', label: '2 - Liability', codePrefix: '2' },
  { value: 'income', label: '4 - Income', codePrefix: '4' },
  { value: 'expense', label: '5 - Expenses', codePrefix: '5' },
];

const glHierarchy = {
  asset: [
    {
      value: '101-property-plant-equipment',
      label: '101 - Property, Plant & Equipment',
      charts: [
        '10101 - Land',
        '10102 - Buildings',
        '10103 - Plant & Machinery',
        '10104 - Office Equipment',
        '10105 - Computers & Pheripherals',
        '10106 - Furniture, Fittings & Partitions',
        '10107 - Motor Vehicles & Cycles',
        '10108 - Intangible Asset',
        '10109 - Capital Work - In - Progress',
      ],
    },
    {
      value: '102-current-assets',
      label: '102 - Current Assets',
      charts: [
        '10201 - Cash - In Vault',
        '10202 - Teller Cash',
        '10203 - Petty Cash',
        '10204 - POS & Wallet Accounts',
        '10205 - Cash - In - Suspense',
        '10206 - Bank Balances',
        '10207 - Placement With Banks / Institutions',
        '10208 - Treasury Bills',
        '10209 - Loans & Advances',
        '10210 - Advances Under Finance Leases',
        '10211 - Investments : Short - Term Securities / Shares',
        '10212 - Investments : Long - Term Securities / Shares',
        '10213 - Other Investment Banks Institution/ Companies',
        '10214 - Prepayments',
        '10215 - Stocks',
        '10216 - Uncleared Effects / Transit Items',
        '10217 - Receivables',
        '10218 - Sundries / Miscellaneous',
        '10219 - Control Accounts',
        '10220 - Suspense Account',
      ],
    },
  ],
  liability: [
    {
      value: '201-current-liabilities',
      label: '201 - Current Liabilities',
      charts: [
        '20101 - Deposits & Current Accounts',
        '20102 - Interest Payable / Accrued Not Paid',
        '20103 - Accounts Payable',
        '20104 - Accruals',
        '20105 - Uncleared Effects / Transit items',
        '20106 - Sundries / Miscellaneous',
        '20107 - Taxation Payable',
        '20108 - Company Taxes',
        '20109 - Dividend Payable',
        '20110 - Unclassified / Control Accounts',
        '20111 - Bank Facilities',
        '20112 - Cash Interface',
        '20113 - Suspense Account',
      ],
    },
    {
      value: '202-long-term-liabilities',
      label: '202 - Long Term Liabilities',
      charts: [
        '20202 - Accumulated Depreciation : Plant & Machinery',
        '20203 - Accumulated Depreciation : Office Equipment',
        '20204 - Accumulated Depreciation : Computers & Pheripherals',
        '20205 - Accumulated Depreciation : Furniture, Fittings & Partitions',
        '20206 - Accumulated Depreciation : Motor Vehicles & Cycles',
        '20208 - Accumulated Depreciation : Land & Building',
        '20209 - Accumulated Depreciation : Softwares',
        '20210 - Specific Loan Losses Provisions',
        '20211 - 1% General Loan Losses Provisions',
        '20212 - Interest - In - Suspense',
        '20213 - Other Provisions',
        '20214 - Memorandum Account',
        '20215 - Property, Plant & Equipment Disposal Account',
        '20216 - Investments Disposal Account',
        '20217 - Post - Balance Sheet Accounts',
        '20218 - Long Term Deposits',
      ],
    },
    {
      value: '203-capital',
      label: '203 - Capital',
      charts: [
        '20301 - Share Capital',
        '20302 - Deposit For Shares',
        '20303 - Share Premium',
        '20304 - Donated Share Capital',
      ],
    },
    {
      value: '204-reserves',
      label: '204 - Reserves',
      charts: [
        '20401 - Bonus Issue Reserve',
        '20402 - Statutory Reserve',
        '20403 - Property, Plant & Equipment Revaluation Reserve',
        '20404 - General Reserve',
        '20405 - Profit & Loss Account',
      ],
    },
  ],
  income: [
    {
      value: '401-interest-similar-income',
      label: '401 - Interest & Similar Income',
      charts: [
        '40101 - Interest on Loans & Advances',
        '40102 - Treasury Bills & Investment Securities',
        '40103 - Placements',
        '40104 - Advances Under Finances Leases',
        '40105 - Interest On Savings From Other Bank',
      ],
    },
    {
      value: '402-fees-commission-income',
      label: '402 - Fees & Commission Income',
      charts: [
        '40201 - Fees Income',
        '40202 - Bank Commission',
        '40203 - Bank Charges',
        '40204 - Commission',
      ],
    },
  ],
  expense: [
    {
      value: '501-interest-similar-expenses',
      label: '501 - Interest & Similar Expenses',
      charts: [
        '50101 - Interest Paid On Deposits / Current Accounts',
        '50102 - Interest Paid On Inter - Bank Transactions',
      ],
    },
    {
      value: '502-general-operating-administrative',
      label: '502 - General / Other Operating & Administrative',
      charts: [
        '50201 - Staff Emoluments & Costs',
        '50202 - Administrative Costs',
        '50203 - Establishment Costs',
        "50204 - Directors' Emoluments",
        '50205 - Financial & Professional Charges',
        '50206 - Taxation Expense',
        '50207 - Advertisement & Marketing Costs',
        '50208 - Amortisation',
        '50209 - Depreciation',
        '50210 - Provision on Risk',
        '50211 - Utility Expense',
        '50212 - Management Expenses',
        '50213 - Repair and Maintenance',
        '50214 - Medical Expense (staff)',
        '50215 - Stationery',
        '50216 - Interest on Loan Paid (M.D)',
        '50217 - Gift',
      ],
    },
  ],
} satisfies Record<
  GeneralLedgerClass,
  Array<{ value: string; label: string; charts: string[] }>
>;

const glAccountDetailsByChart: Record<string, string[]> = {
  '10101 - Land': ['1010101 - Land : Head Office'],
  '10102 - Buildings': ['1010201 - OFFICE BUILDING: Head Office'],
  '10103 - Plant & Machinery': ['1010301 - Plant & Machinery', '1010302 - Generator(Plant)'],
  '10104 - Office Equipment': ['1010401 - Office Equipment'],
  '10105 - Computers & Pheripherals': ['1010501 - Computers'],
  '10106 - Furniture, Fittings & Partitions': ['1010601 - Furniture & Fittings'],
  '10107 - Motor Vehicles & Cycles': ['1010701 - Motor Vehicles', '1010702 - Motor Cycles', '1010703 - Motor Vehicle Disposal'],
  '10108 - Intangible Asset': ['1010801 - Computer Softwares'],
  '10109 - Capital Work - In - Progress': ['1010901 - Capital Work - In - Progress'],
  '10201 - Cash - In Vault': ['1020101 - Cash in Treasury (HQ)'],
  '10202 - Teller Cash': ['1020201 - Teller 1', '1020202 - Teller 2', '1020203 - Teller 3', '1020204 - Teller 4'],
  '10203 - Petty Cash': [
    '1020301 - Cash Advance',
    '1020302 - Teller Shortage',
    '1020303 - Imprest Account ERUNWON',
    '1020304 - Imprest Account :Head Office',
    '1020305 - Teller Diff: Erunwon Branch',
  ],
  '10204 - POS & Wallet Accounts': ['10204 - POS & Wallet Accounts'],
  '10205 - Cash - In - Suspense': ['1020501 - Suspense Account(Asset)'],
  '10206 - Bank Balances': [
    '1020601 - FIDELITY ALA CUR GSM 2595',
    '1020602 - FBN AGB CUR GSM 2698',
    '1020603 - FBN AGB SAV GSM 9699',
    '1020604 - Wema Bank',
    '1020605 - FCMB AGB SAV GSM 9021',
    '1020606 - GTB AGB CUR GSM 3367',
    '1020607 - SKYE BAD SSB GSM 0829',
    '1020608 - IBTC AGB SETT GSM 2583',
    '1020609 - UBA BAD CUR GSM 7016',
    '1020610 - ZEN AGB CUR GSM 4684',
    '1020611 - ACCES AGB CUR GSM 7645',
    '1020612 - STANBIC IBTC 2583',
    '1020613 - POS Services',
    '1020614 - EXTERNAL FUNDS TRANSFER ACCOUNT',
  ],
  '10207 - Placement With Banks / Institutions': [
    '1020701 - Fixed Term Deposit WEMA Bank PLC',
    '1020702 - Fixed Term Deposit UBA Bank Ltd',
    '1020703 - Fixed Term Deposit First Bank of Nig Plc',
    '1020704 - Fixed Term Deposit Access Bank',
    '1020705 - Fixed Term Deposit Union Bank Plc',
  ],
  '10208 - Treasury Bills': [
    '1020801 - Treasury Bills',
    '1020802 - Treasury Bills Access Bank Plc',
    '1020803 - Treasury Bills Union Bank Plc',
    '1020804 - Treasury Bills UBA Plc',
  ],
  '10209 - Loans & Advances': [
    '1020901 - IPMFB Term Loans',
    '1020902 - IPMFB Business Loan',
    '1020903 - General Overdraft',
    '1020904 - IPMFB Staff Loan',
    '1020905 - IPAAS Loan',
  ],
  '10210 - Advances Under Finance Leases': [
    '1021001 - Equipment Leasing : Motor Vehicle',
    '1021002 - Equipment Leasing : Household Items',
    '1021003 - Equipment Leasing : Property / Building',
  ],
  '10211 - Investments : Short - Term Securities / Shares': [
    '1021101 - Quoted Securities / Shares',
    '1021102 - Unquoted Securities / Shares',
  ],
  '10212 - Investments : Long - Term Securities / Shares': [
    '1021201 - Quoted Securities / Shares',
    '1021202 - Unquoted Securities / Shares',
    '1021203 - Investment With Other Company',
    '1021204 - Access Bank Shares',
    '1021205 - Garantee Trust Share',
    '1021206 - WAPIC Shares',
    '1021207 - FEPIL Oil and Gas Shares',
  ],
  '10213 - Other Investment Banks Institution/ Companies': [
    '1021301 - Investment:Nigeria Breweries Stock',
    '1021302 - Investment: Zenith Bank Stock',
    '1021303 - Investment:May & Baker Stock',
    '1021304 - Investment: Guiness Stock',
    '1021305 - Investment:Fidelity Bank Share',
    '1021306 - Investment: Eco Bank Stocks',
    '1021307 - Investment:Access Bank Stock',
    '1021308 - Investment:Access Bank Shares',
    '1021309 - Investment:UBN PLC Stock',
    '1021310 - Investment:GTB PLC Shares',
    '1021311 - Investment:Dangote flour Mills PLC',
    '1021312 - Investment:Union Bank of Nigeria Stock',
    '1021313 - Investment:First Bank of Nigeria Stock',
    '1021314 - Investment: Nigeria Aviation Handling COY',
    '1021315 - Investment:Japaul Oil & Maritaim Service',
    '1021316 - Investment:Fcmb Share',
    '1021317 - Investment:Wapic Plc Share',
    '1021318 - Investment:Keystone Bank Shares',
    '1021319 - Investment:Fcmb Share',
    '1021320 - Investment: POLARIS BANK LIMITED PUBLIC OFFER',
    '1021321 - Investment: POLARIS BANK PUBLIC OFFER',
    '1021322 - Investment: ACCESS BANK PLC RIGHT ISSUE',
    '1021323 - Investment: FBN PLC STOCK',
    '1021324 - Investment:UBA PLC STOCK',
  ],
  '10214 - Prepayments': [
    '1021401 - Prepaid Insurance',
    '1021402 - Prepaid NAMB Subscribtion',
    '1021403 - Prepaid Rent',
    '1021404 - General prepayment',
  ],
  '10215 - Stocks': [
    '1021501 - ATM Card Stock',
    '1021502 - Cheque Book Stock',
    '1021503 - Stationery Stock Items',
    '1021504 - SMS Stock',
    '1021505 - Deposit Slip',
    '1021506 - IBTC Debit Card Stock',
    '1021507 - Withdrawal Slip Stock',
  ],
  '10216 - Uncleared Effects / Transit Items': ['1021601 - Uncleared Effects / Transit Items'],
  '10217 - Receivables': [
    '1021701 - Interests Receivable On Loans (General)',
    '1021702 - INT RECEIVABLE ON LOAN (former software)',
    '1021703 - INTEREST INCOME RECEIVABLE',
    '1021704 - FBN FIXED PLACEMENT INTEREST RECEIV',
    '1021705 - DEFAULT CHARGE RECEIVABLE',
  ],
  '10218 - Sundries / Miscellaneous': [
    '1021801 - Withholding Tax Paid (5%)',
    '1021802 - Withholding Tax Paid (10%)',
    '1021803 - Staff Salary Advances : Operations',
    '1021804 - Provisions for B&D No Longer Required',
    '1021805 - Provisions for NDIC Premium',
    '1021806 - Capital Expenditure',
    '1021807 - Sundry Debtors',
    '1021808 - Provision for Tax(Federal Goverment)',
    '1021809 - Non Performing Contra',
    '1021810 - Fraud Report Account',
    '1021811 - Sms Unpaid',
  ],
  '10219 - Control Accounts': [
    '1021901 - Viral Computers Control Account',
    '1021902 - Mobile App Control Account',
    '1021903 - NIBSS Control Account',
    '1021904 - Verification Stock Control Account',
    '1021905 - USSD Control Account',
    '1021906 - Suspense Account(Loan and Ovadraft)Diff',
    '1021907 - Suspense Account(Deposit Liabilities) Diff',
    '1021908 - Interest-On-Investments Suspense Ledger',
    '1021909 - Suspense Account(Income and Expenses) Diff',
  ],
  '10220 - Suspense Account': [
    '1022001 - Suspense: Suscription Account',
    '1022002 - Suspense: Debit Account',
    '1022003 - Suspense: GL Upload',
    '1022004 - Suspense: Cabal Upload',
    '1022005 - Suspense: SMS Account',
    '1022006 - Suspense: Holding Customer Account',
    '1022007 - Suspense: Current Account Corporate Fees',
  ],
  '20101 - Deposits & Current Accounts': [
    '2010101 - Customer Deposit: Giant Current Account',
    '2010102 - Customer Deposit: Giant Savings Account',
    '2010103 - Customer Deposit: Giant Fixed Deposit Account',
    '2010104 - Customer Deposit: Giant Staff Account',
    '2010105 - Customer Deposit: Giant Current Corporate',
    '2010106 - Customer Deposit:Giant Daily Savings Account',
    '2010107 - Customer Deposit: Giant CND Account',
    '2010108 - Customer Deposit: Giant LBS Account',
    '2010109 - Customer Deposit: Giant MAWA Account',
    '2010110 - Customer Deposit: Giant Housing Savings Account',
    '2010111 - Customer Deposit: Giant Seed Savings Account',
    '2010112 - Customer Deposit: Giant TOSI Account',
  ],
  '20102 - Interest Payable / Accrued Not Paid': [
    '2010201 - Interest Payable / Accrued Not Paid On Fixed Deposits',
    '2010202 - Interest Payable / Accrued Not Paid On Savings Deposit',
    '2010203 - Interest Payable / Accrued Not Paid On Loans',
  ],
  '20103 - Accounts Payable': [
    '2010301 - Pension Fund',
    '2010302 - CRC Search',
    '2010303 - VAT',
    '2010304 - Sundry Creditors',
    '2010305 - Taxation Payable',
    '2010306 - Fixd Deposit Interest Payable',
    '2010307 - Payable-Pension Contribution',
    '2010308 - Sundry Depositors',
    '2010309 - ATM Payable Account',
    '2010310 - Stamp-Duty Payable',
    '2010311 - WHT Payable',
    '2010312 - Life Assurance Payable',
    '2010313 - Free GL',
    '2010314 - Staff welfare Contribution',
    '2010315 - NHF: Head Office',
    '2010316 - FPI TRANSIT ACCOUNT',
    '2010317 - Customer Investment Interest Payable',
    '2010318 - Payable (NIP Outflow suspense)',
    '2010319 - Int Payable tosi Savings Plus',
    '2010320 - Int Payable Nestle Savings Plus',
    '2010321 - Int Payable Gaint Savings Plus',
    '2010322 - Int Payable Gaint Staff Savings Plus',
    '2010323 - Int Payable LBS Staff Savings',
    '2010324 - Gaint Fixd Savings Interest Payable',
  ],
  '20104 - Accruals': [
    '2010401 - INTEREST PAYABLE ON SAVINGS',
    '2010402 - Accruals : Audit Fees',
    '2010403 - Accural:Rent Fees',
    '2010404 - Accrued Interest On Treasury Bill',
  ],
  '20105 - Uncleared Effects / Transit items': ['2010501 - Uncleared Effects / Transit Items'],
  '20106 - Sundries / Miscellaneous': [
    '2010601 - Service Charge',
    '2010602 - Deposit for Share',
    '2010603 - Teller Surplus',
    '2010604 - Refundable Deposit',
    '2010605 - Other Liabilities (General)',
    '2010606 - Liabilities- Others (Banks Credit Suspense Ledger)',
    '2010607 - Impairment Account',
    '2010608 - Micro-Insurance Fund',
    '2010609 - Stamp Duty: Head Office',
    '2010610 - Stamp Duty : Erunwon Branch',
    '2010611 - Genaral Suspense Account',
    '2010612 - Genaral Suspense Account : Erunwon',
    '2010613 - Interest - In - Suspense(Maxi)',
    '2010614 - Suspense Account (Migration)',
    '2010615 - Sms Unpaid',
  ],
  '20107 - Taxation Payable': [
    '2010701 - Personal Income Tax (P.A.Y.E)',
    '2010702 - Stamp Duty',
    '2010703 - Differed Tax',
  ],
  '20108 - Company Taxes': [
    '2010801 - Withholding Tax',
    '2010802 - Education Tax',
    '2010803 - VAT On Cheque Book Issued',
    '2010804 - Corporations Taxes',
    '2010805 - WHT On Term Deposit Interest',
  ],
  '20109 - Dividend Payable': ['2010901 - Dividend Payable', '2010902 - Unclaimed Dividend'],
  '20110 - Unclassified / Control Accounts': [
    '2011001 - Employers SPF (10%)',
    '2011002 - Employee SPF (5%)',
    '2011003 - Other Liabilities(General)',
    '2011004 - Employees N.S.I.T.F',
  ],
  '20111 - Bank Facilities': ['2011101 - Salaries Control Account'],
  '20112 - Cash Interface': ['2011201 - Cash Interface'],
  '20113 - Suspense Account': [
    '2011301 - Suspense: Credit Account',
    '2011302 - Suspense: POS Account',
    '2011303 - Suspense: SMS Account',
    '2011304 - Suspense: Interest Income Account',
    '2011305 - Suspense: Default Charges Account',
    '2011306 - Suspense: Current Account Corporate Fees',
    '2011307 - Suspense: Current Account Individual Fees',
    '2011308 - Suspense: General Savings Current Fees',
  ],
  '20202 - Accumulated Depreciation : Plant & Machinery': ['2020201 - Acc-Dep Plant & Machinery'],
  '20203 - Accumulated Depreciation : Office Equipment': ['2020301 - Office Equipment - Head Office'],
  '20204 - Accumulated Depreciation : Computers & Pheripherals': ['2020401 - Acc-Dep Computers'],
  '20205 - Accumulated Depreciation : Furniture, Fittings & Partitions': [
    '2020501 - Acc-Dep Furniture & Fittings',
    '2020502 - Partitions',
  ],
  '20206 - Accumulated Depreciation : Motor Vehicles & Cycles': [
    '2020601 - Acc-Dep Motor Vehicles',
    '2020602 - Acc-Dep Motor Cycles',
  ],
  '20208 - Accumulated Depreciation : Land & Building': ['2020801 - Acc-Dep Head Office: Building', '2020802 - Acc-Dep Head Office: Land'],
  '20209 - Accumulated Depreciation : Softwares': ['2020901 - Acc-Dep Banking Software'],
  '20210 - Specific Loan Losses Provisions': [
    '2021001 - Pass & Watch',
    '2021002 - Sub Standard',
    '2021003 - Doubtful',
    '2021004 - Lost',
    '2021005 - Cummulative Provision for Bad Debt',
  ],
  '20211 - 1% General Loan Losses Provisions': ['2021101 - 1% General Loan Losses Provisions'],
  '20212 - Interest - In - Suspense': ['2021201 - Interest - In - Suspense'],
  '20213 - Other Provisions': [
    '2021301 - Provision On Doubtful Debts',
    '2021302 - Provision On Diminution On Quoted Investments',
    '2021303 - Provision for Rents & Rates',
    '2021304 - Provision for Audit Fees',
    '2021305 - Provision for Electricity',
    '2021306 - Provision for Taxation',
    '2021307 - Provision for Legal Fees',
    '2021308 - Provision for Training Expenses',
    '2021309 - Provision for Insurance Fees',
    '2021310 - Provision for Loan losses',
    '2021311 - Provision for MFB Cert',
    '2021312 - Provision for Director Remunerations',
    '2021313 - Provision for Computers',
    '2021314 - Provision for Public Relation',
    '2021315 - Provision for Consultancy Services',
    '2021316 - 1% Provision on Other Assets',
    '2021317 - Provision for AGM',
    '2021318 - Provision for Risk Asset',
    '2021319 - Provision for Audit Expenses',
    '2021320 - Provision for Pension and Gratituity',
    '2021321 - Provision for Gift for Marketers',
    '2021322 - Provision for Accrude Expenses',
    '2021323 - Provision for Gift for Drivers',
    '2021324 - Provision for Security Expenses',
    '2021325 - Provision for 13th Month Grant',
    '2021326 - Provision For Leave Bonus',
  ],
  '20214 - Memorandum Account': [
    '2021401 - ATM Card Issuance Suspense',
    '2021402 - Interswitch Settlement Suspense',
    '2021403 - Suspense Account',
  ],
  '20215 - Property, Plant & Equipment Disposal Account': [
    '2021501 - Buildings disposal',
    '2021502 - Plant & Machinery disposal',
    '2021503 - Office Equipment disposal',
    '2021504 - Computers & Pheripherals disposal',
    '2021505 - Furniture, Fittings & Partitions disposal',
    '2021506 - Motor Vehicles & Cycles disposal',
    '2021507 - Wells / Boreholes disposal',
  ],
  '20216 - Investments Disposal Account': ['2021601 - Investments Disposal Account'],
  '20217 - Post - Balance Sheet Accounts': ['2021701 - Prior - Year Adjustments', '2021702 - Extra - Ordinary Items'],
  '20218 - Long Term Deposits': ['2021801 - Customer Fixed Deposits'],
  '20301 - Share Capital': [
    '2030101 - Share Capital',
    '2030102 - Corporate Bodies / Institutions',
    '2030103 - Co-operative Societies, Clubs & Associations',
  ],
  '20302 - Deposit For Shares': [
    '2030201 - Corporate Bodies / Institutions',
    '2030202 - Individuals',
    '2030203 - Co-operative Societies, Clubs & Associations',
  ],
  '20303 - Share Premium': ['2030301 - Share Premium'],
  '20304 - Donated Share Capital': [
    '2030401 - Individuals',
    '2030402 - Corporate Bodies / Institutions',
    '2030403 - Co-operative Societies, Clubs & Associations',
  ],
  '20401 - Bonus Issue Reserve': [
    '2040101 - Individuals',
    '2040102 - Corporate Bodies / Institutions',
    '2040103 - Co-operative Societies, Clubs & Associations',
  ],
  '20402 - Statutory Reserve': ['2040201 - Statutory Reserve', '2040202 - Regulatory Risk Reserve'],
  '20403 - Property, Plant & Equipment Revaluation Reserve': [
    '2040301 - Property, Plant & Equipment Revaluation Reserve',
    '2040302 - Adjustment to available for sale equities',
  ],
  '20404 - General Reserve': ['2040401 - General Reserve', '2040402 - Retained Earnings'],
  '20405 - Profit & Loss Account': [
    '2040501 - Profit & Loss Account (Current Year)',
    '2040502 - Profit & Loss Account (Previous Year)',
    '2040503 - Undistributed Profit / Loss',
  ],
  '40101 - Interest on Loans & Advances': [
    '4010101 - Interest On Micro Loans',
    '4010102 - Interest on SME Loan',
    '4010103 - Interest On OverDraft',
    '4010104 - Int. On Staff Loans',
    '4010105 - Interest On General Loan',
  ],
  '40102 - Treasury Bills & Investment Securities': [
    '4010201 - Income On Treasury Bills',
    '4010202 - Income / Dividends From Investments',
  ],
  '40103 - Placements': [
    '4010301 - Income On Placements with Other Banks',
    '4010302 - Interest On Savings Deposits',
    '4010303 - Interest on Investment',
  ],
  '40104 - Advances Under Finances Leases': [
    '4010401 - Equipment Leasing',
    '4010402 - Automobile Leasing',
    '4010403 - Leasing/Renting',
  ],
  '40105 - Interest On Savings From Other Bank': ['4010501 - Interest Paid On Savings'],
  '40201 - Fees Income': [
    '4020101 - Loan Agreement Fees',
    '4020102 - Legal Fees',
    '4020103 - Processing Fees',
    '4020104 - Management Fees',
    '4020105 - Credit Life Insurance',
    '4020106 - Monitoring / Search Fees',
    '4020107 - Overdraft Form Fees',
    '4020108 - Dividend Income',
    '4020109 - Income From Statement of Account',
    '4020110 - Account Maintenance Fees',
    '4020111 - PENALTY ON TIME-DEPOSIT',
    '4020112 - PAX 25% INCOME GL',
    '4020113 - Sundry Income',
  ],
  '40202 - Bank Commission': [
    '4020201 - Account Maintanance Charges',
    '4020202 - Commission on Daily Contribution',
    '4020203 - Commission From Brokerages',
    '4020204 - Commission On Fund Transfer',
    '4020205 - Commission On Bank Drafts',
    '4020206 - Commission On Cheques Clearing',
    '4020207 - Commission On Acceptance Fees',
    '4020208 - Commission On Cheques / Bills Discounted',
    '4020209 - Commission on E-payment',
    '4020210 - Commission on salaries',
    '4020211 - Commission Recieved',
    '4020212 - ATM Charges',
    '4020213 - Mobile App Income Account',
    '4020214 - USSD/Mobile App Income Account',
    '4020215 - BVN Income Account',
    '4020216 - Verification Income Account',
    '4020217 - Nibss inward Income Account',
  ],
  '40203 - Bank Charges': [
    '4020301 - Cheque Book Charges',
    '4020302 - Savings Passbook Charges',
    '4020303 - Account Opening Charges',
    '4020304 - SMS & Email Alert Charges',
    '4020305 - Closed Account Charges',
    '4020306 - Loan Default Penalties',
    '4020307 - Account Re-activation Charges',
    '4020308 - Deposit Slip Sales',
    '4020309 - Withdrawal Slip Sales',
    '4020310 - Stationery Recoveries',
    '4020311 - Statement of Account Charges',
    '4020312 - Cash Withdrawal Limit Charges',
    '4020313 - POS Charges',
    '4020314 - Salary Handling Charges',
    '4020315 - Other Income',
    '4020316 - Income: Lease/Rent',
    '4020317 - Income: Income on NIP',
    '4020318 - Credit Bureau Search',
    '4020319 - Income From Stationeries',
    '4020320 - Bank Charges Maxi(Income)',
    '4020321 - Transfer Charge',
    '4020322 - Bank Charges: Erunwon Branch',
    '4020323 - Account Opening Charges: Erunwon Branch',
    '4020324 - Credit Bureau Charges',
    '4020325 - Recovery from Loss Loans',
  ],
  '40204 - Commission': [
    '4020401 - Cashiers / Tellers Surplus',
    '4020402 - SALES OF CHEQUE BOOKS/FORMS',
    '4020403 - IT CHARGE',
    '4020404 - COMMISSION RECEIVED ON SALARIES',
    '4020405 - COMMISSION ON TURNOVER',
    '4020406 - OTHER COMMISSION',
    '4020407 - COMMISSIONS',
  ],
  '50101 - Interest Paid On Deposits / Current Accounts': [
    '5010101 - INTEREST PAID ON CURRENT ACCOUNTS',
    '5010102 - INTEREST PAID ON SAVINGS ACCOUNTS',
    '5010103 - Interest On Fixed / Term Deposits',
    '5010104 - Interest Expenses',
  ],
  '50102 - Interest Paid On Inter - Bank Transactions': [
    '5010201 - Interest Due on Running Investment',
    "5010202 - BANK'S INTEREST CHARGES",
  ],
  '50201 - Staff Emoluments & Costs': [
    '5020101 - Staff Salaries & Wages',
    '5020102 - Staff Housing / Rent Allowances',
    '5020104 - Staff Dressing Allowances',
    '5020107 - Staff Lunch Allowances',
    '5020108 - Staff Entertainment Allowances',
    '5020109 - Staff Leave Allowances',
    '5020110 - Out - Of - Station Allowances',
    '5020111 - Staff End - Of - Year Bonus',
    '5020112 - Staff Overtime',
    '5020113 - Staff Training / Conference / Seminars Expenses',
    '5020114 - Staff Welfare',
    '5020115 - Industrial Attachment / N.Y.S.C Salaries',
    '5020116 - Pension Fund Expenses - Employers Contribution',
    '5020117 - Staff Sitting Allowances',
    '5020118 - Staff Hazard Allowances',
    '5020119 - Staff Security Allowances',
    '5020120 - Staff Responsibility Allowances',
    '5020121 - Staff Wages',
    '5020122 - Staff Pension Allowance',
    '5020123 - Staff Transport Allowances',
    '5020124 - Staff Furniture Allowances',
    '5020125 - Staff Productivity Allowances',
    '5020126 - Staff Inconvenience Allowances',
    '5020127 - Staff Medical Allowance',
    '5020128 - Staff Other Bonus Allowance',
    '5020129 - Staff Utility Allowance',
  ],
  '50202 - Administrative Costs': [
    '5020201 - Transport & Travelling Expenses',
    '5020202 - Hotel & Accomodation Expenses',
    '5020203 - Printing & Stationeries',
    '5020204 - Postage & Courier',
    '5020205 - Telephone/Recharge Card',
    '5020206 - Plant and Machinery Repairs',
    '5020207 - Entertainment',
    '5020208 - Migration Expenses',
    '5020209 - Subscriptions',
    '5020210 - Licenses & Statutory Fees',
    '5020211 - Loss On Property, Plant & Equipment Disposals',
    '5020212 - Rent/rate',
    '5020213 - Christmas Bonus',
    '5020214 - Staff Uniforms',
    '5020215 - Building Repairs',
    '5020216 - Industrial Tranning Fund Expenses',
    '5020217 - General Insurance',
    '5020218 - NHF-Medical Expenses',
    '5020219 - Securities Expenses',
    '5020220 - Newspapers & Periodicals',
    '5020221 - Annual / Extra - Ordinary General Meeting (A/EGM) Expenses',
    '5020222 - Staff Vehicle Maintenance / Kilometre Claims',
    '5020223 - Fuel & Oil',
    '5020224 - Other Office Equipments Repairs and Maintenance',
    '5020225 - Bank Charges Expenses',
    '5020226 - Training Expenses',
    '5020227 - Software Development',
    '5020228 - General Office Exp',
    '5020229 - Productivity Bonus',
    '5020230 - Cleaning Expenses',
    '5020231 - State and LGA Expenses',
    '5020232 - Computer Hardware Repairs',
    '5020233 - Seminars & Workshop (CBN,CIBN)',
    '5020234 - Daily Contribution Expenses',
    '5020235 - Office Internal Expenses',
    '5020236 - Software Maintenance',
    '5020237 - Gift & Donations: Head Office',
    '5020238 - Office Repairs & Maintenance',
    '5020239 - Police and Security Guards',
    '5020240 - Office Equipments Maintenance',
    '5020241 - Electricity & Power',
    '5020242 - Dept Recovery Expenses',
    '5020243 - Loss On Investment',
    '5020244 - Motor Vehicle Repair Expenses',
    '5020245 - Internet & Data Expenses',
    '5020246 - Furnitures & Fittings',
    '5020247 - Generator Repair Exp',
    '5020248 - Generator Fuel',
    '5020249 - Computer Accessories Expenses',
    '5020250 - Secretarial Expenses Expenses',
    '5020251 - End-Of-Tenure Expenses',
    '5020252 - TAXATION',
    '5020253 - STAMP DUTY',
    '5020254 - Insurance NDIC Premiun',
    '5020255 - Pension-Employer Contribution',
    '5020256 - INTERBANK CHARGES GL',
    '5020257 - SMS Expenses',
    '5020258 - Other Prepament(Expenses)',
    '5020259 - Pension & Gratuity Expenses',
    '5020260 - AGM Expenses',
    '5020261 - Other Expenses',
  ],
  '50203 - Establishment Costs': [
    '5020301 - Companies Registrations and Renewals',
    '5020302 - Tenement Rates / Business Premises Permit',
    '5020303 - Electricity (Mains)',
    '5020304 - Electricity (Generator Running Expenses)',
    '5020305 - Insurance - General Banking',
    '5020306 - OFFICE DECORATION',
    '5020307 - Office Repairs & Maintenance',
    '5020308 - Office Rent',
  ],
  "50204 - Directors' Emoluments": [
    '5020401 - Directors Salaries',
    '5020402 - Directors Fees',
    '5020403 - Directors Pension Scheme',
    '5020404 - Directors Leave Allowances',
    '5020405 - Directors Sitting Allowances',
    '5020406 - Directors End - Of - Year Bonus',
    '5020407 - Directors Training Expenses',
    '5020408 - Directors Entertainment',
    '5020409 - Directors Utility Allowances',
    "5020410 - Directors / Board Meeting Expenses",
    '5020411 - Directors Transport Allowance',
  ],
  '50205 - Financial & Professional Charges': [
    '5020501 - Penalty Paid Expenses',
    '5020502 - Legal Expenses / Claims',
    '5020503 - NDIC Premium',
    '5020504 - External Audit Fees',
    '5020505 - Consultancy & Other Professional Charges',
    '5020506 - Stamp Duties & Share Issue Expenses',
    '5020507 - Dividend Expenses',
    '5020508 - CBN Expenses',
    '5020509 - Cash Evacuation / Pick - Up Expenses',
    '5020510 - Fillings',
    '5020511 - Registration and Renewal Expenses',
    '5020512 - Other Professional Charges',
    '5020513 - NAMB Expenses',
    '5020514 - Dues & Rates',
  ],
  '50206 - Taxation Expense': ['5020601 - Taxation Expense', '5020602 - Deffered Tax'],
  '50207 - Advertisement & Marketing Costs': [
    '5020701 - Advertisement',
    '5020702 - Web Designing',
    '5020703 - Christmas Gifts',
    '5020704 - Marketing Expenses',
  ],
  '50208 - Amortisation': [
    '5020801 - Amortisation : Goodwill',
    '5020802 - Amortisation : Trademarks',
    '5020803 - Amortisation : Pre - Operational & Incorporation Expenses',
    '5020804 - Amortisation : Banking Software',
  ],
  '50209 - Depreciation': [
    '5020901 - Depreciation : Buildings - (Head Office )',
    '5020902 - Depreciation : Plant & Machinery',
    '5020903 - Depreciation: Office Equiptment',
    '5020904 - Depreciation: Computers',
    '5020905 - Depreciation : Furniture & Fittings',
    '5020906 - Depreciation: Motor Vehicle',
    '5020907 - Depreciation: Banking Software',
    '5020908 - Depreciation: Depriciation all asset',
  ],
  '50210 - Provision on Risk': [
    '5021001 - Provision on Risk Asset',
    '5021002 - Loan loss Provision Expenses',
    '5021003 - Rental Expenses',
    '5021004 - 1% Provision on Other Assets',
    '5021005 - Provision for Pension and Gratity',
    '5021006 - Loan Recovery Expenses',
  ],
  '50211 - Utility Expense': ['5021101 - Ultility Expenses', '5021102 - Armed Robbery Expenses', '5021103 - Species Expenses'],
  '50212 - Management Expenses': ['5021201 - Management Expenses'],
  '50213 - Repair and Maintenance': [
    '5021301 - Repair & Maintenance Building',
    '5021302 - Repair & Maintenance Plant & Machinery',
    '5021303 - Repair & Maintenance Motor Vehicles',
    '5021304 - Repair & Maintenance Furniture & Fittings',
    '5021305 - Repair & Maintenance Computer and Accessories',
    '5021306 - Repair & Mentainance Office Equiptment',
    '5021307 - Repair Photocopier Machine',
    '5021308 - Repair & Maintenance Genarator',
    '5021309 - Repair & Maintenance Inverter',
    '5021310 - Repair & Maintenance well and Plumbing',
    '5021311 - Repair & Maintenance Other General things',
  ],
  '50214 - Medical Expense (staff)': ['5021401 - Medical Expenses (Staff)'],
  '50215 - Stationery': ['5021501 - Stationery'],
  '50216 - Interest on Loan Paid (M.D)': ['5021601 - Interest on Loan (M.D)'],
  '50217 - Gift': ['5021701 - GIft', '5021702 - Incentives'],
};

const formatCurrency = (amount: number) => `\u20A6${amount.toLocaleString()}`;
const getAccountCodeFromDetail = (detail: string) => detail.split(' - ')[0]?.trim() || '';
const createInitialGlHierarchyState = (): Record<GeneralLedgerClass, GlCategoryNode[]> =>
  Object.fromEntries(
    Object.entries(glHierarchy).map(([accountClass, categories]) => [
      accountClass,
      categories.map((category) => ({
        ...category,
        charts: category.charts.map((chart) => ({
          label: chart,
          details: glAccountDetailsByChart[chart] ?? [chart],
        })),
      })),
    ]),
  ) as Record<GeneralLedgerClass, GlCategoryNode[]>;

const assetRegister = [
  { id: 'AST-001', asset: 'Ultrasound Machine', category: 'Medical Equipment', location: 'Radiology', status: 'Active', value: 3500000 },
  { id: 'AST-002', asset: 'Generator Set', category: 'Utility Equipment', location: 'Power House', status: 'Active', value: 5200000 },
  { id: 'AST-003', asset: 'Ward Bed Set', category: 'Furniture', location: 'Ward B', status: 'Under Service', value: 980000 },
  { id: 'AST-004', asset: 'Office Workstations', category: 'IT Equipment', location: 'Accounts Office', status: 'Active', value: 1450000 },
];

const payrollRegister = [
  { id: 'PAYROLL-001', staffGroup: 'Doctors', headcount: 12, grossPay: 4200000, netPay: 3680000, status: 'Ready' },
  { id: 'PAYROLL-002', staffGroup: 'Nurses', headcount: 24, grossPay: 3600000, netPay: 3140000, status: 'Ready' },
  { id: 'PAYROLL-003', staffGroup: 'Administrative Staff', headcount: 18, grossPay: 1850000, netPay: 1645000, status: 'Review' },
  { id: 'PAYROLL-004', staffGroup: 'Support Staff', headcount: 16, grossPay: 1280000, netPay: 1175000, status: 'Ready' },
];

const getAccountsLayerFromHash = (): AccountsLayer => {
  const currentHash = window.location.hash.slice(1) || '/accounts';
  const [, queryString = ''] = currentHash.split('?');
  const section = new URLSearchParams(queryString).get('section');

  if (section === 'asset-management' || section === 'staff-payroll') {
    return section;
  }

  return 'accounting';
};

export function Accounts() {
  const [glClassOptions, setGlClassOptions] = useState(initialGeneralLedgerClassOptions);
  const [glHierarchyState, setGlHierarchyState] = useState<Record<GeneralLedgerClass, GlCategoryNode[]>>(createInitialGlHierarchyState);
  const [accountsLayer, setAccountsLayer] = useState<AccountsLayer>(() => getAccountsLayerFromHash());
  const [accountingView, setAccountingView] = useState<AccountingView>('overview');
  const [generalLedgerView, setGeneralLedgerView] = useState<GeneralLedgerView>('gl-setup');
  const [glAccountCategory, setGlAccountCategory] = useState(glHierarchy.asset[0].value);
  const [glChartOfAccount, setGlChartOfAccount] = useState(glHierarchy.asset[0].charts[0]);
  const [glAccountDetail, setGlAccountDetail] = useState(glAccountDetailsByChart[glHierarchy.asset[0].charts[0]]?.[0] ?? glHierarchy.asset[0].charts[0]);
  const [glAccountCode, setGlAccountCode] = useState('');
  const [glAccountClass, setGlAccountClass] = useState<GeneralLedgerClass>('asset');
  const [glLevel1Draft, setGlLevel1Draft] = useState(initialGeneralLedgerClassOptions[0].label);
  const [glLevel2Draft, setGlLevel2Draft] = useState(glHierarchy.asset[0].label);
  const [glLevel3Draft, setGlLevel3Draft] = useState(glHierarchy.asset[0].charts[0]);
  const [glLevel4Draft, setGlLevel4Draft] = useState(glAccountDetailsByChart[glHierarchy.asset[0].charts[0]]?.[0] ?? glHierarchy.asset[0].charts[0]);
  const {
    generalLedgerAccounts,
    generalLedgerEntries,
    tillBalance,
    addGeneralLedgerAccount,
    removeGeneralLedgerAccount,
  } = useCashier();

  useEffect(() => {
    const syncAccountsLayer = () => {
      setAccountsLayer(getAccountsLayerFromHash());
    };

    syncAccountsLayer();
    window.addEventListener('hashchange', syncAccountsLayer);
    return () => window.removeEventListener('hashchange', syncAccountsLayer);
  }, []);

  useEffect(() => {
    const categories = glHierarchyState[glAccountClass];
    const safeCategory = categories.find((category) => category.value === glAccountCategory) ?? categories[0];
    const safeChart = safeCategory.charts.find((chart) => chart.label === glChartOfAccount) ?? safeCategory.charts[0];
    const safeDetail =
      safeChart.details.find((detail) => detail === glAccountDetail) ?? safeChart.details[0] ?? safeChart.label;

    if (safeCategory.value !== glAccountCategory) {
      setGlAccountCategory(safeCategory.value);
    }

    if (safeChart.label !== glChartOfAccount) {
      setGlChartOfAccount(safeChart.label);
    }

    if (safeDetail !== glAccountDetail) {
      setGlAccountDetail(safeDetail);
    }
  }, [glAccountClass, glAccountCategory, glChartOfAccount, glAccountDetail, glHierarchyState]);

  useEffect(() => {
    setGlAccountCode(getAccountCodeFromDetail(glAccountDetail));
  }, [glAccountDetail]);

  const revenueData = [
    { month: 'Jan', revenue: 850000, expenses: 520000 },
    { month: 'Feb', revenue: 920000, expenses: 540000 },
    { month: 'Mar', revenue: 1050000, expenses: 580000 },
    { month: 'Apr', revenue: 980000, expenses: 560000 },
  ];

  const departmentRevenue = [
    { name: 'Clinical', value: 2800000, color: '#3b82f6' },
    { name: 'Pharmacy', value: 1500000, color: '#10b981' },
    { name: 'Laboratory', value: 950000, color: '#8b5cf6' },
    { name: 'Theatre', value: 1200000, color: '#f59e0b' },
  ];

  const transactions = [
    { id: 'TXN-001', description: 'Patient Consultations', type: 'income', amount: 125000, date: '2026-04-21' },
    { id: 'TXN-002', description: 'Pharmacy Sales', type: 'income', amount: 85000, date: '2026-04-21' },
    { id: 'TXN-003', description: 'Medical Supplies Purchase', type: 'expense', amount: -45000, date: '2026-04-21' },
    { id: 'TXN-004', description: 'Lab Test Revenue', type: 'income', amount: 62000, date: '2026-04-21' },
    { id: 'TXN-005', description: 'Staff Salaries', type: 'expense', amount: -180000, date: '2026-04-20' },
    { id: 'TXN-006', description: 'Utility Bills', type: 'expense', amount: -35000, date: '2026-04-20' },
  ];

  const accountingStats = [
    { label: 'Total Revenue (Month)', value: formatCurrency(2450000), change: '+12.5%', icon: TrendingUp, color: 'bg-green-500', trend: 'up' },
    { label: 'Total Expenses (Month)', value: formatCurrency(1240000), change: '+5.2%', icon: TrendingDown, color: 'bg-red-500', trend: 'up' },
    { label: 'Net Profit', value: formatCurrency(1210000), change: '+18.3%', icon: DollarSign, color: 'bg-blue-500', trend: 'up' },
    { label: 'Pending Invoices', value: '14', change: '-3', icon: FileText, color: 'bg-orange-500', trend: 'down' },
  ];

  const totalRevenue = departmentRevenue.reduce((sum, dept) => sum + dept.value, 0);
  const totalGeneralLedgerBalance = useMemo(
    () => generalLedgerAccounts.reduce((sum, account) => sum + account.balance, 0),
    [generalLedgerAccounts],
  );
  const totalAssetValue = useMemo(
    () => assetRegister.reduce((sum, asset) => sum + asset.value, 0),
    [],
  );
  const payrollGross = useMemo(
    () => payrollRegister.reduce((sum, item) => sum + item.grossPay, 0),
    [],
  );
  const payrollNet = useMemo(
    () => payrollRegister.reduce((sum, item) => sum + item.netPay, 0),
    [],
  );
  const glCategories = glHierarchyState[glAccountClass];
  const selectedGlCategory =
    glCategories.find((category) => category.value === glAccountCategory) ?? glCategories[0];
  const glCharts = selectedGlCategory.charts.map((chart) => chart.label);
  const selectedGlChart =
    selectedGlCategory.charts.find((chart) => chart.label === glChartOfAccount) ?? selectedGlCategory.charts[0];
  const glDetails = selectedGlChart?.details ?? [glChartOfAccount];
  const selectedClassOption =
    glClassOptions.find((option) => option.value === glAccountClass) ?? glClassOptions[0];

  const updateSelectedCategory = (updater: (category: GlCategoryNode) => GlCategoryNode) => {
    setGlHierarchyState((prev) => ({
      ...prev,
      [glAccountClass]: prev[glAccountClass].map((category) =>
        category.value === glAccountCategory ? updater(category) : category,
      ),
    }));
  };

  useEffect(() => {
    setGlLevel1Draft(selectedClassOption.label);
    setGlLevel2Draft(selectedGlCategory.label);
    setGlLevel3Draft(selectedGlChart?.label ?? '');
    setGlLevel4Draft(glAccountDetail);
  }, [selectedClassOption.label, selectedGlCategory.label, selectedGlChart?.label, glAccountDetail]);

  const saveAccountIdLevel = () => {
    const nextLabel = glLevel1Draft.trim();
    if (!nextLabel) return;
    setGlClassOptions((prev) =>
      prev.map((option) => (option.value === glAccountClass ? { ...option, label: nextLabel } : option)),
    );
  };

  const renameAccountCategoryLevel = () => {
    const nextLabel = glLevel2Draft.trim();
    if (!nextLabel) return;
    updateSelectedCategory((category) => ({ ...category, label: nextLabel }));
  };

  const addAccountCategoryLevel = () => {
    const nextLabel = glLevel2Draft.trim();
    if (!nextLabel) return;
    const nextValue = `${glAccountClass}-${Date.now()}`;
    setGlHierarchyState((prev) => ({
      ...prev,
      [glAccountClass]: [
        ...prev[glAccountClass],
        {
          value: nextValue,
          label: nextLabel,
          charts: [{ label: `${selectedClassOption.codePrefix}01 - New Chart`, details: [`${selectedClassOption.codePrefix}0101 - New Detail`] }],
        },
      ],
    }));
    setGlAccountCategory(nextValue);
  };

  const removeAccountCategoryLevel = () => {
    if (glCategories.length <= 1) return;
    const remainingCategories = glCategories.filter((category) => category.value !== glAccountCategory);
    setGlHierarchyState((prev) => ({
      ...prev,
      [glAccountClass]: remainingCategories,
    }));
    setGlAccountCategory(remainingCategories[0].value);
  };

  const renameChartOfAccountLevel = () => {
    const nextLabel = glLevel3Draft.trim();
    if (!nextLabel) return;
    updateSelectedCategory((category) => ({
      ...category,
      charts: category.charts.map((chart) =>
        chart.label === glChartOfAccount ? { ...chart, label: nextLabel } : chart,
      ),
    }));
    setGlChartOfAccount(nextLabel);
  };

  const addChartOfAccountLevel = () => {
    const nextLabel = glLevel3Draft.trim();
    if (!nextLabel) return;
    updateSelectedCategory((category) => ({
      ...category,
      charts: [...category.charts, { label: nextLabel, details: [`${selectedClassOption.codePrefix}0001 - New Detail`] }],
    }));
    setGlChartOfAccount(nextLabel);
  };

  const removeChartOfAccountLevel = () => {
    if (selectedGlCategory.charts.length <= 1) return;
    const remainingCharts = selectedGlCategory.charts.filter((chart) => chart.label !== glChartOfAccount);
    updateSelectedCategory((category) => ({
      ...category,
      charts: remainingCharts,
    }));
    setGlChartOfAccount(remainingCharts[0].label);
  };

  const renameAccountDetailLevel = () => {
    const nextLabel = glLevel4Draft.trim();
    if (!nextLabel) return;
    updateSelectedCategory((category) => ({
      ...category,
      charts: category.charts.map((chart) =>
        chart.label === glChartOfAccount
          ? {
              ...chart,
              details: chart.details.map((detail) => (detail === glAccountDetail ? nextLabel : detail)),
            }
          : chart,
      ),
    }));
    setGlAccountDetail(nextLabel);
  };

  const addAccountDetailLevel = () => {
    const nextLabel = glLevel4Draft.trim();
    if (!nextLabel) return;
    updateSelectedCategory((category) => ({
      ...category,
      charts: category.charts.map((chart) =>
        chart.label === glChartOfAccount
          ? {
              ...chart,
              details: [...chart.details, nextLabel],
            }
          : chart,
      ),
    }));
    setGlAccountDetail(nextLabel);
  };

  const removeAccountDetailLevel = () => {
    if (glDetails.length <= 1) return;
    const remainingDetails = glDetails.filter((detail) => detail !== glAccountDetail);
    updateSelectedCategory((category) => ({
      ...category,
      charts: category.charts.map((chart) =>
        chart.label === glChartOfAccount
          ? {
              ...chart,
              details: remainingDetails,
            }
          : chart,
      ),
    }));
    setGlAccountDetail(remainingDetails[0]);
  };

  const renderAccountingOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountingStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'}>
                  {stat.change}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue vs Expenses</CardTitle>
              <Select defaultValue="4months">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4months">Last 4 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={departmentRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {departmentRevenue.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {departmentRevenue.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-sm text-gray-700">{dept.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(dept.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-sm font-bold text-blue-600">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Filter Date
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{txn.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{txn.description}</td>
                    <td className="px-4 py-3">
                      <Badge variant={txn.type === 'income' ? 'default' : 'destructive'}>{txn.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{txn.date}</td>
                    <td className={`px-4 py-3 text-sm font-semibold text-right ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderGeneralLedger = () => (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-600">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">Cash Payment GL Posting Rule</h3>
        <p className="text-xs text-blue-700">
          When a patient bill is cleared with cash, the system posts `Cashier GL` as debit and `Wallet GL` as credit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Cashier Till Balance</p>
            <p className="text-2xl font-bold mt-2 text-emerald-700">{formatCurrency(tillBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">GL Accounts Tracked</p>
            <p className="text-2xl font-bold mt-2">{generalLedgerAccounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total GL Balance</p>
            <p className="text-2xl font-bold mt-2 text-blue-700">{formatCurrency(totalGeneralLedgerBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>GL Account Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generalLedgerAccounts.map((account) => (
              <div key={account.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{account.name}</p>
                    <p className="text-xs text-gray-500">{account.code}</p>
                  </div>
                  <Badge className={account.normalBalance === 'debit' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>
                    {account.normalBalance === 'debit' ? 'Debit Normal' : 'Credit Normal'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Debit</p>
                    <p className="font-semibold">{formatCurrency(account.debitTotal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Credit</p>
                    <p className="font-semibold">{formatCurrency(account.creditTotal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Balance</p>
                    <p className="font-semibold">{formatCurrency(account.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Payment Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {generalLedgerEntries.length > 0 ? (
              <div className="space-y-4">
                {generalLedgerEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.patientName}</p>
                        <p className="text-xs text-slate-500">
                          {entry.cardNumber} • {entry.reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{entry.postedBy}</p>
                        <p className="text-xs text-slate-500">{entry.postedAt}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t">
                      <p className="text-sm text-slate-700 mb-3">{entry.narration}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Account</th>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Entry Type</th>
                              <th className="px-2 py-2 text-right text-xs font-semibold text-slate-600">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.lines.map((line, index) => (
                              <tr key={`${entry.id}-${line.accountId}-${index}`} className="border-b last:border-b-0">
                                <td className="px-2 py-3 text-sm text-slate-800">{line.accountName}</td>
                                <td className="px-2 py-3">
                                  <Badge className={line.type === 'debit' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>
                                    {line.type === 'debit' ? 'Debit' : 'Credit'}
                                  </Badge>
                                </td>
                                <td className="px-2 py-3 text-right text-sm font-semibold text-slate-900">
                                  {formatCurrency(line.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-14 h-14 mx-auto mb-4 text-slate-300" />
                <p>No cash GL journal entries yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderJournalManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Journal Batches</p>
            <p className="mt-2 text-2xl font-bold">{generalLedgerEntries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Posted Entries</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {generalLedgerEntries.reduce((sum, entry) => sum + entry.lines.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Draft Journals</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Journal Management</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ClipboardList className="mr-2 h-4 w-4" />
                New Journal
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Journals
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reference</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Narration</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Posted By</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {generalLedgerEntries.length > 0 ? (
                  generalLedgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.reference}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.narration}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.postedBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.postedAt}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-700">Posted</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      No journal batches available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccountingReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Available Reports</p>
            <p className="mt-2 text-2xl font-bold">4</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Generated Today</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Export Format</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">PDF / XLS</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Accounting Reports</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Income Statement', description: 'Revenue, expenses, and net performance for the selected period.' },
              { title: 'Balance Sheet', description: 'Assets, liabilities, and equity summary across tracked ledgers.' },
              { title: 'Cash Movement Report', description: 'Cashier till movement and cash receipt trends.' },
              { title: 'Department Revenue Report', description: 'Breakdown of revenue by service department.' },
            ].map((report) => (
              <div key={report.title} className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{report.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{report.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGeneralLedgerSetup = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
      <Card>
        <CardHeader>
          <CardTitle>GL Account Set-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">1. Account ID</p>
            <Select value={glAccountClass} onValueChange={(value) => setGlAccountClass(value as GeneralLedgerClass)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {glClassOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">2. Account Category</p>
            <Select value={glAccountCategory} onValueChange={setGlAccountCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {glCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">3. Chart of Account</p>
            <Select value={glChartOfAccount} onValueChange={setGlChartOfAccount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {glCharts.map((chart) => (
                  <SelectItem key={chart} value={chart}>
                    {chart}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">4. Account Detail</p>
              <Select value={glAccountDetail} onValueChange={setGlAccountDetail}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {glDetails.map((detail) => (
                    <SelectItem key={detail} value={detail}>
                      {detail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Account Code</p>
              <Input
                value={glAccountCode}
                readOnly
                placeholder="Auto-filled from selected account detail"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_38%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#f8fafc_100%)] px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      GL Design Studio
                    </span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Levels 1-4
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Hierarchy Editor</p>
                    <p className="text-sm text-slate-600">Redesigned for structured maintenance of account ID, category, chart, and detail in one controlled workspace.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:min-w-[440px]">
                  <div className="rounded-2xl border border-blue-100 bg-white/90 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current Route</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{selectedClassOption.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedGlCategory.label}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Posting Target</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{glChartOfAccount}</p>
                    <p className="mt-1 text-xs text-slate-500">{glAccountDetail}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 bg-slate-50/80 p-5 xl:border-b-0 xl:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Editor Flow</p>
                <div className="mt-4 space-y-4">
                  {[
                    { level: '01', title: 'Account ID', value: selectedClassOption.label, tone: 'bg-blue-600 text-white' },
                    { level: '02', title: 'Category', value: selectedGlCategory.label, tone: 'bg-sky-100 text-sky-700' },
                    { level: '03', title: 'Chart', value: glChartOfAccount, tone: 'bg-amber-100 text-amber-700' },
                    { level: '04', title: 'Detail', value: glAccountDetail, tone: 'bg-emerald-100 text-emerald-700' },
                  ].map((item, index) => (
                    <div key={item.level} className="relative pl-11">
                      {index < 3 && <div className="absolute left-[17px] top-9 h-10 w-px bg-slate-200" />}
                      <div className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold ${item.tone}`}>
                        {item.level}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Level 1</p>
                        <p className="mt-1 text-xs text-slate-500">Update the selected account ID label.</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">Account ID</Badge>
                    </div>
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                      Active: {selectedClassOption.label}
                    </div>
                    <div className="mt-4 space-y-3">
                      <Input value={glLevel1Draft} onChange={(event) => setGlLevel1Draft(event.target.value)} />
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" onClick={saveAccountIdLevel}>
                        Save Level 1
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Level 2</p>
                        <p className="mt-1 text-xs text-slate-500">Maintain categories under the chosen account ID.</p>
                      </div>
                      <Badge className="bg-sky-100 text-sky-700">Category</Badge>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Active: {selectedGlCategory.label}
                    </div>
                    <div className="mt-4 space-y-3">
                      <Input value={glLevel2Draft} onChange={(event) => setGlLevel2Draft(event.target.value)} />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button variant="outline" size="sm" onClick={renameAccountCategoryLevel}>Save</Button>
                        <Button variant="outline" size="sm" onClick={addAccountCategoryLevel}>Add</Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={removeAccountCategoryLevel}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Level 3</p>
                        <p className="mt-1 text-xs text-slate-500">Refine chart-of-account nodes inside the selected category.</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">Chart</Badge>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Active: {glChartOfAccount}
                    </div>
                    <div className="mt-4 space-y-3">
                      <Input value={glLevel3Draft} onChange={(event) => setGlLevel3Draft(event.target.value)} />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button variant="outline" size="sm" onClick={renameChartOfAccountLevel}>Save</Button>
                        <Button variant="outline" size="sm" onClick={addChartOfAccountLevel}>Add</Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={removeChartOfAccountLevel}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Level 4</p>
                        <p className="mt-1 text-xs text-slate-500">Manage the posting detail that drives the final GL account code.</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">Detail</Badge>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Active: {glAccountDetail}
                    </div>
                    <div className="mt-4 space-y-3">
                      <Input value={glLevel4Draft} onChange={(event) => setGlLevel4Draft(event.target.value)} />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button variant="outline" size="sm" onClick={renameAccountDetailLevel}>Save</Button>
                        <Button variant="outline" size="sm" onClick={addAccountDetailLevel}>Add</Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={removeAccountDetailLevel}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Selection Preview</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{selectedClassOption.label}</Badge>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{selectedGlCategory.label}</Badge>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{glChartOfAccount}</Badge>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{glAccountDetail || 'Account detail not set yet'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">Hierarchy Preview</p>
            <p className="mt-2">{selectedClassOption.label}</p>
            <p>{selectedGlCategory.label}</p>
            <p>{glChartOfAccount}</p>
            <p>{glAccountDetail || 'Account detail not set yet'}</p>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              addGeneralLedgerAccount({
                name: glAccountDetail || glChartOfAccount,
                code: glAccountCode,
                accountClass: glAccountClass,
                accountCategory: selectedGlCategory.label,
                chartOfAccount: glChartOfAccount,
                accountDetail: glAccountDetail,
              });
              setGlAccountClass('asset');
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add GL Account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GL Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generalLedgerAccounts.map((account) => (
            <div key={account.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{account.accountDetail || account.name}</p>
                    <Badge variant="outline">{account.code}</Badge>
                    <Badge className="bg-slate-100 text-slate-700">
                      {glClassOptions.find((option) => option.value === account.accountClass)?.label || account.accountClass}
                    </Badge>
                  </div>
                  <div className="grid gap-1 text-xs text-slate-500">
                    <p><span className="font-medium text-slate-700">Category:</span> {account.accountCategory || '-'}</p>
                    <p><span className="font-medium text-slate-700">Chart:</span> {account.chartOfAccount || '-'}</p>
                    <p><span className="font-medium text-slate-700">Detail:</span> {account.accountDetail || account.name}</p>
                    <p><span className="font-medium text-slate-700">Balance Rule:</span> {account.normalBalance === 'debit' ? 'Debit Normal' : 'Credit Normal'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.protected && (
                    <Badge className="bg-amber-100 text-amber-700">System</Badge>
                  )}
                  {!account.protected && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeGeneralLedgerAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Debit</p>
                  <p className="font-semibold">{formatCurrency(account.debitTotal)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Credit</p>
                  <p className="font-semibold">{formatCurrency(account.creditTotal)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Balance</p>
                  <p className="font-semibold">{formatCurrency(account.balance)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderGeneralLedgerTransactions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Transaction View</CardTitle>
      </CardHeader>
      <CardContent>
        {generalLedgerEntries.length > 0 ? (
          <div className="space-y-4">
            {generalLedgerEntries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.patientName}</p>
                    <p className="text-xs text-slate-500">
                      {entry.cardNumber} - {entry.reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{entry.postedBy}</p>
                    <p className="text-xs text-slate-500">{entry.postedAt}</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-t">
                  <p className="text-sm text-slate-700 mb-3">{entry.narration}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Account</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Entry Type</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold text-slate-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line, index) => (
                          <tr key={`${entry.id}-${line.accountId}-${index}`} className="border-b last:border-b-0">
                            <td className="px-2 py-3 text-sm text-slate-800">{line.accountName}</td>
                            <td className="px-2 py-3">
                              <Badge className={line.type === 'debit' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>
                                {line.type === 'debit' ? 'Debit' : 'Credit'}
                              </Badge>
                            </td>
                            <td className="px-2 py-3 text-right text-sm font-semibold text-slate-900">
                              {formatCurrency(line.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-14 h-14 mx-auto mb-4 text-slate-300" />
            <p>No cash GL journal entries yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderGeneralLedgerSection = () => (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-600">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">Cash Payment GL Posting Rule</h3>
        <p className="text-xs text-blue-700">
          When a patient bill is cleared with cash, the system posts `Cashier GL` as debit and `Wallet GL` as credit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Cashier Till Balance</p>
            <p className="text-2xl font-bold mt-2 text-emerald-700">{formatCurrency(tillBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">GL Accounts Tracked</p>
            <p className="text-2xl font-bold mt-2">{generalLedgerAccounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total GL Balance</p>
            <p className="text-2xl font-bold mt-2 text-blue-700">{formatCurrency(totalGeneralLedgerBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={generalLedgerView === 'gl-setup' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setGeneralLedgerView('gl-setup')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            GL Set-up
          </Button>
          <Button
            variant={generalLedgerView === 'transaction-view' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setGeneralLedgerView('transaction-view')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Transaction View
          </Button>
        </div>
      </div>

      {generalLedgerView === 'gl-setup' ? renderGeneralLedgerSetup() : renderGeneralLedgerTransactions()}
    </div>
  );

  const renderAssetManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Asset Value</p>
            <p className="text-2xl font-bold mt-2 text-blue-700">{formatCurrency(totalAssetValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Active Assets</p>
            <p className="text-2xl font-bold mt-2">{assetRegister.filter((asset) => asset.status === 'Active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Under Service</p>
            <p className="text-2xl font-bold mt-2 text-amber-600">{assetRegister.filter((asset) => asset.status !== 'Active').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assetRegister.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{asset.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{asset.asset}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{asset.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{asset.location}</td>
                    <td className="px-4 py-3">
                      <Badge className={asset.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(asset.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStaffPayroll = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Gross Payroll</p>
            <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(payrollGross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Net Payroll</p>
            <p className="text-2xl font-bold mt-2 text-emerald-700">{formatCurrency(payrollNet)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Departments in Run</p>
            <p className="text-2xl font-bold mt-2">{payrollRegister.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Payroll Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payroll ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff Group</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Headcount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Gross Pay</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Net Pay</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payrollRegister.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.staffGroup}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.headcount}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(item.grossPay)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{formatCurrency(item.netPay)}</td>
                    <td className="px-4 py-3">
                      <Badge className={item.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccountingLayer = () => (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={accountingView === 'overview' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setAccountingView('overview')}
          >
            <PieChartIcon className="w-4 h-4 mr-2" />
            Financial Overview
          </Button>
          <Button
            variant={accountingView === 'general-ledger' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setAccountingView('general-ledger')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            General Ledger
          </Button>
          <Button
            variant={accountingView === 'journal-management' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setAccountingView('journal-management')}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Journal Management
          </Button>
          <Button
            variant={accountingView === 'report' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setAccountingView('report')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Report
          </Button>
          <Button
            variant={accountingView === 'lab-wallet' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setAccountingView('lab-wallet')}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Lab Wallet Monitor
          </Button>
        </div>
      </div>

      {accountingView === 'lab-wallet'
        ? <LabWalletViewer />
        : accountingView === 'report'
          ? renderAccountingReport()
          : accountingView === 'journal-management'
            ? renderJournalManagement()
        : accountingView === 'general-ledger'
          ? renderGeneralLedgerSection()
          : renderAccountingOverview()}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Accounts</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Accounts Control Center</h2>
          <p className="mt-2 text-sm text-slate-500">
            Use the blue navigation bar to switch between account sections.
          </p>
        </div>
      </div>

      {accountsLayer === 'accounting'
        ? renderAccountingLayer()
        : accountsLayer === 'asset-management'
          ? renderAssetManagement()
          : renderStaffPayroll()}
    </div>
  );
}
