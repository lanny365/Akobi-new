import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Calculator,
  Check,
  ChevronsUpDown,
  FolderOpen,
  GitBranch,
  Save,
  Settings,
  Sparkles,
  Trash2,
  DollarSign,
  Download,
  FileText,
  ClipboardList,
  Pencil,
  Plus,
  PieChart as PieChartIcon,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { SearchableSelect } from './ui/searchable-select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
import { useStaffAuth } from '../context/StaffAuthContext';
import { cn } from './ui/utils';
import { toast } from 'sonner';

type AccountsLayer = 'accounting' | 'asset-management' | 'staff-payroll';
type AccountingView = 'overview' | 'general-ledger' | 'journal-management' | 'report' | 'lab-wallet' | 'setup';
type AccountingReportType =
  | 'income-statement'
  | 'profit-loss'
  | 'balance-sheet'
  | 'trial-balance'
  | 'general-ledger'
  | 'cash-movement'
  | 'department-revenue';

type JournalDraft = {
  date: string;
  reference: string;
  postedBy: string;
  journalType: string;
};

type JournalCommittedLine = {
  id: string;
  accountId: string;
  accountDetails: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
};

type JournalLineForm = {
  accountId: string;
  accountDetails: string;
  settlementAccountId: string;
  settlementAccountDetails: string;
  description: string;
  amount: string;
  type: 'debit' | 'credit';
};

type JournalAccountOption = {
  id: string;
  code: string;
  accountDetail: string;
  name: string;
  accountClass: GeneralLedgerClass;
  accountCategory: string;
  chartOfAccount: string;
};

type JournalEditLine = {
  id: string;
  accountId: string;
  accountName: string;
  accountDetails: string;
  description: string;
  amount: string;
  type: 'debit' | 'credit';
};

type JournalEditDraft = {
  entryId: string;
  reference: string;
  narration: string;
  postedBy: string;
  date: string;
  lines: JournalEditLine[];
};

type AccountingReportRow = {
  accountId?: string;
  label: string;
  category?: string;
  code?: string;
  chartOfAccount?: string;
  opening?: number;
  debit?: number;
  credit?: number;
  amount?: number;
};

type DepreciationAssetCategory =
  | 'Building'
  | 'Plant & Machinery'
  | 'Computer & Peripherals'
  | 'Office Equipment'
  | 'Furniture & Fittings'
  | 'Motor Vehicles';

type AssetSectorConfig = {
  name: string;
  accountingCategory: DepreciationAssetCategory;
};

type AssetDepreciationReportRow = {
  referenceNo: string;
  assetId: string;
  asset: string;
  assetSector: string;
  accountGroup: string;
  assetCategory: string;
  method: string;
  usefulLife: string;
  frequency: string;
  depreciationRate: string;
  residualValue: string;
  depreciationStartDate: string;
  openingValue: number;
  depreciationCharge: number;
  closingValue: number;
  pnlDebitAccount: string;
  accumulatedDepreciationCreditAccount: string;
  status: string;
  setupId: string;
};

const JOURNAL_REFERENCE_SEQUENCE_LENGTH = 7;
const JOURNAL_REFERENCE_PATTERN = /^([A-Z]{3})(\d{2})(\d{7})$/;
const ASSET_REFERENCE_PREFIX = 'ASREG';
const ASSET_REFERENCE_SEQUENCE_LENGTH = 7;
const ASSET_REFERENCE_PATTERN = /^(ASREG)(\d{2})(\d{7})$/;
const ASSET_TRANSFER_REFERENCE_PREFIX = 'ASTRF';
const ASSET_TRANSFER_REFERENCE_SEQUENCE_LENGTH = 7;
const ASSET_TRANSFER_REFERENCE_PATTERN = /^(ASTRF)(\d{2})(\d{7})$/;
const ASSET_DISPOSAL_REFERENCE_PREFIX = 'ASDSP';
const ASSET_DISPOSAL_REFERENCE_SEQUENCE_LENGTH = 7;
const ASSET_DISPOSAL_REFERENCE_PATTERN = /^(ASDSP)(\d{2})(\d{7})$/;
const ACCUMULATED_DEPRECIATION_REFERENCE_PREFIX = 'ACDRP';
const ACCUMULATED_DEPRECIATION_REFERENCE_SEQUENCE_LENGTH = 6;
const ASSET_TAG_PREFIX = 'AKOBI';
const ASSET_TAG_SEQUENCE_LENGTH = 5;
const ASSET_TAG_PATTERN = /^AKOBI\/([A-Z]{3})\/(\d{2})(\d{5})$/;

const getTodayIsoDate = () => new Date().toISOString().split('T')[0];
const getFirstDayOfMonthIsoDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-01`;
};

const getJournalReferenceYear = (dateValue: string) => {
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T00:00:00`)
    : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().getFullYear().toString().slice(-2);
  }

  return parsedDate.getFullYear().toString().slice(-2);
};

const getJournalReferencePrefix = (journalType: string) =>
  journalType === 'expense' ? 'EXP' : 'AGJ';

const getNextJournalReference = (
  entries: Array<{ reference: string }>,
  dateValue: string,
  journalType: string,
) => {
  const referenceYear = getJournalReferenceYear(dateValue);
  const referencePrefix = getJournalReferencePrefix(journalType);
  const nextSequence =
    entries.reduce((highestSequence, entry) => {
      const match = entry.reference.trim().match(JOURNAL_REFERENCE_PATTERN);
      if (!match || match[1] !== referencePrefix || match[2] !== referenceYear) {
        return highestSequence;
      }

      const currentSequence = Number.parseInt(match[3], 10);
      return Number.isFinite(currentSequence) && currentSequence > highestSequence
        ? currentSequence
        : highestSequence;
    }, 0) + 1;

  return `${referencePrefix}${referenceYear}${nextSequence
    .toString()
    .padStart(JOURNAL_REFERENCE_SEQUENCE_LENGTH, '0')}`;
};

const ACCOUNTING_VIEW_INFO: Record<AccountingView, { label: string; Icon: LucideIcon }> = {
  'overview': { label: 'Financial Overview', Icon: PieChartIcon },
  'general-ledger': { label: 'General Ledger', Icon: BookOpen },
  'journal-management': { label: 'Journal Management', Icon: ClipboardList },
  'report': { label: 'Report', Icon: FileText },
  'lab-wallet': { label: 'Lab Wallet Monitor', Icon: Wallet },
  'setup': { label: 'Setup', Icon: Settings },
};
type GeneralLedgerView = 'gl-setup' | 'transaction-view';
type AssetManagementView =
  | 'asset-register'
  | 'asset-depreciation'
  | 'asset-revaluation'
  | 'asset-transfer'
  | 'asset-disposal'
  | 'insurance-claim';
type AssetRegisterView = 'setup' | 'edit' | 'report';
type AssetDepreciationView = 'setup' | 'report';
type AssetRevaluationView = 'setup' | 'report';
type AssetTransferView = 'setup' | 'report';
type AssetDisposalView = 'setup' | 'report';
type AssetInsuranceView = 'setup' | 'premium-payment' | 'claim' | 'report';
type AssetInsuranceReportView = 'registered' | 'premium-paid' | 'claim';
type StaffPayrollView = 'setup' | 'staff-registration' | 'salary-advance';
type DeductionCategory = 'statutory' | 'voluntary' | 'disciplinary';
type DeductionCalcType = 'fixed' | 'percentage';

type DeductionRecord = {
  id: string;
  name: string;
  category: DeductionCategory;
  calcType: DeductionCalcType;
  value: number;
  glAccountId: string;
  enabled: boolean;
};

type AllowanceRecord = {
  id: string;
  name: string;
  calcType: DeductionCalcType;
  value: number;
  glAccountId: string;
  enabled: boolean;
};

type StaffDeductionItem = { deductionId: string; enabled: boolean; valueOverride: number | null };
type StaffAllowanceItem = { allowanceId: string; enabled: boolean; valueOverride: number | null };

type StaffPayrollProfile = {
  staffId: string;
  deductions: StaffDeductionItem[];
  allowances: StaffAllowanceItem[];
};
type GeneralLedgerClass = 'asset' | 'liability' | 'income' | 'expense';
type GlChartNode = { label: string; details: string[] };
type GlCategoryNode = { value: string; label: string; charts: GlChartNode[] };
type AccountsSetupState = {
  cashierGlAccountId: string;
  inventoryStockGlAccountId: string;
  walletGlAccountId: string;
  departmentIncomeGlAccounts: Record<string, string>;
  departmentExpenseGlAccounts: Record<string, string>;
};

type AssetRegisterRecord = {
  id: string;
  asset: string;
  category: string;
  assetAccountingCategory: string;
  location: string;
  status: string;
  value: number;
  serialNumber: string;
  modelNumber: string;
  assetAcquisition: string;
  assetTag: string;
  manufacturer: string;
  purchaseDate: string;
  supplier: string;
  department: string;
  custodian: string;
  condition: string;
  warrantyExpiryDate: string;
  assetImageName: string;
  usefulLife: string;
  debitAccountId: string;
  debitAccountDisplay: string;
  creditAccountId: string;
  creditAccountDisplay: string;
};

type AssetRegisterForm = {
  assetReferenceNo: string;
  assetName: string;
  assetCategory: string;
  assetAccountingCategory: string;
  serialNumber: string;
  modelNumber: string;
  assetAcquisition: string;
  assetTag: string;
  manufacturer: string;
  purchaseDate: string;
  purchaseCost: string;
  supplier: string;
  location: string;
  department: string;
  custodian: string;
  condition: string;
  warrantyExpiryDate: string;
  status: string;
  assetImageName: string;
  usefulLife: string;
  debitAccountId: string;
  creditAccountId: string;
};

type AssetDepreciationSetupRecord = {
  id: string;
  depreciationMethod: string;
  usefulLife: string;
  residualValue: string;
  depreciationStartDate: string;
  depreciationFrequency: string;
  depreciationRate: string;
  assetCategory: string;
  accountGroup: string;
  pnlDebitAccount: string;
  accumulatedDepreciationCreditAccount: string;
};

type AssetDepreciationSetupForm = {
  depreciationMethod: string;
  usefulLife: string;
  residualValue: string;
  depreciationStartDate: string;
  depreciationFrequency: string;
  depreciationRate: string;
  assetCategory: string;
  accountGroup: string;
  pnlDebitAccount: string;
  accumulatedDepreciationCreditAccount: string;
};

type AssetRevaluationRecord = {
  id: string;
  assetReferenceNo: string;
  assetName: string;
  assetCategory: string;
  assetSector: string;
  revaluationDate: string;
  revaluationType: string;
  oldBookValue: number;
  newRevaluedAmount: number;
  revaluationDifference: number;
  reasonForRevaluation: string;
  valuationMethod: string;
  valuerName: string;
  valuationReportNumber: string;
  accountingSection: string;
  debitAccountId: string;
  debitAccountDisplay: string;
  creditAccountId: string;
  creditAccountDisplay: string;
};

type AssetRevaluationForm = {
  assetReferenceNo: string;
  revaluationDate: string;
  revaluationType: string;
  oldBookValue: string;
  newRevaluedAmount: string;
  revaluationDifference: string;
  reasonForRevaluation: string;
  valuationMethod: string;
  valuerName: string;
  valuationReportNumber: string;
  accountingSection: string;
  debitAccountId: string;
  creditAccountId: string;
};

type AssetTransferRecord = {
  id: string;
  transferDate: string;
  transferType: string;
  reasonForTransfer: string;
  status: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  serialNumber: string;
  currentCondition: string;
  fromDepartment: string;
  fromLocation: string;
  fromCustodian: string;
  fromBranchHospital: string;
  toDepartment: string;
  toLocation: string;
  toCustodian: string;
  toBranchHospital: string;
  debitAccountId: string;
  debitAccountDisplay: string;
  creditAccountId: string;
  creditAccountDisplay: string;
  requestedBy: string;
  approvedBy: string;
  releasedBy: string;
  receivedBy: string;
  dateReceived: string;
  comment: string;
  conditionBefore: string;
  conditionAfter: string;
  damageNote: string;
  attachmentName: string;
};

type AssetTransferForm = {
  transferNo: string;
  transferDate: string;
  transferType: string;
  reasonForTransfer: string;
  status: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  serialNumber: string;
  currentCondition: string;
  fromDepartment: string;
  fromLocation: string;
  fromCustodian: string;
  fromBranchHospital: string;
  toDepartment: string;
  toLocation: string;
  toCustodian: string;
  toBranchHospital: string;
  debitAccountId: string;
  creditAccountId: string;
  requestedBy: string;
  approvedBy: string;
  releasedBy: string;
  receivedBy: string;
  dateReceived: string;
  comment: string;
  conditionBefore: string;
  conditionAfter: string;
  damageNote: string;
  attachmentName: string;
};

type AssetDisposalRecord = {
  id: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  assetLocation: string;
  department: string;
  custodian: string;
  purchaseDate: string;
  purchaseCost: number;
  supplierName: string;
  serialNumber: string;
  modelNumber: string;
  currentCondition: string;
  accumulatedDepreciation: number;
  netBookValue: number;
  lastDepreciationDate: string;
  remainingUsefulLife: string;
  disposalType: string;
  disposalDate: string;
  disposalValue: number;
  buyerName: string;
  paymentMethod: string;
  debitAccountId: string;
  debitAccountDisplay: string;
  creditAccountId: string;
  creditAccountDisplay: string;
  bankOrCashAccountId: string;
  bankOrCashAccountDisplay: string;
  disposalExpense: number;
  profitOrLoss: number;
  requestedBy: string;
  checkedBy: string;
  approvedBy: string;
  approvalDate: string;
  approvalStatus: string;
  reasonForDisposal: string;
  managementComment: string;
  assetPictureName: string;
  disposalApprovalMemoName: string;
  buyerReceiptName: string;
  policeReportName: string;
  damageReportName: string;
  valuationReportName: string;
  boardApprovalDocumentName: string;
  supplierReturnDocumentName: string;
  assetAccountDisplay: string;
  accumulatedDepreciationAccountDisplay: string;
  disposalExpenseAccountDisplay: string;
};

type AssetDisposalForm = {
  disposalNo: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  assetLocation: string;
  department: string;
  custodian: string;
  purchaseDate: string;
  purchaseCost: string;
  supplierName: string;
  serialNumber: string;
  modelNumber: string;
  currentCondition: string;
  accumulatedDepreciation: string;
  netBookValue: string;
  lastDepreciationDate: string;
  remainingUsefulLife: string;
  disposalType: string;
  disposalDate: string;
  disposalValue: string;
  buyerName: string;
  paymentMethod: string;
  debitAccountId: string;
  creditAccountId: string;
  bankOrCashAccountId: string;
  disposalExpense: string;
  profitOrLoss: string;
  requestedBy: string;
  checkedBy: string;
  approvedBy: string;
  approvalDate: string;
  approvalStatus: string;
  reasonForDisposal: string;
  managementComment: string;
  assetPictureName: string;
  disposalApprovalMemoName: string;
  buyerReceiptName: string;
  policeReportName: string;
  damageReportName: string;
  valuationReportName: string;
  boardApprovalDocumentName: string;
  supplierReturnDocumentName: string;
};

type AssetInsuranceRecord = {
  id: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  department: string;
  location: string;
  assetCustodian: string;
  purchaseCost: number;
  currentNetBookValue: number;
  currentCondition: string;
  insuranceCompanyName: string;
  insuranceCompanyAddress: string;
  contactPerson: string;
  phoneNumber: string;
  emailAddress: string;
  brokerName: string;
  brokerPhoneNumber: string;
  policyNumber: string;
  insuranceType: string;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  assetValue: number;
  sumInsured: number;
  premiumAmount: number;
  deductibleExcess: number;
  claimLimit: number;
  paymentFrequency: string;
  coverageDetails: string;
  exclusions: string;
  policyStatus: string;
  paymentDate: string;
  paymentMethod: string;
  bankCashAccountId: string;
  bankCashAccountDisplay: string;
  accountAffectedType: string;
  paymentDebitAccountId: string;
  paymentDebitAccountDisplay: string;
  paymentCreditAccountId: string;
  paymentCreditAccountDisplay: string;
  paymentReference: string;
  receiptNumber: string;
  amountPaid: number;
  paidBy: string;
  receivedByInsuranceAgent: string;
  paymentNarration: string;
  paymentStatus: string;
  paymentApprovalStatus: string;
  paymentApprovedBy: string;
  paymentApprovedDate: string;
  generalLedgerPostingStatus: string;
  accountingTreatment: string;
  nextRenewalAlertDate: string;
  claimNumber: string;
  claimDate: string;
  incidentDate: string;
  incidentType: string;
  incidentDescription: string;
  claimAmount: number;
  approvedClaimAmount: number;
  insuranceCompanyResponse: string;
  claimStatus: string;
  claimApprovalStatus: string;
  claimApprovedBy: string;
  claimApprovedDate: string;
  insurerSubmissionStatus: string;
  insurerSubmissionDate: string;
  claimPostingStatus: string;
  claimClosedDate: string;
  claimClosedBy: string;
  settlementDate: string;
  amountReceived: number;
  evidenceUploadName: string;
  insurancePolicyDocumentName: string;
  premiumReceiptName: string;
  assetPhotoName: string;
  claimFormName: string;
  policeReportName: string;
  fireReportName: string;
  damageReportName: string;
  engineerReportName: string;
  valuationReportName: string;
  settlementLetterName: string;
  renewalAlertMessage: string;
  renewalAlertDays: number | null;
};

type AssetInsuranceForm = {
  assetCode: string;
  assetName: string;
  assetCategory: string;
  department: string;
  location: string;
  assetCustodian: string;
  purchaseCost: string;
  currentNetBookValue: string;
  currentCondition: string;
  insuranceCompanyName: string;
  insuranceCompanyAddress: string;
  contactPerson: string;
  phoneNumber: string;
  emailAddress: string;
  brokerName: string;
  brokerPhoneNumber: string;
  policyNumber: string;
  insuranceType: string;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  assetValue: string;
  sumInsured: string;
  premiumAmount: string;
  deductibleExcess: string;
  claimLimit: string;
  paymentFrequency: string;
  coverageDetails: string;
  exclusions: string;
  policyStatus: string;
  paymentDate: string;
  paymentMethod: string;
  bankCashAccountId: string;
  accountAffectedType: string;
  paymentDebitAccountId: string;
  paymentCreditAccountId: string;
  paymentReference: string;
  receiptNumber: string;
  amountPaid: string;
  paidBy: string;
  receivedByInsuranceAgent: string;
  paymentNarration: string;
  paymentStatus: string;
  paymentApprovalStatus: string;
  paymentApprovedBy: string;
  paymentApprovedDate: string;
  generalLedgerPostingStatus: string;
  accountingTreatment: string;
  nextRenewalAlertDate: string;
  claimNumber: string;
  claimDate: string;
  incidentDate: string;
  incidentType: string;
  incidentDescription: string;
  claimAmount: string;
  approvedClaimAmount: string;
  insuranceCompanyResponse: string;
  claimStatus: string;
  claimApprovalStatus: string;
  claimApprovedBy: string;
  claimApprovedDate: string;
  insurerSubmissionStatus: string;
  insurerSubmissionDate: string;
  claimPostingStatus: string;
  claimClosedDate: string;
  claimClosedBy: string;
  settlementDate: string;
  amountReceived: string;
  evidenceUploadName: string;
  insurancePolicyDocumentName: string;
  premiumReceiptName: string;
  assetPhotoName: string;
  claimFormName: string;
  policeReportName: string;
  fireReportName: string;
  damageReportName: string;
  engineerReportName: string;
  valuationReportName: string;
  settlementLetterName: string;
};

type AssetInsuranceReceiptPayload = {
  receiptNumber: string;
  paymentDate: string;
  policyNumber: string;
  insuranceCompanyName: string;
  insuranceType: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  department: string;
  location: string;
  premiumAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  paymentReference: string;
  debitAccountDisplay: string;
  creditAccountDisplay: string;
  paidBy: string;
  receivedByInsuranceAgent: string;
  paymentStatus: string;
  paymentApprovalStatus: string;
  accountingTreatment: string;
  narration: string;
};

type PayrollSetupState = {
  payrollFrequency: string;
  nextPayrollDate: string;
  salaryExpenseAccountId: string;
  salaryPayableAccountId: string;
  salaryAdvanceAccountId: string;
  payrollBankAccountId: string;
};

type StaffRegistrationRecord = {
  id: string;
  staffId: string;
  title: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  homeAddress: string;
  stateOfOrigin: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  department: string;
  designation: string;
  staffGroup: string;
  employmentType: string;
  employmentDate: string;
  salaryGrade: string;
  grossSalary: number;
  taxId: string;
  pensionPin: string;
  nhfNumber: string;
  bankName: string;
  accountNumber: string;
  paymentMode: string;
  status: string;
};

type StaffRegistrationForm = {
  staffId: string;
  title: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  homeAddress: string;
  stateOfOrigin: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  department: string;
  designation: string;
  staffGroup: string;
  employmentType: string;
  employmentDate: string;
  salaryGrade: string;
  grossSalary: string;
  taxId: string;
  pensionPin: string;
  nhfNumber: string;
  bankName: string;
  accountNumber: string;
  paymentMode: string;
  status: string;
};

type StaffSalaryAdvanceRecord = {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  requestDate: string;
  amount: number;
  reason: string;
  repaymentMonths: string;
  status: string;
  approvedBy: string;
};

type MaintenanceApprovalRecord = {
  id: string;
  assetReferenceNo: string;
  equipmentName: string;
  location: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed';
  assignedTo?: string;
  repairCost: number;
  photoName: string;
  routeTo: string;
  accountantApprovalStatus: 'Not Routed' | 'Pending Approval' | 'Approved' | 'Declined';
  approvalComment: string;
  expenseGlId: string;
  expenseGlDisplay: string;
  assetGlId: string;
  assetGlDisplay: string;
  department: string;
  custodian: string;
  ledgerReference: string;
  approvedBy?: string;
  approvalDate?: string;
};

type AssetPurchaseApprovalRecord = {
  id: string;
  assetName: string;
  assetCategory: string;
  department: string;
  location: string;
  specification: string;
  reason: string;
  quantity: number;
  estimatedCost: number;
  vendorName: string;
  requestedBy: string;
  requestedAt: string;
  photoName: string;
  routeTo: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Declined';
  approvalComment: string;
  approvedBy?: string;
  approvalDate?: string;
};

type StaffSalaryAdvanceForm = {
  staffId: string;
  requestDate: string;
  amount: string;
  reason: string;
  repaymentMonths: string;
  status: string;
  approvedBy: string;
};

const INITIAL_ASSET_SECTOR_CONFIGS: AssetSectorConfig[] = [
  { name: 'Medical Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Laboratory Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Theatre Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Radiology Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Ward Equipment', accountingCategory: 'Furniture & Fittings' },
  { name: 'Pharmacy Assets', accountingCategory: 'Office Equipment' },
  { name: 'ICT Assets', accountingCategory: 'Computer & Peripherals' },
  { name: 'Furniture & Fittings', accountingCategory: 'Furniture & Fittings' },
  { name: 'Motor Vehicles', accountingCategory: 'Motor Vehicles' },
  { name: 'Building & Infrastructure', accountingCategory: 'Building' },
  { name: 'Electrical & Power Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Kitchen Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Cleaning & Laundry Equipment', accountingCategory: 'Plant & Machinery' },
  { name: 'Security & Safety Equipment', accountingCategory: 'Office Equipment' },
  { name: 'Office Equipment', accountingCategory: 'Office Equipment' },
  { name: 'Biomedical Engineering Assets', accountingCategory: 'Plant & Machinery' },
];

const DEPRECIATION_METHOD_OPTIONS = [
  'Straight Line',
  'Reducing Balance',
  'Units of Production',
  'Sum of Years Digits',
] as const;

const DEPRECIATION_FREQUENCY_OPTIONS = [
  'Monthly',
  'Quarterly',
  'Bi-Annual',
  'Annual',
] as const;

const ASSET_INSURANCE_TYPE_OPTIONS = [
  'Fire Insurance',
  'Theft/Burglary Insurance',
  'Motor Vehicle Insurance',
  'Comprehensive Insurance',
  'Equipment Breakdown Insurance',
  'Property Insurance',
  'Professional Equipment Insurance',
  'Marine Insurance',
  'Public Liability Insurance',
  'Electronic Equipment Insurance',
  'All Risk Insurance',
  'Group Asset Insurance',
] as const;

const ASSET_INSURANCE_POLICY_STATUS_OPTIONS = [
  'Active',
  'Expired',
  'Pending Renewal',
  'Cancelled',
  'Claimed',
  'Suspended',
] as const;

const ASSET_INSURANCE_PAYMENT_STATUS_OPTIONS = [
  'Paid',
  'Part Payment',
  'Unpaid',
  'Overdue',
  'Cancelled',
  'Reversed',
] as const;

const ASSET_INSURANCE_CLAIM_STATUS_OPTIONS = [
  'Pending',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Settled',
  'Closed',
  'Cancelled',
] as const;

const ASSET_INSURANCE_PAYMENT_FREQUENCY_OPTIONS = [
  'One-time payment',
  'Monthly',
  'Quarterly',
  'Half-yearly',
  'Yearly',
] as const;

const ASSET_INSURANCE_PAYMENT_METHOD_OPTIONS = [
  'Cash',
  'Bank Transfer',
  'Cheque',
  'POS',
  'Online Payment',
] as const;

const ASSET_INSURANCE_ACCOUNT_AFFECTED_OPTIONS = [
  'Cash Account',
  'Bank Account',
  'Petty Cash',
  'Wallet Account',
] as const;

const ASSET_INSURANCE_ACCOUNTING_TREATMENT_OPTIONS = [
  'Direct Expense',
  'Prepaid Insurance',
] as const;

const ASSET_INSURANCE_INCIDENT_TYPE_OPTIONS = [
  'Fire',
  'Theft',
  'Burglary',
  'Accident',
  'Mechanical Breakdown',
  'Electrical Fault',
  'Flood',
  'Vandalism',
  'Loss',
  'Other',
] as const;

const DEPRECIATION_ASSET_CATEGORY_OPTIONS = [
  'Building',
  'Plant & Machinery',
  'Computer & Peripherals',
  'Office Equipment',
  'Furniture & Fittings',
  'Motor Vehicles',
] as const satisfies readonly DepreciationAssetCategory[];


const inferAssetCategoryFromName = (assetName: string, availableSectors: string[]) => {
  const normalizedName = assetName.trim().toLowerCase();

  if (!normalizedName) {
    return '';
  }

  const assetCategoryMatchers: Array<{ category: string; keywords: string[] }> = [
    {
      category: 'Radiology Equipment',
      keywords: ['x-ray', 'xray', 'ultrasound', 'scan', 'scanner', 'ct', 'mri', 'imaging', 'radiology'],
    },
    {
      category: 'Laboratory Equipment',
      keywords: ['microscope', 'centrifuge', 'analyzer', 'laboratory', 'lab', 'reagent', 'incubator', 'spectrometer'],
    },
    {
      category: 'Theatre Equipment',
      keywords: ['theatre', 'surgical', 'operating', 'anesthesia', 'suction', 'sterilizer', 'autoclave'],
    },
    {
      category: 'Ward Equipment',
      keywords: ['ward', 'bed', 'mattress', 'bedside', 'locker', 'patient monitor', 'infusion stand'],
    },
    {
      category: 'Pharmacy Assets',
      keywords: ['pharmacy', 'drug shelf', 'dispensary', 'medicine cabinet', 'dispensing'],
    },
    {
      category: 'ICT Assets',
      keywords: ['computer', 'laptop', 'desktop', 'printer', 'server', 'router', 'switch', 'network', 'monitor', 'workstation'],
    },
    {
      category: 'Furniture & Fittings',
      keywords: ['chair', 'table', 'desk', 'cabinet', 'furniture', 'sofa', 'shelf', 'partition', 'stool'],
    },
    {
      category: 'Motor Vehicles',
      keywords: ['vehicle', 'car', 'ambulance', 'bus', 'truck', 'van', 'motor', 'bike', 'motorcycle'],
    },
    {
      category: 'Building & Infrastructure',
      keywords: ['building', 'roof', 'floor', 'gate', 'fence', 'borehole', 'infrastructure', 'renovation'],
    },
    {
      category: 'Electrical & Power Equipment',
      keywords: ['generator', 'ups', 'inverter', 'transformer', 'power', 'electrical', 'solar', 'battery'],
    },
    {
      category: 'Kitchen Equipment',
      keywords: ['kitchen', 'cooker', 'oven', 'microwave', 'freezer', 'fridge', 'refrigerator', 'boiler'],
    },
    {
      category: 'Cleaning & Laundry Equipment',
      keywords: ['washing machine', 'laundry', 'dryer', 'cleaning', 'vacuum', 'mop', 'pressing iron'],
    },
    {
      category: 'Security & Safety Equipment',
      keywords: ['cctv', 'camera', 'security', 'fire extinguisher', 'alarm', 'safety', 'access control'],
    },
    {
      category: 'Office Equipment',
      keywords: ['photocopier', 'shredder', 'binding machine', 'laminator', 'fax', 'office equipment'],
    },
    {
      category: 'Biomedical Engineering Assets',
      keywords: ['biomedical', 'calibration', 'defibrillator', 'ecg', 'eeg', 'ventilator', 'patient monitor'],
    },
    {
      category: 'Medical Equipment',
      keywords: ['hospital', 'medical', 'examination', 'treatment', 'ecg', 'defibrillator', 'ventilator', 'syringe pump'],
    },
  ];

  const matchedCategory = assetCategoryMatchers.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  if (matchedCategory && availableSectors.includes(matchedCategory.category)) {
    return matchedCategory.category;
  }

  if (availableSectors.includes('Medical Equipment')) {
    return 'Medical Equipment';
  }

  return availableSectors[0] ?? '';
};

const inferAssetAccountingCategoryFromSector = (
  assetSector: string,
  assetSectorConfigs: AssetSectorConfig[],
) => assetSectorConfigs.find((sector) => sector.name === assetSector)?.accountingCategory || '';

const getAssetCategoryCode = (category: string) => {
  const lettersOnly = category.replace(/[^A-Za-z]/g, '').toUpperCase();
  return lettersOnly.slice(0, 3).padEnd(3, 'X');
};

const getDefaultAccountGroupForAssetCategory = (assetCategory: string) => {
  switch (assetCategory.trim()) {
    case 'Building':
      return '10102 - Buildings';
    case 'Plant & Machinery':
      return '10103 - Plant & Machinery';
    case 'Office Equipment':
      return '10104 - Office Equipment';
    case 'Computer & Peripherals':
      return '10105 - Computers & Pheripherals';
    case 'Furniture & Fittings':
      return '10106 - Furniture, Fittings & Partitions';
    case 'Motor Vehicles':
      return '10107 - Motor Vehicles & Cycles';
    default:
      return '';
  }
};

const getDepreciationFrequencyDivisor = (frequency: string) => {
  switch (frequency.trim().toLowerCase()) {
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'bi-annual':
      return 2;
    default:
      return 1;
  }
};

const getAccumulatedDepreciationReference = (dateValue: string, sequence: number) => {
  const referenceYear = getJournalReferenceYear(dateValue);
  return `${ACCUMULATED_DEPRECIATION_REFERENCE_PREFIX}${referenceYear}${sequence
    .toString()
    .padStart(ACCUMULATED_DEPRECIATION_REFERENCE_SEQUENCE_LENGTH, '0')}`;
};

const parseUsefulLifeYears = (value: string) => {
  const match = value.match(/(\d+(\.\d+)?)/);
  if (!match) {
    return 0;
  }

  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const calculateAssetDepreciationCharge = ({
  method,
  frequency,
  openingValue,
  residualValue,
  rate,
  usefulLife,
  depreciationStartDate,
}: {
  method: string;
  frequency: string;
  openingValue: number;
  residualValue: number;
  rate: number;
  usefulLife: string;
  depreciationStartDate: string;
}) => {
  if (!Number.isFinite(openingValue) || openingValue <= 0) {
    return 0;
  }

  const today = new Date(`${getTodayIsoDate()}T12:00:00`);
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(depreciationStartDate)
    ? new Date(`${depreciationStartDate}T12:00:00`)
    : null;

  if (startDate && !Number.isNaN(startDate.getTime()) && today < startDate) {
    return 0;
  }

  const safeResidualValue = Number.isFinite(residualValue) && residualValue > 0 ? residualValue : 0;
  const depreciableBase = Math.max(openingValue - safeResidualValue, 0);
  const usefulLifeYears = parseUsefulLifeYears(usefulLife);
  const normalizedMethod = method.trim().toLowerCase();

  let annualCharge = 0;

  if (normalizedMethod === 'reducing balance') {
    annualCharge =
      rate > 0
        ? openingValue * (rate / 100)
        : usefulLifeYears > 0
          ? openingValue / usefulLifeYears
          : 0;
  } else {
    annualCharge =
      rate > 0
        ? depreciableBase * (rate / 100)
        : usefulLifeYears > 0
          ? depreciableBase / usefulLifeYears
          : 0;
  }

  const periodCharge = annualCharge / getDepreciationFrequencyDivisor(frequency);
  return Math.max(Math.min(periodCharge, depreciableBase), 0);
};

const DEPARTMENT_INCOME_OPTIONS: Array<{ key: string; label: string; description: string }> = [
  { key: 'reception', label: 'Reception', description: 'Consultation, registration & card fees' },
  { key: 'pharmacy', label: 'Pharmacy', description: 'Drug sales & dispensing revenue' },
  { key: 'laboratory', label: 'Laboratory', description: 'Lab test & pathology fees' },
  { key: 'radiology', label: 'Radiology / Imaging', description: 'X-Ray, ultrasound, CT, MRI fees' },
  { key: 'theatre', label: 'Theatre / Surgery', description: 'Surgical procedure fees' },
  { key: 'wards', label: 'Wards / Admission', description: 'Bed, daily care & admission fees' },
  { key: 'emergency', label: 'Emergency', description: 'Emergency triage & care fees' },
  { key: 'other', label: 'Other Income', description: 'Miscellaneous non-categorized revenue' },
];

const DEPARTMENT_EXPENSE_OPTIONS: Array<{ key: string; label: string; description: string }> = [
  { key: 'reception', label: 'Reception', description: 'Front-desk staff, supplies & utilities allocated' },
  { key: 'pharmacy', label: 'Pharmacy', description: 'Drug procurement, pharmacist costs & dispensing supplies' },
  { key: 'laboratory', label: 'Laboratory', description: 'Reagents, lab consumables & technician costs' },
  { key: 'radiology', label: 'Radiology / Imaging', description: 'Imaging consumables, radiographer costs & equipment maintenance' },
  { key: 'theatre', label: 'Theatre / Surgery', description: 'Surgical supplies, theatre staff & equipment costs' },
  { key: 'wards', label: 'Wards / Admission', description: 'Ward supplies, nursing costs & patient consumables' },
  { key: 'emergency', label: 'Emergency', description: 'Emergency supplies, on-call staff & triage materials' },
  { key: 'administration', label: 'Administration', description: 'Admin staff, office supplies & general overheads' },
  { key: 'maintenance', label: 'Maintenance', description: 'Repairs, equipment servicing & facility upkeep' },
  { key: 'utilities', label: 'Utilities', description: 'Electricity, water, fuel, internet & telecom' },
  { key: 'other', label: 'Other Expenses', description: 'Miscellaneous non-categorized costs' },
];

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
const getJournalAccountDisplayId = (account: {
  code: string;
  accountDetail?: string;
}) => {
  const detailCode = account.accountDetail ? getAccountCodeFromDetail(account.accountDetail) : '';
  return /^\d+$/.test(detailCode) ? detailCode : account.code;
};
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

const createJournalCatalogOptions = (): JournalAccountOption[] => {
  const options = new Map<string, JournalAccountOption>();

  (Object.entries(glHierarchy) as Array<
    [GeneralLedgerClass, Array<{ value: string; label: string; charts: string[] }>]
  >).forEach(([accountClass, categories]) => {
    categories.forEach((category) => {
      category.charts.forEach((chart) => {
        const details = glAccountDetailsByChart[chart] ?? [chart];

        details.forEach((detail) => {
          const detailCode = getAccountCodeFromDetail(detail);
          if (!detailCode) {
            return;
          }

          const optionId = `CATALOG::${detailCode}`;
          if (!options.has(optionId)) {
            options.set(optionId, {
              id: optionId,
              code: detailCode,
              accountDetail: detail,
              name: detail,
              accountClass,
              accountCategory: category.label,
              chartOfAccount: chart,
            });
          }
        });
      });
    });
  });

  return Array.from(options.values()).sort((left, right) =>
    left.code.localeCompare(right.code, undefined, { numeric: true }),
  );
};

const JOURNAL_CATALOG_OPTIONS = createJournalCatalogOptions();

const initialAssetRegister: AssetRegisterRecord[] = [
  {
    id: 'ASREG250000001',
    asset: 'Ultrasound Machine',
    category: 'Medical Equipment',
    assetAccountingCategory: 'Plant & Machinery',
    location: 'Radiology',
    status: 'Active',
    value: 3500000,
    serialNumber: 'USM-001',
    modelNumber: 'EPIQ-7',
    assetAcquisition: 'Direct Purchase',
    assetTag: 'AKOBI/RAD/2500001',
    manufacturer: 'Philips',
    purchaseDate: '2025-02-10',
    supplier: 'MedEquip Services',
    department: 'Radiology',
    custodian: 'Radiology Supervisor',
    condition: 'Good',
    warrantyExpiryDate: '2027-02-10',
    assetImageName: '',
    usefulLife: '5 years',
    debitAccountId: '',
    debitAccountDisplay: '',
    creditAccountId: '',
    creditAccountDisplay: '',
  },
  {
    id: 'ASREG240000001',
    asset: 'Generator Set',
    category: 'Utility Equipment',
    assetAccountingCategory: 'Plant & Machinery',
    location: 'Power House',
    status: 'Active',
    value: 5200000,
    serialNumber: 'GEN-220',
    modelNumber: 'CAT-550KVA',
    assetAcquisition: 'Direct Purchase',
    assetTag: 'AKOBI/ELE/2400001',
    manufacturer: 'Caterpillar',
    purchaseDate: '2024-08-03',
    supplier: 'Prime Power Systems',
    department: 'Maintenance',
    custodian: 'Chief Engineer',
    condition: 'Good',
    warrantyExpiryDate: '2026-08-03',
    assetImageName: '',
    usefulLife: '8 years',
    debitAccountId: '',
    debitAccountDisplay: '',
    creditAccountId: '',
    creditAccountDisplay: '',
  },
  {
    id: 'ASREG250000002',
    asset: 'Ward Bed Set',
    category: 'Furniture',
    assetAccountingCategory: 'Furniture & Fittings',
    location: 'Ward B',
    status: 'Under Service',
    value: 980000,
    serialNumber: 'BED-WB-013',
    modelNumber: 'HB-Classic',
    assetAcquisition: 'Direct Purchase',
    assetTag: 'AKOBI/WAR/2500001',
    manufacturer: 'Hospital Furnishings',
    purchaseDate: '2025-01-18',
    supplier: 'Careline Interiors',
    department: 'Wards',
    custodian: 'Ward Manager',
    condition: 'Fair',
    warrantyExpiryDate: '2026-01-18',
    assetImageName: '',
    usefulLife: '6 years',
    debitAccountId: '',
    debitAccountDisplay: '',
    creditAccountId: '',
    creditAccountDisplay: '',
  },
  {
    id: 'ASREG250000003',
    asset: 'Office Workstations',
    category: 'IT Equipment',
    assetAccountingCategory: 'Computer & Peripherals',
    location: 'Accounts Office',
    status: 'Active',
    value: 1450000,
    serialNumber: 'ICT-WS-004',
    modelNumber: 'HP ProDesk',
    assetAcquisition: 'Direct Purchase',
    assetTag: 'AKOBI/ICT/2500001',
    manufacturer: 'HP',
    purchaseDate: '2025-07-01',
    supplier: 'Digital Office Hub',
    department: 'Accounts',
    custodian: 'ICT Officer',
    condition: 'Good',
    warrantyExpiryDate: '2028-07-01',
    assetImageName: '',
    usefulLife: '4 years',
    debitAccountId: '',
    debitAccountDisplay: '',
    creditAccountId: '',
    creditAccountDisplay: '',
  },
];

const initialAssetDepreciationSetups: AssetDepreciationSetupRecord[] = [
  {
    id: 'DEPSET-001',
    depreciationMethod: 'Straight Line',
    usefulLife: '5 years',
    residualValue: '500000',
    depreciationStartDate: '2026-01-01',
    depreciationFrequency: 'Monthly',
    depreciationRate: '10',
    assetCategory: 'Plant & Machinery',
    accountGroup: '10103 - Plant & Machinery',
    pnlDebitAccount: '5020206 - Plant and Machinery Repairs',
    accumulatedDepreciationCreditAccount: '20202 - Accumulated Depreciation : Plant & Machinery',
  },
  {
    id: 'DEPSET-002',
    depreciationMethod: 'Reducing Balance',
    usefulLife: '8 years',
    residualValue: '750000',
    depreciationStartDate: '2026-01-01',
    depreciationFrequency: 'Annual',
    depreciationRate: '12.5',
    assetCategory: 'Plant & Machinery',
    accountGroup: '10103 - Plant & Machinery',
    pnlDebitAccount: '5020247 - Generator Repair Exp',
    accumulatedDepreciationCreditAccount: '20202 - Accumulated Depreciation : Plant & Machinery',
  },
];

const initialAssetRevaluationRegister: AssetRevaluationRecord[] = [
  {
    id: 'REV-001',
    assetReferenceNo: 'ASREG250000001',
    assetName: 'Ultrasound Machine',
    assetCategory: 'Plant & Machinery',
    assetSector: 'Medical Equipment',
    revaluationDate: '2026-01-12',
    revaluationType: 'Upward Revaluation',
    oldBookValue: 3150000,
    newRevaluedAmount: 3600000,
    revaluationDifference: 450000,
    reasonForRevaluation: 'Independent valuation reflected higher current market value.',
    valuationMethod: 'Market Comparison',
    valuerName: 'Finance Committee',
    valuationReportNumber: 'VAL-RAD-2026-001',
    accountingSection: '10103 - Plant & Machinery',
    debitAccountId: '',
    debitAccountDisplay: '1010301 - Plant & Machinery',
    creditAccountId: '',
    creditAccountDisplay: '2040301 - Property, Plant & Equipment Revaluation Reserve',
  },
  {
    id: 'REV-002',
    assetReferenceNo: 'ASREG240000001',
    assetName: 'Generator Set',
    assetCategory: 'Plant & Machinery',
    assetSector: 'Electrical & Power Equipment',
    revaluationDate: '2026-02-05',
    revaluationType: 'Upward Revaluation',
    oldBookValue: 4550000,
    newRevaluedAmount: 4700000,
    revaluationDifference: 150000,
    reasonForRevaluation: 'Replacement-cost review increased the carrying value.',
    valuationMethod: 'Replacement Cost',
    valuerName: 'Board Resolution',
    valuationReportNumber: 'VAL-ENG-2026-002',
    accountingSection: '10103 - Plant & Machinery',
    debitAccountId: '',
    debitAccountDisplay: '1010302 - Generator(Plant)',
    creditAccountId: '',
    creditAccountDisplay: '2040301 - Property, Plant & Equipment Revaluation Reserve',
  },
];

const initialAssetTransferRegister: AssetTransferRecord[] = [
  {
    id: 'ASTRF260000001',
    transferDate: '2026-03-18',
    transferType: 'Internal Department Transfer',
    reasonForTransfer: 'Move the ultrasound unit closer to the expanded diagnostic annex.',
    status: 'Completed',
    assetCode: 'ASREG250000001',
    assetName: 'Ultrasound Machine',
    assetCategory: 'Plant & Machinery',
    serialNumber: 'USM-001',
    currentCondition: 'Good',
    fromDepartment: 'Radiology',
    fromLocation: 'Radiology',
    fromCustodian: 'Radiology Supervisor',
    fromBranchHospital: 'Akobi Main Hospital',
    toDepartment: 'Radiology',
    toLocation: 'Diagnostic Annex',
    toCustodian: 'Diagnostic Annex Supervisor',
    toBranchHospital: 'Akobi Main Hospital',
    debitAccountId: '',
    debitAccountDisplay: '1010301 - Plant & Machinery',
    creditAccountId: '',
    creditAccountDisplay: '1010301 - Plant & Machinery',
    requestedBy: 'Radiology Supervisor',
    approvedBy: 'Head of Operations',
    releasedBy: 'Asset Controller',
    receivedBy: 'Diagnostic Annex Supervisor',
    dateReceived: '2026-03-18',
    comment: 'Transferred after calibration and room readiness confirmation.',
    conditionBefore: 'Good',
    conditionAfter: 'Good',
    damageNote: '',
    attachmentName: 'ultrasound-transfer.jpg',
  },
  {
    id: 'ASTRF260000002',
    transferDate: '2026-04-07',
    transferType: 'Internal Department Transfer',
    reasonForTransfer: 'Relocate workstations to support expanded administration staff.',
    status: 'Completed',
    assetCode: 'ASREG250000003',
    assetName: 'Office Workstations',
    assetCategory: 'Computer & Peripherals',
    serialNumber: 'ICT-WS-004',
    currentCondition: 'Good',
    fromDepartment: 'Accounts',
    fromLocation: 'Accounts Office',
    fromCustodian: 'ICT Officer',
    fromBranchHospital: 'Akobi Main Hospital',
    toDepartment: 'Administration',
    toLocation: 'Administration Block',
    toCustodian: 'Administrative Officer',
    toBranchHospital: 'Akobi Main Hospital',
    debitAccountId: '',
    debitAccountDisplay: '1010204 - Office Equipment',
    creditAccountId: '',
    creditAccountDisplay: '1010204 - Office Equipment',
    requestedBy: 'Administrative Officer',
    approvedBy: 'Finance Manager',
    releasedBy: 'ICT Unit',
    receivedBy: 'Administrative Officer',
    dateReceived: '2026-04-07',
    comment: 'All units tested and handed over in working condition.',
    conditionBefore: 'Good',
    conditionAfter: 'Good',
    damageNote: '',
    attachmentName: '',
  },
];

const initialAssetDisposalRegister: AssetDisposalRecord[] = [
  {
    id: 'ASDSP260000001',
    assetCode: 'ASREG250000002',
    assetName: 'Ward Bed Set',
    assetCategory: 'Furniture & Fittings',
    assetLocation: 'Ward B',
    department: 'Wards',
    custodian: 'Ward Manager',
    purchaseDate: '2025-01-18',
    purchaseCost: 980000,
    supplierName: 'Careline Interiors',
    serialNumber: 'BED-WB-013',
    modelNumber: 'HB-Classic',
    currentCondition: 'Poor',
    accumulatedDepreciation: 680000,
    netBookValue: 300000,
    lastDepreciationDate: '2026-03-31',
    remainingUsefulLife: '2 years',
    disposalType: 'Written off',
    disposalDate: '2026-04-29',
    disposalValue: 0,
    buyerName: '',
    paymentMethod: 'Cash',
    debitAccountId: '',
    debitAccountDisplay: '1010101 - Cash In Hand',
    creditAccountId: '',
    creditAccountDisplay: '1010401 - Furniture and Fittings',
    bankOrCashAccountId: '',
    bankOrCashAccountDisplay: '1010101 - Cash In Hand',
    disposalExpense: 0,
    profitOrLoss: -300000,
    requestedBy: 'Ward Manager',
    checkedBy: 'Biomedical Engineer',
    approvedBy: 'Medical Director',
    approvalDate: '2026-04-28',
    approvalStatus: 'Approved',
    reasonForDisposal: 'Damaged beyond repair after repeated maintenance requests.',
    managementComment: 'Approved for write-off after inspection and committee review.',
    assetPictureName: 'ward-bed-photo.jpg',
    disposalApprovalMemoName: 'ward-bed-writeoff-memo.pdf',
    buyerReceiptName: '',
    policeReportName: '',
    damageReportName: 'ward-bed-damage-report.pdf',
    valuationReportName: '',
    boardApprovalDocumentName: 'board-approval-writeoff.pdf',
    supplierReturnDocumentName: '',
    assetAccountDisplay: '1010401 - Furniture and Fittings',
    accumulatedDepreciationAccountDisplay: '2020401 - Accumulated Depreciation : Furniture & Fittings',
    disposalExpenseAccountDisplay: '',
  },
];

const payrollRegister = [
  { id: 'PAYROLL-001', staffGroup: 'Doctors', headcount: 12, grossPay: 4200000, netPay: 3680000, status: 'Ready' },
  { id: 'PAYROLL-002', staffGroup: 'Nurses', headcount: 24, grossPay: 3600000, netPay: 3140000, status: 'Ready' },
  { id: 'PAYROLL-003', staffGroup: 'Administrative Staff', headcount: 18, grossPay: 1850000, netPay: 1645000, status: 'Review' },
  { id: 'PAYROLL-004', staffGroup: 'Support Staff', headcount: 16, grossPay: 1280000, netPay: 1175000, status: 'Ready' },
];

const initialPayrollSetup: PayrollSetupState = {
  payrollFrequency: 'Monthly',
  nextPayrollDate: getTodayIsoDate(),
  salaryExpenseAccountId: '',
  salaryPayableAccountId: '',
  salaryAdvanceAccountId: '',
  payrollBankAccountId: '',
};

const initialStaffRegistrationRegister: StaffRegistrationRecord[] = [
  {
    id: 'STAFF-REG-001', staffId: 'STF-001', title: 'Dr.', fullName: 'Dr. Funmi Adekoya',
    gender: 'Female', dateOfBirth: '1985-03-12', phone: '08012345678', email: 'funmi.adekoya@akobihospital.ng',
    homeAddress: '12 Adeola Crescent, Ikeja, Lagos', stateOfOrigin: 'Osun',
    nextOfKinName: 'Bola Adekoya', nextOfKinPhone: '08098765432', nextOfKinRelationship: 'Spouse',
    department: 'Clinical Services', designation: 'Consultant Physician', staffGroup: 'Doctors',
    employmentType: 'Full-time', employmentDate: '2026-01-10', salaryGrade: 'GL 14',
    grossSalary: 850000, taxId: 'TIN-001-2345', pensionPin: 'PEN-100123', nhfNumber: 'NHF-00123',
    bankName: 'GTBank', accountNumber: '0123456789', paymentMode: 'Bank Transfer', status: 'Active',
  },
  {
    id: 'STAFF-REG-002', staffId: 'STF-002', title: 'Nurse', fullName: 'Grace Olanrewaju',
    gender: 'Female', dateOfBirth: '1990-07-25', phone: '08023456789', email: 'grace.olanrewaju@akobihospital.ng',
    homeAddress: '5 Hospital Road, Surulere, Lagos', stateOfOrigin: 'Ogun',
    nextOfKinName: 'James Olanrewaju', nextOfKinPhone: '08034567890', nextOfKinRelationship: 'Spouse',
    department: 'Nursing Services', designation: 'Senior Nursing Officer', staffGroup: 'Nurses',
    employmentType: 'Full-time', employmentDate: '2025-11-22', salaryGrade: 'GL 10',
    grossSalary: 420000, taxId: 'TIN-002-6789', pensionPin: 'PEN-200456', nhfNumber: 'NHF-00456',
    bankName: 'Access Bank', accountNumber: '1234567890', paymentMode: 'Bank Transfer', status: 'Active',
  },
];

const initialStaffSalaryAdvanceRegister: StaffSalaryAdvanceRecord[] = [
  {
    id: 'SALADV2600001',
    staffId: 'STF-002',
    staffName: 'Grace Olanrewaju',
    department: 'Nursing Services',
    requestDate: getTodayIsoDate(),
    amount: 120000,
    reason: 'Emergency medical support',
    repaymentMonths: '3',
    status: 'Pending Approval',
    approvedBy: '',
  },
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

const getAccountBehaviorSummary = (accountClass: GeneralLedgerClass) =>
  accountClass === 'asset' || accountClass === 'expense'
    ? 'Debit increases this account, while credit decreases it.'
    : 'Credit increases this account, while debit decreases it.';

const ACCOUNTS_SETUP_STORAGE_KEY = 'akobi_accounts_setup';
const ASSET_REGISTER_STORAGE_KEY = 'akobi_asset_register';
const ASSET_SECTOR_CONFIG_STORAGE_KEY = 'akobi_asset_sector_config';
const ASSET_DEPRECIATION_SETUP_STORAGE_KEY = 'akobi_asset_depreciation_setup';
const ASSET_REVALUATION_STORAGE_KEY = 'akobi_asset_revaluation_register';
const ASSET_TRANSFER_STORAGE_KEY = 'akobi_asset_transfer_register';
const ASSET_DISPOSAL_STORAGE_KEY = 'akobi_asset_disposal_register';
const ASSET_INSURANCE_STORAGE_KEY = 'akobi_asset_insurance_register';
const STAFF_PAYROLL_SETUP_STORAGE_KEY = 'akobi_staff_payroll_setup';
const STAFF_DEDUCTION_SETUP_STORAGE_KEY = 'akobi_staff_deduction_setup';
const STAFF_ALLOWANCE_SETUP_STORAGE_KEY = 'akobi_staff_allowance_setup';
const STAFF_PAYROLL_PROFILES_STORAGE_KEY = 'akobi_staff_payroll_profiles';
const STAFF_REGISTRATION_STORAGE_KEY = 'akobi_staff_registration_register';
const STAFF_SALARY_ADVANCE_STORAGE_KEY = 'akobi_staff_salary_advance_register';
const MAINTENANCE_REGISTER_STORAGE_KEY = 'akobi_maintenance_register';
const ASSET_PURCHASE_REQUEST_STORAGE_KEY = 'akobi_asset_purchase_requests';

const INITIAL_DEDUCTION_RECORDS: DeductionRecord[] = [
  { id: 'DED-001', name: 'PAYE Tax', category: 'statutory', calcType: 'percentage', value: 7.5, glAccountId: '', enabled: true },
  { id: 'DED-002', name: 'Pension', category: 'statutory', calcType: 'percentage', value: 8, glAccountId: '', enabled: true },
  { id: 'DED-003', name: 'NHF (National Housing Fund)', category: 'statutory', calcType: 'percentage', value: 2.5, glAccountId: '', enabled: true },
  { id: 'DED-004', name: 'Health Insurance', category: 'statutory', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-005', name: 'Loan Deduction', category: 'voluntary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-006', name: 'Staff Loan', category: 'voluntary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-007', name: 'Salary Advance Recovery', category: 'voluntary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-008', name: 'Cooperative Deduction', category: 'voluntary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-009', name: 'Union Dues', category: 'voluntary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-010', name: 'Tax Deduction', category: 'statutory', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-011', name: 'Absence Deduction', category: 'disciplinary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-012', name: 'Lateness Deduction', category: 'disciplinary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'DED-013', name: 'Damage / Loss Deduction', category: 'disciplinary', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
];

const createBlankStaffRegistrationForm = (): StaffRegistrationForm => ({
  staffId: '',
  title: '',
  fullName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  homeAddress: '',
  stateOfOrigin: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  department: '',
  designation: '',
  staffGroup: '',
  employmentType: 'Full-time',
  employmentDate: getTodayIsoDate(),
  salaryGrade: '',
  grossSalary: '',
  taxId: '',
  pensionPin: '',
  nhfNumber: '',
  bankName: '',
  accountNumber: '',
  paymentMode: 'Bank Transfer',
  status: 'Active',
});

const createBlankStaffSalaryAdvanceForm = (): StaffSalaryAdvanceForm => ({
  staffId: '',
  requestDate: getTodayIsoDate(),
  amount: '',
  reason: '',
  repaymentMonths: '',
  status: 'Pending Approval',
  approvedBy: '',
});

const getAssetReferenceYear = (dateValue: string) => {
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T00:00:00`)
    : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().getFullYear().toString().slice(-2);
  }

  return parsedDate.getFullYear().toString().slice(-2);
};

const normalizeAssetRegisterReferences = (assets: AssetRegisterRecord[]) => {
  const yearSequences = new Map<string, number>();

  return [...assets]
    .sort((left, right) => {
      const leftDate = left.purchaseDate || '';
      const rightDate = right.purchaseDate || '';
      if (leftDate === rightDate) {
        return left.asset.localeCompare(right.asset);
      }

      return leftDate.localeCompare(rightDate);
    })
    .map((asset) => {
      if (ASSET_REFERENCE_PATTERN.test(asset.id)) {
        const [, , year, sequence] = asset.id.match(ASSET_REFERENCE_PATTERN) ?? [];
        const currentSequence = Number.parseInt(sequence ?? '0', 10);
        const highestYearSequence = yearSequences.get(year) ?? 0;

        if (Number.isFinite(currentSequence) && currentSequence > highestYearSequence) {
          yearSequences.set(year, currentSequence);
        }

        return asset;
      }

      const assetYear = getAssetReferenceYear(asset.purchaseDate);
      const nextSequence = (yearSequences.get(assetYear) ?? 0) + 1;
      yearSequences.set(assetYear, nextSequence);

      return {
        ...asset,
        id: `${ASSET_REFERENCE_PREFIX}${assetYear}${nextSequence
          .toString()
          .padStart(ASSET_REFERENCE_SEQUENCE_LENGTH, '0')}`,
      };
    });
};

const getNextAssetReference = (assets: AssetRegisterRecord[], dateValue: string) => {
  const referenceYear = getAssetReferenceYear(dateValue);
  const nextSequence =
    assets.reduce((highestSequence, asset) => {
      const match = asset.id.match(ASSET_REFERENCE_PATTERN);
      if (!match || match[2] !== referenceYear) {
        return highestSequence;
      }

      const currentSequence = Number.parseInt(match[3], 10);
      return Number.isFinite(currentSequence) && currentSequence > highestSequence
        ? currentSequence
        : highestSequence;
    }, 0) + 1;

  return `${ASSET_REFERENCE_PREFIX}${referenceYear}${nextSequence
    .toString()
    .padStart(ASSET_REFERENCE_SEQUENCE_LENGTH, '0')}`;
};

const getNextAssetTransferReference = (transfers: AssetTransferRecord[], dateValue: string) => {
  const referenceYear = getAssetReferenceYear(dateValue);
  const nextSequence =
    transfers.reduce((highestSequence, transfer) => {
      const match = transfer.id.match(ASSET_TRANSFER_REFERENCE_PATTERN);
      if (!match || match[2] !== referenceYear) {
        return highestSequence;
      }

      const currentSequence = Number.parseInt(match[3], 10);
      return Number.isFinite(currentSequence) && currentSequence > highestSequence
        ? currentSequence
        : highestSequence;
    }, 0) + 1;

  return `${ASSET_TRANSFER_REFERENCE_PREFIX}${referenceYear}${nextSequence
    .toString()
    .padStart(ASSET_TRANSFER_REFERENCE_SEQUENCE_LENGTH, '0')}`;
};

const getNextAssetDisposalReference = (disposals: AssetDisposalRecord[], dateValue: string) => {
  const referenceYear = getAssetReferenceYear(dateValue);
  const nextSequence =
    disposals.reduce((highestSequence, disposal) => {
      const match = disposal.id.match(ASSET_DISPOSAL_REFERENCE_PATTERN);
      if (!match || match[2] !== referenceYear) {
        return highestSequence;
      }

      const currentSequence = Number.parseInt(match[3], 10);
      return Number.isFinite(currentSequence) && currentSequence > highestSequence
        ? currentSequence
        : highestSequence;
    }, 0) + 1;

  return `${ASSET_DISPOSAL_REFERENCE_PREFIX}${referenceYear}${nextSequence
    .toString()
    .padStart(ASSET_DISPOSAL_REFERENCE_SEQUENCE_LENGTH, '0')}`;
};

const normalizeAssetRegisterTags = (assets: AssetRegisterRecord[]) => {
  const categoryYearSequences = new Map<string, number>();

  return [...assets]
    .sort((left, right) => {
      const leftDate = left.purchaseDate || '';
      const rightDate = right.purchaseDate || '';
      if (leftDate === rightDate) {
        return left.asset.localeCompare(right.asset);
      }

      return leftDate.localeCompare(rightDate);
    })
    .map((asset) => {
      const categoryCode = getAssetCategoryCode(asset.category);
      const assetYear = getAssetReferenceYear(asset.purchaseDate);
      const sequenceKey = `${categoryCode}-${assetYear}`;

      if (ASSET_TAG_PATTERN.test(asset.assetTag)) {
        const [, existingCode, existingYear, existingSequence] = asset.assetTag.match(ASSET_TAG_PATTERN) ?? [];
        const currentSequence = Number.parseInt(existingSequence ?? '0', 10);

        if (existingCode === categoryCode && existingYear === assetYear) {
          const highestSequence = categoryYearSequences.get(sequenceKey) ?? 0;
          if (Number.isFinite(currentSequence) && currentSequence > highestSequence) {
            categoryYearSequences.set(sequenceKey, currentSequence);
          }

          return asset;
        }
      }

      const nextSequence = (categoryYearSequences.get(sequenceKey) ?? 0) + 1;
      categoryYearSequences.set(sequenceKey, nextSequence);

      return {
        ...asset,
        assetTag: `${ASSET_TAG_PREFIX}/${categoryCode}/${assetYear}${nextSequence
          .toString()
          .padStart(ASSET_TAG_SEQUENCE_LENGTH, '0')}`,
      };
    });
};

const getNextAssetTag = (
  assets: AssetRegisterRecord[],
  category: string,
  purchaseDate: string,
) => {
  if (!category.trim()) {
    return '';
  }

  const categoryCode = getAssetCategoryCode(category);
  const assetYear = getAssetReferenceYear(purchaseDate);
  const sequenceKey = `${categoryCode}-${assetYear}`;
  const nextSequence =
    assets.reduce((highestSequence, asset) => {
      const match = asset.assetTag.trim().match(ASSET_TAG_PATTERN);
      if (!match) {
        return highestSequence;
      }

      const currentCategoryCode = match[1];
      const currentYear = match[2];
      const currentSequence = Number.parseInt(match[3], 10);
      if (`${currentCategoryCode}-${currentYear}` !== sequenceKey) {
        return highestSequence;
      }

      return Number.isFinite(currentSequence) && currentSequence > highestSequence
        ? currentSequence
        : highestSequence;
    }, 0) + 1;

  return `${ASSET_TAG_PREFIX}/${categoryCode}/${assetYear}${nextSequence
    .toString()
    .padStart(ASSET_TAG_SEQUENCE_LENGTH, '0')}`;
};

const createBlankAssetRegisterForm = (
  assetReferenceNo: string,
  purchaseDate = getTodayIsoDate(),
  assetTag = '',
): AssetRegisterForm => ({
  assetReferenceNo,
  assetName: '',
  assetCategory: '',
  assetAccountingCategory: '',
  serialNumber: '',
  modelNumber: '',
  assetAcquisition: '',
  assetTag,
  manufacturer: '',
  purchaseDate,
  purchaseCost: '',
  supplier: '',
  location: '',
  department: '',
  custodian: '',
  condition: 'Good',
  warrantyExpiryDate: '',
  status: 'Active',
  assetImageName: '',
  usefulLife: '',
  debitAccountId: '',
  creditAccountId: '',
});

const createAssetRegisterFormFromRecord = (asset: AssetRegisterRecord): AssetRegisterForm => ({
  assetReferenceNo: asset.id,
  assetName: asset.asset,
  assetCategory: asset.category,
  assetAccountingCategory: asset.assetAccountingCategory,
  serialNumber: asset.serialNumber,
  modelNumber: asset.modelNumber,
  assetAcquisition: asset.assetAcquisition,
  assetTag: asset.assetTag,
  manufacturer: asset.manufacturer,
  purchaseDate: asset.purchaseDate,
  purchaseCost: asset.value.toString(),
  supplier: asset.supplier,
  location: asset.location,
  department: asset.department,
  custodian: asset.custodian,
  condition: asset.condition,
  warrantyExpiryDate: asset.warrantyExpiryDate,
  status: asset.status,
  assetImageName: asset.assetImageName,
  usefulLife: asset.usefulLife,
  debitAccountId: asset.debitAccountId,
  creditAccountId: asset.creditAccountId,
});

const createBlankAssetDepreciationSetupForm = (): AssetDepreciationSetupForm => ({
  depreciationMethod: 'Straight Line',
  usefulLife: '',
  residualValue: '',
  depreciationStartDate: getTodayIsoDate(),
  depreciationFrequency: 'Monthly',
  depreciationRate: '',
  assetCategory: '',
  accountGroup: '',
  pnlDebitAccount: '',
  accumulatedDepreciationCreditAccount: '',
});

const createBlankAssetRevaluationForm = (): AssetRevaluationForm => ({
  assetReferenceNo: '',
  revaluationDate: getTodayIsoDate(),
  revaluationType: 'Upward Revaluation',
  oldBookValue: '',
  newRevaluedAmount: '',
  revaluationDifference: '',
  reasonForRevaluation: '',
  valuationMethod: 'Market Comparison',
  valuerName: '',
  valuationReportNumber: '',
  accountingSection: '',
  debitAccountId: '',
  creditAccountId: '',
});

const createBlankAssetTransferForm = (
  transferNo: string,
  transferDate = getTodayIsoDate(),
): AssetTransferForm => ({
  transferNo,
  transferDate,
  transferType: 'Internal Department Transfer',
  reasonForTransfer: '',
  status: 'Pending Approval',
  assetCode: '',
  assetName: '',
  assetCategory: '',
  serialNumber: '',
  currentCondition: '',
  fromDepartment: '',
  fromLocation: '',
  fromCustodian: '',
  fromBranchHospital: 'Akobi Main Hospital',
  toDepartment: '',
  toLocation: '',
  toCustodian: '',
  toBranchHospital: 'Akobi Main Hospital',
  debitAccountId: '',
  creditAccountId: '',
  requestedBy: '',
  approvedBy: '',
  releasedBy: '',
  receivedBy: '',
  dateReceived: '',
  comment: '',
  conditionBefore: '',
  conditionAfter: '',
  damageNote: '',
  attachmentName: '',
});

const createBlankAssetDisposalForm = (
  disposalNo: string,
  disposalDate = getTodayIsoDate(),
): AssetDisposalForm => ({
  disposalNo,
  assetCode: '',
  assetName: '',
  assetCategory: '',
  assetLocation: '',
  department: '',
  custodian: '',
  purchaseDate: '',
  purchaseCost: '',
  supplierName: '',
  serialNumber: '',
  modelNumber: '',
  currentCondition: '',
  accumulatedDepreciation: '',
  netBookValue: '',
  lastDepreciationDate: '',
  remainingUsefulLife: '',
  disposalType: 'Sold',
  disposalDate,
  disposalValue: '',
  buyerName: '',
  paymentMethod: 'Cash',
  debitAccountId: '',
  creditAccountId: '',
  bankOrCashAccountId: '',
  disposalExpense: '',
  profitOrLoss: '',
  requestedBy: '',
  checkedBy: '',
  approvedBy: '',
  approvalDate: '',
  approvalStatus: 'Pending',
  reasonForDisposal: '',
  managementComment: '',
  assetPictureName: '',
  disposalApprovalMemoName: '',
  buyerReceiptName: '',
  policeReportName: '',
  damageReportName: '',
  valuationReportName: '',
  boardApprovalDocumentName: '',
  supplierReturnDocumentName: '',
});

const createBlankAssetInsuranceForm = (): AssetInsuranceForm => ({
  assetCode: '',
  assetName: '',
  assetCategory: '',
  department: '',
  location: '',
  assetCustodian: '',
  purchaseCost: '',
  currentNetBookValue: '',
  currentCondition: '',
  insuranceCompanyName: '',
  insuranceCompanyAddress: '',
  contactPerson: '',
  phoneNumber: '',
  emailAddress: '',
  brokerName: '',
  brokerPhoneNumber: '',
  policyNumber: '',
  insuranceType: '',
  policyStartDate: '',
  policyEndDate: '',
  renewalDate: '',
  assetValue: '',
  sumInsured: '',
  premiumAmount: '',
  deductibleExcess: '',
  claimLimit: '',
  paymentFrequency: 'Yearly',
  coverageDetails: '',
  exclusions: '',
  policyStatus: 'Active',
  paymentDate: '',
  paymentMethod: 'Bank Transfer',
  bankCashAccountId: '',
  accountAffectedType: 'Bank Account',
  paymentDebitAccountId: '',
  paymentCreditAccountId: '',
  paymentReference: '',
  receiptNumber: '',
  amountPaid: '',
  paidBy: '',
  receivedByInsuranceAgent: '',
  paymentNarration: '',
  paymentStatus: 'Unpaid',
  paymentApprovalStatus: 'Pending Approval',
  paymentApprovedBy: '',
  paymentApprovedDate: '',
  generalLedgerPostingStatus: 'Pending Posting',
  accountingTreatment: 'Prepaid Insurance',
  nextRenewalAlertDate: '',
  claimNumber: '',
  claimDate: '',
  incidentDate: '',
  incidentType: '',
  incidentDescription: '',
  claimAmount: '',
  approvedClaimAmount: '',
  insuranceCompanyResponse: '',
  claimStatus: 'Pending',
  claimApprovalStatus: 'Draft',
  claimApprovedBy: '',
  claimApprovedDate: '',
  insurerSubmissionStatus: 'Not Submitted',
  insurerSubmissionDate: '',
  claimPostingStatus: 'Pending Posting',
  claimClosedDate: '',
  claimClosedBy: '',
  settlementDate: '',
  amountReceived: '',
  evidenceUploadName: '',
  insurancePolicyDocumentName: '',
  premiumReceiptName: '',
  assetPhotoName: '',
  claimFormName: '',
  policeReportName: '',
  fireReportName: '',
  damageReportName: '',
  engineerReportName: '',
  valuationReportName: '',
  settlementLetterName: '',
});

const getAssetInsuranceNextAlertDate = (policyEndDate: string) => {
  if (!policyEndDate) {
    return '';
  }

  const expiry = new Date(`${policyEndDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) {
    return '';
  }

  expiry.setDate(expiry.getDate() - 30);
  return expiry.toISOString().slice(0, 10);
};

const getAssetInsuranceRenewalAlert = (policyEndDate: string) => {
  if (!policyEndDate) {
    return {
      daysUntilExpiry: null as number | null,
      message: '',
      level: 'none' as 'none' | 'due' | 'expired',
    };
  }

  const today = new Date(`${getTodayIsoDate()}T00:00:00`);
  const expiry = new Date(`${policyEndDate}T00:00:00`);

  if (Number.isNaN(expiry.getTime())) {
    return {
      daysUntilExpiry: null,
      message: '',
      level: 'none' as const,
    };
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / millisecondsPerDay);

  if (daysUntilExpiry < 0) {
    return {
      daysUntilExpiry,
      message: `Policy expired ${Math.abs(daysUntilExpiry)} day(s) ago. Renew immediately.`,
      level: 'expired' as const,
    };
  }

  if (daysUntilExpiry === 0) {
    return {
      daysUntilExpiry,
      message: 'Policy expires today. Renew immediately to avoid a coverage gap.',
      level: 'due' as const,
    };
  }

  if (daysUntilExpiry <= 7) {
    return {
      daysUntilExpiry,
      message: `Policy expires in ${daysUntilExpiry} day(s). Immediate renewal follow-up is required.`,
      level: 'due' as const,
    };
  }

  if (daysUntilExpiry <= 14) {
    return {
      daysUntilExpiry,
      message: `Policy expires in ${daysUntilExpiry} day(s). Begin renewal processing now.`,
      level: 'due' as const,
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      daysUntilExpiry,
      message: `Policy expires in ${daysUntilExpiry} day(s). Renewal alert is now active.`,
      level: 'due' as const,
    };
  }

  return {
    daysUntilExpiry,
    message: 'Policy is active. Renewal alert will trigger once it is within 30 days of expiry.',
    level: 'none' as const,
  };
};

const getStoredAccountsSetup = (): AccountsSetupState => {
  const defaults: AccountsSetupState = {
    cashierGlAccountId: 'GL-CASHIER',
    inventoryStockGlAccountId: '',
    walletGlAccountId: 'GL-WALLET',
    departmentIncomeGlAccounts: DEPARTMENT_INCOME_OPTIONS.reduce(
      (acc, dept) => ({ ...acc, [dept.key]: '' }),
      {} as Record<string, string>,
    ),
    departmentExpenseGlAccounts: DEPARTMENT_EXPENSE_OPTIONS.reduce(
      (acc, dept) => ({ ...acc, [dept.key]: '' }),
      {} as Record<string, string>,
    ),
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  const storedValue = window.localStorage.getItem(ACCOUNTS_SETUP_STORAGE_KEY);
  if (!storedValue) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<AccountsSetupState>;
    return {
      ...defaults,
      ...parsed,
      departmentIncomeGlAccounts: {
        ...defaults.departmentIncomeGlAccounts,
        ...(parsed.departmentIncomeGlAccounts ?? {}),
      },
      departmentExpenseGlAccounts: {
        ...defaults.departmentExpenseGlAccounts,
        ...(parsed.departmentExpenseGlAccounts ?? {}),
      },
    };
  } catch {
    window.localStorage.removeItem(ACCOUNTS_SETUP_STORAGE_KEY);
    return defaults;
  }
};

const getStoredAssetRegister = (): AssetRegisterRecord[] => {
  const normalizeAssets = (assets: AssetRegisterRecord[]) =>
    normalizeAssetRegisterTags(
      normalizeAssetRegisterReferences(
        assets.map((asset) => {
          const rawSector = asset.category?.trim() || '';
          const normalizedSector =
            INITIAL_ASSET_SECTOR_CONFIGS.find((sector) => sector.name === rawSector)?.name ||
            (rawSector === 'Utility Equipment'
              ? 'Electrical & Power Equipment'
              : rawSector === 'Furniture'
                ? 'Furniture & Fittings'
                : rawSector === 'IT Equipment'
                  ? 'ICT Assets'
                  : rawSector);
          const normalizedAccountingCategory =
            asset.assetAccountingCategory?.trim() ||
            inferAssetAccountingCategoryFromSector(normalizedSector, INITIAL_ASSET_SECTOR_CONFIGS) ||
            inferAssetAccountingCategoryFromSector(rawSector, INITIAL_ASSET_SECTOR_CONFIGS);

          return {
            ...asset,
            category: normalizedSector || rawSector,
            assetAccountingCategory: normalizedAccountingCategory,
          };
        }),
      ),
    );

  if (typeof window === 'undefined') {
    return normalizeAssets(initialAssetRegister);
  }

  const storedValue = window.localStorage.getItem(ASSET_REGISTER_STORAGE_KEY);
  if (!storedValue) {
    return normalizeAssets(initialAssetRegister);
  }

  try {
    const parsed = JSON.parse(storedValue) as AssetRegisterRecord[];
    const safeAssets =
      Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAssetRegister;
    return normalizeAssets(safeAssets);
  } catch {
    window.localStorage.removeItem(ASSET_REGISTER_STORAGE_KEY);
    return normalizeAssets(initialAssetRegister);
  }
};

const sanitizeAssetSectorConfigs = (configs: AssetSectorConfig[]) => {
  const seen = new Set<string>();

  return configs.filter((config) => {
    const name = config.name.trim();
    const accountingCategory = config.accountingCategory;
    const normalizedName = name.toLowerCase();

    if (!name || seen.has(normalizedName)) {
      return false;
    }

    if (!DEPRECIATION_ASSET_CATEGORY_OPTIONS.includes(accountingCategory)) {
      return false;
    }

    seen.add(normalizedName);
    return true;
  });
};

const getStoredAssetSectorConfigs = (): AssetSectorConfig[] => {
  if (typeof window === 'undefined') {
    return INITIAL_ASSET_SECTOR_CONFIGS;
  }

  const storedValue = window.localStorage.getItem(ASSET_SECTOR_CONFIG_STORAGE_KEY);
  if (!storedValue) {
    return INITIAL_ASSET_SECTOR_CONFIGS;
  }

  try {
    const parsed = JSON.parse(storedValue) as AssetSectorConfig[];
    const safeConfigs = Array.isArray(parsed) ? sanitizeAssetSectorConfigs(parsed) : [];
    return safeConfigs.length > 0 ? safeConfigs : INITIAL_ASSET_SECTOR_CONFIGS;
  } catch {
    window.localStorage.removeItem(ASSET_SECTOR_CONFIG_STORAGE_KEY);
    return INITIAL_ASSET_SECTOR_CONFIGS;
  }
};

const getStoredAssetDepreciationSetups = (): AssetDepreciationSetupRecord[] => {
  if (typeof window === 'undefined') {
    return initialAssetDepreciationSetups;
  }

  const storedValue = window.localStorage.getItem(ASSET_DEPRECIATION_SETUP_STORAGE_KEY);
  if (!storedValue) {
    return initialAssetDepreciationSetups;
  }

  try {
    const parsed = JSON.parse(storedValue) as Array<Partial<AssetDepreciationSetupRecord>>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return initialAssetDepreciationSetups;
    }

    return parsed.map((setup, index) => {
      const rawAssetCategory = setup.assetCategory?.trim() || '';
      const normalizedAssetCategory = DEPRECIATION_ASSET_CATEGORY_OPTIONS.includes(
        rawAssetCategory as DepreciationAssetCategory,
      )
        ? rawAssetCategory
        : inferAssetAccountingCategoryFromSector(rawAssetCategory, INITIAL_ASSET_SECTOR_CONFIGS);

      return {
        id: setup.id?.trim() || `DEPSET-${(index + 1).toString().padStart(3, '0')}`,
        depreciationMethod: setup.depreciationMethod?.trim() || 'Straight Line',
        usefulLife: setup.usefulLife?.trim() || '',
        residualValue: setup.residualValue?.trim() || '0',
        depreciationStartDate: setup.depreciationStartDate || getTodayIsoDate(),
        depreciationFrequency: setup.depreciationFrequency?.trim() || 'Monthly',
        depreciationRate: setup.depreciationRate?.trim() || '',
        assetCategory: normalizedAssetCategory || rawAssetCategory,
        accountGroup:
          setup.accountGroup?.trim() ||
          getDefaultAccountGroupForAssetCategory(normalizedAssetCategory || rawAssetCategory),
        pnlDebitAccount: setup.pnlDebitAccount?.trim() || '',
        accumulatedDepreciationCreditAccount:
          setup.accumulatedDepreciationCreditAccount?.trim() || '',
      };
    });
  } catch {
    window.localStorage.removeItem(ASSET_DEPRECIATION_SETUP_STORAGE_KEY);
    return initialAssetDepreciationSetups;
  }
};

const getStoredAssetRevaluationRegister = (): AssetRevaluationRecord[] => {
  if (typeof window === 'undefined') {
    return initialAssetRevaluationRegister;
  }

  const storedValue = window.localStorage.getItem(ASSET_REVALUATION_STORAGE_KEY);
  if (!storedValue) {
    return initialAssetRevaluationRegister;
  }

  try {
    const parsed = JSON.parse(storedValue) as AssetRevaluationRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAssetRevaluationRegister;
  } catch {
    window.localStorage.removeItem(ASSET_REVALUATION_STORAGE_KEY);
    return initialAssetRevaluationRegister;
  }
};

const getStoredAssetTransferRegister = (): AssetTransferRecord[] => {
  if (typeof window === 'undefined') {
    return initialAssetTransferRegister;
  }

  const storedValue = window.localStorage.getItem(ASSET_TRANSFER_STORAGE_KEY);
  if (!storedValue) {
    return initialAssetTransferRegister;
  }

  try {
    const parsed = JSON.parse(storedValue) as AssetTransferRecord[];
    return Array.isArray(parsed) ? parsed : initialAssetTransferRegister;
  } catch {
    window.localStorage.removeItem(ASSET_TRANSFER_STORAGE_KEY);
    return initialAssetTransferRegister;
  }
};

const getStoredAssetDisposalRegister = (): AssetDisposalRecord[] => {
  if (typeof window === 'undefined') {
    return initialAssetDisposalRegister;
  }

  const storedValue = window.localStorage.getItem(ASSET_DISPOSAL_STORAGE_KEY);
  if (!storedValue) {
    return initialAssetDisposalRegister;
  }

  try {
    const parsed = JSON.parse(storedValue) as AssetDisposalRecord[];
    return Array.isArray(parsed) ? parsed : initialAssetDisposalRegister;
  } catch {
    window.localStorage.removeItem(ASSET_DISPOSAL_STORAGE_KEY);
    return initialAssetDisposalRegister;
  }
};

const getStoredAssetInsuranceRegister = (): AssetInsuranceRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedValue = window.localStorage.getItem(ASSET_INSURANCE_STORAGE_KEY);
  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as AssetInsuranceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(ASSET_INSURANCE_STORAGE_KEY);
    return [];
  }
};

const INITIAL_ALLOWANCE_RECORDS: AllowanceRecord[] = [
  { id: 'ALW-001', name: 'Housing Allowance', calcType: 'percentage', value: 10, glAccountId: '', enabled: false },
  { id: 'ALW-002', name: 'Transport Allowance', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'ALW-003', name: 'Medical Allowance', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'ALW-004', name: 'Meal Allowance', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'ALW-005', name: 'Overtime Allowance', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'ALW-006', name: 'Hazard Allowance', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
  { id: 'ALW-007', name: 'Leave Allowance', calcType: 'percentage', value: 10, glAccountId: '', enabled: false },
  { id: 'ALW-008', name: 'Utility Allowance', calcType: 'fixed', value: 0, glAccountId: '', enabled: false },
];

const getStoredAllowanceSetup = (): AllowanceRecord[] => {
  if (typeof window === 'undefined') return INITIAL_ALLOWANCE_RECORDS;
  const stored = window.localStorage.getItem(STAFF_ALLOWANCE_SETUP_STORAGE_KEY);
  if (!stored) return INITIAL_ALLOWANCE_RECORDS;
  try { return JSON.parse(stored) as AllowanceRecord[]; } catch { return INITIAL_ALLOWANCE_RECORDS; }
};

const getStoredPayrollProfiles = (): StaffPayrollProfile[] => {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem(STAFF_PAYROLL_PROFILES_STORAGE_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored) as StaffPayrollProfile[]; } catch { return []; }
};

const getStoredDeductionSetup = (): DeductionRecord[] => {
  if (typeof window === 'undefined') return INITIAL_DEDUCTION_RECORDS;
  const storedValue = window.localStorage.getItem(STAFF_DEDUCTION_SETUP_STORAGE_KEY);
  if (!storedValue) return INITIAL_DEDUCTION_RECORDS;
  try {
    return JSON.parse(storedValue) as DeductionRecord[];
  } catch {
    window.localStorage.removeItem(STAFF_DEDUCTION_SETUP_STORAGE_KEY);
    return INITIAL_DEDUCTION_RECORDS;
  }
};

const getStoredPayrollSetup = (): PayrollSetupState => {
  if (typeof window === 'undefined') {
    return initialPayrollSetup;
  }

  const storedValue = window.localStorage.getItem(STAFF_PAYROLL_SETUP_STORAGE_KEY);
  if (!storedValue) {
    return initialPayrollSetup;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<PayrollSetupState>;
    return {
      ...initialPayrollSetup,
      ...parsed,
    };
  } catch {
    window.localStorage.removeItem(STAFF_PAYROLL_SETUP_STORAGE_KEY);
    return initialPayrollSetup;
  }
};

const getStoredStaffRegistrationRegister = (): StaffRegistrationRecord[] => {
  if (typeof window === 'undefined') {
    return initialStaffRegistrationRegister;
  }

  const storedValue = window.localStorage.getItem(STAFF_REGISTRATION_STORAGE_KEY);
  if (!storedValue) {
    return initialStaffRegistrationRegister;
  }

  try {
    const parsed = JSON.parse(storedValue) as StaffRegistrationRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialStaffRegistrationRegister;
  } catch {
    window.localStorage.removeItem(STAFF_REGISTRATION_STORAGE_KEY);
    return initialStaffRegistrationRegister;
  }
};

const getStoredStaffSalaryAdvanceRegister = (): StaffSalaryAdvanceRecord[] => {
  if (typeof window === 'undefined') {
    return initialStaffSalaryAdvanceRegister;
  }

  const storedValue = window.localStorage.getItem(STAFF_SALARY_ADVANCE_STORAGE_KEY);
  if (!storedValue) {
    return initialStaffSalaryAdvanceRegister;
  }

  try {
    const parsed = JSON.parse(storedValue) as StaffSalaryAdvanceRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialStaffSalaryAdvanceRegister;
  } catch {
    window.localStorage.removeItem(STAFF_SALARY_ADVANCE_STORAGE_KEY);
    return initialStaffSalaryAdvanceRegister;
  }
};

const getStoredMaintenanceApprovalRegister = (): MaintenanceApprovalRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(MAINTENANCE_REGISTER_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue) as MaintenanceApprovalRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(MAINTENANCE_REGISTER_STORAGE_KEY);
    return [];
  }
};

const getStoredAssetPurchaseApprovalRegister = (): AssetPurchaseApprovalRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(ASSET_PURCHASE_REQUEST_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue) as AssetPurchaseApprovalRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(ASSET_PURCHASE_REQUEST_STORAGE_KEY);
    return [];
  }
};

export function Accounts() {
  const [glClassOptions, setGlClassOptions] = useState(initialGeneralLedgerClassOptions);
  const [glHierarchyState, setGlHierarchyState] = useState<Record<GeneralLedgerClass, GlCategoryNode[]>>(createInitialGlHierarchyState);
  const [accountsLayer, setAccountsLayer] = useState<AccountsLayer>(() => getAccountsLayerFromHash());
  const [accountingView, setAccountingView] = useState<AccountingView>('overview');
  const [generalLedgerView, setGeneralLedgerView] = useState<GeneralLedgerView>('gl-setup');
  const [assetManagementView, setAssetManagementView] = useState<AssetManagementView>('asset-register');
  const [assetRegisterView, setAssetRegisterView] = useState<AssetRegisterView>('setup');
  const [assetDepreciationView, setAssetDepreciationView] = useState<AssetDepreciationView>('setup');
  const [assetRevaluationView, setAssetRevaluationView] = useState<AssetRevaluationView>('setup');
  const [assetTransferView, setAssetTransferView] = useState<AssetTransferView>('setup');
  const [assetDisposalView, setAssetDisposalView] = useState<AssetDisposalView>('setup');
  const [assetInsuranceView, setAssetInsuranceView] = useState<AssetInsuranceView>('setup');
  const [assetInsuranceReportView, setAssetInsuranceReportView] = useState<AssetInsuranceReportView>('registered');
  const [staffPayrollView, setStaffPayrollView] = useState<StaffPayrollView>('setup');
  const [setupSubView, setSetupSubView] = useState<'deduction' | 'allowance'>('deduction');
  const [selectedDepreciationReportView, setSelectedDepreciationReportView] = useState('all');
  const [assetSectorConfigs, setAssetSectorConfigs] = useState<AssetSectorConfig[]>(() => getStoredAssetSectorConfigs());
  const [assetSectorDraft, setAssetSectorDraft] = useState<AssetSectorConfig>({
    name: '',
    accountingCategory: DEPRECIATION_ASSET_CATEGORY_OPTIONS[0],
  });
  const [assetSectorError, setAssetSectorError] = useState<string | null>(null);
  const [assetRegister, setAssetRegister] = useState<AssetRegisterRecord[]>(() => getStoredAssetRegister());
  const [assetDepreciationSetups, setAssetDepreciationSetups] = useState<AssetDepreciationSetupRecord[]>(
    () => getStoredAssetDepreciationSetups(),
  );
  const [assetRevaluationRegister, setAssetRevaluationRegister] = useState<AssetRevaluationRecord[]>(
    () => getStoredAssetRevaluationRegister(),
  );
  const [assetTransferRegister, setAssetTransferRegister] = useState<AssetTransferRecord[]>(
    () => getStoredAssetTransferRegister(),
  );
  const [assetDisposalRegister, setAssetDisposalRegister] = useState<AssetDisposalRecord[]>(
    () => getStoredAssetDisposalRegister(),
  );
  const [assetInsuranceRegister, setAssetInsuranceRegister] = useState<AssetInsuranceRecord[]>(
    () => getStoredAssetInsuranceRegister(),
  );
  const [payrollSetup, setPayrollSetup] = useState<PayrollSetupState>(() => getStoredPayrollSetup());
  const [deductionRecords, setDeductionRecords] = useState<DeductionRecord[]>(() => getStoredDeductionSetup());
  const [allowanceRecords, setAllowanceRecords] = useState<AllowanceRecord[]>(() => getStoredAllowanceSetup());
  const [staffPayrollProfiles, setStaffPayrollProfiles] = useState<StaffPayrollProfile[]>(() => getStoredPayrollProfiles());
  const [selectedProfileStaffId, setSelectedProfileStaffId] = useState<string>('');
  const [savedProfileIds, setSavedProfileIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(window.localStorage.getItem('akobi_saved_profile_ids') ?? '[]') as string[]; } catch { return []; }
  });
  const [staffRegistrationRegister, setStaffRegistrationRegister] = useState<StaffRegistrationRecord[]>(
    () => getStoredStaffRegistrationRegister(),
  );
  const [staffSalaryAdvanceRegister, setStaffSalaryAdvanceRegister] = useState<StaffSalaryAdvanceRecord[]>(
    () => getStoredStaffSalaryAdvanceRegister(),
  );
  const [maintenanceApprovalQueue, setMaintenanceApprovalQueue] = useState<MaintenanceApprovalRecord[]>(
    () => getStoredMaintenanceApprovalRegister(),
  );
  const [assetPurchaseApprovalQueue, setAssetPurchaseApprovalQueue] = useState<AssetPurchaseApprovalRecord[]>(
    () => getStoredAssetPurchaseApprovalRegister(),
  );
  const [assetDepreciationSetupForm, setAssetDepreciationSetupForm] = useState<AssetDepreciationSetupForm>(
    () => createBlankAssetDepreciationSetupForm(),
  );
  const [assetRevaluationForm, setAssetRevaluationForm] = useState<AssetRevaluationForm>(() =>
    createBlankAssetRevaluationForm(),
  );
  const [assetTransferForm, setAssetTransferForm] = useState<AssetTransferForm>(() =>
    createBlankAssetTransferForm(
      getNextAssetTransferReference(getStoredAssetTransferRegister(), getTodayIsoDate()),
      getTodayIsoDate(),
    ),
  );
  const [assetDisposalForm, setAssetDisposalForm] = useState<AssetDisposalForm>(() =>
    createBlankAssetDisposalForm(
      getNextAssetDisposalReference(getStoredAssetDisposalRegister(), getTodayIsoDate()),
      getTodayIsoDate(),
    ),
  );
  const [assetInsuranceForm, setAssetInsuranceForm] = useState<AssetInsuranceForm>(() =>
    createBlankAssetInsuranceForm(),
  );
  const [staffRegistrationForm, setStaffRegistrationForm] = useState<StaffRegistrationForm>(() =>
    createBlankStaffRegistrationForm(),
  );
  const [staffSalaryAdvanceForm, setStaffSalaryAdvanceForm] = useState<StaffSalaryAdvanceForm>(() =>
    createBlankStaffSalaryAdvanceForm(),
  );
  const [assetDepreciationSetupError, setAssetDepreciationSetupError] = useState<string | null>(null);
  const [assetRevaluationError, setAssetRevaluationError] = useState<string | null>(null);
  const [assetTransferError, setAssetTransferError] = useState<string | null>(null);
  const [assetDisposalError, setAssetDisposalError] = useState<string | null>(null);
  const [assetInsuranceError, setAssetInsuranceError] = useState<string | null>(null);
  const [staffRegistrationError, setStaffRegistrationError] = useState<string | null>(null);
  const [staffSalaryAdvanceError, setStaffSalaryAdvanceError] = useState<string | null>(null);
  const [assetRegisterForm, setAssetRegisterForm] = useState<AssetRegisterForm>(() =>
    createBlankAssetRegisterForm(
      getNextAssetReference(getStoredAssetRegister(), getTodayIsoDate()),
      getTodayIsoDate(),
      '',
    ),
  );
  const [assetRegisterError, setAssetRegisterError] = useState<string | null>(null);
  const [selectedAssetRegisterId, setSelectedAssetRegisterId] = useState('');
  const [assetRegisterEditForm, setAssetRegisterEditForm] = useState<AssetRegisterForm | null>(null);
  const [assetRegisterEditError, setAssetRegisterEditError] = useState<string | null>(null);
  const assetSectorOptions = useMemo(
    () => assetSectorConfigs.map((sector) => sector.name),
    [assetSectorConfigs],
  );
  const [glAccountCategory, setGlAccountCategory] = useState(glHierarchy.asset[0].value);
  const [glChartOfAccount, setGlChartOfAccount] = useState(glHierarchy.asset[0].charts[0]);
  const [glAccountDetail, setGlAccountDetail] = useState(glAccountDetailsByChart[glHierarchy.asset[0].charts[0]]?.[0] ?? glHierarchy.asset[0].charts[0]);
  const [glAccountCode, setGlAccountCode] = useState('');
  const [glAccountClass, setGlAccountClass] = useState<GeneralLedgerClass>('asset');
  const [accountsSetup, setAccountsSetup] = useState<AccountsSetupState>(() => getStoredAccountsSetup());
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
    addGeneralLedgerEntry,
    updateGeneralLedgerEntry,
    deleteGeneralLedgerEntry,
  } = useCashier();
  const { currentStaff } = useStaffAuth();

  const [journalView, setJournalView] = useState<'entries' | 'edit' | 'expenses'>('entries');
  const accountantName = currentStaff?.fullName?.trim() || 'Accountant';
  const getNextMaintenanceApprovalReference = (
    records: MaintenanceApprovalRecord[],
    dateValue: string,
  ) => {
    const year = getJournalReferenceYear(dateValue);
    const matchingReferences = records
      .map((record) => record.ledgerReference?.trim() || '')
      .filter((reference) => /^MNTAPR\d{2}\d{7}$/.test(reference) && reference.slice(6, 8) === year);
    const nextSequence =
      matchingReferences.reduce((highest, reference) => {
        const current = Number.parseInt(reference.slice(-7), 10);
        return Number.isFinite(current) && current > highest ? current : highest;
      }, 0) + 1;

    return `MNTAPR${year}${nextSequence.toString().padStart(7, '0')}`;
  };
  const createBlankJournalDraft = (
    date = getTodayIsoDate(),
    entries = generalLedgerEntries,
    journalType = 'general',
  ): JournalDraft => ({
    date,
    reference: getNextJournalReference(entries, date, journalType),
    postedBy: accountantName,
    journalType,
  });
  const createBlankLineForm = (): JournalLineForm => ({
    accountId: '',
    accountDetails: '',
    settlementAccountId: '',
    settlementAccountDetails: '',
    description: '',
    amount: '',
    type: 'debit',
  });
  const [journalDraft, setJournalDraft] = useState<JournalDraft>(() => createBlankJournalDraft());
  const [committedLines, setCommittedLines] = useState<JournalCommittedLine[]>([]);
  const [lineForm, setLineForm] = useState<JournalLineForm>(() => createBlankLineForm());
  const [journalFormError, setJournalFormError] = useState<string | null>(null);
  const [isJournalAccountPickerOpen, setIsJournalAccountPickerOpen] = useState(false);
  const [isSettlementAccountPickerOpen, setIsSettlementAccountPickerOpen] = useState(false);
  const [selectedPostedJournalId, setSelectedPostedJournalId] = useState('');
  const [journalEditDraft, setJournalEditDraft] = useState<JournalEditDraft | null>(null);
  const [journalEditError, setJournalEditError] = useState<string | null>(null);
  const [isDeleteJournalDialogOpen, setIsDeleteJournalDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<AccountingReportType>('income-statement');
  const [reportDateFrom, setReportDateFrom] = useState(getFirstDayOfMonthIsoDate());
  const [reportDateTo, setReportDateTo] = useState(getTodayIsoDate());
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState('all');
  const [isLedgerAccountPickerOpen, setIsLedgerAccountPickerOpen] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ACCOUNTS_SETUP_STORAGE_KEY, JSON.stringify(accountsSetup));
  }, [accountsSetup]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_SECTOR_CONFIG_STORAGE_KEY,
      JSON.stringify(assetSectorConfigs),
    );
  }, [assetSectorConfigs]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ASSET_REGISTER_STORAGE_KEY, JSON.stringify(assetRegister));
  }, [assetRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_DEPRECIATION_SETUP_STORAGE_KEY,
      JSON.stringify(assetDepreciationSetups),
    );
  }, [assetDepreciationSetups]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_REVALUATION_STORAGE_KEY,
      JSON.stringify(assetRevaluationRegister),
    );
  }, [assetRevaluationRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_TRANSFER_STORAGE_KEY,
      JSON.stringify(assetTransferRegister),
    );
  }, [assetTransferRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_DISPOSAL_STORAGE_KEY,
      JSON.stringify(assetDisposalRegister),
    );
  }, [assetDisposalRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_INSURANCE_STORAGE_KEY,
      JSON.stringify(assetInsuranceRegister),
    );
  }, [assetInsuranceRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      STAFF_PAYROLL_SETUP_STORAGE_KEY,
      JSON.stringify(payrollSetup),
    );
  }, [payrollSetup]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      STAFF_REGISTRATION_STORAGE_KEY,
      JSON.stringify(staffRegistrationRegister),
    );
  }, [staffRegistrationRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      STAFF_SALARY_ADVANCE_STORAGE_KEY,
      JSON.stringify(staffSalaryAdvanceRegister),
    );
  }, [staffSalaryAdvanceRegister]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      MAINTENANCE_REGISTER_STORAGE_KEY,
      JSON.stringify(maintenanceApprovalQueue),
    );
  }, [maintenanceApprovalQueue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ASSET_PURCHASE_REQUEST_STORAGE_KEY,
      JSON.stringify(assetPurchaseApprovalQueue),
    );
  }, [assetPurchaseApprovalQueue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncMaintenanceQueue = () => {
      setMaintenanceApprovalQueue(getStoredMaintenanceApprovalRegister());
      setAssetPurchaseApprovalQueue(getStoredAssetPurchaseApprovalRegister());
    };

    window.addEventListener('storage', syncMaintenanceQueue);
    window.addEventListener('focus', syncMaintenanceQueue);
    return () => {
      window.removeEventListener('storage', syncMaintenanceQueue);
      window.removeEventListener('focus', syncMaintenanceQueue);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STAFF_DEDUCTION_SETUP_STORAGE_KEY, JSON.stringify(deductionRecords));
  }, [deductionRecords]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STAFF_ALLOWANCE_SETUP_STORAGE_KEY, JSON.stringify(allowanceRecords));
  }, [allowanceRecords]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STAFF_PAYROLL_PROFILES_STORAGE_KEY, JSON.stringify(staffPayrollProfiles));
  }, [staffPayrollProfiles]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('akobi_saved_profile_ids', JSON.stringify(savedProfileIds));
  }, [savedProfileIds]);

  useEffect(() => {
    const nextReference = getNextAssetReference(assetRegister, assetRegisterForm.purchaseDate);
    const nextAssetTag = getNextAssetTag(
      assetRegister,
      assetRegisterForm.assetCategory,
      assetRegisterForm.purchaseDate,
    );

    setAssetRegisterForm((prev) =>
      prev.assetReferenceNo === nextReference && prev.assetTag === nextAssetTag
        ? prev
        : {
            ...prev,
            assetReferenceNo: nextReference,
            assetTag: nextAssetTag,
          },
    );
  }, [assetRegister, assetRegisterForm.assetCategory, assetRegisterForm.purchaseDate]);

  useEffect(() => {
    const nextTransferNo = getNextAssetTransferReference(
      assetTransferRegister,
      assetTransferForm.transferDate,
    );

    setAssetTransferForm((prev) =>
      prev.transferNo === nextTransferNo
        ? prev
      : {
            ...prev,
            transferNo: nextTransferNo,
          },
    );
  }, [assetTransferForm.transferDate, assetTransferRegister]);

  useEffect(() => {
    const nextDisposalNo = getNextAssetDisposalReference(
      assetDisposalRegister,
      assetDisposalForm.disposalDate,
    );

    setAssetDisposalForm((prev) =>
      prev.disposalNo === nextDisposalNo
        ? prev
        : {
            ...prev,
            disposalNo: nextDisposalNo,
          },
    );
  }, [assetDisposalForm.disposalDate, assetDisposalRegister]);

  useEffect(() => {
    setAssetRegisterForm((prev) => {
      if (!prev.assetCategory) {
        return prev.assetAccountingCategory ? { ...prev, assetAccountingCategory: '' } : prev;
      }

      if (!assetSectorOptions.includes(prev.assetCategory)) {
        return {
          ...prev,
          assetCategory: '',
          assetAccountingCategory: '',
          assetTag: '',
        };
      }

      const nextAccountingCategory = inferAssetAccountingCategoryFromSector(prev.assetCategory, assetSectorConfigs);
      return prev.assetAccountingCategory === nextAccountingCategory
        ? prev
        : {
            ...prev,
            assetAccountingCategory: nextAccountingCategory,
          };
    });

    setAssetRegisterEditForm((prev) => {
      if (!prev) {
        return prev;
      }

      if (!assetSectorOptions.includes(prev.assetCategory)) {
        return prev;
      }

      const nextAccountingCategory = inferAssetAccountingCategoryFromSector(prev.assetCategory, assetSectorConfigs);
      return prev.assetAccountingCategory === nextAccountingCategory
        ? prev
        : {
            ...prev,
            assetAccountingCategory: nextAccountingCategory,
          };
    });
  }, [assetSectorConfigs, assetSectorOptions]);

  useEffect(() => {
    if (!selectedAssetRegisterId) {
      setAssetRegisterEditForm(null);
      return;
    }

    const selectedAsset = assetRegister.find((asset) => asset.id === selectedAssetRegisterId);
    if (!selectedAsset) {
      setSelectedAssetRegisterId('');
      setAssetRegisterEditForm(null);
      return;
    }

    setAssetRegisterEditForm(createAssetRegisterFormFromRecord(selectedAsset));
    setAssetRegisterEditError(null);
  }, [assetRegister, selectedAssetRegisterId]);

  useEffect(() => {
    setJournalDraft((prev) => {
      const nextReference = getNextJournalReference(generalLedgerEntries, prev.date, prev.journalType);
      if (prev.reference === nextReference && prev.postedBy === accountantName) {
        return prev;
      }

      return {
        ...prev,
        reference: nextReference,
        postedBy: accountantName,
      };
    });
  }, [accountantName, generalLedgerEntries]);

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
  const selectedCashierGlAccount = generalLedgerAccounts.find(
    (account) => account.id === accountsSetup.cashierGlAccountId,
  );
  const selectedInventoryStockGlAccount = generalLedgerAccounts.find(
    (account) => account.id === accountsSetup.inventoryStockGlAccountId,
  );
  const selectedWalletGlAccount = generalLedgerAccounts.find(
    (account) => account.id === accountsSetup.walletGlAccountId,
  );
  const expenseGlAccounts = useMemo(
    () => generalLedgerAccounts.filter((account) => account.accountClass === 'expense'),
    [generalLedgerAccounts],
  );
  const incomeGlAccounts = useMemo(
    () => generalLedgerAccounts.filter((account) => account.accountClass === 'income'),
    [generalLedgerAccounts],
  );
  const totalAssetValue = useMemo(
    () => assetRegister.reduce((sum, asset) => sum + asset.value, 0),
    [],
  );
  const payrollGross = useMemo(
    () => staffRegistrationRegister.reduce((sum, item) => sum + item.grossSalary, 0),
    [staffRegistrationRegister],
  );
  const payrollNet = useMemo(
    () => staffRegistrationRegister.reduce((sum, item) => sum + item.grossSalary * 0.88, 0),
    [staffRegistrationRegister],
  );
  const payrollAdvanceTotal = useMemo(
    () => staffSalaryAdvanceRegister.reduce((sum, item) => sum + item.amount, 0),
    [staffSalaryAdvanceRegister],
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
  const selectedAccountBehavior = getAccountBehaviorSummary(glAccountClass);

  const journalAccountOptions = useMemo<JournalAccountOption[]>(() => {
    const options = new Map<string, JournalAccountOption>();

    generalLedgerAccounts.forEach((account) => {
      options.set(account.id, {
        id: account.id,
        code: getJournalAccountDisplayId(account),
        accountDetail: account.accountDetail || account.name,
        name: account.name,
        accountClass: account.accountClass,
        accountCategory: account.accountCategory || '',
        chartOfAccount: account.chartOfAccount || '',
      });
    });

    JOURNAL_CATALOG_OPTIONS.forEach((catalogOption) => {
      const existingAccount = generalLedgerAccounts.find(
        (account) =>
          account.code === catalogOption.code ||
          account.accountDetail === catalogOption.accountDetail,
      );

      const optionId = existingAccount?.id || catalogOption.id;
      if (!options.has(optionId)) {
        options.set(optionId, {
          ...catalogOption,
          id: optionId,
        });
      }
    });

    return Array.from(options.values()).sort((left, right) =>
      left.code.localeCompare(right.code, undefined, { numeric: true }),
    );
  }, [generalLedgerAccounts]);
  const setupIncomeGlOptions = useMemo(
    () => journalAccountOptions.filter((account) => account.accountClass === 'income'),
    [journalAccountOptions],
  );
  const setupExpenseGlOptions = useMemo(
    () => journalAccountOptions.filter((account) => account.accountClass === 'expense'),
    [journalAccountOptions],
  );
  useEffect(() => {
    const incomeIds = new Set(setupIncomeGlOptions.map((account) => account.id));
    const expenseIds = new Set(setupExpenseGlOptions.map((account) => account.id));
    let hasIncomeCleanup = false;
    let hasExpenseCleanup = false;

    const nextIncomeMappings = Object.fromEntries(
      Object.entries(accountsSetup.departmentIncomeGlAccounts).map(([key, value]) => {
        const safeValue = value && incomeIds.has(value) ? value : '';
        if (safeValue !== value) {
          hasIncomeCleanup = true;
        }
        return [key, safeValue];
      }),
    ) as Record<string, string>;

    const nextExpenseMappings = Object.fromEntries(
      Object.entries(accountsSetup.departmentExpenseGlAccounts).map(([key, value]) => {
        const safeValue = value && expenseIds.has(value) ? value : '';
        if (safeValue !== value) {
          hasExpenseCleanup = true;
        }
        return [key, safeValue];
      }),
    ) as Record<string, string>;

    if (!hasIncomeCleanup && !hasExpenseCleanup) {
      return;
    }

    setAccountsSetup((prev) => ({
      ...prev,
      departmentIncomeGlAccounts: nextIncomeMappings,
      departmentExpenseGlAccounts: nextExpenseMappings,
    }));
  }, [
    accountsSetup.departmentExpenseGlAccounts,
    accountsSetup.departmentIncomeGlAccounts,
    setupExpenseGlOptions,
    setupIncomeGlOptions,
  ]);

  const selectedJournalAccountOption = journalAccountOptions.find(
    (account) => account.id === lineForm.accountId,
  );
  const activeJournalAccountOptions = useMemo(
    () =>
      journalView === 'expenses'
        ? journalAccountOptions.filter((account) => account.accountClass === 'expense')
        : journalAccountOptions,
    [journalAccountOptions, journalView],
  );
  const activeSelectedJournalAccountOption = activeJournalAccountOptions.find(
    (account) => account.id === lineForm.accountId,
  );
  const settlementAccountOptions = useMemo<JournalAccountOption[]>(() => {
    const options = new Map<string, JournalAccountOption>();

    journalAccountOptions
      .filter(
        (account) =>
          account.accountClass === 'asset' &&
          ['10202 - Teller Cash', '10203 - Petty Cash', '10206 - Bank Balances'].includes(account.chartOfAccount),
      )
      .forEach((account) => {
        options.set(account.id, account);
      });

    return Array.from(options.values()).sort((left, right) =>
      left.code.localeCompare(right.code, undefined, { numeric: true }),
    );
  }, [journalAccountOptions]);
  const selectedSettlementAccountOption = settlementAccountOptions.find(
    (account) => account.id === lineForm.settlementAccountId,
  );
  const assetChartOfAccountOptions = useMemo(
    () =>
      Array.from(
        new Set(
          journalAccountOptions
            .filter((account) => account.accountClass === 'asset' && Boolean(account.chartOfAccount))
            .map((account) => account.chartOfAccount.trim()),
        ),
      ).sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
    [journalAccountOptions],
  );
  const depreciationExpenseAccountOptions = useMemo(
    () =>
      journalAccountOptions
        .filter(
          (account) =>
            account.accountClass === 'expense' &&
            account.chartOfAccount.trim() === '50209 - Depreciation',
        )
        .map((account) => ({
          id: account.id,
          displayLabel: `${account.code} - ${account.accountDetail}`,
        }))
        .sort((left, right) => left.displayLabel.localeCompare(right.displayLabel, undefined, { numeric: true })),
    [journalAccountOptions],
  );
  const accumulatedDepreciationCreditOptions = useMemo(
    () =>
      journalAccountOptions
        .filter(
          (account) =>
            account.accountClass === 'liability' &&
            /accumulated depreciation/i.test(account.chartOfAccount.trim()),
        )
        .map((account) => ({
          id: account.id,
          displayLabel: `${account.code} - ${account.accountDetail}`,
        }))
        .sort((left, right) => left.displayLabel.localeCompare(right.displayLabel, undefined, { numeric: true })),
    [journalAccountOptions],
  );
  const assetRegisterAccountOptions = useMemo(
    () =>
      journalAccountOptions.map((account) => ({
        ...account,
        displayLabel: `${account.code} - ${account.accountDetail}`,
      })),
    [journalAccountOptions],
  );
  const searchableAssetRegisterAccountOptions = useMemo(
    () =>
      assetRegisterAccountOptions.map((account) => ({
        value: account.id,
        label: account.displayLabel,
        description: `${account.accountDetail}${account.chartOfAccount ? ` | ${account.chartOfAccount}` : ''}`,
        keywords: `${account.code} ${account.accountDetail} ${account.name} ${account.chartOfAccount}`,
      })),
    [assetRegisterAccountOptions],
  );
  const searchableDepreciationExpenseAccountOptions = useMemo(
    () =>
      depreciationExpenseAccountOptions.map((account) => ({
        value: account.displayLabel,
        label: account.displayLabel,
        description: 'Depreciation Expense Account',
        keywords: account.displayLabel,
      })),
    [depreciationExpenseAccountOptions],
  );
  const searchableAccumulatedDepreciationCreditOptions = useMemo(
    () =>
      accumulatedDepreciationCreditOptions.map((account) => ({
        value: account.displayLabel,
        label: account.displayLabel,
        description: 'Accumulated Depreciation Liability Account',
        keywords: account.displayLabel,
      })),
    [accumulatedDepreciationCreditOptions],
  );
  const assetRegisterAccountLookup = useMemo(
    () => new Map(assetRegisterAccountOptions.map((account) => [account.id, account])),
    [assetRegisterAccountOptions],
  );
  const selectedAssetForRevaluation = useMemo(
    () => assetRegister.find((asset) => asset.id === assetRevaluationForm.assetReferenceNo) ?? null,
    [assetRegister, assetRevaluationForm.assetReferenceNo],
  );
  const selectedAssetForTransfer = useMemo(
    () => assetRegister.find((asset) => asset.id === assetTransferForm.assetCode) ?? null,
    [assetRegister, assetTransferForm.assetCode],
  );
  const selectedAssetForDisposal = useMemo(
    () => assetRegister.find((asset) => asset.id === assetDisposalForm.assetCode) ?? null,
    [assetRegister, assetDisposalForm.assetCode],
  );
  const selectedAssetForInsurance = useMemo(
    () => assetRegister.find((asset) => asset.id === assetInsuranceForm.assetCode) ?? null,
    [assetRegister, assetInsuranceForm.assetCode],
  );
  const assetInsuranceSummary = useMemo(() => {
    const activePolicies = assetInsuranceRegister.filter(
      (record) => record.policyStatus.toLowerCase() === 'active',
    ).length;
    const pendingRenewal = assetInsuranceRegister.filter((record) => {
      const alert = getAssetInsuranceRenewalAlert(record.policyEndDate);
      return alert.daysUntilExpiry !== null && alert.daysUntilExpiry <= 30;
    }).length;
    const openClaims = assetInsuranceRegister.filter((record) =>
      ['pending', 'submitted', 'under review', 'approved'].includes(record.claimStatus.toLowerCase()),
    ).length;
    const totalSumInsured = assetInsuranceRegister.reduce((sum, record) => sum + record.sumInsured, 0);

    return {
      activePolicies,
      pendingRenewal,
      openClaims,
      totalSumInsured,
    };
  }, [assetInsuranceRegister]);
  const assetInsuranceRenewalAlert = useMemo(
    () => getAssetInsuranceRenewalAlert(assetInsuranceForm.policyEndDate),
    [assetInsuranceForm.policyEndDate],
  );
  const searchableAssetInsurancePolicyOptions = useMemo(
    () =>
      assetInsuranceRegister.map((record) => ({
        value: record.policyNumber,
        label: record.policyNumber,
        description: `${record.insuranceCompanyName} | ${record.assetName} | ${record.insuranceType}`,
        keywords: `${record.policyNumber} ${record.insuranceCompanyName} ${record.assetName} ${record.assetCode} ${record.insuranceType}`,
      })),
    [assetInsuranceRegister],
  );
  const searchableStaffRegistrationOptions = useMemo(
    () =>
      staffRegistrationRegister.map((staff) => ({
        value: staff.staffId,
        label: `${staff.staffId} - ${staff.fullName}`,
        description: `${staff.department} | ${staff.designation}`,
        keywords: `${staff.staffId} ${staff.fullName} ${staff.department} ${staff.designation} ${staff.staffGroup}`,
      })),
    [staffRegistrationRegister],
  );
  const selectedSalaryAdvanceStaff = useMemo(
    () => staffRegistrationRegister.find((staff) => staff.staffId === staffSalaryAdvanceForm.staffId) ?? null,
    [staffRegistrationRegister, staffSalaryAdvanceForm.staffId],
  );
  const assetInsuranceRegisteredReportRows = useMemo(
    () =>
      assetInsuranceRegister.map((record) => ({
        assetCode: record.assetCode,
        assetName: record.assetName,
        purchaseCost: record.purchaseCost,
        assetValue: record.assetValue,
        sumInsured: record.sumInsured,
        claimLimit: record.claimLimit,
        policyNumber: record.policyNumber,
      })),
    [assetInsuranceRegister],
  );
  const assetInsurancePremiumPaidReportRows = useMemo(
    () =>
      assetInsuranceRegister
        .filter((record) => record.premiumAmount > 0 || record.amountPaid > 0 || !!record.paymentDate)
        .map((record) => ({
          policyNumber: record.policyNumber,
          assetName: record.assetName,
          insuranceCompanyName: record.insuranceCompanyName,
          premiumAmount: record.premiumAmount,
          amountPaid: record.amountPaid,
          balance: Math.max(record.premiumAmount - record.amountPaid, 0),
          paymentDate: record.paymentDate,
          paymentMethod: record.paymentMethod,
          receiptNumber: record.receiptNumber,
          paymentDebitAccountDisplay: record.paymentDebitAccountDisplay,
          paymentCreditAccountDisplay: record.paymentCreditAccountDisplay,
          paymentStatus: record.paymentStatus,
          paymentApprovalStatus: record.paymentApprovalStatus,
        })),
    [assetInsuranceRegister],
  );
  const assetInsuranceClaimReportRows = useMemo(
    () =>
      assetInsuranceRegister
        .filter(
          (record) =>
            !!record.claimNumber ||
            record.claimAmount > 0 ||
            record.approvedClaimAmount > 0 ||
            record.amountReceived > 0 ||
            record.claimStatus.toLowerCase() !== 'pending',
        )
        .map((record) => ({
          claimNumber: record.claimNumber,
          policyNumber: record.policyNumber,
          assetName: record.assetName,
          incidentDate: record.incidentDate,
          incidentType: record.incidentType,
          claimAmount: record.claimAmount,
          approvedClaimAmount: record.approvedClaimAmount,
          amountReceived: record.amountReceived,
          claimStatus: record.claimStatus,
          claimApprovalStatus: record.claimApprovalStatus,
          insurerSubmissionStatus: record.insurerSubmissionStatus,
          claimPostingStatus: record.claimPostingStatus,
          claimClosedDate: record.claimClosedDate,
        })),
    [assetInsuranceRegister],
  );
  const assetInsurancePremiumPaidSummary = useMemo(
    () => ({
      totalPremium: assetInsurancePremiumPaidReportRows.reduce((sum, row) => sum + row.premiumAmount, 0),
      totalPaid: assetInsurancePremiumPaidReportRows.reduce((sum, row) => sum + row.amountPaid, 0),
      totalBalance: assetInsurancePremiumPaidReportRows.reduce((sum, row) => sum + row.balance, 0),
    }),
    [assetInsurancePremiumPaidReportRows],
  );
  const assetRegisterEditSource = useMemo(
    () => assetRegister.filter((asset) => asset.id !== selectedAssetRegisterId),
    [assetRegister, selectedAssetRegisterId],
  );
  const assetDepreciationReportRows = useMemo<AssetDepreciationReportRow[]>(
    () =>
      assetRegister
        .flatMap((asset) => {
        const assetDebitAccount = assetRegisterAccountLookup.get(asset.debitAccountId);
        const assetAccountGroup =
          assetDebitAccount?.chartOfAccount?.trim() ||
          getDefaultAccountGroupForAssetCategory(asset.assetAccountingCategory?.trim() || '');
        const assetAccountingCategory = asset.assetAccountingCategory?.trim() || '';
        const matchingSetupsForCategory = assetDepreciationSetups.filter(
          (setup) => (setup.assetCategory?.trim() || '') === assetAccountingCategory,
        );
        const matchingSetup = assetAccountGroup
          ? assetDepreciationSetups.find(
              (setup) =>
                (setup.accountGroup?.trim() || '') === assetAccountGroup &&
                (setup.assetCategory?.trim() || '') === assetAccountingCategory,
            )
          : matchingSetupsForCategory.length === 1
            ? matchingSetupsForCategory[0]
            : undefined;

        if (!matchingSetup) {
          return [];
        }

        const openingValue = Number.isFinite(asset.value) ? asset.value : 0;
        const depreciationCharge = calculateAssetDepreciationCharge({
          method: matchingSetup.depreciationMethod,
          frequency: matchingSetup.depreciationFrequency,
          openingValue,
          residualValue: Number.parseFloat(matchingSetup.residualValue || '0'),
          rate: Number.parseFloat(matchingSetup.depreciationRate || '0'),
          usefulLife: matchingSetup.usefulLife,
          depreciationStartDate: matchingSetup.depreciationStartDate,
        });

        return [
          {
            referenceNo: '',
            assetId: asset.id,
            asset: asset.asset,
            assetSector: asset.category,
            accountGroup: assetAccountGroup || matchingSetup.accountGroup,
            assetCategory: asset.assetAccountingCategory,
            method: matchingSetup.depreciationMethod,
            usefulLife: matchingSetup.usefulLife,
            frequency: matchingSetup.depreciationFrequency,
            depreciationRate: matchingSetup.depreciationRate,
            residualValue: matchingSetup.residualValue,
            depreciationStartDate: matchingSetup.depreciationStartDate,
            openingValue,
            depreciationCharge,
            closingValue: Math.max(openingValue - depreciationCharge, 0),
            pnlDebitAccount: matchingSetup.pnlDebitAccount,
            accumulatedDepreciationCreditAccount: matchingSetup.accumulatedDepreciationCreditAccount,
            status: asset.status,
            setupId: matchingSetup.id,
          },
        ];
      })
        .sort((left, right) => {
          if (left.setupId === right.setupId) {
            return left.assetId.localeCompare(right.assetId, undefined, { numeric: true });
          }

          return left.setupId.localeCompare(right.setupId, undefined, { numeric: true });
        })
        .map((row, index) => ({
          ...row,
          referenceNo: getAccumulatedDepreciationReference(getTodayIsoDate(), index + 1),
        })),
    [assetDepreciationSetups, assetRegister, assetRegisterAccountLookup],
  );
  const assetDisposalPostingPreviewRows = useMemo(() => {
    const purchaseCost = Number.parseFloat(assetDisposalForm.purchaseCost || '0') || 0;
    const accumulatedDepreciation = Number.parseFloat(assetDisposalForm.accumulatedDepreciation || '0') || 0;
    const disposalValue = Number.parseFloat(assetDisposalForm.disposalValue || '0') || 0;
    const disposalExpense = Number.parseFloat(assetDisposalForm.disposalExpense || '0') || 0;
    const netBookValue = Number.parseFloat(assetDisposalForm.netBookValue || '0') || 0;
    const profitOrLoss = Number.parseFloat(assetDisposalForm.profitOrLoss || '0') || 0;

    if (!assetDisposalForm.assetCode || purchaseCost <= 0) {
      return [];
    }

    const rows: Array<{ account: string; debit: number; credit: number }> = [];

    if (disposalValue > 0) {
      rows.push({
        account: assetRegisterAccountLookup.get(assetDisposalForm.debitAccountId)?.displayLabel || 'Account to Debit',
        debit: disposalValue,
        credit: 0,
      });
    }

    if (accumulatedDepreciation > 0) {
      rows.push({
        account:
          assetDepreciationReportRows.find((row) => row.assetId === assetDisposalForm.assetCode)
            ?.accumulatedDepreciationCreditAccount || 'Accumulated Depreciation',
        debit: accumulatedDepreciation,
        credit: 0,
      });
    }

    if (disposalExpense > 0) {
      rows.push({
        account: 'Disposal Expense',
        debit: disposalExpense,
        credit: 0,
      });
    }

    if (profitOrLoss < 0) {
      rows.push({
        account: 'Loss on Asset Disposal',
        debit: Math.abs(profitOrLoss),
        credit: 0,
      });
    }

    rows.push({
      account: assetRegisterAccountLookup.get(assetDisposalForm.creditAccountId)?.displayLabel || 'Account to Credit',
      debit: 0,
      credit: purchaseCost,
    });

    if (profitOrLoss > 0) {
      rows.push({
        account: 'Profit on Asset Disposal',
        debit: 0,
        credit: profitOrLoss,
      });
    }

    if (rows.every((row) => row.debit === 0 && row.credit === 0) && netBookValue > 0) {
      rows.push({
        account: 'Loss on Asset Disposal',
        debit: netBookValue,
        credit: 0,
      });
    }

    return rows;
  }, [
    assetDepreciationReportRows,
    assetDisposalForm.accumulatedDepreciation,
    assetDisposalForm.assetCode,
    assetDisposalForm.creditAccountId,
    assetDisposalForm.debitAccountId,
    assetDisposalForm.disposalExpense,
    assetDisposalForm.disposalValue,
    assetDisposalForm.netBookValue,
    assetDisposalForm.purchaseCost,
    assetDisposalForm.profitOrLoss,
    assetRegisterAccountLookup,
  ]);
  const assetDisposalPostingTotals = useMemo(() => {
    const totalDebit = assetDisposalPostingPreviewRows.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = assetDisposalPostingPreviewRows.reduce((sum, row) => sum + row.credit, 0);
    const difference = totalDebit - totalCredit;

    return {
      totalDebit,
      totalCredit,
      difference,
      isBalanced: Math.abs(difference) < 0.005,
    };
  }, [assetDisposalPostingPreviewRows]);
  const assetDisposalValueAdvice = useMemo(() => {
    const disposalValue = Number.parseFloat(assetDisposalForm.disposalValue || '0') || 0;
    const netBookValue = Number.parseFloat(assetDisposalForm.netBookValue || '0') || 0;
    const disposalExpense = Number.parseFloat(assetDisposalForm.disposalExpense || '0') || 0;
    const recognizedResult = Number.parseFloat(assetDisposalForm.profitOrLoss || '0') || 0;

    if (!assetDisposalForm.assetCode || netBookValue <= 0) {
      return null;
    }

    const grossDifference = disposalValue - netBookValue;
    const adviceType =
      grossDifference > 0 ? 'gain' : grossDifference < 0 ? 'shortage' : 'balanced';

    return {
      grossDifference,
      adviceType,
      disposalExpense,
      recognizedResult,
    };
  }, [
    assetDisposalForm.assetCode,
    assetDisposalForm.disposalExpense,
    assetDisposalForm.disposalValue,
    assetDisposalForm.netBookValue,
    assetDisposalForm.profitOrLoss,
  ]);
  const assetDepreciationReportExportRows = useMemo(
    () =>
      assetDepreciationReportRows.map((asset, index) => ({
        'S/N': index + 1,
        'Ref No': asset.referenceNo,
        'Asset Category': asset.assetCategory,
        'Account Sector': `${asset.assetSector}${asset.accountGroup ? ` (${asset.accountGroup})` : ''}`,
        Method: asset.method,
        'Useful Life': asset.usefulLife,
        Frequency: asset.frequency,
        Rate: `${asset.depreciationRate}%`,
        'Residual Value': Number.parseFloat(asset.residualValue || '0') || 0,
        Amount: asset.depreciationCharge,
        'P&L Debit GL': asset.pnlDebitAccount,
        'Accumulated Depreciation Credit GL': asset.accumulatedDepreciationCreditAccount,
        'Start Date': asset.depreciationStartDate,
      })),
    [assetDepreciationReportRows],
  );
  const depreciationReportViewOptions = useMemo(
    () => [
      { value: 'all', label: 'All Categories' },
      { value: 'category', label: 'Category' },
      { value: 'sector', label: 'Sector' },
    ],
    [],
  );
  const filteredAssetDepreciationReportRows = useMemo(
    () => {
      if (selectedDepreciationReportView === 'all') {
        return assetDepreciationReportRows;
      }

      if (selectedDepreciationReportView === 'category') {
        return [...assetDepreciationReportRows].sort((left, right) => {
          const categoryComparison = left.assetCategory.localeCompare(right.assetCategory, undefined, { numeric: true });
          if (categoryComparison !== 0) {
            return categoryComparison;
          }

          const sectorComparison = left.assetSector.localeCompare(right.assetSector, undefined, { numeric: true });
          if (sectorComparison !== 0) {
            return sectorComparison;
          }

          return left.referenceNo.localeCompare(right.referenceNo, undefined, { numeric: true });
        });
      }

      if (selectedDepreciationReportView === 'sector') {
        return [...assetDepreciationReportRows].sort((left, right) => {
          const sectorComparison = left.assetSector.localeCompare(right.assetSector, undefined, { numeric: true });
          if (sectorComparison !== 0) {
            return sectorComparison;
          }

          const categoryComparison = left.assetCategory.localeCompare(right.assetCategory, undefined, { numeric: true });
          if (categoryComparison !== 0) {
            return categoryComparison;
          }

          return left.referenceNo.localeCompare(right.referenceNo, undefined, { numeric: true });
        });
      }

      return assetDepreciationReportRows;
    },
    [assetDepreciationReportRows, selectedDepreciationReportView],
  );
  const categoryGroupedAssetDepreciationReportRows = useMemo(() => {
    if (selectedDepreciationReportView !== 'category') {
      return filteredAssetDepreciationReportRows.map((asset, index) => ({
        type: 'asset' as const,
        asset,
        serialNumber: index + 1,
      }));
    }

    const rows: Array<
      | { type: 'asset'; asset: (typeof filteredAssetDepreciationReportRows)[number]; serialNumber: number }
      | { type: 'subtotal'; category: string; amount: number }
    > = [];
    let currentCategory = '';
    let currentTotal = 0;
    let serialNumber = 0;

    filteredAssetDepreciationReportRows.forEach((asset) => {
      if (currentCategory && asset.assetCategory !== currentCategory) {
        rows.push({
          type: 'subtotal',
          category: currentCategory,
          amount: currentTotal,
        });
        currentTotal = 0;
      }

      currentCategory = asset.assetCategory;
      serialNumber += 1;
      currentTotal += asset.depreciationCharge;
      rows.push({
        type: 'asset',
        asset,
        serialNumber,
      });
    });

    if (currentCategory) {
      rows.push({
        type: 'subtotal',
        category: currentCategory,
        amount: currentTotal,
      });
    }

    return rows;
  }, [filteredAssetDepreciationReportRows, selectedDepreciationReportView]);
  const filteredAssetDepreciationReportExportRows = useMemo(
    () =>
      categoryGroupedAssetDepreciationReportRows.map((row) =>
        row.type === 'subtotal'
          ? {
              'S/N': '',
              'Ref No': '',
              'Asset Category': `${row.category} Total`,
              'Account Sector': '',
              Method: '',
              'Useful Life': '',
              Frequency: '',
              Rate: '',
              'Residual Value': '',
              Amount: row.amount,
              'P&L Debit GL': '',
              'Accumulated Depreciation Credit GL': '',
              'Start Date': '',
            }
          : {
              'S/N': row.serialNumber,
              'Ref No': row.asset.referenceNo,
              'Asset Category': row.asset.assetCategory,
              'Account Sector': `${row.asset.assetSector}${row.asset.accountGroup ? ` (${row.asset.accountGroup})` : ''}`,
              Method: row.asset.method,
              'Useful Life': row.asset.usefulLife,
              Frequency: row.asset.frequency,
              Rate: `${row.asset.depreciationRate}%`,
              'Residual Value': Number.parseFloat(row.asset.residualValue || '0') || 0,
              Amount: row.asset.depreciationCharge,
              'P&L Debit GL': row.asset.pnlDebitAccount,
              'Accumulated Depreciation Credit GL': row.asset.accumulatedDepreciationCreditAccount,
              'Start Date': row.asset.depreciationStartDate,
            },
      ),
    [categoryGroupedAssetDepreciationReportRows],
  );
  const filteredReportEntries = useMemo(() => {
    const from = reportDateFrom ? new Date(`${reportDateFrom}T00:00:00`) : null;
    const to = reportDateTo ? new Date(`${reportDateTo}T23:59:59`) : null;

    return generalLedgerEntries.filter((entry) => {
      const entryDateValue = entry.postedAt.slice(0, 10);
      const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(entryDateValue)
        ? new Date(`${entryDateValue}T12:00:00`)
        : null;

      if (!entryDate || Number.isNaN(entryDate.getTime())) {
        return false;
      }

      if (from && entryDate < from) {
        return false;
      }

      if (to && entryDate > to) {
        return false;
      }

      return true;
    });
  }, [generalLedgerEntries, reportDateFrom, reportDateTo]);
  const accountLookupById = useMemo(
    () => new Map(generalLedgerAccounts.map((account) => [account.id, account])),
    [generalLedgerAccounts],
  );
  const ledgerReportAccountOptions = useMemo(
    () =>
      journalAccountOptions
        .filter((account) => Boolean(account.accountDetail))
        .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true })),
    [journalAccountOptions],
  );
  const reportSummary = useMemo(() => {
    const getEntryDate = (value: string) => (/^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : getTodayIsoDate());
    const reportStart = reportDateFrom || '0000-01-01';
    const activityRows = filteredReportEntries.flatMap((entry) =>
      entry.lines.map((line) => {
        const account = accountLookupById.get(line.accountId);
        return {
          accountId: line.accountId,
          reference: entry.reference,
          date: entry.postedAt.slice(0, 10),
          label: line.accountDetail || line.accountName || account?.accountDetail || account?.name || line.accountId,
          accountClass: account?.accountClass || 'asset',
          chartOfAccount: account?.chartOfAccount || '',
          description: line.description || entry.narration,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
        };
      }),
    );
    const openingBalanceByAccount = new Map<string, number>();

    generalLedgerEntries.forEach((entry) => {
      if (getEntryDate(entry.postedAt) >= reportStart) {
        return;
      }

      entry.lines.forEach((line) => {
        const account = accountLookupById.get(line.accountId);
        const accountClass = account?.accountClass || 'asset';
        const movement =
          accountClass === 'asset' || accountClass === 'expense'
            ? line.type === 'debit'
              ? line.amount
              : -line.amount
            : line.type === 'credit'
              ? line.amount
              : -line.amount;

        openingBalanceByAccount.set(line.accountId, (openingBalanceByAccount.get(line.accountId) || 0) + movement);
      });
    });

    const incomeRowsMap = new Map<string, AccountingReportRow>();
    const expenseRowsMap = new Map<string, AccountingReportRow>();
    const cashMovementCharts = ['10202 - Teller Cash', '10203 - Petty Cash', '10206 - Bank Balances'];
    const tillLikeCharts = ['10202 - Teller Cash', '10203 - Petty Cash'];
    const cashRows: Array<AccountingReportRow & { reference?: string; description?: string; date?: string }> = [];

    activityRows.forEach((row) => {
      if (row.accountClass === 'income') {
        const existing = incomeRowsMap.get(row.label) || { label: row.label, credit: 0, debit: 0 };
        existing.credit = (existing.credit || 0) + row.credit;
        existing.debit = (existing.debit || 0) + row.debit;
        incomeRowsMap.set(row.label, existing);
      }

      if (row.accountClass === 'expense') {
        const existing = expenseRowsMap.get(row.label) || { label: row.label, debit: 0, credit: 0 };
        existing.debit = (existing.debit || 0) + row.debit;
        existing.credit = (existing.credit || 0) + row.credit;
        expenseRowsMap.set(row.label, existing);
      }

    });

    const classifyCashMovementType = ({
      flow,
      cashLine,
      counterparts,
      entryNarration,
    }: {
      flow: 'Inflow' | 'Outflow';
      cashLine: typeof activityRows[number];
      counterparts: Array<typeof activityRows[number]>;
      entryNarration: string;
    }) => {
      const text = [
        entryNarration,
        cashLine.description,
        cashLine.label,
        cashLine.chartOfAccount,
        ...counterparts.map((row) => `${row.label} ${row.chartOfAccount} ${row.description}`),
      ]
        .join(' ')
        .toLowerCase();

      const counterpartHasChart = (chart: string) => counterpartRows.some((row) => row.chartOfAccount === chart);
      const counterpartRows = counterparts;

      if (flow === 'Inflow') {
        if (/patient|billing|consult|payment received|cashier payment/.test(text)) {
          return 'Patient payment';
        }
        if (/wallet/.test(text)) {
          return 'Wallet funding by cash';
        }
        if (/refund/.test(text)) {
          return 'Refund received';
        }
        if (/capital|owner|share capital|deposit for shares|share premium|retained earnings|reserve/.test(text)) {
          return 'Owner capital introduced';
        }
        if (counterpartRows.some((row) => row.accountClass === 'income') || /sales|sale|income|revenue/.test(text)) {
          return 'Sales income';
        }
        if (tillLikeCharts.includes(cashLine.chartOfAccount) && counterpartHasChart('10206 - Bank Balances')) {
          return 'Cash deposit';
        }
        return 'Cash deposit';
      }

      if (/supplier|vendor|payable|creditor/.test(text)) {
        return 'Supplier payment';
      }
      if (/salary|wage|payroll|staff salaries|staff salary|emolument/.test(text)) {
        return 'Salary payment';
      }
      if (/refund/.test(text) && /patient|client/.test(text)) {
        return 'Refund to patient';
      }
      if (/drug|pharmacy|item|stock|inventory|purchase/.test(text)) {
        return 'Purchase of drugs/items';
      }
      if (tillLikeCharts.includes(cashLine.chartOfAccount) && counterpartHasChart('10206 - Bank Balances')) {
        return 'Bank deposit from till';
      }
      if (cashLine.chartOfAccount === '10206 - Bank Balances' && counterpartRows.some((row) => tillLikeCharts.includes(row.chartOfAccount))) {
        return 'Cash withdrawal';
      }
      if (counterpartRows.some((row) => row.accountClass === 'expense') || /expense|utility|rent|fuel|maintenance|allowance|medical/.test(text)) {
        return 'Expense payment';
      }
      return 'Expense payment';
    };

    filteredReportEntries.forEach((entry) => {
      const entryRows = entry.lines.map((line) => {
        const account = accountLookupById.get(line.accountId);
        return {
          accountId: line.accountId,
          label: line.accountDetail || line.accountName || account?.accountDetail || account?.name || line.accountId,
          accountClass: account?.accountClass || 'asset',
          chartOfAccount: account?.chartOfAccount || '',
          description: line.description || entry.narration,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
        };
      });

      const entryCashRows = entryRows.filter((row) => cashMovementCharts.includes(row.chartOfAccount));
      if (entryCashRows.length === 0) {
        return;
      }

      const nonCashRows = entryRows.filter((row) => !cashMovementCharts.includes(row.chartOfAccount));
      const hasOnlyCashTransfer = nonCashRows.length === 0 && entryCashRows.length >= 2;

      if (hasOnlyCashTransfer) {
        const bankDebit = entryCashRows.find((row) => row.chartOfAccount === '10206 - Bank Balances' && row.debit > 0);
        const bankCredit = entryCashRows.find((row) => row.chartOfAccount === '10206 - Bank Balances' && row.credit > 0);
        const tillDebit = entryCashRows.find((row) => tillLikeCharts.includes(row.chartOfAccount) && row.debit > 0);
        const tillCredit = entryCashRows.find((row) => tillLikeCharts.includes(row.chartOfAccount) && row.credit > 0);

        if (bankDebit && tillCredit) {
          cashRows.push({
            label: tillCredit.label,
            category: 'Outflow',
            code: 'Bank deposit from till',
            debit: 0,
            credit: Math.min(bankDebit.debit, tillCredit.credit),
            amount: Math.min(bankDebit.debit, tillCredit.credit),
            reference: entry.reference,
            description: entry.narration,
            date: getEntryDate(entry.postedAt),
          });
          return;
        }

        if (tillDebit && bankCredit) {
          cashRows.push({
            label: tillDebit.label,
            category: 'Inflow',
            code: 'Cash deposit',
            debit: Math.min(tillDebit.debit, bankCredit.credit),
            credit: 0,
            amount: Math.min(tillDebit.debit, bankCredit.credit),
            reference: entry.reference,
            description: entry.narration,
            date: getEntryDate(entry.postedAt),
          });
          return;
        }
      }

      entryCashRows.forEach((cashLine) => {
        const flow = cashLine.debit > 0 ? 'Inflow' : 'Outflow';
        const amount = cashLine.debit > 0 ? cashLine.debit : cashLine.credit;
        const movementType = classifyCashMovementType({
          flow,
          cashLine,
          counterparts: entryRows.filter((row) => row.accountId !== cashLine.accountId),
          entryNarration: entry.narration,
        });

        cashRows.push({
          label: cashLine.label,
          category: flow,
          code: movementType,
          debit: flow === 'Inflow' ? amount : 0,
          credit: flow === 'Outflow' ? amount : 0,
          amount,
          reference: entry.reference,
          description: cashLine.description,
          date: getEntryDate(entry.postedAt),
        });
      });
    });

    cashRows.sort((left, right) => {
      const flowOrder = left.category === right.category ? 0 : left.category === 'Inflow' ? -1 : 1;
      if (flowOrder !== 0) {
        return flowOrder;
      }

      const dateOrder = (left.date || '').localeCompare(right.date || '');
      if (dateOrder !== 0) {
        return dateOrder;
      }

      return (left.reference || '').localeCompare(right.reference || '');
    });

    const incomeRows = Array.from(incomeRowsMap.values()).map((row) => ({
      ...row,
      amount: (row.credit || 0) - (row.debit || 0),
    }));
    const expenseRows = Array.from(expenseRowsMap.values()).map((row) => ({
      ...row,
      amount: (row.debit || 0) - (row.credit || 0),
    }));

    const totalIncome = incomeRows.reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalExpense = expenseRows.reduce((sum, row) => sum + (row.amount || 0), 0);

    const getBalanceSheetSection = (account: { accountClass: GeneralLedgerClass; chartOfAccount?: string }) => {
      if (account.accountClass === 'asset') {
        return 'Assets';
      }

      if ((account.chartOfAccount || '').startsWith('203') || (account.chartOfAccount || '').startsWith('204')) {
        return 'Equity';
      }

      return 'Liabilities';
    };
    const balanceSheetRowsMap = new Map<string, AccountingReportRow>();

    generalLedgerAccounts
      .filter(
        (account) =>
          ['asset', 'liability'].includes(account.accountClass) &&
          Boolean(account.chartOfAccount) &&
          Math.abs(account.balance || 0) > 0,
      )
      .forEach((account) => {
        const section = getBalanceSheetSection(account);
        const chartLabel = account.chartOfAccount || account.accountDetail || account.name;
        const key = `${section}::${chartLabel}`;
        const existing = balanceSheetRowsMap.get(key) || {
          label: chartLabel,
          category: section,
          amount: 0,
        };

        existing.amount = (existing.amount || 0) + account.balance;
        balanceSheetRowsMap.set(key, existing);
      });

    const balanceSheetRows: AccountingReportRow[] = Array.from(balanceSheetRowsMap.values()).sort((left, right) => {
      const sectionOrder = ['Assets', 'Liabilities', 'Equity'];
      const leftOrder = sectionOrder.indexOf(left.category || '');
      const rightOrder = sectionOrder.indexOf(right.category || '');

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label, undefined, { numeric: true });
    });
    const balanceSheetTotals = balanceSheetRows.reduce<Record<string, number>>((totals, row) => {
      const key = row.category || 'Other';
      totals[key] = (totals[key] || 0) + (row.amount || 0);
      return totals;
    }, {});
    const trialBalanceRows: AccountingReportRow[] = generalLedgerAccounts
      .map((account) => {
        const opening = openingBalanceByAccount.get(account.id) || 0;
        const periodDebit = activityRows
          .filter((row) => row.accountId === account.id && row.debit > 0)
          .reduce((sum, row) => sum + row.debit, 0);
        const periodCredit = activityRows
          .filter((row) => row.accountId === account.id && row.credit > 0)
          .reduce((sum, row) => sum + row.credit, 0);
        const periodMovement =
          account.accountClass === 'asset' || account.accountClass === 'expense'
            ? periodDebit - periodCredit
            : periodCredit - periodDebit;
        const closing = opening + periodMovement;

        return {
          code: getJournalAccountDisplayId(account),
          label: account.accountDetail || account.name,
          category: account.accountClass,
          chartOfAccount: account.chartOfAccount || '',
          opening,
          debit: periodDebit,
          credit: periodCredit,
          amount: closing,
        };
      })
      .filter((row) => (row.opening || 0) !== 0 || (row.debit || 0) !== 0 || (row.credit || 0) !== 0 || (row.amount || 0) !== 0)
      .sort((left, right) => {
        const sectionOrder: Record<string, number> = { asset: 1, liability: 2, income: 3, expense: 4 };
        const sectionDelta = (sectionOrder[left.category || 'expense'] || 99) - (sectionOrder[right.category || 'expense'] || 99);
        if (sectionDelta !== 0) {
          return sectionDelta;
        }

        const chartDelta = (left.chartOfAccount || '').localeCompare(right.chartOfAccount || '', undefined, { numeric: true });
        if (chartDelta !== 0) {
          return chartDelta;
        }

        return (left.code || left.label).localeCompare(right.code || right.label, undefined, { numeric: true });
      });
    const trialBalanceOpeningTotal = trialBalanceRows.reduce((sum, row) => sum + (row.opening || 0), 0);
    const trialBalanceDebitTotal = trialBalanceRows.reduce((sum, row) => sum + (row.debit || 0), 0);
    const trialBalanceCreditTotal = trialBalanceRows.reduce((sum, row) => sum + (row.credit || 0), 0);
    const trialBalanceClosingTotal = trialBalanceRows.reduce((sum, row) => sum + (row.amount || 0), 0);
    const sectionTitleMap: Record<string, string> = {
      asset: 'ASSETS',
      liability: 'LIABILITIES',
      income: 'INCOME',
      expense: 'EXPENSES',
    };
    const trialBalanceReportRows = trialBalanceRows.reduce<
      Array<{
        rowType: 'section' | 'chart' | 'detail' | 'total' | 'grand-total';
        code?: string;
        label: string;
        opening?: number;
        debit?: number;
        credit?: number;
        closing?: number;
      }>
    >((rows, row) => {
      const sectionLabel = sectionTitleMap[row.category || 'expense'];
      if (!rows.some((entry) => entry.rowType === 'section' && entry.label === sectionLabel)) {
        rows.push({ rowType: 'section', label: sectionLabel });
      }

      const chartKey = `${sectionLabel}::${row.chartOfAccount || row.label}`;
      const lastChartIndex = rows.findIndex((entry) => entry.rowType === 'chart' && entry.code === chartKey);
      if (lastChartIndex === -1) {
        rows.push({
          rowType: 'chart',
          code: chartKey,
          label: row.chartOfAccount || row.label,
        });
      }

      rows.push({
        rowType: 'detail',
        code: row.code,
        label: row.label,
        opening: row.opening || 0,
        debit: row.debit || 0,
        credit: row.credit || 0,
        closing: row.amount || 0,
      });

      const nextRow = trialBalanceRows[rows.filter((entry) => entry.rowType === 'detail').length];
      const sameChartContinues = nextRow && nextRow.category === row.category && nextRow.chartOfAccount === row.chartOfAccount;
      if (!sameChartContinues) {
        const chartDetails = trialBalanceRows.filter(
          (entry) => entry.category === row.category && entry.chartOfAccount === row.chartOfAccount,
        );
        rows.push({
          rowType: 'total',
          label: `Total ${row.chartOfAccount || row.label}`,
          opening: chartDetails.reduce((sum, entry) => sum + (entry.opening || 0), 0),
          debit: chartDetails.reduce((sum, entry) => sum + (entry.debit || 0), 0),
          credit: chartDetails.reduce((sum, entry) => sum + (entry.credit || 0), 0),
          closing: chartDetails.reduce((sum, entry) => sum + (entry.amount || 0), 0),
        });
      }

      return rows;
    }, []);
    trialBalanceReportRows.push({
      rowType: 'grand-total',
      label: 'Trial Balance Grand Total',
      opening: trialBalanceOpeningTotal,
      debit: trialBalanceDebitTotal,
      credit: trialBalanceCreditTotal,
      closing: trialBalanceClosingTotal,
    });
    const generalLedgerRows = [...activityRows]
      .sort((left, right) => {
        const leftKey = `${left.label}|${left.date}|${left.reference}|${left.description}`;
        const rightKey = `${right.label}|${right.date}|${right.reference}|${right.description}`;
        return leftKey.localeCompare(rightKey);
      })
      .reduce<Array<AccountingReportRow & { reference?: string; description?: string; date?: string }>>((rows, row) => {
        const previousBalance = rows.length > 0 && rows[rows.length - 1].label === row.label
          ? rows[rows.length - 1].amount || 0
          : 0;
        const movement =
          row.accountClass === 'asset' || row.accountClass === 'expense'
            ? row.debit - row.credit
            : row.credit - row.debit;

        rows.push({
          accountId: row.accountId,
          code: getAccountCodeFromDetail(row.label),
          chartOfAccount: row.chartOfAccount,
          label: row.label,
          category: row.accountClass,
          debit: row.debit,
          credit: row.credit,
          amount: previousBalance + movement,
          reference: row.reference,
          description: row.description,
          date: row.date,
        });

        return rows;
      }, []);

    return {
      incomeRows,
      expenseRows,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      balanceSheetRows,
      balanceSheetTotals,
      trialBalanceRows,
      trialBalanceOpeningTotal,
      trialBalanceDebitTotal,
      trialBalanceCreditTotal,
      trialBalanceClosingTotal,
      trialBalanceReportRows,
      generalLedgerRows,
      cashRows,
    };
  }, [filteredReportEntries, accountLookupById, generalLedgerAccounts, generalLedgerEntries, reportDateFrom]);

  const updateAssetRegisterFormState = <K extends keyof AssetRegisterForm>(
    previousForm: AssetRegisterForm,
    field: K,
    value: AssetRegisterForm[K],
    assetsSource: AssetRegisterRecord[],
    preserveReference = false,
  ): AssetRegisterForm => {
    if (field === 'assetName') {
      const nextAssetName = String(value);
      const nextCategory = inferAssetCategoryFromName(nextAssetName, assetSectorOptions);
      const nextAccountingCategory = inferAssetAccountingCategoryFromSector(nextCategory, assetSectorConfigs);
      return {
        ...previousForm,
        assetName: nextAssetName,
        assetCategory: nextCategory,
        assetAccountingCategory: nextAccountingCategory,
        assetTag: getNextAssetTag(
          assetsSource,
          nextCategory,
          previousForm.purchaseDate,
        ),
      };
    }

    if (field === 'assetCategory') {
      const nextCategory = String(value);
      return {
        ...previousForm,
        assetCategory: nextCategory,
        assetAccountingCategory: inferAssetAccountingCategoryFromSector(nextCategory, assetSectorConfigs),
        assetTag: getNextAssetTag(assetsSource, nextCategory, previousForm.purchaseDate),
      };
    }

    if (field === 'purchaseDate') {
      const nextPurchaseDate = String(value);
      return {
        ...previousForm,
        purchaseDate: nextPurchaseDate,
        assetReferenceNo: preserveReference
          ? previousForm.assetReferenceNo
          : getNextAssetReference(assetsSource, nextPurchaseDate),
        assetTag: getNextAssetTag(assetsSource, previousForm.assetCategory, nextPurchaseDate),
      };
    }

    return {
      ...previousForm,
      [field]: value,
    };
  };

  const handleAssetRegisterFormChange = <K extends keyof AssetRegisterForm>(
    field: K,
    value: AssetRegisterForm[K],
  ) => {
    setAssetRegisterForm((prev) =>
      updateAssetRegisterFormState(prev, field, value, assetRegister),
    );
  };

  const handleAssetRegisterEditFormChange = <K extends keyof AssetRegisterForm>(
    field: K,
    value: AssetRegisterForm[K],
  ) => {
    setAssetRegisterEditForm((prev) =>
      prev
        ? updateAssetRegisterFormState(
            prev,
            field,
            value,
            assetRegisterEditSource,
            true,
          )
        : prev,
    );
  };

  const handleAddAssetSector = () => {
    const sectorName = assetSectorDraft.name.trim();

    if (!sectorName) {
      setAssetSectorError('Enter an asset sector name before adding it.');
      return;
    }

    const alreadyExists = assetSectorConfigs.some(
      (sector) => sector.name.trim().toLowerCase() === sectorName.toLowerCase(),
    );

    if (alreadyExists) {
      setAssetSectorError('That asset sector already exists.');
      return;
    }

    setAssetSectorConfigs((prev) => [
      ...prev,
      {
        name: sectorName,
        accountingCategory: assetSectorDraft.accountingCategory,
      },
    ]);
    setAssetSectorDraft({
      name: '',
      accountingCategory: DEPRECIATION_ASSET_CATEGORY_OPTIONS[0],
    });
    setAssetSectorError(null);
    toast.success('Asset sector added successfully.');
  };

  const handleRemoveAssetSector = (sectorName: string) => {
    if (assetSectorConfigs.length <= 1) {
      setAssetSectorError('At least one asset sector must remain in the system.');
      toast.error('Add another asset sector before removing the last one.');
      return;
    }

    const isInUse = assetRegister.some((asset) => asset.category === sectorName);

    if (isInUse) {
      setAssetSectorError('This asset sector is already used in the asset register and cannot be removed.');
      toast.error('Remove or edit the registered assets using this sector before deleting it.');
      return;
    }

    setAssetSectorConfigs((prev) => prev.filter((sector) => sector.name !== sectorName));
    setAssetSectorError(null);
    setAssetRegisterForm((prev) =>
      prev.assetCategory === sectorName
        ? {
            ...prev,
            assetCategory: '',
            assetAccountingCategory: '',
            assetTag: '',
          }
        : prev,
    );
    setAssetRegisterEditForm((prev) =>
      prev && prev.assetCategory === sectorName
        ? {
            ...prev,
            assetCategory: '',
            assetAccountingCategory: '',
            assetTag: '',
          }
        : prev,
    );
    toast.success('Asset sector removed successfully.');
  };

  const resetAssetRegisterForm = (assets: AssetRegisterRecord[]) => {
    const nextPurchaseDate = getTodayIsoDate();
    setAssetRegisterForm(
      createBlankAssetRegisterForm(
        getNextAssetReference(assets, nextPurchaseDate),
        nextPurchaseDate,
        '',
      ),
    );
    setAssetRegisterError(null);
  };

  const handleAssetRegisterSubmit = () => {
    const purchaseCost = Number.parseFloat(assetRegisterForm.purchaseCost);

    if (
      !assetRegisterForm.assetReferenceNo.trim() ||
      !assetRegisterForm.assetName.trim() ||
      !assetRegisterForm.assetCategory.trim() ||
      !assetRegisterForm.assetAccountingCategory.trim() ||
      !assetRegisterForm.purchaseDate ||
      !assetRegisterForm.location.trim() ||
      !assetRegisterForm.department.trim() ||
      !assetRegisterForm.status.trim() ||
      !assetRegisterForm.usefulLife.trim() ||
      !assetRegisterForm.debitAccountId ||
      !assetRegisterForm.creditAccountId
    ) {
      setAssetRegisterError('Complete the required asset fields before saving the register.');
      return;
    }

    if (!Number.isFinite(purchaseCost) || purchaseCost <= 0) {
      setAssetRegisterError('Purchase cost must be greater than zero.');
      return;
    }

    const debitAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetRegisterForm.debitAccountId,
    );
    const creditAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetRegisterForm.creditAccountId,
    );

    if (!debitAccount || !creditAccount) {
      setAssetRegisterError('Choose valid debit and credit accounts for this asset.');
      return;
    }

    const nextAsset: AssetRegisterRecord = {
      id: assetRegisterForm.assetReferenceNo.trim(),
      asset: assetRegisterForm.assetName.trim(),
      category: assetRegisterForm.assetCategory.trim(),
      assetAccountingCategory: assetRegisterForm.assetAccountingCategory.trim(),
      location: assetRegisterForm.location.trim(),
      status: assetRegisterForm.status.trim(),
      value: purchaseCost,
      serialNumber: assetRegisterForm.serialNumber.trim(),
      modelNumber: assetRegisterForm.modelNumber.trim(),
      assetAcquisition: assetRegisterForm.assetAcquisition.trim(),
      assetTag: assetRegisterForm.assetTag.trim(),
      manufacturer: assetRegisterForm.manufacturer.trim(),
      purchaseDate: assetRegisterForm.purchaseDate,
      supplier: assetRegisterForm.supplier.trim(),
      department: assetRegisterForm.department.trim(),
      custodian: assetRegisterForm.custodian.trim(),
      condition: assetRegisterForm.condition.trim(),
      warrantyExpiryDate: assetRegisterForm.warrantyExpiryDate,
      assetImageName: assetRegisterForm.assetImageName.trim(),
      usefulLife: assetRegisterForm.usefulLife.trim(),
      debitAccountId: debitAccount.id,
      debitAccountDisplay: debitAccount.displayLabel,
      creditAccountId: creditAccount.id,
      creditAccountDisplay: creditAccount.displayLabel,
    };

    const duplicateReference = assetRegister.some(
      (asset) => asset.id.toLowerCase() === nextAsset.id.toLowerCase(),
    );

    if (duplicateReference) {
      setAssetRegisterError('Asset reference number already exists. Use a unique reference.');
      return;
    }

    const nextAssets = [nextAsset, ...assetRegister];
    setAssetRegister(nextAssets);
    resetAssetRegisterForm(nextAssets);
    toast.success(`Asset ${nextAsset.id} registered successfully.`);
  };

  const handleUpdateAssetRegister = () => {
    if (!selectedAssetRegisterId || !assetRegisterEditForm) {
      setAssetRegisterEditError('Select an asset record to edit.');
      return;
    }

    const purchaseCost = Number.parseFloat(assetRegisterEditForm.purchaseCost);

    if (
      !assetRegisterEditForm.assetName.trim() ||
      !assetRegisterEditForm.assetCategory.trim() ||
      !assetRegisterEditForm.assetAccountingCategory.trim() ||
      !assetRegisterEditForm.purchaseDate ||
      !assetRegisterEditForm.location.trim() ||
      !assetRegisterEditForm.department.trim() ||
      !assetRegisterEditForm.status.trim() ||
      !assetRegisterEditForm.usefulLife.trim() ||
      !assetRegisterEditForm.debitAccountId ||
      !assetRegisterEditForm.creditAccountId
    ) {
      setAssetRegisterEditError('Complete the required asset fields before updating.');
      return;
    }

    if (!Number.isFinite(purchaseCost) || purchaseCost <= 0) {
      setAssetRegisterEditError('Purchase cost must be greater than zero.');
      return;
    }

    const debitAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetRegisterEditForm.debitAccountId,
    );
    const creditAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetRegisterEditForm.creditAccountId,
    );

    if (!debitAccount || !creditAccount) {
      setAssetRegisterEditError('Choose valid debit and credit accounts for this asset.');
      return;
    }

    const updatedAsset: AssetRegisterRecord = {
      id: selectedAssetRegisterId,
      asset: assetRegisterEditForm.assetName.trim(),
      category: assetRegisterEditForm.assetCategory.trim(),
      assetAccountingCategory: assetRegisterEditForm.assetAccountingCategory.trim(),
      location: assetRegisterEditForm.location.trim(),
      status: assetRegisterEditForm.status.trim(),
      value: purchaseCost,
      serialNumber: assetRegisterEditForm.serialNumber.trim(),
      modelNumber: assetRegisterEditForm.modelNumber.trim(),
      assetAcquisition: assetRegisterEditForm.assetAcquisition.trim(),
      assetTag: assetRegisterEditForm.assetTag.trim(),
      manufacturer: assetRegisterEditForm.manufacturer.trim(),
      purchaseDate: assetRegisterEditForm.purchaseDate,
      supplier: assetRegisterEditForm.supplier.trim(),
      department: assetRegisterEditForm.department.trim(),
      custodian: assetRegisterEditForm.custodian.trim(),
      condition: assetRegisterEditForm.condition.trim(),
      warrantyExpiryDate: assetRegisterEditForm.warrantyExpiryDate,
      assetImageName: assetRegisterEditForm.assetImageName.trim(),
      usefulLife: assetRegisterEditForm.usefulLife.trim(),
      debitAccountId: debitAccount.id,
      debitAccountDisplay: debitAccount.displayLabel,
      creditAccountId: creditAccount.id,
      creditAccountDisplay: creditAccount.displayLabel,
    };

    setAssetRegister((prev) =>
      prev.map((asset) => (asset.id === selectedAssetRegisterId ? updatedAsset : asset)),
    );
    setAssetRegisterEditError(null);
    toast.success(`Asset ${selectedAssetRegisterId} updated successfully.`);
  };

  const handleAssetDepreciationSetupFormChange = <K extends keyof AssetDepreciationSetupForm>(
    field: K,
    value: AssetDepreciationSetupForm[K],
  ) => {
    setAssetDepreciationSetupForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetAssetDepreciationSetupForm = () => {
    setAssetDepreciationSetupForm(createBlankAssetDepreciationSetupForm());
    setAssetDepreciationSetupError(null);
  };

  const handleSaveAssetDepreciationSetup = () => {
    if (
      !assetDepreciationSetupForm.depreciationMethod.trim() ||
      !assetDepreciationSetupForm.usefulLife.trim() ||
      !assetDepreciationSetupForm.depreciationStartDate ||
      !assetDepreciationSetupForm.depreciationFrequency.trim() ||
      !assetDepreciationSetupForm.depreciationRate.trim() ||
      !assetDepreciationSetupForm.assetCategory.trim() ||
      !assetDepreciationSetupForm.accountGroup.trim() ||
      !assetDepreciationSetupForm.pnlDebitAccount.trim() ||
      !assetDepreciationSetupForm.accumulatedDepreciationCreditAccount.trim()
    ) {
      setAssetDepreciationSetupError('Complete all depreciation setup fields before saving.');
      return;
    }

    const depreciationRate = Number.parseFloat(assetDepreciationSetupForm.depreciationRate);
    const residualValue = Number.parseFloat(assetDepreciationSetupForm.residualValue || '0');

    if (!Number.isFinite(depreciationRate) || depreciationRate <= 0) {
      setAssetDepreciationSetupError('Depreciation rate must be greater than zero.');
      return;
    }

    if (!Number.isFinite(residualValue) || residualValue < 0) {
      setAssetDepreciationSetupError('Residual / Salvage Value cannot be negative.');
      return;
    }

    const nextSetup: AssetDepreciationSetupRecord = {
      id: `DEPSET-${(assetDepreciationSetups.length + 1).toString().padStart(3, '0')}`,
      depreciationMethod: assetDepreciationSetupForm.depreciationMethod.trim(),
      usefulLife: assetDepreciationSetupForm.usefulLife.trim(),
      residualValue: assetDepreciationSetupForm.residualValue.trim() || '0',
      depreciationStartDate: assetDepreciationSetupForm.depreciationStartDate,
      depreciationFrequency: assetDepreciationSetupForm.depreciationFrequency.trim(),
      depreciationRate: assetDepreciationSetupForm.depreciationRate.trim(),
      assetCategory: assetDepreciationSetupForm.assetCategory.trim(),
      accountGroup: assetDepreciationSetupForm.accountGroup.trim(),
      pnlDebitAccount: assetDepreciationSetupForm.pnlDebitAccount.trim(),
      accumulatedDepreciationCreditAccount: assetDepreciationSetupForm.accumulatedDepreciationCreditAccount.trim(),
    };

    setAssetDepreciationSetups((prev) => [nextSetup, ...prev]);
    resetAssetDepreciationSetupForm();
    toast.success('Depreciation setup saved successfully.');
  };
  const handleAssetRevaluationFormChange = <K extends keyof AssetRevaluationForm>(
    field: K,
    value: AssetRevaluationForm[K],
  ) => {
    setAssetRevaluationForm((prev) => {
      if (field === 'assetReferenceNo') {
        const selectedAsset = assetRegister.find((asset) => asset.id === value) ?? null;
        const oldBookValue = selectedAsset ? selectedAsset.value.toString() : '';
        const accountingSection = selectedAsset
          ? assetRegisterAccountLookup.get(selectedAsset.debitAccountId)?.chartOfAccount?.trim() ||
            getDefaultAccountGroupForAssetCategory(selectedAsset.assetAccountingCategory)
          : '';
        const newRevaluedAmount = prev.newRevaluedAmount;
        const difference =
          oldBookValue && newRevaluedAmount
            ? (Number.parseFloat(newRevaluedAmount || '0') - Number.parseFloat(oldBookValue || '0')).toString()
            : '';

        return {
          ...prev,
          assetReferenceNo: String(value),
          oldBookValue,
          accountingSection,
          revaluationDifference: difference,
        };
      }

      if (field === 'newRevaluedAmount') {
        const nextNewAmount = String(value);
        const nextDifference =
          prev.oldBookValue && nextNewAmount
            ? (Number.parseFloat(nextNewAmount || '0') - Number.parseFloat(prev.oldBookValue || '0')).toString()
            : '';

        return {
          ...prev,
          newRevaluedAmount: nextNewAmount,
          revaluationDifference: nextDifference,
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });

    if (assetRevaluationError) {
      setAssetRevaluationError(null);
    }
  };

  const resetAssetRevaluationForm = () => {
    setAssetRevaluationForm(createBlankAssetRevaluationForm());
    setAssetRevaluationError(null);
  };

  const handleSaveAssetRevaluation = () => {
    if (
      !assetRevaluationForm.assetReferenceNo ||
      !assetRevaluationForm.revaluationDate ||
      !assetRevaluationForm.revaluationType.trim() ||
      !assetRevaluationForm.oldBookValue.trim() ||
      !assetRevaluationForm.newRevaluedAmount.trim() ||
      !assetRevaluationForm.reasonForRevaluation.trim() ||
      !assetRevaluationForm.valuationMethod.trim() ||
      !assetRevaluationForm.valuerName.trim() ||
      !assetRevaluationForm.valuationReportNumber.trim() ||
      !assetRevaluationForm.accountingSection.trim() ||
      !assetRevaluationForm.debitAccountId ||
      !assetRevaluationForm.creditAccountId
    ) {
      setAssetRevaluationError('Complete all asset revaluation fields before saving.');
      return;
    }

    const oldBookValue = Number.parseFloat(assetRevaluationForm.oldBookValue);
    const newRevaluedAmount = Number.parseFloat(assetRevaluationForm.newRevaluedAmount);

    if (!Number.isFinite(oldBookValue) || !Number.isFinite(newRevaluedAmount)) {
      setAssetRevaluationError('Old book value and new revalued amount must be valid numbers.');
      return;
    }

    const selectedAsset = assetRegister.find(
      (asset) => asset.id === assetRevaluationForm.assetReferenceNo,
    );
    if (!selectedAsset) {
      setAssetRevaluationError('Select a valid asset reference number.');
      return;
    }

    const debitAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetRevaluationForm.debitAccountId,
    );
    const creditAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetRevaluationForm.creditAccountId,
    );

    if (!debitAccount || !creditAccount) {
      setAssetRevaluationError('Choose valid debit and credit accounts.');
      return;
    }

    const nextRecord: AssetRevaluationRecord = {
      id: `REV-${(assetRevaluationRegister.length + 1).toString().padStart(3, '0')}`,
      assetReferenceNo: selectedAsset.id,
      assetName: selectedAsset.asset,
      assetCategory: selectedAsset.assetAccountingCategory,
      assetSector: selectedAsset.category,
      revaluationDate: assetRevaluationForm.revaluationDate,
      revaluationType: assetRevaluationForm.revaluationType.trim(),
      oldBookValue,
      newRevaluedAmount,
      revaluationDifference: newRevaluedAmount - oldBookValue,
      reasonForRevaluation: assetRevaluationForm.reasonForRevaluation.trim(),
      valuationMethod: assetRevaluationForm.valuationMethod.trim(),
      valuerName: assetRevaluationForm.valuerName.trim(),
      valuationReportNumber: assetRevaluationForm.valuationReportNumber.trim(),
      accountingSection: assetRevaluationForm.accountingSection.trim(),
      debitAccountId: debitAccount.id,
      debitAccountDisplay: debitAccount.displayLabel,
      creditAccountId: creditAccount.id,
      creditAccountDisplay: creditAccount.displayLabel,
    };

    setAssetRevaluationRegister((prev) => [nextRecord, ...prev]);
    resetAssetRevaluationForm();
    toast.success(`Asset revaluation ${nextRecord.id} saved successfully.`);
  };
  const handleAssetTransferFormChange = <K extends keyof AssetTransferForm>(
    field: K,
    value: AssetTransferForm[K],
  ) => {
    setAssetTransferForm((prev) => {
      if (field === 'assetCode') {
        const selectedAsset = assetRegister.find((asset) => asset.id === value) ?? null;

        if (!selectedAsset) {
          return {
            ...prev,
            assetCode: String(value),
            assetName: '',
            assetCategory: '',
            serialNumber: '',
            currentCondition: '',
            fromDepartment: '',
            fromLocation: '',
            fromCustodian: '',
            conditionBefore: '',
          };
        }

        return {
          ...prev,
          assetCode: selectedAsset.id,
          assetName: selectedAsset.asset,
          assetCategory: selectedAsset.assetAccountingCategory || '',
          serialNumber: selectedAsset.serialNumber || '',
          currentCondition: selectedAsset.condition || '',
          fromDepartment: selectedAsset.department || '',
          fromLocation: selectedAsset.location || '',
          fromCustodian: selectedAsset.custodian || '',
          conditionBefore: selectedAsset.condition || '',
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });

    if (assetTransferError) {
      setAssetTransferError(null);
    }
  };

  const resetAssetTransferForm = () => {
    const nextTransferDate = getTodayIsoDate();
    setAssetTransferForm(
      createBlankAssetTransferForm(
        getNextAssetTransferReference(assetTransferRegister, nextTransferDate),
        nextTransferDate,
      ),
    );
    setAssetTransferError(null);
  };

  const handleSaveAssetTransfer = () => {
    if (
      !assetTransferForm.transferNo.trim() ||
      !assetTransferForm.transferDate ||
      !assetTransferForm.transferType.trim() ||
      !assetTransferForm.reasonForTransfer.trim() ||
      !assetTransferForm.status.trim() ||
      !assetTransferForm.assetCode.trim() ||
      !assetTransferForm.assetName.trim() ||
      !assetTransferForm.assetCategory.trim() ||
      !assetTransferForm.fromDepartment.trim() ||
      !assetTransferForm.fromLocation.trim() ||
      !assetTransferForm.toDepartment.trim() ||
      !assetTransferForm.toLocation.trim() ||
      !assetTransferForm.debitAccountId ||
      !assetTransferForm.creditAccountId ||
      !assetTransferForm.requestedBy.trim() ||
      !assetTransferForm.conditionBefore.trim() ||
      !assetTransferForm.conditionAfter.trim()
    ) {
      setAssetTransferError('Complete the required transfer details before saving.');
      return;
    }

    const duplicateTransferNo = assetTransferRegister.some(
      (record) => record.id.toLowerCase() === assetTransferForm.transferNo.trim().toLowerCase(),
    );

    if (duplicateTransferNo) {
      setAssetTransferError('Transfer number already exists. Use the generated transfer number.');
      return;
    }

    const debitAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetTransferForm.debitAccountId,
    );
    const creditAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetTransferForm.creditAccountId,
    );

    if (!debitAccount || !creditAccount) {
      setAssetTransferError('Choose valid debit and credit accounts for this transfer.');
      return;
    }

    const nextTransfer: AssetTransferRecord = {
      id: assetTransferForm.transferNo.trim(),
      transferDate: assetTransferForm.transferDate,
      transferType: assetTransferForm.transferType.trim(),
      reasonForTransfer: assetTransferForm.reasonForTransfer.trim(),
      status: assetTransferForm.status.trim(),
      assetCode: assetTransferForm.assetCode.trim(),
      assetName: assetTransferForm.assetName.trim(),
      assetCategory: assetTransferForm.assetCategory.trim(),
      serialNumber: assetTransferForm.serialNumber.trim(),
      currentCondition: assetTransferForm.currentCondition.trim(),
      fromDepartment: assetTransferForm.fromDepartment.trim(),
      fromLocation: assetTransferForm.fromLocation.trim(),
      fromCustodian: assetTransferForm.fromCustodian.trim(),
      fromBranchHospital: assetTransferForm.fromBranchHospital.trim(),
      toDepartment: assetTransferForm.toDepartment.trim(),
      toLocation: assetTransferForm.toLocation.trim(),
      toCustodian: assetTransferForm.toCustodian.trim(),
      toBranchHospital: assetTransferForm.toBranchHospital.trim(),
      debitAccountId: debitAccount.id,
      debitAccountDisplay: debitAccount.displayLabel,
      creditAccountId: creditAccount.id,
      creditAccountDisplay: creditAccount.displayLabel,
      requestedBy: assetTransferForm.requestedBy.trim(),
      approvedBy: assetTransferForm.approvedBy.trim(),
      releasedBy: assetTransferForm.releasedBy.trim(),
      receivedBy: assetTransferForm.receivedBy.trim(),
      dateReceived: assetTransferForm.dateReceived,
      comment: assetTransferForm.comment.trim(),
      conditionBefore: assetTransferForm.conditionBefore.trim(),
      conditionAfter: assetTransferForm.conditionAfter.trim(),
      damageNote: assetTransferForm.damageNote.trim(),
      attachmentName: assetTransferForm.attachmentName.trim(),
    };

    setAssetTransferRegister((prev) => [nextTransfer, ...prev]);
    resetAssetTransferForm();
    toast.success(`Asset transfer ${nextTransfer.id} saved successfully.`);
  };
  const handleAssetDisposalFormChange = <K extends keyof AssetDisposalForm>(
    field: K,
    value: AssetDisposalForm[K],
  ) => {
    setAssetDisposalForm((prev) => {
      const computeValues = (draft: AssetDisposalForm) => {
        const purchaseCost = Number.parseFloat(draft.purchaseCost || '0') || 0;
        const accumulatedDepreciation = Number.parseFloat(draft.accumulatedDepreciation || '0') || 0;
        const disposalValue = Number.parseFloat(draft.disposalValue || '0') || 0;
        const disposalExpense = Number.parseFloat(draft.disposalExpense || '0') || 0;
        const netBookValue = Math.max(purchaseCost - accumulatedDepreciation, 0);
        const profitOrLoss = disposalValue - disposalExpense - netBookValue;

        return {
          ...draft,
          netBookValue: netBookValue ? netBookValue.toString() : '0',
          profitOrLoss: profitOrLoss ? profitOrLoss.toString() : '0',
        };
      };

      if (field === 'assetCode') {
        const selectedAsset = assetRegister.find((asset) => asset.id === value) ?? null;
        const relatedDepreciationRow = assetDepreciationReportRows.find(
          (row) => row.assetId === value,
        );

        if (!selectedAsset) {
          return computeValues({
            ...prev,
            assetCode: String(value),
            assetName: '',
            assetCategory: '',
            assetLocation: '',
            department: '',
            custodian: '',
            purchaseDate: '',
            purchaseCost: '',
            supplierName: '',
            serialNumber: '',
            modelNumber: '',
            currentCondition: '',
            accumulatedDepreciation: '',
            netBookValue: '',
            lastDepreciationDate: '',
            remainingUsefulLife: '',
          });
        }

        const accumulatedDepreciation = relatedDepreciationRow
          ? Math.max(selectedAsset.value - relatedDepreciationRow.closingValue, 0)
          : 0;

        return computeValues({
          ...prev,
          assetCode: selectedAsset.id,
          assetName: selectedAsset.asset,
          assetCategory: selectedAsset.assetAccountingCategory || '',
          assetLocation: selectedAsset.location || '',
          department: selectedAsset.department || '',
          custodian: selectedAsset.custodian || '',
          purchaseDate: selectedAsset.purchaseDate || '',
          purchaseCost: selectedAsset.value.toString(),
          supplierName: selectedAsset.supplier || '',
          serialNumber: selectedAsset.serialNumber || '',
          modelNumber: selectedAsset.modelNumber || '',
          currentCondition: selectedAsset.condition || '',
          accumulatedDepreciation: accumulatedDepreciation.toString(),
          netBookValue: '',
          lastDepreciationDate: relatedDepreciationRow?.depreciationStartDate || '',
          remainingUsefulLife: selectedAsset.usefulLife || '',
          creditAccountId: selectedAsset.debitAccountId || '',
        });
      }

      return computeValues({
        ...prev,
        [field]: value,
      });
    });

    if (assetDisposalError) {
      setAssetDisposalError(null);
    }
  };

  const resetAssetDisposalForm = () => {
    const nextDisposalDate = getTodayIsoDate();
    setAssetDisposalForm(
      createBlankAssetDisposalForm(
        getNextAssetDisposalReference(assetDisposalRegister, nextDisposalDate),
        nextDisposalDate,
      ),
    );
    setAssetDisposalError(null);
  };
  const handleAssetInsuranceFormChange = <K extends keyof AssetInsuranceForm>(
    field: K,
    value: AssetInsuranceForm[K],
  ) => {
    setAssetInsuranceForm((prev) => {
      const computePaymentWorkflow = (draft: AssetInsuranceForm) => {
        const premiumAmount = Number.parseFloat(draft.premiumAmount || '0') || 0;
        const amountPaid = Number.parseFloat(draft.amountPaid || '0') || 0;

        let paymentStatus = draft.paymentStatus;
        if (amountPaid <= 0) {
          paymentStatus = 'Unpaid';
        } else if (amountPaid >= premiumAmount && premiumAmount > 0) {
          paymentStatus = 'Paid';
        } else if (amountPaid > 0 && amountPaid < premiumAmount) {
          paymentStatus = 'Part Payment';
        }

        return {
          ...draft,
          paymentStatus,
          nextRenewalAlertDate: draft.policyEndDate ? getAssetInsuranceNextAlertDate(draft.policyEndDate) : '',
        };
      };

      if (field === 'assetCode') {
        const selectedAsset = assetRegister.find((asset) => asset.id === value) ?? null;
        const relatedDepreciationRow = assetDepreciationReportRows.find((row) => row.assetId === value);

        if (!selectedAsset) {
          return computePaymentWorkflow({
            ...prev,
            assetCode: String(value),
            assetName: '',
            assetCategory: '',
            department: '',
            location: '',
            assetCustodian: '',
            purchaseCost: '',
            currentNetBookValue: '',
            currentCondition: '',
          });
        }

        const currentNetBookValue = relatedDepreciationRow?.closingValue ?? selectedAsset.value;

        return computePaymentWorkflow({
          ...prev,
          assetCode: selectedAsset.id,
          assetName: selectedAsset.asset,
          assetCategory: selectedAsset.assetAccountingCategory || selectedAsset.category || '',
          department: selectedAsset.department || '',
          location: selectedAsset.location || '',
          assetCustodian: selectedAsset.custodian || '',
          purchaseCost: selectedAsset.value.toString(),
          assetValue: prev.assetValue || selectedAsset.value.toString(),
          currentNetBookValue: currentNetBookValue.toString(),
          currentCondition: selectedAsset.condition || '',
        });
      }

      if (field === 'policyEndDate') {
        return computePaymentWorkflow({
          ...prev,
          [field]: value,
          renewalDate: String(value),
        });
      }

       return computePaymentWorkflow({
        ...prev,
        [field]: value,
      });
    });

    if (assetInsuranceError) {
      setAssetInsuranceError(null);
    }
  };

  const loadAssetInsuranceClaimFromPolicy = (policyNumber: string) => {
    const selectedPolicy = assetInsuranceRegister.find((record) => record.policyNumber === policyNumber) ?? null;

    if (!selectedPolicy) {
      handleAssetInsuranceFormChange('policyNumber', policyNumber);
      return;
    }

    setAssetInsuranceForm((prev) => ({
      ...prev,
      assetCode: selectedPolicy.assetCode,
      assetName: selectedPolicy.assetName,
      assetCategory: selectedPolicy.assetCategory,
      department: selectedPolicy.department,
      location: selectedPolicy.location,
      assetCustodian: selectedPolicy.assetCustodian,
      purchaseCost: selectedPolicy.purchaseCost.toString(),
      currentNetBookValue: selectedPolicy.currentNetBookValue.toString(),
      currentCondition: selectedPolicy.currentCondition,
      insuranceCompanyName: selectedPolicy.insuranceCompanyName,
      insuranceCompanyAddress: selectedPolicy.insuranceCompanyAddress,
      contactPerson: selectedPolicy.contactPerson,
      phoneNumber: selectedPolicy.phoneNumber,
      emailAddress: selectedPolicy.emailAddress,
      brokerName: selectedPolicy.brokerName,
      brokerPhoneNumber: selectedPolicy.brokerPhoneNumber,
      policyNumber: selectedPolicy.policyNumber,
      insuranceType: selectedPolicy.insuranceType,
      policyStartDate: selectedPolicy.policyStartDate,
      policyEndDate: selectedPolicy.policyEndDate,
      renewalDate: selectedPolicy.renewalDate,
      assetValue: selectedPolicy.assetValue ? selectedPolicy.assetValue.toString() : '',
      sumInsured: selectedPolicy.sumInsured.toString(),
      premiumAmount: selectedPolicy.premiumAmount ? selectedPolicy.premiumAmount.toString() : '',
      deductibleExcess: selectedPolicy.deductibleExcess ? selectedPolicy.deductibleExcess.toString() : '',
      claimLimit: selectedPolicy.claimLimit ? selectedPolicy.claimLimit.toString() : '',
      claimNumber: selectedPolicy.claimNumber,
      claimDate: selectedPolicy.claimDate,
      incidentDate: selectedPolicy.incidentDate,
      incidentType: selectedPolicy.incidentType,
      incidentDescription: selectedPolicy.incidentDescription,
      claimAmount: selectedPolicy.claimAmount ? selectedPolicy.claimAmount.toString() : '',
      approvedClaimAmount: selectedPolicy.approvedClaimAmount ? selectedPolicy.approvedClaimAmount.toString() : '',
      insuranceCompanyResponse: selectedPolicy.insuranceCompanyResponse,
      claimStatus: selectedPolicy.claimStatus || 'Pending',
      claimApprovalStatus: selectedPolicy.claimApprovalStatus || 'Draft',
      claimApprovedBy: selectedPolicy.claimApprovedBy || '',
      claimApprovedDate: selectedPolicy.claimApprovedDate || '',
      insurerSubmissionStatus: selectedPolicy.insurerSubmissionStatus || 'Not Submitted',
      insurerSubmissionDate: selectedPolicy.insurerSubmissionDate || '',
      claimPostingStatus: selectedPolicy.claimPostingStatus || 'Pending Posting',
      claimClosedDate: selectedPolicy.claimClosedDate || '',
      claimClosedBy: selectedPolicy.claimClosedBy || '',
      settlementDate: selectedPolicy.settlementDate,
      amountReceived: selectedPolicy.amountReceived ? selectedPolicy.amountReceived.toString() : '',
      evidenceUploadName: selectedPolicy.evidenceUploadName,
      claimFormName: selectedPolicy.claimFormName,
      policeReportName: selectedPolicy.policeReportName,
      fireReportName: selectedPolicy.fireReportName,
      damageReportName: selectedPolicy.damageReportName,
      engineerReportName: selectedPolicy.engineerReportName,
      valuationReportName: selectedPolicy.valuationReportName,
      settlementLetterName: selectedPolicy.settlementLetterName,
    }));
    setAssetInsuranceError(null);
  };

  const handleAssetInsuranceClaimAction = (
    action:
      | 'submit-for-approval'
      | 'approve-internally'
      | 'submit-to-insurer'
      | 'update-insurer-response'
      | 'record-approved-amount'
      | 'record-settlement'
      | 'post-to-accounts'
      | 'close-claim',
  ) => {
    const today = getTodayIsoDate();

    setAssetInsuranceForm((prev) => {
      switch (action) {
        case 'submit-for-approval':
          return {
            ...prev,
            claimApprovalStatus: 'Pending Approval',
            claimStatus: prev.claimStatus === 'Pending' ? 'Submitted' : prev.claimStatus,
          };
        case 'approve-internally':
          return {
            ...prev,
            claimApprovalStatus: 'Approved Internally',
            claimApprovedBy: prev.claimApprovedBy || accountantName,
            claimApprovedDate: prev.claimApprovedDate || today,
          };
        case 'submit-to-insurer':
          return {
            ...prev,
            insurerSubmissionStatus: 'Submitted to Insurance Company',
            insurerSubmissionDate: prev.insurerSubmissionDate || today,
            claimStatus: 'Under Review',
          };
        case 'update-insurer-response':
          return {
            ...prev,
            claimStatus: prev.insuranceCompanyResponse.trim() ? 'Under Review' : prev.claimStatus,
          };
        case 'record-approved-amount':
          return {
            ...prev,
            claimStatus:
              (Number.parseFloat(prev.approvedClaimAmount || '0') || 0) > 0 ? 'Approved' : prev.claimStatus,
          };
        case 'record-settlement':
          return {
            ...prev,
            settlementDate: prev.settlementDate || today,
            claimStatus:
              (Number.parseFloat(prev.amountReceived || '0') || 0) > 0 ? 'Settled' : prev.claimStatus,
          };
        case 'post-to-accounts':
          return {
            ...prev,
            claimPostingStatus: 'Posted to Accounts',
          };
        case 'close-claim':
          return {
            ...prev,
            claimStatus: 'Closed',
            claimClosedDate: prev.claimClosedDate || today,
            claimClosedBy: prev.claimClosedBy || accountantName,
          };
        default:
          return prev;
      }
    });
  };

  const handlePrintCurrentAssetInsuranceClaimReport = () => {
    if (!assetInsuranceForm.policyNumber.trim() || !assetInsuranceForm.assetCode.trim()) {
      toast.error('Select the insured policy and asset before printing the claim report.');
      return;
    }

    const doc = new jsPDF();
    const claimAmount = Number.parseFloat(assetInsuranceForm.claimAmount || '0') || 0;
    const approvedClaimAmount = Number.parseFloat(assetInsuranceForm.approvedClaimAmount || '0') || 0;
    const amountReceived = Number.parseFloat(assetInsuranceForm.amountReceived || '0') || 0;

    doc.setFontSize(16);
    doc.text('AKOBI SPECIALIST HOSPITAL', 14, 18);
    doc.setFontSize(11);
    doc.text('Insurance Claim Report', 14, 26);
    doc.text(`Print Date: ${getTodayIsoDate()}`, 145, 26, { align: 'right' });

    doc.autoTable({
      startY: 34,
      head: [['Field', 'Details']],
      body: [
        ['Claim Number', assetInsuranceForm.claimNumber || '-'],
        ['Policy Number', assetInsuranceForm.policyNumber || '-'],
        ['Asset Reference No', assetInsuranceForm.assetCode || '-'],
        ['Asset Name', assetInsuranceForm.assetName || '-'],
        ['Asset Category', assetInsuranceForm.assetCategory || '-'],
        ['Incident Date', assetInsuranceForm.incidentDate || '-'],
        ['Claim Date', assetInsuranceForm.claimDate || '-'],
        ['Incident Type', assetInsuranceForm.incidentType || '-'],
        ['Incident Details', assetInsuranceForm.incidentDescription || '-'],
        ['Claim Amount', formatCurrency(claimAmount)],
        ['Approved Claim Amount', formatCurrency(approvedClaimAmount)],
        ['Amount Received', formatCurrency(amountReceived)],
        ['Claim Status', assetInsuranceForm.claimStatus || '-'],
        ['Internal Approval', `${assetInsuranceForm.claimApprovalStatus || '-'} | ${assetInsuranceForm.claimApprovedBy || '-'}`],
        ['Insurer Submission', `${assetInsuranceForm.insurerSubmissionStatus || '-'} | ${assetInsuranceForm.insurerSubmissionDate || '-'}`],
        ['Insurer Response', assetInsuranceForm.insuranceCompanyResponse || '-'],
        ['Settlement Date', assetInsuranceForm.settlementDate || '-'],
        ['Posting Status', assetInsuranceForm.claimPostingStatus || '-'],
        ['Closed By', assetInsuranceForm.claimClosedBy || '-'],
        ['Closed Date', assetInsuranceForm.claimClosedDate || '-'],
        ['Evidence Upload', assetInsuranceForm.evidenceUploadName || '-'],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 56, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
    });

    doc.save(
      `Insurance_Claim_Report_${(assetInsuranceForm.claimNumber || assetInsuranceForm.policyNumber || getTodayIsoDate()).replace(/[^a-z0-9_-]+/gi, '_')}.pdf`,
    );
    toast.success('Insurance claim report generated.');
  };

  const resetAssetInsuranceForm = () => {
    setAssetInsuranceForm(createBlankAssetInsuranceForm());
    setAssetInsuranceError(null);
  };

  const handleSaveAssetInsurance = () => {
    if (
      !assetInsuranceForm.assetCode.trim() ||
      !assetInsuranceForm.assetName.trim() ||
      !assetInsuranceForm.insuranceCompanyName.trim() ||
      !assetInsuranceForm.policyNumber.trim() ||
      !assetInsuranceForm.insuranceType.trim() ||
      !assetInsuranceForm.policyStartDate ||
      !assetInsuranceForm.policyEndDate ||
      !assetInsuranceForm.policyStatus.trim()
    ) {
      setAssetInsuranceError('Complete the required asset insurance, policy, and status fields before saving.');
      return;
    }

    const purchaseCost = Number.parseFloat(assetInsuranceForm.purchaseCost || '0') || 0;
    const currentNetBookValue = Number.parseFloat(assetInsuranceForm.currentNetBookValue || '0') || 0;
    const assetValue = Number.parseFloat(assetInsuranceForm.assetValue || '0') || 0;
    const sumInsured = Number.parseFloat(assetInsuranceForm.sumInsured || '0') || 0;
    const premiumAmount = Number.parseFloat(assetInsuranceForm.premiumAmount || '0') || 0;
    const deductibleExcess = Number.parseFloat(assetInsuranceForm.deductibleExcess || '0') || 0;
    const claimLimit = Number.parseFloat(assetInsuranceForm.claimLimit || '0') || 0;
    const amountPaid = Number.parseFloat(assetInsuranceForm.amountPaid || '0') || 0;
    const claimAmount = Number.parseFloat(assetInsuranceForm.claimAmount || '0') || 0;
    const approvedClaimAmount = Number.parseFloat(assetInsuranceForm.approvedClaimAmount || '0') || 0;
    const amountReceived = Number.parseFloat(assetInsuranceForm.amountReceived || '0') || 0;

    const selectedBankCashAccount = assetInsuranceForm.bankCashAccountId
      ? assetRegisterAccountOptions.find((account) => account.id === assetInsuranceForm.bankCashAccountId)
      : null;
    const selectedPaymentDebitAccount = assetInsuranceForm.paymentDebitAccountId
      ? assetRegisterAccountOptions.find((account) => account.id === assetInsuranceForm.paymentDebitAccountId)
      : null;
    const selectedPaymentCreditAccount = assetInsuranceForm.paymentCreditAccountId
      ? assetRegisterAccountOptions.find((account) => account.id === assetInsuranceForm.paymentCreditAccountId)
      : null;
    const renewalAlert = getAssetInsuranceRenewalAlert(assetInsuranceForm.policyEndDate);
    const duplicatePolicyNumber = assetInsuranceRegister.some(
      (record) =>
        record.policyNumber.toLowerCase() === assetInsuranceForm.policyNumber.trim().toLowerCase() &&
        record.assetCode !== assetInsuranceForm.assetCode.trim(),
    );

    if (duplicatePolicyNumber) {
      setAssetInsuranceError('Policy number already exists on another insured asset record.');
      return;
    }

    const nextInsuranceRecord: AssetInsuranceRecord = {
      id: `${assetInsuranceForm.assetCode.trim()}-${assetInsuranceForm.policyNumber.trim()}`,
      assetCode: assetInsuranceForm.assetCode.trim(),
      assetName: assetInsuranceForm.assetName.trim(),
      assetCategory: assetInsuranceForm.assetCategory.trim(),
      department: assetInsuranceForm.department.trim(),
      location: assetInsuranceForm.location.trim(),
      assetCustodian: assetInsuranceForm.assetCustodian.trim(),
      purchaseCost,
      currentNetBookValue,
      currentCondition: assetInsuranceForm.currentCondition.trim(),
      insuranceCompanyName: assetInsuranceForm.insuranceCompanyName.trim(),
      insuranceCompanyAddress: assetInsuranceForm.insuranceCompanyAddress.trim(),
      contactPerson: assetInsuranceForm.contactPerson.trim(),
      phoneNumber: assetInsuranceForm.phoneNumber.trim(),
      emailAddress: assetInsuranceForm.emailAddress.trim(),
      brokerName: assetInsuranceForm.brokerName.trim(),
      brokerPhoneNumber: assetInsuranceForm.brokerPhoneNumber.trim(),
      policyNumber: assetInsuranceForm.policyNumber.trim(),
      insuranceType: assetInsuranceForm.insuranceType.trim(),
      policyStartDate: assetInsuranceForm.policyStartDate,
      policyEndDate: assetInsuranceForm.policyEndDate,
      renewalDate: assetInsuranceForm.renewalDate || assetInsuranceForm.policyEndDate,
      assetValue,
      sumInsured,
      premiumAmount,
      deductibleExcess,
      claimLimit,
      paymentFrequency: assetInsuranceForm.paymentFrequency.trim(),
      coverageDetails: assetInsuranceForm.coverageDetails.trim(),
      exclusions: assetInsuranceForm.exclusions.trim(),
      policyStatus: assetInsuranceForm.policyStatus.trim(),
      paymentDate: assetInsuranceForm.paymentDate,
      paymentMethod: assetInsuranceForm.paymentMethod.trim(),
      bankCashAccountId: assetInsuranceForm.bankCashAccountId.trim(),
      bankCashAccountDisplay: selectedBankCashAccount?.displayLabel || '',
      accountAffectedType: assetInsuranceForm.accountAffectedType.trim(),
      paymentDebitAccountId: assetInsuranceForm.paymentDebitAccountId.trim(),
      paymentDebitAccountDisplay: selectedPaymentDebitAccount?.displayLabel || '',
      paymentCreditAccountId: assetInsuranceForm.paymentCreditAccountId.trim(),
      paymentCreditAccountDisplay: selectedPaymentCreditAccount?.displayLabel || '',
      paymentReference: assetInsuranceForm.paymentReference.trim(),
      receiptNumber: assetInsuranceForm.receiptNumber.trim(),
      amountPaid,
      paidBy: assetInsuranceForm.paidBy.trim() || accountantName,
      receivedByInsuranceAgent: assetInsuranceForm.receivedByInsuranceAgent.trim(),
      paymentNarration: assetInsuranceForm.paymentNarration.trim(),
      paymentStatus: assetInsuranceForm.paymentStatus.trim(),
      paymentApprovalStatus: assetInsuranceForm.paymentApprovalStatus.trim(),
      paymentApprovedBy: assetInsuranceForm.paymentApprovedBy.trim(),
      paymentApprovedDate: assetInsuranceForm.paymentApprovedDate,
      generalLedgerPostingStatus: assetInsuranceForm.generalLedgerPostingStatus.trim(),
      accountingTreatment: assetInsuranceForm.accountingTreatment.trim(),
      nextRenewalAlertDate: assetInsuranceForm.nextRenewalAlertDate || getAssetInsuranceNextAlertDate(assetInsuranceForm.policyEndDate),
      claimNumber: assetInsuranceForm.claimNumber.trim(),
      claimDate: assetInsuranceForm.claimDate,
      incidentDate: assetInsuranceForm.incidentDate,
      incidentType: assetInsuranceForm.incidentType.trim(),
      incidentDescription: assetInsuranceForm.incidentDescription.trim(),
      claimAmount,
      approvedClaimAmount,
      insuranceCompanyResponse: assetInsuranceForm.insuranceCompanyResponse.trim(),
      claimStatus: assetInsuranceForm.claimStatus.trim(),
      claimApprovalStatus: assetInsuranceForm.claimApprovalStatus.trim(),
      claimApprovedBy: assetInsuranceForm.claimApprovedBy.trim(),
      claimApprovedDate: assetInsuranceForm.claimApprovedDate,
      insurerSubmissionStatus: assetInsuranceForm.insurerSubmissionStatus.trim(),
      insurerSubmissionDate: assetInsuranceForm.insurerSubmissionDate,
      claimPostingStatus: assetInsuranceForm.claimPostingStatus.trim(),
      claimClosedDate: assetInsuranceForm.claimClosedDate,
      claimClosedBy: assetInsuranceForm.claimClosedBy.trim(),
      settlementDate: assetInsuranceForm.settlementDate,
      amountReceived,
      evidenceUploadName: assetInsuranceForm.evidenceUploadName.trim(),
      insurancePolicyDocumentName: assetInsuranceForm.insurancePolicyDocumentName.trim(),
      premiumReceiptName: assetInsuranceForm.premiumReceiptName.trim(),
      assetPhotoName: assetInsuranceForm.assetPhotoName.trim(),
      claimFormName: assetInsuranceForm.claimFormName.trim(),
      policeReportName: assetInsuranceForm.policeReportName.trim(),
      fireReportName: assetInsuranceForm.fireReportName.trim(),
      damageReportName: assetInsuranceForm.damageReportName.trim(),
      engineerReportName: assetInsuranceForm.engineerReportName.trim(),
      valuationReportName: assetInsuranceForm.valuationReportName.trim(),
      settlementLetterName: assetInsuranceForm.settlementLetterName.trim(),
      renewalAlertMessage: renewalAlert.message,
      renewalAlertDays: renewalAlert.daysUntilExpiry,
    };

    setAssetInsuranceRegister((prev) => [
      nextInsuranceRecord,
      ...prev.filter((record) => record.id !== nextInsuranceRecord.id),
    ]);
    resetAssetInsuranceForm();
    toast.success(`Insurance policy ${nextInsuranceRecord.policyNumber} saved successfully.`);
  };

  const handleSaveAssetDisposal = () => {
    if (
      !assetDisposalForm.disposalNo.trim() ||
      !assetDisposalForm.assetCode.trim() ||
      !assetDisposalForm.assetName.trim() ||
      !assetDisposalForm.assetCategory.trim() ||
      !assetDisposalForm.disposalType.trim() ||
      !assetDisposalForm.disposalDate ||
      !assetDisposalForm.currentCondition.trim() ||
      !assetDisposalForm.debitAccountId ||
      !assetDisposalForm.creditAccountId ||
      !assetDisposalForm.reasonForDisposal.trim() ||
      !assetDisposalForm.requestedBy.trim() ||
      !assetDisposalForm.approvalStatus.trim()
    ) {
      setAssetDisposalError('Complete the required disposal fields before saving.');
      return;
    }

    const purchaseCost = Number.parseFloat(assetDisposalForm.purchaseCost || '0');
    const accumulatedDepreciation = Number.parseFloat(assetDisposalForm.accumulatedDepreciation || '0');
    const netBookValue = Number.parseFloat(assetDisposalForm.netBookValue || '0');
    const disposalValue = Number.parseFloat(assetDisposalForm.disposalValue || '0');
    const disposalExpense = Number.parseFloat(assetDisposalForm.disposalExpense || '0');
    const profitOrLoss = Number.parseFloat(assetDisposalForm.profitOrLoss || '0');

    if (
      !Number.isFinite(purchaseCost) ||
      !Number.isFinite(accumulatedDepreciation) ||
      !Number.isFinite(netBookValue) ||
      !Number.isFinite(disposalValue) ||
      !Number.isFinite(disposalExpense) ||
      !Number.isFinite(profitOrLoss)
    ) {
      setAssetDisposalError('Financial disposal values must be valid numbers.');
      return;
    }

    if (!assetDisposalPostingTotals.isBalanced) {
      setAssetDisposalError('Accounting posting must balance. Make sure total debit equals total credit before saving.');
      return;
    }

    const assetRecord = assetRegister.find((asset) => asset.id === assetDisposalForm.assetCode);
    if (!assetRecord) {
      setAssetDisposalError('Select a valid asset code for disposal.');
      return;
    }

    const disposalRow = assetDepreciationReportRows.find((row) => row.assetId === assetDisposalForm.assetCode);
    const debitAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetDisposalForm.debitAccountId,
    );
    const creditAccount = assetRegisterAccountOptions.find(
      (account) => account.id === assetDisposalForm.creditAccountId,
    );
    const bankOrCashAccount = assetDisposalForm.bankOrCashAccountId
      ? assetRegisterAccountOptions.find((account) => account.id === assetDisposalForm.bankOrCashAccountId)
      : null;

    if (!debitAccount || !creditAccount) {
      setAssetDisposalError('Choose valid account to debit and account to credit for this disposal.');
      return;
    }

    const duplicateDisposalNo = assetDisposalRegister.some(
      (record) => record.id.toLowerCase() === assetDisposalForm.disposalNo.trim().toLowerCase(),
    );

    if (duplicateDisposalNo) {
      setAssetDisposalError('Disposal number already exists. Use the generated disposal number.');
      return;
    }

    const nextDisposal: AssetDisposalRecord = {
      id: assetDisposalForm.disposalNo.trim(),
      assetCode: assetDisposalForm.assetCode.trim(),
      assetName: assetDisposalForm.assetName.trim(),
      assetCategory: assetDisposalForm.assetCategory.trim(),
      assetLocation: assetDisposalForm.assetLocation.trim(),
      department: assetDisposalForm.department.trim(),
      custodian: assetDisposalForm.custodian.trim(),
      purchaseDate: assetDisposalForm.purchaseDate,
      purchaseCost,
      supplierName: assetDisposalForm.supplierName.trim(),
      serialNumber: assetDisposalForm.serialNumber.trim(),
      modelNumber: assetDisposalForm.modelNumber.trim(),
      currentCondition: assetDisposalForm.currentCondition.trim(),
      accumulatedDepreciation,
      netBookValue,
      lastDepreciationDate: assetDisposalForm.lastDepreciationDate,
      remainingUsefulLife: assetDisposalForm.remainingUsefulLife.trim(),
      disposalType: assetDisposalForm.disposalType.trim(),
      disposalDate: assetDisposalForm.disposalDate,
      disposalValue,
      buyerName: assetDisposalForm.buyerName.trim(),
      paymentMethod: assetDisposalForm.paymentMethod.trim(),
      debitAccountId: debitAccount.id,
      debitAccountDisplay: debitAccount.displayLabel,
      creditAccountId: creditAccount.id,
      creditAccountDisplay: creditAccount.displayLabel,
      bankOrCashAccountId: bankOrCashAccount?.id || '',
      bankOrCashAccountDisplay: bankOrCashAccount?.displayLabel || '',
      disposalExpense,
      profitOrLoss,
      requestedBy: assetDisposalForm.requestedBy.trim(),
      checkedBy: assetDisposalForm.checkedBy.trim(),
      approvedBy: assetDisposalForm.approvedBy.trim(),
      approvalDate: assetDisposalForm.approvalDate,
      approvalStatus: assetDisposalForm.approvalStatus.trim(),
      reasonForDisposal: assetDisposalForm.reasonForDisposal.trim(),
      managementComment: assetDisposalForm.managementComment.trim(),
      assetPictureName: assetDisposalForm.assetPictureName.trim(),
      disposalApprovalMemoName: assetDisposalForm.disposalApprovalMemoName.trim(),
      buyerReceiptName: assetDisposalForm.buyerReceiptName.trim(),
      policeReportName: assetDisposalForm.policeReportName.trim(),
      damageReportName: assetDisposalForm.damageReportName.trim(),
      valuationReportName: assetDisposalForm.valuationReportName.trim(),
      boardApprovalDocumentName: assetDisposalForm.boardApprovalDocumentName.trim(),
      supplierReturnDocumentName: assetDisposalForm.supplierReturnDocumentName.trim(),
      assetAccountDisplay: assetRecord.debitAccountDisplay || assetRecord.assetAccountingCategory,
      accumulatedDepreciationAccountDisplay: disposalRow?.accumulatedDepreciationCreditAccount || '',
      disposalExpenseAccountDisplay: disposalExpense > 0 ? 'Disposal Expense' : '',
    };

    setAssetDisposalRegister((prev) => [nextDisposal, ...prev]);
    resetAssetDisposalForm();
    toast.success(`Asset disposal ${nextDisposal.id} saved successfully.`);
  };
  const handleExportAssetDepreciationReportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(filteredAssetDepreciationReportExportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depreciation Report');
    const suffix =
      selectedDepreciationReportView === 'all'
        ? 'All_Categories'
        : selectedDepreciationReportView.replace(/[^A-Za-z0-9]+/g, '_');
    XLSX.writeFile(workbook, `Depreciation_Report_${suffix}_${getTodayIsoDate()}.xlsx`);
    toast.success('Depreciation report exported to Excel.');
  };

  const handleExportAssetDepreciationReportPdf = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('AKOBI SPECIALIST HOSPITAL', 14, 18);
    doc.setFontSize(11);
    doc.text('Depreciation Report', 14, 26);
    doc.text(
      `View: ${
        selectedDepreciationReportView === 'all'
          ? 'All Categories'
          : depreciationReportViewOptions.find((option) => option.value === selectedDepreciationReportView)?.label ||
            selectedDepreciationReportView
      }`,
      14,
      32,
    );
    doc.text(`Print Date: ${getTodayIsoDate()}`, 14, 38);

    doc.autoTable({
      startY: 44,
      head: [[
        'S/N',
        'Ref No',
        'Asset Category',
        'Account Sector',
        'Method',
        'Useful Life',
        'Frequency',
        'Rate',
        'Residual Value',
        'Amount',
        'P&L Debit GL',
        'Accumulated Depreciation Credit GL',
        'Start Date',
      ]],
      body: categoryGroupedAssetDepreciationReportRows.map((row) =>
        row.type === 'subtotal'
          ? [
              '',
              '',
              `${row.category} Total`,
              '',
              '',
              '',
              '',
              '',
              '',
              formatCurrency(row.amount),
              '',
              '',
              '',
            ]
          : [
              `${row.serialNumber}`,
              row.asset.referenceNo,
              row.asset.assetCategory,
              `${row.asset.assetSector}${row.asset.accountGroup ? ` (${row.asset.accountGroup})` : ''}`,
              row.asset.method,
              row.asset.usefulLife,
              row.asset.frequency,
              `${row.asset.depreciationRate}%`,
              formatCurrency(Number.parseFloat(row.asset.residualValue || '0') || 0),
              formatCurrency(row.asset.depreciationCharge),
              row.asset.pnlDebitAccount,
              row.asset.accumulatedDepreciationCreditAccount,
              row.asset.depreciationStartDate,
            ],
      ),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: 10, right: 10 },
    });

    const suffix =
      selectedDepreciationReportView === 'all'
        ? 'All_Categories'
        : selectedDepreciationReportView.replace(/[^A-Za-z0-9]+/g, '_');
    doc.save(`Depreciation_Report_${suffix}_${getTodayIsoDate()}.pdf`);
    toast.success('Depreciation report exported to PDF.');
  };
  const assetDisposalReportRows = useMemo(
    () =>
      [...assetDisposalRegister].sort((a, b) => {
        const dateCompare = (b.disposalDate || '').localeCompare(a.disposalDate || '');
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return b.id.localeCompare(a.id);
      }),
    [assetDisposalRegister],
  );
  const assetDisposalReportSummary = useMemo(() => {
    const totalDisposals = assetDisposalReportRows.length;
    const totalDisposalValue = assetDisposalReportRows.reduce((sum, record) => sum + record.disposalValue, 0);
    const totalNetBookValue = assetDisposalReportRows.reduce((sum, record) => sum + record.netBookValue, 0);
    const totalProfitOrLoss = assetDisposalReportRows.reduce((sum, record) => sum + record.profitOrLoss, 0);
    const approvedCount = assetDisposalReportRows.filter(
      (record) => record.approvalStatus.toLowerCase() === 'approved',
    ).length;

    return {
      totalDisposals,
      totalDisposalValue,
      totalNetBookValue,
      totalProfitOrLoss,
      approvedCount,
    };
  }, [assetDisposalReportRows]);
  const assetDisposalReportExportRows = useMemo(
    () =>
      assetDisposalReportRows.map((record, index) => ({
        'S/N': index + 1,
        'Disposal No': record.id,
        'Disposal Date': record.disposalDate,
        'Asset Code': record.assetCode,
        'Asset Name': record.assetName,
        'Asset Category': record.assetCategory,
        Department: record.department,
        Location: record.assetLocation,
        Custodian: record.custodian,
        'Disposal Type': record.disposalType,
        'Purchase Cost': record.purchaseCost,
        'Accumulated Depreciation': record.accumulatedDepreciation,
        'Net Book Value': record.netBookValue,
        'Amount Sold': record.disposalValue,
        'Disposal Expense': record.disposalExpense,
        'Profit / Loss': record.profitOrLoss,
        'Account to Debit': record.debitAccountDisplay,
        'Account to Credit': record.creditAccountDisplay,
        'Asset Account': record.assetAccountDisplay,
        'Accumulated Depreciation Account': record.accumulatedDepreciationAccountDisplay,
        'Approval Status': record.approvalStatus,
        'Requested By': record.requestedBy,
        'Checked By': record.checkedBy,
        'Approved By': record.approvedBy,
        'Reason for Disposal': record.reasonForDisposal,
      })),
    [assetDisposalReportRows],
  );
  const handleExportAssetDisposalReportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(assetDisposalReportExportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asset Disposal Report');
    XLSX.writeFile(workbook, `Asset_Disposal_Report_${getTodayIsoDate()}.xlsx`);
    toast.success('Asset disposal report exported to Excel.');
  };
  const handleExportAssetDisposalReportPdf = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('AKOBI SPECIALIST HOSPITAL', 14, 18);
    doc.setFontSize(11);
    doc.text('Asset Disposal Report', 14, 26);
    doc.text(`Print Date: ${getTodayIsoDate()}`, 14, 32);
    doc.text(
      `Disposals: ${assetDisposalReportSummary.totalDisposals}   Approved: ${assetDisposalReportSummary.approvedCount}   Net Book Value: ${formatCurrency(assetDisposalReportSummary.totalNetBookValue)}   Disposal Value: ${formatCurrency(assetDisposalReportSummary.totalDisposalValue)}`,
      14,
      38,
    );

    doc.autoTable({
      startY: 44,
      head: [[
        'S/N',
        'Disposal No',
        'Date',
        'Asset',
        'Category',
        'Type',
        'NBV',
        'Amount Sold',
        'Profit / Loss',
        'Debit GL',
        'Credit GL',
        'Approval',
      ]],
      body: assetDisposalReportRows.map((record, index) => [
        `${index + 1}`,
        record.id,
        record.disposalDate,
        `${record.assetName} (${record.assetCode})`,
        record.assetCategory,
        record.disposalType,
        formatCurrency(record.netBookValue),
        formatCurrency(record.disposalValue),
        formatCurrency(record.profitOrLoss),
        record.debitAccountDisplay || '-',
        record.creditAccountDisplay || '-',
        record.approvalStatus,
      ]),
      foot: [[
        '',
        '',
        '',
        'TOTAL',
        '',
        '',
        formatCurrency(assetDisposalReportSummary.totalNetBookValue),
        formatCurrency(assetDisposalReportSummary.totalDisposalValue),
        formatCurrency(assetDisposalReportSummary.totalProfitOrLoss),
        '',
        '',
        '',
      ]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      margin: { left: 10, right: 10 },
    });

    doc.save(`Asset_Disposal_Report_${getTodayIsoDate()}.pdf`);
    toast.success('Asset disposal report exported to PDF.');
  };
  const exportAssetInsurancePaymentReceiptPdf = (payload: AssetInsuranceReceiptPayload) => {
    if (payload.amountPaid <= 0) {
      toast.error('Enter or save an amount paid before generating the payment receipt.');
      return;
    }

    const doc = new jsPDF();
    const safeReceiptNumber =
      payload.receiptNumber.trim().replace(/[^a-z0-9_-]+/gi, '_') ||
      payload.policyNumber.trim().replace(/[^a-z0-9_-]+/gi, '_') ||
      getTodayIsoDate();

    doc.setFontSize(16);
    doc.text('AKOBI SPECIALIST HOSPITAL', 14, 18);
    doc.setFontSize(11);
    doc.text('Insurance Premium Payment Receipt', 14, 26);
    doc.text(`Receipt No: ${payload.receiptNumber || 'Pending Assignment'}`, 14, 32);
    doc.text(`Generated On: ${getTodayIsoDate()}`, 145, 32, { align: 'right' });

    doc.autoTable({
      startY: 38,
      head: [['Field', 'Details']],
      body: [
        ['Payment Date', payload.paymentDate || '-'],
        ['Policy Number', payload.policyNumber || '-'],
        ['Insurance Company', payload.insuranceCompanyName || '-'],
        ['Insurance Type', payload.insuranceType || '-'],
        ['Asset Reference No', payload.assetCode || '-'],
        ['Asset Name', payload.assetName || '-'],
        ['Asset Category', payload.assetCategory || '-'],
        ['Department / Location', `${payload.department || '-'} / ${payload.location || '-'}`],
        ['Premium Amount', formatCurrency(payload.premiumAmount)],
        ['Amount Paid', formatCurrency(payload.amountPaid)],
        ['Balance', formatCurrency(payload.balance)],
        ['Payment Method', payload.paymentMethod || '-'],
        ['Payment Reference', payload.paymentReference || '-'],
        ['Account to Debit', payload.debitAccountDisplay || '-'],
        ['Account to Credit', payload.creditAccountDisplay || '-'],
        ['Paid By', payload.paidBy || '-'],
        ['Received By / Insurance Agent', payload.receivedByInsuranceAgent || '-'],
        ['Payment Status', payload.paymentStatus || '-'],
        ['Approval Status', payload.paymentApprovalStatus || '-'],
        ['Accounting Treatment', payload.accountingTreatment || '-'],
        ['Narration', payload.narration || '-'],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
    });

    doc.setFontSize(9);
    doc.text(
      'This receipt confirms the insurance premium payment recorded in the hospital asset insurance register.',
      14,
      (doc as any).lastAutoTable.finalY + 10,
    );

    doc.save(`Insurance_Payment_Receipt_${safeReceiptNumber}.pdf`);
    toast.success('Insurance premium payment receipt generated.');
  };
  const handleGenerateCurrentAssetInsuranceReceipt = () => {
    const premiumAmount = Number.parseFloat(assetInsuranceForm.premiumAmount || '0') || 0;
    const amountPaid = Number.parseFloat(assetInsuranceForm.amountPaid || '0') || 0;
    const balance = Math.max(premiumAmount - amountPaid, 0);
    const debitAccount =
      assetRegisterAccountOptions.find((account) => account.id === assetInsuranceForm.paymentDebitAccountId)
        ?.displayLabel || '';
    const creditAccount =
      assetRegisterAccountOptions.find((account) => account.id === assetInsuranceForm.paymentCreditAccountId)
        ?.displayLabel || '';

    exportAssetInsurancePaymentReceiptPdf({
      receiptNumber: assetInsuranceForm.receiptNumber,
      paymentDate: assetInsuranceForm.paymentDate,
      policyNumber: assetInsuranceForm.policyNumber,
      insuranceCompanyName: assetInsuranceForm.insuranceCompanyName,
      insuranceType: assetInsuranceForm.insuranceType,
      assetCode: assetInsuranceForm.assetCode,
      assetName: assetInsuranceForm.assetName,
      assetCategory: assetInsuranceForm.assetCategory,
      department: assetInsuranceForm.department,
      location: assetInsuranceForm.location,
      premiumAmount,
      amountPaid,
      balance,
      paymentMethod: assetInsuranceForm.paymentMethod,
      paymentReference: assetInsuranceForm.paymentReference,
      debitAccountDisplay: debitAccount,
      creditAccountDisplay: creditAccount,
      paidBy: assetInsuranceForm.paidBy || accountantName,
      receivedByInsuranceAgent: assetInsuranceForm.receivedByInsuranceAgent,
      paymentStatus: assetInsuranceForm.paymentStatus,
      paymentApprovalStatus: assetInsuranceForm.paymentApprovalStatus,
      accountingTreatment: assetInsuranceForm.accountingTreatment,
      narration: assetInsuranceForm.paymentNarration,
    });
  };
  const handleGenerateSavedAssetInsuranceReceipt = (record: AssetInsuranceRecord) => {
    exportAssetInsurancePaymentReceiptPdf({
      receiptNumber: record.receiptNumber,
      paymentDate: record.paymentDate,
      policyNumber: record.policyNumber,
      insuranceCompanyName: record.insuranceCompanyName,
      insuranceType: record.insuranceType,
      assetCode: record.assetCode,
      assetName: record.assetName,
      assetCategory: record.assetCategory,
      department: record.department,
      location: record.location,
      premiumAmount: record.premiumAmount,
      amountPaid: record.amountPaid,
      balance: Math.max(record.premiumAmount - record.amountPaid, 0),
      paymentMethod: record.paymentMethod,
      paymentReference: record.paymentReference,
      debitAccountDisplay: record.paymentDebitAccountDisplay,
      creditAccountDisplay: record.paymentCreditAccountDisplay,
      paidBy: record.paidBy,
      receivedByInsuranceAgent: record.receivedByInsuranceAgent,
      paymentStatus: record.paymentStatus,
      paymentApprovalStatus: record.paymentApprovalStatus,
      accountingTreatment: record.accountingTreatment,
      narration: record.paymentNarration,
    });
  };
  const handleExportAssetInsuranceReportExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (assetInsuranceReportView === 'registered') {
      const worksheet = XLSX.utils.json_to_sheet(
        assetInsuranceRegisteredReportRows.map((row) => ({
          'Asset ID': row.assetCode,
          'Asset Name': row.assetName,
          'Cost Purchased': row.purchaseCost,
          Value: row.assetValue,
          'Sum Insured': row.sumInsured,
          'Claim Limit': row.claimLimit,
          'Policy Num': row.policyNumber,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Insurance Register');
      XLSX.writeFile(workbook, `Insurance_Registered_Report_${getTodayIsoDate()}.xlsx`);
      toast.success('Insurance registered report exported to Excel.');
      return;
    }

    if (assetInsuranceReportView === 'premium-paid') {
      const worksheet = XLSX.utils.json_to_sheet(
        assetInsurancePremiumPaidReportRows.map((row) => ({
          'Policy Number': row.policyNumber,
          Asset: row.assetName,
          'Insurance Company': row.insuranceCompanyName,
          'Premium Amount': row.premiumAmount,
          'Amount Paid': row.amountPaid,
          Balance: row.balance,
          'Payment Date': row.paymentDate,
          'Payment Method': row.paymentMethod,
          'Receipt Number': row.receiptNumber,
          'Account to Debit': row.paymentDebitAccountDisplay,
          'Account to Credit': row.paymentCreditAccountDisplay,
          'Payment Status': row.paymentStatus,
          'Approval Status': row.paymentApprovalStatus,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Premium Paid Report');
      XLSX.writeFile(workbook, `Insurance_Premium_Paid_Report_${getTodayIsoDate()}.xlsx`);
      toast.success('Insurance premium paid report exported to Excel.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      assetInsuranceClaimReportRows.map((row) => ({
        'Claim Number': row.claimNumber,
        'Policy Number': row.policyNumber,
        Asset: row.assetName,
        'Incident Date': row.incidentDate,
        'Incident Type': row.incidentType,
        'Claim Amount': row.claimAmount,
        'Approved Claim Amount': row.approvedClaimAmount,
        'Amount Received': row.amountReceived,
        'Claim Status': row.claimStatus,
        'Approval Status': row.claimApprovalStatus,
        'Insurer Submission': row.insurerSubmissionStatus,
        'Posting Status': row.claimPostingStatus,
        'Closed Date': row.claimClosedDate,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Insurance Claim Report');
    XLSX.writeFile(workbook, `Insurance_Claim_Report_${getTodayIsoDate()}.xlsx`);
    toast.success('Insurance claim report exported to Excel.');
  };
  const handleExportAssetInsuranceReportPdf = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('AKOBI SPECIALIST HOSPITAL', 14, 18);
    doc.setFontSize(11);
    const title =
      assetInsuranceReportView === 'registered'
        ? 'Insurance Registered Report'
        : assetInsuranceReportView === 'premium-paid'
          ? 'Premium Paid Report'
          : 'Insurance Claim Report';
    doc.text(title, 14, 26);
    doc.text(`Print Date: ${getTodayIsoDate()}`, 14, 32);

    if (assetInsuranceReportView === 'registered') {
      doc.autoTable({
        startY: 38,
        head: [[
          'Asset ID', 'Asset Name', 'Cost Purchased', 'Value', 'Sum Insured', 'Claim Limit', 'Policy Num',
        ]],
        body: assetInsuranceRegisteredReportRows.map((row) => [
          row.assetCode,
          row.assetName,
          formatCurrency(row.purchaseCost),
          formatCurrency(row.assetValue),
          formatCurrency(row.sumInsured),
          formatCurrency(row.claimLimit),
          row.policyNumber,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`Insurance_Registered_Report_${getTodayIsoDate()}.pdf`);
      toast.success('Insurance registered report exported to PDF.');
      return;
    }

    if (assetInsuranceReportView === 'premium-paid') {
      doc.autoTable({
        startY: 38,
        head: [[
          'Policy No', 'Asset', 'Company', 'Premium', 'Amount Paid', 'Balance', 'Date',
          'Method', 'Receipt No', 'Debit GL', 'Credit GL', 'Status', 'Approval',
        ]],
        body: assetInsurancePremiumPaidReportRows.map((row) => [
          row.policyNumber,
          row.assetName,
          row.insuranceCompanyName,
          formatCurrency(row.premiumAmount),
          formatCurrency(row.amountPaid),
          formatCurrency(row.balance),
          row.paymentDate,
          row.paymentMethod,
          row.receiptNumber,
          row.paymentDebitAccountDisplay || '-',
          row.paymentCreditAccountDisplay || '-',
          row.paymentStatus,
          row.paymentApprovalStatus,
        ]),
        foot: [[
          '', '', 'TOTAL',
          formatCurrency(assetInsurancePremiumPaidSummary.totalPremium),
          formatCurrency(assetInsurancePremiumPaidSummary.totalPaid),
          formatCurrency(assetInsurancePremiumPaidSummary.totalBalance),
          '', '', '', '', '', '', '',
        ]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`Insurance_Premium_Paid_Report_${getTodayIsoDate()}.pdf`);
      toast.success('Insurance premium paid report exported to PDF.');
      return;
    }

    doc.autoTable({
      startY: 38,
      head: [[
        'Claim No', 'Policy No', 'Asset', 'Incident Date', 'Incident Type', 'Claim Amount',
        'Approved Amount', 'Received', 'Status', 'Approval', 'Insurer', 'Posting', 'Closed Date',
      ]],
      body: assetInsuranceClaimReportRows.map((row) => [
        row.claimNumber || '-',
        row.policyNumber,
        row.assetName,
        row.incidentDate || '-',
        row.incidentType || '-',
        formatCurrency(row.claimAmount),
        formatCurrency(row.approvedClaimAmount),
        formatCurrency(row.amountReceived),
        row.claimStatus || '-',
        row.claimApprovalStatus || '-',
        row.insurerSubmissionStatus || '-',
        row.claimPostingStatus || '-',
        row.claimClosedDate || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: 10, right: 10 },
    });
    doc.save(`Insurance_Claim_Report_${getTodayIsoDate()}.pdf`);
    toast.success('Insurance claim report exported to PDF.');
  };
  const filteredGeneralLedgerRows = useMemo(
    () =>
      selectedLedgerAccountId === 'all'
        ? reportSummary.generalLedgerRows
        : reportSummary.generalLedgerRows.filter((row) => row.accountId === selectedLedgerAccountId),
    [reportSummary.generalLedgerRows, selectedLedgerAccountId],
  );
  const selectedLedgerAccountOption =
    ledgerReportAccountOptions.find((account) => account.id === selectedLedgerAccountId) ?? null;

  useEffect(() => {
    if (selectedLedgerAccountId === 'all') {
      return;
    }

    const accountStillExists = ledgerReportAccountOptions.some((account) => account.id === selectedLedgerAccountId);
    if (!accountStillExists) {
      setSelectedLedgerAccountId('all');
    }
  }, [ledgerReportAccountOptions, selectedLedgerAccountId]);
  const selectedPostedJournalEntry = generalLedgerEntries.find(
    (entry) => entry.id === selectedPostedJournalId,
  );
  const journalEditDebitTotal = (journalEditDraft?.lines ?? [])
    .filter((line) => line.type === 'debit')
    .reduce((sum, line) => {
      const amount = Number.parseFloat(line.amount);
      return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
    }, 0);
  const journalEditCreditTotal = (journalEditDraft?.lines ?? [])
    .filter((line) => line.type === 'credit')
    .reduce((sum, line) => {
      const amount = Number.parseFloat(line.amount);
      return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
    }, 0);
  const journalEditBalance = journalEditDebitTotal - journalEditCreditTotal;
  const journalEditIsBalanced =
    journalEditDebitTotal > 0 && Math.abs(journalEditBalance) < 0.01;

  const loadPostedJournalForEdit = (entryId: string) => {
    const entry = generalLedgerEntries.find((item) => item.id === entryId);
    setSelectedPostedJournalId(entryId);
    setJournalEditError(null);

    if (!entry) {
      setJournalEditDraft(null);
      return;
    }

    setJournalEditDraft({
      entryId: entry.id,
      reference: entry.reference,
      narration: entry.narration,
      postedBy: entry.postedBy,
      date: /^\d{4}-\d{2}-\d{2}/.test(entry.postedAt) ? entry.postedAt.slice(0, 10) : getTodayIsoDate(),
      lines: entry.lines.map((line, index) => ({
        id: `${entry.id}-line-${index}`,
        accountId: line.accountId,
        accountName: line.accountName,
        accountDetails:
          line.accountDetail ||
          generalLedgerAccounts.find((account) => account.id === line.accountId)?.accountDetail ||
          line.accountName,
        description: line.description || '',
        amount: line.amount.toString(),
        type: line.type,
      })),
    });
  };

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

  useEffect(() => {
    if (
      journalView === 'expenses' &&
      selectedJournalAccountOption &&
      selectedJournalAccountOption.accountClass !== 'expense'
    ) {
      setLineForm((prev) => ({
        ...prev,
        accountId: '',
        accountDetails: '',
      }));
    }
  }, [journalView, selectedJournalAccountOption]);

  useEffect(() => {
    if (
      journalView === 'expenses' &&
      lineForm.settlementAccountId &&
      !selectedSettlementAccountOption
    ) {
      setLineForm((prev) => ({
        ...prev,
        settlementAccountId: '',
        settlementAccountDetails: '',
      }));
    }
  }, [journalView, lineForm.settlementAccountId, selectedSettlementAccountOption]);

  useEffect(() => {
    if (journalView !== 'edit') {
      return;
    }

    if (!selectedPostedJournalId && generalLedgerEntries.length > 0) {
      loadPostedJournalForEdit(generalLedgerEntries[0].id);
      return;
    }

    if (selectedPostedJournalId && !selectedPostedJournalEntry) {
      if (generalLedgerEntries.length > 0) {
        loadPostedJournalForEdit(generalLedgerEntries[0].id);
      } else {
        setSelectedPostedJournalId('');
        setJournalEditDraft(null);
      }
    }
  }, [journalView, selectedPostedJournalId, selectedPostedJournalEntry, generalLedgerEntries]);

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
        <p className="mt-2 text-xs text-blue-700">
          Assets and expenses are debit in nature, while liabilities and income are credit in nature.
          Debit increases assets and expenses but decreases liabilities and income. Credit does the reverse.
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
                <p className="mt-3 text-xs text-slate-500">
                  {getAccountBehaviorSummary(account.accountClass)}
                </p>
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

  const parseJournalAmount = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const journalTotalDebit = committedLines
    .filter((line) => line.type === 'debit')
    .reduce((sum, line) => sum + line.amount, 0);
  const journalTotalCredit = committedLines
    .filter((line) => line.type === 'credit')
    .reduce((sum, line) => sum + line.amount, 0);
  const journalBalance = journalTotalDebit - journalTotalCredit;
  const journalIsBalanced =
    journalTotalDebit > 0 && Math.abs(journalBalance) < 0.01;
  const canFinalizeJournal = journalIsBalanced && committedLines.length >= 2;

  const handlePostLine = () => {
    setJournalFormError(null);
    if (!lineForm.accountId) {
      setJournalFormError('Choose an account ID before posting a line.');
      return;
    }
    const selectedAccountOption = activeJournalAccountOptions.find(
      (account) => account.id === lineForm.accountId,
    );
    if (!selectedAccountOption) {
      setJournalFormError('Selected account could not be resolved.');
      return;
    }
    const amount = parseJournalAmount(lineForm.amount);
    if (amount <= 0) {
      setJournalFormError('Amount must be greater than zero.');
      return;
    }
    if (journalView === 'expenses' && !lineForm.settlementAccountId) {
      setJournalFormError('Choose the bank, teller, or petty cash account to credit.');
      return;
    }
    const resolvedAccount =
      lineForm.accountId.startsWith('CATALOG::')
        ? addGeneralLedgerAccount({
            name: selectedAccountOption.name,
            code: selectedAccountOption.code,
            accountClass: selectedAccountOption.accountClass,
            accountCategory: selectedAccountOption.accountCategory,
            chartOfAccount: selectedAccountOption.chartOfAccount,
            accountDetail: selectedAccountOption.accountDetail,
          })
        : generalLedgerAccounts.find((account) => account.id === lineForm.accountId) || null;

    if (!resolvedAccount) {
      setJournalFormError('Could not prepare the selected GL account.');
      return;
    }

    if (journalView === 'expenses') {
      const selectedSettlementAccount =
        settlementAccountOptions.find((account) => account.id === lineForm.settlementAccountId) || null;

      if (!selectedSettlementAccount) {
        setJournalFormError('Selected bank, teller, or petty cash account could not be resolved.');
        return;
      }

      const resolvedSettlementAccount =
        lineForm.settlementAccountId.startsWith('CATALOG::')
          ? addGeneralLedgerAccount({
              name: selectedSettlementAccount.name,
              code: selectedSettlementAccount.code,
              accountClass: selectedSettlementAccount.accountClass,
              accountCategory: selectedSettlementAccount.accountCategory,
              chartOfAccount: selectedSettlementAccount.chartOfAccount,
              accountDetail: selectedSettlementAccount.accountDetail,
            })
          : generalLedgerAccounts.find((account) => account.id === lineForm.settlementAccountId) || null;

      if (!resolvedSettlementAccount) {
        setJournalFormError('Could not prepare the selected bank, teller, or petty cash account.');
        return;
      }

      const lineIdBase = `JCL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setCommittedLines((prev) => [
        ...prev,
        {
          id: `${lineIdBase}-debit`,
          accountId: resolvedAccount.id,
          accountDetails: selectedAccountOption.accountDetail,
          description: lineForm.description,
          amount,
          type: 'debit',
        },
        {
          id: `${lineIdBase}-credit`,
          accountId: resolvedSettlementAccount.id,
          accountDetails: selectedSettlementAccount.accountDetail,
          description: lineForm.description || `Expense paid through ${selectedSettlementAccount.accountDetail}`,
          amount,
          type: 'credit',
        },
      ]);
      setLineForm(createBlankLineForm());
      return;
    }

    const newLine: JournalCommittedLine = {
      id: `JCL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      accountId: resolvedAccount.id,
      accountDetails: selectedAccountOption.accountDetail,
      description: lineForm.description,
      amount,
      type: lineForm.type,
    };
    setCommittedLines((prev) => [...prev, newLine]);
    setLineForm(createBlankLineForm());
  };

  const handleRemoveCommittedLine = (lineId: string) => {
    setCommittedLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const clearLineForm = () => {
    setLineForm(createBlankLineForm());
    setJournalFormError(null);
  };

  const handleJournalEditLineChange = (
    lineId: string,
    field: 'description' | 'amount',
    value: string,
  ) => {
    setJournalEditDraft((prev) =>
      prev
        ? {
            ...prev,
            lines: prev.lines.map((line) =>
              line.id === lineId ? { ...line, [field]: value } : line,
            ),
          }
        : prev,
    );
  };

  const handleUpdatePostedJournal = () => {
    setJournalEditError(null);
    if (!journalEditDraft) {
      setJournalEditError('Choose a posted journal reference first.');
      return;
    }

    if (journalEditDraft.lines.length < 2) {
      setJournalEditError('A journal must contain at least two lines.');
      return;
    }

    if (!journalEditIsBalanced) {
      setJournalEditError('Total debits must equal total credits before you can update.');
      return;
    }

    const updatedEntry = updateGeneralLedgerEntry({
      entryId: journalEditDraft.entryId,
      reference: journalEditDraft.reference,
      narration: journalEditDraft.narration.trim() || 'UPDATED JOURNAL',
      postedBy: journalEditDraft.postedBy.trim() || accountantName,
      date: journalEditDraft.date,
      lines: journalEditDraft.lines.map((line) => ({
        accountId: line.accountId,
        type: line.type,
        amount: parseJournalAmount(line.amount),
        accountDetail: line.accountDetails,
        description: line.description,
      })),
    });

    if (!updatedEntry) {
      setJournalEditError('Could not update this journal. Check the amounts and try again.');
      return;
    }

    loadPostedJournalForEdit(updatedEntry.id);
    toast.success(`Journal ${updatedEntry.reference} updated successfully.`);
  };

  const handleDeletePostedJournal = () => {
    setJournalEditError(null);
    if (!journalEditDraft) {
      setJournalEditError('Choose a posted journal reference first.');
      return;
    }

    const deleted = deleteGeneralLedgerEntry(journalEditDraft.entryId);
    if (!deleted) {
      setJournalEditError('Could not delete this journal.');
      return;
    }

    const nextEntries = generalLedgerEntries.filter((entry) => entry.id !== journalEditDraft.entryId);
    if (nextEntries.length > 0) {
      loadPostedJournalForEdit(nextEntries[0].id);
    } else {
      setSelectedPostedJournalId('');
      setJournalEditDraft(null);
    }

    setIsDeleteJournalDialogOpen(false);
    toast.success(`Journal ${journalEditDraft.reference} deleted successfully.`);
  };

  const handleFinalizeJournal = () => {
    setJournalFormError(null);
    const entryPostedBy = accountantName.trim();
    if (!entryPostedBy) {
      setJournalFormError('Posted By is required to finalize this journal.');
      return;
    }
    if (committedLines.length < 2) {
      setJournalFormError('Add at least two lines before finalizing.');
      return;
    }
    if (!journalIsBalanced) {
      setJournalFormError('Total debits must equal total credits before finalizing.');
      return;
    }

    const narration =
      committedLines
        .map((line) => line.description.trim())
        .filter(Boolean)
        .join(' / ') || `${journalDraft.journalType.toUpperCase()} JOURNAL`;
    const entryReference = getNextJournalReference(
      generalLedgerEntries,
      journalDraft.date,
      journalDraft.journalType,
    );

    const result = addGeneralLedgerEntry({
      reference: entryReference,
      narration,
      postedBy: entryPostedBy,
      date: journalDraft.date,
      lines: committedLines.map((line) => ({
        accountId: line.accountId,
        type: line.type,
        amount: line.amount,
        accountDetail: line.accountDetails,
        description: line.description,
      })),
    });

    if (!result) {
      setJournalFormError('Could not post journal — verify all accounts and amounts.');
      return;
    }

    setJournalDraft(
      createBlankJournalDraft(getTodayIsoDate(), [result, ...generalLedgerEntries], journalDraft.journalType),
    );
    setCommittedLines([]);
    setLineForm(createBlankLineForm());
    setJournalView('edit');
    toast.success(`Journal ${result.reference} posted successfully.`);
  };

  const formatJournalAmount = (value: number) =>
    value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderJournalSubNav = () => (
    <div className="bg-white rounded-lg border shadow-sm p-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={journalView === 'entries' ? 'default' : 'ghost'}
          className="flex-1 min-w-[180px]"
          onClick={() => {
            setJournalDraft((prev) => ({
              ...prev,
              journalType: 'general',
              reference: getNextJournalReference(generalLedgerEntries, prev.date, 'general'),
            }));
            setJournalView('entries');
          }}
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Journal Entries
        </Button>
        <Button
          variant={journalView === 'expenses' ? 'default' : 'ghost'}
          className="flex-1 min-w-[180px]"
          onClick={() => {
            setJournalDraft((prev) => ({
              ...prev,
              journalType: 'expense',
              reference: getNextJournalReference(generalLedgerEntries, prev.date, 'expense'),
            }));
            setJournalView('expenses');
          }}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Expenses Entries
        </Button>
        <Button
          variant={journalView === 'edit' ? 'default' : 'ghost'}
          className="flex-1 min-w-[180px]"
          onClick={() => setJournalView('edit')}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Journal Edit
        </Button>
      </div>
    </div>
  );

  const renderJournalEntriesList = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-blue-700">JOURNAL EDIT</h2>
            <p className="text-sm text-slate-500">
              Pick a posted reference, bring it back, alter the figures or descriptions, or delete the transaction.
            </p>
          </div>
          <Badge className="text-xs uppercase tracking-wide bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200">
            Posted Journal Editor
          </Badge>
        </div>
      </div>

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
            <CardTitle>Edit Posted Journal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {generalLedgerEntries.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Reference</label>
                  <Select value={selectedPostedJournalId} onValueChange={loadPostedJournalForEdit}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose posted journal reference" />
                    </SelectTrigger>
                    <SelectContent>
                      {generalLedgerEntries.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {entry.reference} - {entry.narration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Posted By</label>
                  <Input
                    className="mt-1 bg-slate-50 cursor-not-allowed"
                    value={journalEditDraft?.postedBy || ''}
                    readOnly
                  />
                </div>
              </div>

              {journalEditDraft && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Journal Description</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        value={journalEditDraft.narration}
                        onChange={(e) =>
                          setJournalEditDraft((prev) =>
                            prev ? { ...prev, narration: e.target.value } : prev,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Transaction Date</label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={journalEditDraft.date}
                        onChange={(e) =>
                          setJournalEditDraft((prev) =>
                            prev ? { ...prev, date: e.target.value } : prev,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">Account</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">Description</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-blue-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {journalEditDraft.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-3 text-sm">
                              <p className="font-medium text-slate-900">{line.accountName}</p>
                              <p className="text-xs text-slate-500">{line.accountDetails}</p>
                            </td>
                            <td className="px-3 py-3">
                              <Badge className={line.type === 'debit' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>
                                {line.type === 'debit' ? 'Debit' : 'Credit'}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Input
                                value={line.description}
                                onChange={(e) => handleJournalEditLineChange(line.id, 'description', e.target.value)}
                                placeholder="Line description"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <Input
                                className="text-right font-mono"
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.amount}
                                onChange={(e) => handleJournalEditLineChange(line.id, 'amount', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {journalEditError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {journalEditError}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">
                        Debit: {formatJournalAmount(journalEditDebitTotal)} | Credit: {formatJournalAmount(journalEditCreditTotal)}
                      </p>
                      <p className={journalEditIsBalanced ? 'text-green-700' : 'text-amber-700'}>
                        {journalEditIsBalanced
                          ? 'Journal is balanced and ready to update.'
                          : `Out of balance by ${formatJournalAmount(Math.abs(journalEditBalance))}.`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setIsDeleteJournalDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Transaction
                      </Button>
                      <Button onClick={handleUpdatePostedJournal} disabled={!journalEditIsBalanced}>
                        <Save className="mr-2 h-4 w-4" />
                        Update Journal
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              No journal entries posted yet. Use Journal Entries to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderJournalEntriesForm = (entryMode: 'general' | 'expense' = 'general') => {
    const isExpenseEntryMode = entryMode === 'expense';

    return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => setJournalView('edit')}
              aria-label="Back to journal list"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-blue-700">
                {isExpenseEntryMode ? 'EXPENSE ENTRY' : 'JOURNAL ENTRY'}
              </h2>
              <p className="text-sm text-slate-500">
                {isExpenseEntryMode
                  ? 'Capture and review expense journal lines in a cleaner standard workspace.'
                  : 'Capture and review accounting journal lines in a cleaner standard workspace.'}
              </p>
            </div>
          </div>
          <Badge className="text-xs uppercase tracking-wide bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200">
            {isExpenseEntryMode ? 'Expense Journal' : 'Accounting Journal'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total Debit</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 font-mono">{formatJournalAmount(journalTotalDebit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total Credit</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 font-mono">{formatJournalAmount(journalTotalCredit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Balance</p>
            <p className={`mt-2 text-2xl font-bold font-mono ${committedLines.length === 0 ? 'text-slate-900' : journalIsBalanced ? 'text-green-700' : 'text-red-700'}`}>
              {formatJournalAmount(journalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Entries Loaded</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{committedLines.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700">Entry Details</h3>
            <p className="text-sm text-slate-500">Provide journal information and post a debit or credit line.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Journal Type</label>
                <Select
                  value={journalDraft.journalType}
                  onValueChange={(value) =>
                    setJournalDraft((prev) => ({
                      ...prev,
                      journalType: value,
                      reference: getNextJournalReference(generalLedgerEntries, prev.date, value),
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">GENERAL JOURNAL</SelectItem>
                    <SelectItem value="expense">EXPENSE JOURNAL</SelectItem>
                    <SelectItem value="adjustment">ADJUSTMENT JOURNAL</SelectItem>
                    <SelectItem value="closing">CLOSING JOURNAL</SelectItem>
                    <SelectItem value="reversal">REVERSAL JOURNAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {isExpenseEntryMode ? 'Expense GL Account' : 'Account ID'}
                </label>
                <Popover open={isJournalAccountPickerOpen} onOpenChange={setIsJournalAccountPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isJournalAccountPickerOpen}
                      className="mt-1 w-full justify-between font-normal"
                    >
                      {activeSelectedJournalAccountOption
                        ? `${activeSelectedJournalAccountOption.code} - ${activeSelectedJournalAccountOption.accountDetail}`
                        : entryMode === 'expense'
                          ? 'Search expense account number or name'
                          : 'Search account number or name'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={
                          entryMode === 'expense'
                            ? 'Search expense account number or name...'
                            : 'Search by account number or name...'
                        }
                      />
                      <CommandList>
                        <CommandEmpty>
                          {entryMode === 'expense'
                            ? 'No matching expense account found.'
                            : 'No matching account found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {activeJournalAccountOptions.map((account) => (
                            <CommandItem
                              key={account.id}
                              value={`${account.code} ${account.accountDetail} ${account.name}`}
                              onSelect={() => {
                                setLineForm((prev) => ({
                                  ...prev,
                                  accountId: account.id,
                                  accountDetails: account.accountDetail,
                                }));
                                setIsJournalAccountPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  lineForm.accountId === account.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span className="truncate">{account.code} - {account.accountDetail}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {isExpenseEntryMode ? 'Expense Account Details' : 'Account Details'}
                </label>
                <Input
                  className="mt-1 bg-slate-50 cursor-not-allowed"
                  value={lineForm.accountDetails}
                  readOnly
                  placeholder={isExpenseEntryMode ? 'Auto-fills from selected expense GL account' : 'Auto-fills from selected Account ID'}
                />
              </div>
              {isExpenseEntryMode && (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Cash / Bank Credit Account</label>
                    <Popover open={isSettlementAccountPickerOpen} onOpenChange={setIsSettlementAccountPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isSettlementAccountPickerOpen}
                          className="mt-1 w-full justify-between font-normal"
                        >
                          {selectedSettlementAccountOption
                            ? `${selectedSettlementAccountOption.code} - ${selectedSettlementAccountOption.accountDetail}`
                            : 'Search bank balances, teller, or petty cash'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search bank balances, teller, or petty cash..." />
                          <CommandList>
                            <CommandEmpty>No matching bank, teller, or petty cash account found.</CommandEmpty>
                            <CommandGroup>
                              {settlementAccountOptions.map((account) => (
                                <CommandItem
                                  key={account.id}
                                  value={`${account.code} ${account.accountDetail} ${account.name}`}
                                  onSelect={() => {
                                    setLineForm((prev) => ({
                                      ...prev,
                                      settlementAccountId: account.id,
                                      settlementAccountDetails: account.accountDetail,
                                    }));
                                    setIsSettlementAccountPickerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      lineForm.settlementAccountId === account.id ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  <span className="truncate">{account.code} - {account.accountDetail}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Cash / Bank Account Details</label>
                    <Input
                      className="mt-1 bg-slate-50 cursor-not-allowed"
                      value={lineForm.settlementAccountDetails}
                      readOnly
                      placeholder="Auto-fills from selected bank, teller, or petty cash account"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Description</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={lineForm.description}
                  onChange={(e) => setLineForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Reference No.</label>
                <Input
                  className="mt-1 bg-slate-50 cursor-not-allowed"
                  placeholder="Auto-generated"
                  value={journalDraft.reference}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Posted By</label>
                <Input
                  className="mt-1 bg-slate-50 cursor-not-allowed"
                  placeholder="Signed-in accountant"
                  value={journalDraft.postedBy}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Transaction Date</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={journalDraft.date}
                  onChange={(e) =>
                    setJournalDraft((prev) => ({
                      ...prev,
                      date: e.target.value,
                      reference: getNextJournalReference(generalLedgerEntries, e.target.value, prev.journalType),
                    }))
                  }
                />
              </div>
              <div className={`grid gap-3 items-end ${isExpenseEntryMode ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div className={isExpenseEntryMode ? '' : 'col-span-2'}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Amount</label>
                  <Input
                    className="mt-1 text-right font-mono"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={lineForm.amount}
                    onChange={(e) => setLineForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                {!isExpenseEntryMode && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() => setLineForm((prev) => ({ ...prev, type: 'debit' }))}
                    >
                      <span
                        className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                          lineForm.type === 'debit'
                            ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-200'
                            : 'border-slate-300'
                        }`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">Debit</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() => setLineForm((prev) => ({ ...prev, type: 'credit' }))}
                    >
                      <span
                        className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                          lineForm.type === 'credit'
                            ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-200'
                            : 'border-slate-300'
                        }`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">Credit</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={clearLineForm}>Clear</Button>
                <Button onClick={handlePostLine}>POST ENTRY</Button>
              </div>
            </div>
          </div>

          {journalFormError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {journalFormError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700">Journal Ledger</h3>
              <p className="text-sm text-slate-500">Review posted lines and current debit-credit position.</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export to excel
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">Account ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">Account Details</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-blue-600">Debit</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-blue-600">Credit</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {committedLines.length > 0 ? (
                  committedLines.map((line) => {
                    const account = generalLedgerAccounts.find((a) => a.id === line.accountId);
                    const displayId = account ? getJournalAccountDisplayId(account) : line.accountId;
                    return (
                      <tr key={line.id}>
                        <td className="px-3 py-2 text-sm font-mono">{displayId}</td>
                        <td className="px-3 py-2 text-sm">{line.accountDetails}</td>
                        <td className="px-3 py-2 text-sm text-slate-600">{line.description || '—'}</td>
                        <td className="px-3 py-2 text-sm text-right font-mono">
                          {line.type === 'debit' ? formatJournalAmount(line.amount) : '—'}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-mono">
                          {line.type === 'credit' ? formatJournalAmount(line.amount) : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleRemoveCommittedLine(line.id)}
                            aria-label="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No lines posted yet. Use the form above to post a debit or credit line.
                    </td>
                  </tr>
                )}
              </tbody>
              {committedLines.length > 0 && (
                <tfoot className="bg-slate-50 border-t">
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-sm font-semibold text-slate-700 text-right">Totals</td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-semibold">{formatJournalAmount(journalTotalDebit)}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-semibold">{formatJournalAmount(journalTotalCredit)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
            <p className={`text-sm font-medium ${
              committedLines.length === 0
                ? 'text-slate-500'
                : !journalIsBalanced
                  ? 'text-amber-700'
                  : 'text-green-700'
            }`}>
              {committedLines.length === 0
                ? 'Post a debit and a credit line to begin.'
                : committedLines.length < 2
                  ? 'Post at least one more line to balance the journal.'
                  : !journalIsBalanced
                    ? `Out of balance by ${formatJournalAmount(Math.abs(journalBalance))} — keep posting until debit equals credit.`
                    : 'Transactions balanced — ready to save.'}
            </p>
            <Button onClick={handleFinalizeJournal} disabled={!canFinalizeJournal}>
              <Save className="w-4 h-4 mr-2" />
              SAVE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  const renderJournalManagement = () => (
    <div className="space-y-6">
      {renderJournalSubNav()}
      {journalView === 'edit'
        ? renderJournalEntriesList()
        : journalView === 'expenses'
          ? renderJournalEntriesForm('expense')
          : renderJournalEntriesForm('general')}
      <AlertDialog open={isDeleteJournalDialogOpen} onOpenChange={setIsDeleteJournalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Posted Journal?</AlertDialogTitle>
            <AlertDialogDescription>
              {journalEditDraft
                ? `This will permanently remove ${journalEditDraft.reference} and recalculate the ledger balances.`
                : 'This will permanently remove the selected journal and recalculate the ledger balances.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeletePostedJournal}
            >
              Delete Journal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const renderAccountingReport = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-blue-700">ACCOUNTING REPORTS</h2>
            <p className="text-sm text-slate-500">
              Generate filtered income, balance, cash movement, general ledger, and department revenue reports from the accounting data already posted.
            </p>
          </div>
          <Badge className="text-xs uppercase tracking-wide bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200">
            Reporting Workspace
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Report Types</p>
            <p className="mt-2 text-2xl font-bold">7</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Entries In Range</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{filteredReportEntries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className={`mt-2 text-2xl font-bold ${reportSummary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(reportSummary.netProfit)}
            </p>
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
          <CardTitle>Report Controls</CardTitle>
        </CardHeader>
        <CardContent className={`grid gap-4 ${reportType === 'general-ledger' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-4'}`}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Report Type</label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as AccountingReportType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income-statement">Income Statement</SelectItem>
                <SelectItem value="profit-loss">Profit &amp; Loss</SelectItem>
                <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                <SelectItem value="trial-balance">Trial Balance</SelectItem>
                <SelectItem value="general-ledger">General Ledger Report</SelectItem>
                <SelectItem value="cash-movement">Cash Movement Report</SelectItem>
                <SelectItem value="department-revenue">Department Revenue Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Date From</label>
            <Input type="date" className="mt-1" value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Date To</label>
            <Input type="date" className="mt-1" value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)} />
          </div>
          {reportType === 'general-ledger' ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Account Ledger</label>
              <Popover open={isLedgerAccountPickerOpen} onOpenChange={setIsLedgerAccountPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isLedgerAccountPickerOpen}
                    className="mt-1 w-full justify-between font-normal"
                  >
                    {selectedLedgerAccountOption
                      ? `${selectedLedgerAccountOption.code} - ${selectedLedgerAccountOption.accountDetail}`
                      : selectedLedgerAccountId === 'all'
                        ? 'Search all account details by number or name'
                        : 'Search account detail by number or name'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search account ledger by account number or name..." />
                    <CommandList>
                      <CommandEmpty>No matching account ledger found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all account details"
                          onSelect={() => {
                            setSelectedLedgerAccountId('all');
                            setIsLedgerAccountPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedLedgerAccountId === 'all' ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate">All Account Details</span>
                        </CommandItem>
                        {ledgerReportAccountOptions.map((account) => (
                          <CommandItem
                            key={account.id}
                            value={`${account.code} ${account.accountDetail} ${account.name}`}
                            onSelect={() => {
                              setSelectedLedgerAccountId(account.id);
                              setIsLedgerAccountPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedLedgerAccountId === account.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <span className="truncate">{account.code} - {account.accountDetail}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const titleMap: Record<AccountingReportType, string> = {
                  'income-statement': 'Income Statement',
                  'profit-loss': 'Profit & Loss',
                  'balance-sheet': 'Balance Sheet',
                  'trial-balance': 'Trial Balance',
                  'general-ledger': 'General Ledger Report',
                  'cash-movement': 'Cash Movement Report',
                  'department-revenue': 'Department Revenue Report',
                };
                const workbook = XLSX.utils.book_new();
                const reportRows =
                  reportType === 'income-statement'
                    ? [
                        ...reportSummary.incomeRows.map((row) => ({
                          Period: `${reportDateFrom} to ${reportDateTo}`,
                          'Account Details': row.label,
                          Amount: row.amount || 0,
                        })),
                        {
                          Period: `${reportDateFrom} to ${reportDateTo}`,
                          'Account Details': 'TOTAL INCOME',
                          Amount: reportSummary.totalIncome,
                        },
                      ]
                    : reportType === 'profit-loss'
                      ? [
                          ...reportSummary.incomeRows.map((row) => ({
                            Section: 'Income',
                            'Account Details': row.label,
                            Amount: row.amount || 0,
                          })),
                          {
                            Section: 'Income Total',
                            'Account Details': 'TOTAL INCOME',
                            Amount: reportSummary.totalIncome,
                          },
                          ...reportSummary.expenseRows.map((row) => ({
                            Section: 'Expense',
                            'Account Details': row.label,
                            Amount: row.amount || 0,
                          })),
                          {
                            Section: 'Expense Total',
                            'Account Details': 'TOTAL EXPENSE',
                            Amount: reportSummary.totalExpense,
                          },
                          {
                            Section: 'Result',
                            'Account Details': reportSummary.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS',
                            Amount: reportSummary.netProfit,
                          },
                        ]
                    : reportType === 'balance-sheet'
                      ? reportSummary.balanceSheetRows.map((row) => ({
                          Section: row.category,
                          'Chart Of Account': row.label,
                          'Closing Balance': row.amount || 0,
                        }))
                      : reportType === 'trial-balance'
                        ? reportSummary.trialBalanceReportRows.map((row, index) => ({
                            'S/N': row.rowType === 'detail' ? index + 1 : '',
                            'Account ID': row.code || '',
                            Description: row.label,
                            Opening: row.opening || 0,
                            Debit: row.debit || 0,
                            Credit: row.credit || 0,
                            Closing: row.closing || 0,
                          }))
                      : reportType === 'general-ledger'
                        ? filteredGeneralLedgerRows.map((row) => ({
                            Date: row.date || '',
                            Reference: row.reference || '',
                            'Account ID': row.code || '',
                            Account: row.label,
                            Class: row.category || '',
                            Description: row.description || '',
                            Debit: row.debit || 0,
                            Credit: row.credit || 0,
                            Balance: row.amount || 0,
                          }))
                      : reportType === 'cash-movement'
                        ? reportSummary.cashRows.map((row) => ({
                            Date: row.date || '',
                            Reference: row.reference || '',
                            Flow: row.category || '',
                            'Movement Type': row.code || '',
                            Account: row.label,
                            Description: row.description || '',
                            Inflow: row.debit || 0,
                            Outflow: row.credit || 0,
                          }))
                        : departmentRevenue.map((row) => ({ Department: row.name, Revenue: row.value }));

                const worksheet = XLSX.utils.json_to_sheet(reportRows);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
                XLSX.writeFile(workbook, `${titleMap[reportType].replace(/\s+/g, '_')}_${getTodayIsoDate()}.xlsx`);
                toast.success(`${titleMap[reportType]} exported to Excel.`);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                const doc = new jsPDF();
                const titleMap: Record<AccountingReportType, string> = {
                  'income-statement': 'Income Statement',
                  'profit-loss': 'Profit & Loss',
                  'balance-sheet': 'Balance Sheet',
                  'trial-balance': 'Trial Balance',
                  'general-ledger': 'General Ledger Report',
                  'cash-movement': 'Cash Movement Report',
                  'department-revenue': 'Department Revenue Report',
                };
                const title = titleMap[reportType];

                doc.setFontSize(16);
                doc.text('AKOBI SPECIALIST HOSPITAL', 14, 18);
                doc.setFontSize(11);
                doc.text(title, 14, 26);
                doc.text(`Period: ${reportDateFrom} to ${reportDateTo}`, 14, 32);

                const body =
                  reportType === 'income-statement'
                    ? [
                        ...reportSummary.incomeRows.map((row) => [
                          `${reportDateFrom} to ${reportDateTo}`,
                          row.label,
                          formatCurrency(row.amount || 0),
                        ]),
                        [`${reportDateFrom} to ${reportDateTo}`, 'TOTAL INCOME', formatCurrency(reportSummary.totalIncome)],
                      ]
                    : reportType === 'profit-loss'
                      ? [
                          ...reportSummary.incomeRows.map((row) => ['Income', row.label, formatCurrency(row.amount || 0)]),
                          ['Income Total', 'TOTAL INCOME', formatCurrency(reportSummary.totalIncome)],
                          ...reportSummary.expenseRows.map((row) => ['Expense', row.label, formatCurrency(row.amount || 0)]),
                          ['Expense Total', 'TOTAL EXPENSE', formatCurrency(reportSummary.totalExpense)],
                          ['Result', reportSummary.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS', formatCurrency(reportSummary.netProfit)],
                        ]
                    : reportType === 'balance-sheet'
                      ? reportSummary.balanceSheetRows.map((row) => [
                          row.category || '',
                          row.label,
                          formatCurrency(row.amount || 0),
                        ])
                      : reportType === 'trial-balance'
                        ? reportSummary.trialBalanceReportRows.map((row, index) => [
                            row.rowType === 'detail' ? `${index + 1}` : '',
                            row.code || '',
                            row.label,
                            row.rowType === 'section' || row.rowType === 'chart' ? '' : formatCurrency(row.opening || 0),
                            row.rowType === 'section' || row.rowType === 'chart' ? '' : formatCurrency(row.debit || 0),
                            row.rowType === 'section' || row.rowType === 'chart' ? '' : formatCurrency(row.credit || 0),
                            row.rowType === 'section' || row.rowType === 'chart' ? '' : formatCurrency(row.closing || 0),
                          ])
                      : reportType === 'general-ledger'
                        ? filteredGeneralLedgerRows.map((row) => [
                            row.date || '',
                            row.reference || '',
                            row.code || '',
                            row.label,
                            row.category || '',
                            row.description || '',
                            formatCurrency(row.debit || 0),
                            formatCurrency(row.credit || 0),
                            formatCurrency(row.amount || 0),
                          ])
                      : reportType === 'cash-movement'
                        ? reportSummary.cashRows.map((row) => [
                            row.date || '',
                            row.reference || '',
                            row.category || '',
                            row.code || '',
                            row.label,
                            row.description || '',
                            formatCurrency(row.debit || 0),
                            formatCurrency(row.credit || 0),
                          ])
                        : departmentRevenue.map((row) => [row.name, formatCurrency(row.value)]);

                const head =
                  reportType === 'income-statement'
                    ? [['Period', 'Account Details', 'Amount']]
                    : reportType === 'profit-loss'
                      ? [['Section', 'Account Details', 'Amount']]
                    : reportType === 'balance-sheet'
                      ? [['Section', 'Chart Of Account', 'Closing Balance']]
                      : reportType === 'trial-balance'
                        ? [['S/N', 'Account ID', 'Description', 'Opening', 'Debit', 'Credit', 'Closing']]
                      : reportType === 'general-ledger'
                        ? [['Date', 'Reference', 'Account ID', 'Account', 'Class', 'Description', 'Debit', 'Credit', 'Balance']]
                      : reportType === 'cash-movement'
                        ? [['Date', 'Reference', 'Flow', 'Movement Type', 'Account', 'Description', 'Inflow', 'Outflow']]
                        : [['Department', 'Revenue']];

                doc.autoTable({
                  head,
                  body,
                  startY: 38,
                  styles: { fontSize: 9 },
                });

                doc.save(`${title.replace(/\s+/g, '_')}_${getTodayIsoDate()}.pdf`);
                toast.success(`${title} exported to PDF.`);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === 'income-statement'
              ? 'Income Statement Preview'
              : reportType === 'profit-loss'
                ? 'Profit & Loss Preview'
              : reportType === 'balance-sheet'
                ? 'Balance Sheet Preview'
                : reportType === 'trial-balance'
                  ? 'Trial Balance Preview'
                : reportType === 'general-ledger'
                  ? selectedLedgerAccountOption
                    ? `General Ledger Preview - ${selectedLedgerAccountOption.accountDetail}`
                    : 'General Ledger Preview'
                : reportType === 'cash-movement'
                  ? 'Cash Movement Preview'
                  : 'Department Revenue Preview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {reportType === 'income-statement' ? (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account Details</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportSummary.incomeRows.map((row) => (
                    <tr key={`income-${row.label}`}>
                      <td className="px-4 py-3 text-sm text-slate-600">{reportDateFrom} to {reportDateTo}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.amount || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{reportDateFrom} to {reportDateTo}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">TOTAL INCOME</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{formatCurrency(reportSummary.totalIncome)}</td>
                  </tr>
                </tbody>
              </table>
            ) : reportType === 'profit-loss' ? (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Section</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account Details</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportSummary.incomeRows.map((row) => (
                    <tr key={`profit-income-${row.label}`}>
                      <td className="px-4 py-3 text-sm text-emerald-700">Income</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.amount || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50">
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-800">Income Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">TOTAL INCOME</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{formatCurrency(reportSummary.totalIncome)}</td>
                  </tr>
                  {reportSummary.expenseRows.map((row) => (
                    <tr key={`profit-expense-${row.label}`}>
                      <td className="px-4 py-3 text-sm text-red-700">Expense</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.amount || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50">
                    <td className="px-4 py-3 text-sm font-semibold text-red-800">Expense Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">TOTAL EXPENSE</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{formatCurrency(reportSummary.totalExpense)}</td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">Result</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {reportSummary.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-bold">
                      {formatCurrency(reportSummary.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : reportType === 'balance-sheet' ? (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Section</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Chart Of Account</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportSummary.balanceSheetRows.map((row) => (
                    <tr key={`balance-${row.category}-${row.label}`}>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium uppercase">{row.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{formatCurrency(row.amount || 0)}</td>
                    </tr>
                  ))}
                  {(['Assets', 'Liabilities', 'Equity'] as const).map((section) => (
                    <tr key={`balance-total-${section}`} className="bg-slate-50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{section} Total</td>
                      <td className="px-4 py-3 text-sm text-slate-700"></td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                        {formatCurrency(reportSummary.balanceSheetTotals[section] || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : reportType === 'trial-balance' ? (
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-5 text-center">
                  <p className="text-lg font-bold tracking-wide text-slate-900">AKOBI SPECIALIST HOSPITAL</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Trial Balance</p>
                  <p className="mt-1 text-xs text-slate-500">Start Date: {reportDateFrom}</p>
                  <p className="text-xs text-slate-500">End Date: {reportDateTo}</p>
                  <p className="text-xs text-slate-500">Print Date: {getTodayIsoDate()}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Entries Loaded</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{reportSummary.trialBalanceRows.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Opening Balance</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(reportSummary.trialBalanceOpeningTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Debit</p>
                    <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(reportSummary.trialBalanceDebitTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Closing Balance</p>
                    <p className="mt-1 text-lg font-bold text-blue-700">{formatCurrency(reportSummary.trialBalanceClosingTotal)}</p>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2 border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-600">S/N</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Account ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Opening</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Debit</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Credit</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(() => {
                      let detailIndex = 0;
                      return reportSummary.trialBalanceReportRows.map((row, index) => {
                        const isSection = row.rowType === 'section';
                        const isChart = row.rowType === 'chart';
                        const isTotal = row.rowType === 'total' || row.rowType === 'grand-total';
                        const serial = row.rowType === 'detail' ? `${++detailIndex}` : '';

                        return (
                          <tr
                            key={`trial-${row.rowType}-${row.code || row.label}-${index}`}
                            className={
                              isSection
                                ? 'bg-slate-200'
                                : isChart
                                  ? 'bg-slate-50'
                                  : isTotal
                                    ? 'bg-slate-100'
                                    : 'hover:bg-slate-50/80'
                            }
                          >
                            <td className={`px-4 py-3 text-sm ${isSection ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{serial}</td>
                            <td className={`px-4 py-3 text-sm ${isSection ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {isSection ? '' : row.code || ''}
                            </td>
                            <td className={`px-4 py-3 text-sm ${isSection || isTotal ? 'font-semibold text-slate-900' : 'text-slate-900'} ${isChart ? 'font-semibold text-slate-700' : ''}`}>
                              {row.label}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono">
                              {isSection || isChart ? '' : formatCurrency(row.opening || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono">
                              {isSection || isChart ? '' : formatCurrency(row.debit || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono">
                              {isSection || isChart ? '' : formatCurrency(row.credit || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                              {isSection || isChart ? '' : formatCurrency(row.closing || 0)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            ) : reportType === 'general-ledger' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Account Ledger</p>
                  <p className="mt-2 text-sm text-slate-800">
                    {selectedLedgerAccountOption
                      ? `${selectedLedgerAccountOption.code} - ${selectedLedgerAccountOption.accountDetail}`
                      : 'All account details'}
                  </p>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Class</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Debit</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Credit</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredGeneralLedgerRows.map((row, index) => (
                      <tr key={`ledger-${row.reference}-${row.label}-${index}`}>
                        <td className="px-4 py-3 text-sm text-slate-900">{row.date || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{row.reference || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.code || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{row.label}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase">{row.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.debit || 0)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.credit || 0)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{formatCurrency(row.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : reportType === 'cash-movement' ? (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reference</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Flow</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Movement Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Inflow</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(() => {
                    let activeFlow = '';
                    return reportSummary.cashRows.map((row, index) => {
                      const rows: JSX.Element[] = [];
                      if ((row.category || '') !== activeFlow) {
                        activeFlow = row.category || '';
                        rows.push(
                          <tr key={`cash-flow-${activeFlow}-${index}`} className="bg-slate-100">
                            <td colSpan={8} className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
                              {activeFlow}
                            </td>
                          </tr>,
                        );
                      }

                      rows.push(
                        <tr key={`cash-${row.reference}-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-900">{row.date || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{row.reference || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.category || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{row.code || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{row.label}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.debit || 0)}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.credit || 0)}</td>
                        </tr>,
                      );

                      return rows;
                    });
                  })()}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {departmentRevenue.map((row) => (
                    <tr key={row.name}>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGeneralLedgerSetup = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="order-2 xl:order-2">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>GL Account Builder</CardTitle>
            <p className="text-sm text-slate-500">
              Move from class to posting detail, then register the final ledger line with its generated code.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Categories</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{glCategories.length}</p>
              <p className="mt-1 text-xs text-slate-600">Account groups under the selected class</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Posting Details</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{glDetails.length}</p>
              <p className="mt-1 text-xs text-slate-600">Leaf nodes available for this chart</p>
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Builder Steps</p>
                <p className="text-xs text-slate-500">Select the exact route for the new ledger account.</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700">4 levels</Badge>
            </div>

            <div className="space-y-3">
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

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

                <div className="rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Generated Code</p>
                      <p className="mt-2 text-2xl font-bold tracking-[0.08em] text-slate-900">{glAccountCode || '----'}</p>
                    </div>
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Auto-derived from the selected posting detail.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Account behavior</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {glAccountClass === 'asset' || glAccountClass === 'expense' ? 'Debit nature' : 'Credit nature'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{selectedAccountBehavior}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.4)]">
            <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_34%),linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] px-6 py-6">
              <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      Hierarchy Editor
                    </span>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                      Live structure
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold tracking-tight text-slate-900">GL design workspace</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Maintain the naming structure from account class down to the posting detail, with the current route always visible.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: 'Account Class', value: selectedClassOption.label, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
                    { label: 'Categories', value: `${glCategories.length}`, tone: 'border-sky-100 bg-sky-50 text-sky-700' },
                    { label: 'Charts', value: `${selectedGlCategory.charts.length}`, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
                    { label: 'Details', value: `${glDetails.length}`, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border p-3 ${item.tone}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
            <div className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900">
                      <GitBranch className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold">Current hierarchy route</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      The active posting path determines both the account label context and the generated code below.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Target code</p>
                    <p className="mt-2 text-lg font-bold tracking-[0.1em] text-slate-900">{glAccountCode || '----'}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
                  {[
                    { step: '01', title: 'Account ID', value: selectedClassOption.label, accent: 'border-blue-200 bg-blue-50' },
                    { step: '02', title: 'Category', value: selectedGlCategory.label, accent: 'border-sky-200 bg-sky-50' },
                    { step: '03', title: 'Chart', value: glChartOfAccount, accent: 'border-amber-200 bg-amber-50' },
                    { step: '04', title: 'Detail', value: glAccountDetail || 'Account detail not set yet', accent: 'border-emerald-200 bg-emerald-50' },
                  ].map((item, index) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className={`min-w-0 flex-1 rounded-2xl border p-4 ${item.accent}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Level {item.step}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.value}</p>
                      </div>
                      {index < 3 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 lg:block" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Level 1 editor</p>
                      <p className="mt-1 text-xs text-slate-500">Rename the selected account class label.</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Account ID</Badge>
                  </div>
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    Active: {selectedClassOption.label}
                  </div>
                  <div className="mt-4 space-y-3">
                    <Input value={glLevel1Draft} onChange={(event) => setGlLevel1Draft(event.target.value)} />
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" onClick={saveAccountIdLevel}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Save Level 1
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Level 2 editor</p>
                      <p className="mt-1 text-xs text-slate-500">Create, rename, or prune categories under the active class.</p>
                    </div>
                    <Badge className="bg-sky-100 text-sky-700">Category</Badge>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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

                <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Level 3 editor</p>
                      <p className="mt-1 text-xs text-slate-500">Refine the chart-of-account node inside the current category.</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">Chart</Badge>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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

                <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Level 4 editor</p>
                      <p className="mt-1 text-xs text-slate-500">Manage the posting detail that drives the final GL account code.</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Detail</Badge>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.8)]">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-300" />
                  <p className="text-sm font-semibold">Selection preview</p>
                </div>
                <div className="mt-4 space-y-3">
                  {[selectedClassOption.label, selectedGlCategory.label, glChartOfAccount, glAccountDetail || 'Account detail not set yet'].map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-blue-100">
                        {index + 1}
                      </span>
                      <p className="text-sm text-white/90">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">Hierarchy snapshot</p>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Class</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedClassOption.label}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Category</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedGlCategory.label}</p>

                    <div className="mt-4 space-y-3">
                      {selectedGlCategory.charts.map((chart) => {
                        const isActiveChart = chart.label === glChartOfAccount;
                        return (
                          <div
                            key={chart.label}
                            className={`rounded-2xl border p-3 transition-colors ${
                              isActiveChart ? 'border-amber-200 bg-amber-50/80' : 'border-slate-200 bg-slate-50/70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{chart.label}</p>
                                <p className="mt-1 text-xs text-slate-500">{chart.details.length} posting detail(s)</p>
                              </div>
                              {isActiveChart && <Badge className="bg-amber-100 text-amber-700">Active</Badge>}
                            </div>
                            {isActiveChart && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {chart.details.map((detail) => (
                                  <Badge
                                    key={detail}
                                    variant="outline"
                                    className={
                                      detail === glAccountDetail
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-white text-slate-700'
                                    }
                                  >
                                    {detail}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

      <Card className="order-1 xl:order-1">
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
                    <p><span className="font-medium text-slate-700">Behavior:</span> {getAccountBehaviorSummary(account.accountClass)}</p>
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

      <div className="bg-white rounded-lg border shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'asset-register', label: 'Asset Register', icon: FolderOpen },
            { id: 'asset-depreciation', label: 'Asset Depreciation', icon: Calculator },
            { id: 'asset-revaluation', label: 'Asset Revaluation', icon: Sparkles },
            { id: 'asset-transfer', label: 'Asset Transfer', icon: GitBranch },
            { id: 'asset-disposal', label: 'Asset Disposal', icon: Trash2 },
            { id: 'insurance-claim', label: 'Asset Insurance', icon: FileText },
          ].map((item) => (
            <Button
              key={item.id}
              variant={assetManagementView === item.id ? 'default' : 'ghost'}
              className="flex-1 min-w-[190px]"
              onClick={() => setAssetManagementView(item.id as AssetManagementView)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {assetManagementView === 'asset-register' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetRegisterView === 'setup' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetRegisterView('setup')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Asset Register Setup
              </Button>
              <Button
                variant={assetRegisterView === 'edit' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetRegisterView('edit')}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Asset Register Edit
              </Button>
              <Button
                variant={assetRegisterView === 'report' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetRegisterView('report')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Asset Register Report
              </Button>
            </div>
          </div>

          {assetRegisterView === 'setup' ? (
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/20">Fixed Assets</Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">
                      Registration Workspace
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">Asset Registration Form</h3>
                    <p className="mt-1 text-sm text-slate-200">
                      Capture asset identity, procurement details, departmental custody, and accounting links in one controlled record.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Reference</p>
                    <p className="mt-1 text-sm font-semibold">{assetRegisterForm.assetReferenceNo || 'Draft'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Status</p>
                    <p className="mt-1 text-sm font-semibold">{assetRegisterForm.status || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Purchase Cost</p>
                    <p className="mt-1 text-sm font-semibold">
                      {assetRegisterForm.purchaseCost
                        ? formatCurrency(Number.parseFloat(assetRegisterForm.purchaseCost) || 0)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="space-y-6 bg-slate-50/60 p-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">Asset Identity</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Define the core reference and identification details for this asset.
                        </p>
                      </div>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        Mandatory Core Data
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Asset Reference No</label>
                        <Input
                          readOnly
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.assetReferenceNo}
                          placeholder="ASREG260000001"
                        />
                      </div>
                      <div className="space-y-2 xl:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Asset Name</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.assetName}
                          onChange={(event) => handleAssetRegisterFormChange('assetName', event.target.value)}
                          placeholder="Enter asset name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Asset Sector</label>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <Select
                              value={assetRegisterForm.assetCategory}
                              onValueChange={(value) => handleAssetRegisterFormChange('assetCategory', value)}
                            >
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                                <SelectValue placeholder="Auto-classified from asset name" />
                              </SelectTrigger>
                              <SelectContent>
                                {assetSectorConfigs.map((sector) => (
                                  <SelectItem key={sector.name} value={sector.name}>
                                    {sector.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[360px] space-y-4 p-4">
                              <div>
                                <h5 className="text-sm font-semibold text-slate-900">Asset Sector Setup</h5>
                                <p className="mt-1 text-xs text-slate-500">
                                  Add a new sector or remove one that is not yet used in the register.
                                </p>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Asset Sector Name</label>
                                  <Input
                                    className="border-slate-300 bg-white focus-visible:ring-emerald-500"
                                    value={assetSectorDraft.name}
                                    onChange={(event) => {
                                      setAssetSectorDraft((prev) => ({ ...prev, name: event.target.value }));
                                      if (assetSectorError) {
                                        setAssetSectorError(null);
                                      }
                                    }}
                                    placeholder="e.g. Dental Equipment"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Linked Asset Category</label>
                                  <Select
                                    value={assetSectorDraft.accountingCategory}
                                    onValueChange={(value) => {
                                      setAssetSectorDraft((prev) => ({
                                        ...prev,
                                        accountingCategory: value as DepreciationAssetCategory,
                                      }));
                                      if (assetSectorError) {
                                        setAssetSectorError(null);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="border-slate-300 bg-white focus:ring-emerald-500">
                                      <SelectValue placeholder="Choose linked category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DEPRECIATION_ASSET_CATEGORY_OPTIONS.map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleAddAssetSector}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Sector
                                </Button>
                              </div>
                              {assetSectorError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                  {assetSectorError}
                                </div>
                              ) : null}
                              <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current Sectors</p>
                                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                  {assetSectorConfigs.map((sector) => (
                                    <div
                                      key={sector.name}
                                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{sector.name}</p>
                                        <p className="text-xs text-slate-500">{sector.accountingCategory}</p>
                                      </div>
                                      <button
                                        type="button"
                                        className="rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                        onClick={() => handleRemoveAssetSector(sector.name)}
                                        aria-label={`Remove ${sector.name}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <p className="text-xs text-slate-500">
                          The system classifies this automatically as you type the asset name.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Asset Category</label>
                        <Select
                          disabled
                          value={assetRegisterForm.assetAccountingCategory}
                          onValueChange={(value) => handleAssetRegisterFormChange('assetAccountingCategory', value)}
                        >
                          <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                            <SelectValue placeholder="Auto-classified from asset sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPRECIATION_ASSET_CATEGORY_OPTIONS.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Serial Number</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.serialNumber}
                          onChange={(event) => handleAssetRegisterFormChange('serialNumber', event.target.value)}
                          placeholder="Serial number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Model Number</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.modelNumber}
                          onChange={(event) => handleAssetRegisterFormChange('modelNumber', event.target.value)}
                          placeholder="Model number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Asset Tag</label>
                        <Input
                          readOnly
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.assetTag}
                          placeholder="AKOBI/LAB/2600001"
                        />
                        <p className="text-xs text-slate-500">
                          Auto-generated from category code, transaction year, and yearly running number.
                        </p>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Manufacturer</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.manufacturer}
                          onChange={(event) => handleAssetRegisterFormChange('manufacturer', event.target.value)}
                          placeholder="Manufacturer"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Asset Acquisition</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.assetAcquisition}
                          onChange={(event) => handleAssetRegisterFormChange('assetAcquisition', event.target.value)}
                          placeholder="Direct purchase / donation / lease"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">Procurement Details</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Record the commercial and warranty information tied to the acquisition.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Purchase Date</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          type="date"
                          value={assetRegisterForm.purchaseDate}
                          onChange={(event) => handleAssetRegisterFormChange('purchaseDate', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Purchase Cost</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          type="number"
                          min="0"
                          step="0.01"
                          value={assetRegisterForm.purchaseCost}
                          onChange={(event) => handleAssetRegisterFormChange('purchaseCost', event.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Warranty Expiry Date</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          type="date"
                          value={assetRegisterForm.warrantyExpiryDate}
                          onChange={(event) => handleAssetRegisterFormChange('warrantyExpiryDate', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2 xl:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Supplier</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.supplier}
                          onChange={(event) => handleAssetRegisterFormChange('supplier', event.target.value)}
                          placeholder="Supplier name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Useful Life</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.usefulLife}
                          onChange={(event) => handleAssetRegisterFormChange('usefulLife', event.target.value)}
                          placeholder="5 years"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">Assignment & Control</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Set who holds the asset, where it is used, and its operational state.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Location</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.location}
                          onChange={(event) => handleAssetRegisterFormChange('location', event.target.value)}
                          placeholder="Location"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Department</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.department}
                          onChange={(event) => handleAssetRegisterFormChange('department', event.target.value)}
                          placeholder="Department"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Custodian / Person In Charge</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetRegisterForm.custodian}
                          onChange={(event) => handleAssetRegisterFormChange('custodian', event.target.value)}
                          placeholder="Responsible officer"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Condition</label>
                          <Select
                            value={assetRegisterForm.condition}
                            onValueChange={(value) => handleAssetRegisterFormChange('condition', value)}
                          >
                            <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((value) => (
                                <SelectItem key={value} value={value}>{value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Status</label>
                          <Select
                            value={assetRegisterForm.status}
                            onValueChange={(value) => handleAssetRegisterFormChange('status', value)}
                          >
                            <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {['Active', 'Under Service', 'Inactive', 'Transferred', 'Disposed'].map((value) => (
                                <SelectItem key={value} value={value}>{value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">Accounting Linkage</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Attach the asset to the correct debit and credit GL accounts for controlled posting.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Account To Debit</label>
                        <SearchableSelect
                          value={assetRegisterForm.debitAccountId}
                          onValueChange={(value) => handleAssetRegisterFormChange('debitAccountId', value)}
                          options={searchableAssetRegisterAccountOptions}
                          placeholder="Search debit account"
                          searchPlaceholder="Search debit account by number or name..."
                          emptyMessage="No matching debit account found."
                          className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Account To Credit</label>
                        <SearchableSelect
                          value={assetRegisterForm.creditAccountId}
                          onValueChange={(value) => handleAssetRegisterFormChange('creditAccountId', value)}
                          options={searchableAssetRegisterAccountOptions}
                          placeholder="Search credit account"
                          searchPlaceholder="Search credit account by number or name..."
                          emptyMessage="No matching credit account found."
                          className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">Asset Image</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Attach a visual reference to help future verification and physical inspection.
                      </p>
                    </div>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <Input
                        className="border-slate-300 bg-white focus-visible:ring-blue-500"
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleAssetRegisterFormChange(
                            'assetImageName',
                            event.target.files?.[0]?.name || '',
                          )
                        }
                      />
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>Accepted formats: JPG, PNG, WEBP</span>
                        <span>{assetRegisterForm.assetImageName || 'No file selected'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {assetRegisterError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                  {assetRegisterError}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ready to register this asset?</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Save the current draft to the asset register or clear the form to start a new record.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300"
                    onClick={() => resetAssetRegisterForm(assetRegister)}
                  >
                    Clear Form
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAssetRegisterSubmit}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Asset Register
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : assetRegisterView === 'edit' ? (
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Edit Workspace</p>
                  <h3 className="mt-2 text-2xl font-semibold">Asset Register Edit</h3>
                  <p className="mt-1 max-w-3xl text-sm text-slate-200">
                    Select an existing asset reference number, bring back everything already registered, and update any field using the same professional structure as the asset registration form.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100">Asset Selected</p>
                    <p className="mt-2 text-sm font-semibold">{selectedAssetRegisterId || 'No selection yet'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100">Status</p>
                    <p className="mt-2 text-sm font-semibold">{assetRegisterEditForm?.status || 'Waiting for load'}</p>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 bg-slate-50/60 p-6">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 shadow-sm">
                <p className="text-sm font-semibold text-blue-900">Updated Asset Register Edit</p>
                <p className="mt-1 text-sm text-blue-700">
                  Select the asset reference number first, then the full registered asset record loads back into this standard edit form for changes.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Select Asset Reference No</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick any registered asset reference number to bring back all the saved details for editing.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Asset Reference Dropdown</label>
                    <Select value={selectedAssetRegisterId} onValueChange={setSelectedAssetRegisterId}>
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select asset reference number" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetRegister.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.id} - {asset.asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selected Record</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedAssetRegisterId || 'No asset selected yet'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Once you pick the reference number, the full registered asset record loads below for editing.
                    </p>
                  </div>
                </div>
              </div>
              {assetRegisterEditForm ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-base font-semibold text-slate-900">Asset Identity</h4>
                            <p className="mt-1 text-sm text-slate-500">
                              Start with the saved asset reference number, then update the core identity and classification details.
                            </p>
                          </div>
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                            Existing Registered Asset
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Asset Reference No</label>
                            <Input
                              readOnly
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.assetReferenceNo}
                            />
                          </div>
                          <div className="space-y-2 xl:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Asset Name</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.assetName}
                              onChange={(event) => handleAssetRegisterEditFormChange('assetName', event.target.value)}
                              placeholder="Enter asset name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Asset Sector</label>
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <Select
                                  value={assetRegisterEditForm.assetCategory}
                                  onValueChange={(value) => handleAssetRegisterEditFormChange('assetCategory', value)}
                                >
                                  <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                                    <SelectValue placeholder="Auto-classified from asset name" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {assetSectorConfigs.map((sector) => (
                                      <SelectItem key={sector.name} value={sector.name}>
                                        {sector.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-[360px] space-y-4 p-4">
                                  <div>
                                    <h5 className="text-sm font-semibold text-slate-900">Asset Sector Setup</h5>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Add a new sector or remove one that is not yet used in the register.
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Asset Sector Name</label>
                                      <Input
                                        className="border-slate-300 bg-white focus-visible:ring-emerald-500"
                                        value={assetSectorDraft.name}
                                        onChange={(event) => {
                                          setAssetSectorDraft((prev) => ({ ...prev, name: event.target.value }));
                                          if (assetSectorError) {
                                            setAssetSectorError(null);
                                          }
                                        }}
                                        placeholder="e.g. Dental Equipment"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Linked Asset Category</label>
                                      <Select
                                        value={assetSectorDraft.accountingCategory}
                                        onValueChange={(value) => {
                                          setAssetSectorDraft((prev) => ({
                                            ...prev,
                                            accountingCategory: value as DepreciationAssetCategory,
                                          }));
                                          if (assetSectorError) {
                                            setAssetSectorError(null);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="border-slate-300 bg-white focus:ring-emerald-500">
                                          <SelectValue placeholder="Choose linked category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {DEPRECIATION_ASSET_CATEGORY_OPTIONS.map((category) => (
                                            <SelectItem key={category} value={category}>
                                              {category}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleAddAssetSector}>
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add Sector
                                    </Button>
                                  </div>
                                  {assetSectorError ? (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                      {assetSectorError}
                                    </div>
                                  ) : null}
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current Sectors</p>
                                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                      {assetSectorConfigs.map((sector) => (
                                        <div
                                          key={sector.name}
                                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">{sector.name}</p>
                                            <p className="text-xs text-slate-500">{sector.accountingCategory}</p>
                                          </div>
                                          <button
                                            type="button"
                                            className="rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                            onClick={() => handleRemoveAssetSector(sector.name)}
                                            aria-label={`Remove ${sector.name}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <p className="text-xs text-slate-500">
                              Everything already saved for this asset is loaded back once you choose the reference number.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Asset Category</label>
                            <Select
                              disabled
                              value={assetRegisterEditForm.assetAccountingCategory}
                              onValueChange={(value) => handleAssetRegisterEditFormChange('assetAccountingCategory', value)}
                            >
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                                <SelectValue placeholder="Auto-classified from asset sector" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEPRECIATION_ASSET_CATEGORY_OPTIONS.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Serial Number</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.serialNumber}
                              onChange={(event) => handleAssetRegisterEditFormChange('serialNumber', event.target.value)}
                              placeholder="Serial number"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Model Number</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.modelNumber}
                              onChange={(event) => handleAssetRegisterEditFormChange('modelNumber', event.target.value)}
                              placeholder="Model number"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Asset Tag</label>
                            <Input
                              readOnly
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.assetTag}
                              placeholder="AKOBI/LAB/2600001"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Manufacturer</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.manufacturer}
                              onChange={(event) => handleAssetRegisterEditFormChange('manufacturer', event.target.value)}
                              placeholder="Manufacturer"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Asset Acquisition</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.assetAcquisition}
                              onChange={(event) => handleAssetRegisterEditFormChange('assetAcquisition', event.target.value)}
                              placeholder="Direct purchase / donation / lease"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">Procurement Details</h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Review and amend the commercial, supplier, and warranty information already saved for the asset.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Purchase Date</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              type="date"
                              value={assetRegisterEditForm.purchaseDate}
                              onChange={(event) => handleAssetRegisterEditFormChange('purchaseDate', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Purchase Cost</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              type="number"
                              min="0"
                              step="0.01"
                              value={assetRegisterEditForm.purchaseCost}
                              onChange={(event) => handleAssetRegisterEditFormChange('purchaseCost', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Warranty Expiry Date</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              type="date"
                              value={assetRegisterEditForm.warrantyExpiryDate}
                              onChange={(event) => handleAssetRegisterEditFormChange('warrantyExpiryDate', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Supplier</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.supplier}
                              onChange={(event) => handleAssetRegisterEditFormChange('supplier', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Useful Life</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.usefulLife}
                              onChange={(event) => handleAssetRegisterEditFormChange('usefulLife', event.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">Assignment & Control</h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Update location, department, custodian, condition, and lifecycle status for this asset.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Location</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.location}
                              onChange={(event) => handleAssetRegisterEditFormChange('location', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Department</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.department}
                              onChange={(event) => handleAssetRegisterEditFormChange('department', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Custodian / Person In Charge</label>
                            <Input
                              className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                              value={assetRegisterEditForm.custodian}
                              onChange={(event) => handleAssetRegisterEditFormChange('custodian', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Condition</label>
                            <Select
                              value={assetRegisterEditForm.condition}
                              onValueChange={(value) => handleAssetRegisterEditFormChange('condition', value)}
                            >
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((value) => (
                                  <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <Select
                              value={assetRegisterEditForm.status}
                              onValueChange={(value) => handleAssetRegisterEditFormChange('status', value)}
                            >
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Active', 'Under Service', 'Inactive', 'Transferred', 'Disposed'].map((value) => (
                                  <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">Accounting Linkage</h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Confirm the debit and credit GL accounts linked to this asset record.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account To Debit</label>
                            <SearchableSelect
                              value={assetRegisterEditForm.debitAccountId}
                              onValueChange={(value) => handleAssetRegisterEditFormChange('debitAccountId', value)}
                              options={searchableAssetRegisterAccountOptions}
                              placeholder="Search debit account"
                              searchPlaceholder="Search debit account by number or name..."
                              emptyMessage="No matching debit account found."
                              className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account To Credit</label>
                            <SearchableSelect
                              value={assetRegisterEditForm.creditAccountId}
                              onValueChange={(value) => handleAssetRegisterEditFormChange('creditAccountId', value)}
                              options={searchableAssetRegisterAccountOptions}
                              placeholder="Search credit account"
                              searchPlaceholder="Search credit account by number or name..."
                              emptyMessage="No matching credit account found."
                              className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">Loaded Asset Snapshot</p>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-700">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Current Value</p>
                            <p className="mt-1 font-semibold">
                              {assetRegisterEditForm.purchaseCost
                                ? formatCurrency(Number.parseFloat(assetRegisterEditForm.purchaseCost) || 0)
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Asset Tag</p>
                            <p className="mt-1 font-semibold">{assetRegisterEditForm.assetTag || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {assetRegisterEditError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                      {assetRegisterEditError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Save the updated asset record</p>
                      <p className="mt-1 text-sm text-slate-500">
                        The edited asset will overwrite the previous registration details and remain linked to its original reference number.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" className="border-slate-300" onClick={() => setSelectedAssetRegisterId('')}>
                        Clear Selection
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateAssetRegister}>
                        <Save className="mr-2 h-4 w-4" />
                        Update Asset Register
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <Pencil className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">Choose an asset record to edit</p>
                  <p className="mt-1 text-sm text-slate-500">
                    The edit form will load here after you select an asset from the register.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Asset Register Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Sector</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Custodian</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Condition</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Debit Account</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Credit Account</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Purchase Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assetRegister.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{asset.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="font-medium">{asset.asset}</div>
                          <div className="text-xs text-slate-500">
                            {asset.serialNumber || 'No serial number'} {asset.modelNumber ? `| ${asset.modelNumber}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.assetAccountingCategory || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.department || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.location}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.custodian || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.condition || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={asset.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.debitAccountDisplay || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{asset.creditAccountDisplay || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(asset.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      ) : assetManagementView === 'asset-depreciation' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetDepreciationView === 'setup' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetDepreciationView('setup')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Depreciation Setup
              </Button>
              <Button
                variant={assetDepreciationView === 'report' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetDepreciationView('report')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Depreciation Report
              </Button>
            </div>
          </div>

          {assetDepreciationView === 'setup' ? (
          <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/20">Depreciation Control</Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20">
                      Setup Workspace
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">Depreciation Setup</h3>
                  <p className="mt-1 text-sm text-slate-200">
                    Configure how asset groups depreciate by category, account group, frequency, and rate.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Method</p>
                    <p className="mt-1 text-sm font-semibold">{assetDepreciationSetupForm.depreciationMethod || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Frequency</p>
                    <p className="mt-1 text-sm font-semibold">{assetDepreciationSetupForm.depreciationFrequency || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Rate</p>
                    <p className="mt-1 text-sm font-semibold">
                      {assetDepreciationSetupForm.depreciationRate
                        ? `${assetDepreciationSetupForm.depreciationRate}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 bg-slate-50/60 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Depreciation Setup Form</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Define the policy inputs that will drive depreciation calculations for each asset group.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Depreciation Method</label>
                    <Select
                      value={assetDepreciationSetupForm.depreciationMethod}
                      onValueChange={(value) => handleAssetDepreciationSetupFormChange('depreciationMethod', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPRECIATION_METHOD_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Useful Life</label>
                    <Input
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetDepreciationSetupForm.usefulLife}
                      onChange={(event) => handleAssetDepreciationSetupFormChange('usefulLife', event.target.value)}
                      placeholder="5 years"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Residual / Salvage Value</label>
                    <Input
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      type="number"
                      min="0"
                      step="0.01"
                      value={assetDepreciationSetupForm.residualValue}
                      onChange={(event) => handleAssetDepreciationSetupFormChange('residualValue', event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Depreciation Start Date</label>
                    <Input
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      type="date"
                      value={assetDepreciationSetupForm.depreciationStartDate}
                      onChange={(event) => handleAssetDepreciationSetupFormChange('depreciationStartDate', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Depreciation Frequency</label>
                    <Select
                      value={assetDepreciationSetupForm.depreciationFrequency}
                      onValueChange={(value) => handleAssetDepreciationSetupFormChange('depreciationFrequency', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPRECIATION_FREQUENCY_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Depreciation Rate</label>
                    <Input
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      type="number"
                      min="0"
                      step="0.01"
                      value={assetDepreciationSetupForm.depreciationRate}
                      onChange={(event) => handleAssetDepreciationSetupFormChange('depreciationRate', event.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Asset Category</label>
                    <Select
                      value={assetDepreciationSetupForm.assetCategory}
                      onValueChange={(value) => handleAssetDepreciationSetupFormChange('assetCategory', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select asset category" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPRECIATION_ASSET_CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Account Group</label>
                    <Select
                      value={assetDepreciationSetupForm.accountGroup}
                      onValueChange={(value) => handleAssetDepreciationSetupFormChange('accountGroup', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select chart of account GL" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetChartOfAccountOptions.map((group) => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">P&amp;L Account to Debit</label>
                    <SearchableSelect
                      value={assetDepreciationSetupForm.pnlDebitAccount}
                      onValueChange={(value) => handleAssetDepreciationSetupFormChange('pnlDebitAccount', value)}
                      options={searchableDepreciationExpenseAccountOptions}
                      placeholder="Search depreciation expense account"
                      searchPlaceholder="Search P&L debit account by number or name..."
                      emptyMessage="No matching depreciation expense account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-3">
                    <label className="text-sm font-medium text-slate-700">Accumulated Depreciation to Credit</label>
                    <SearchableSelect
                      value={assetDepreciationSetupForm.accumulatedDepreciationCreditAccount}
                      onValueChange={(value) =>
                        handleAssetDepreciationSetupFormChange(
                          'accumulatedDepreciationCreditAccount',
                          value,
                        )
                      }
                      options={searchableAccumulatedDepreciationCreditOptions}
                      placeholder="Search accumulated depreciation account"
                      searchPlaceholder="Search accumulated depreciation credit account..."
                      emptyMessage="No matching accumulated depreciation account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {assetDepreciationSetupError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                  {assetDepreciationSetupError}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Save this depreciation policy</p>
                  <p className="mt-1 text-sm text-slate-500">
                    The saved setup becomes the control reference for assets that sit under the selected account group and category.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300"
                    onClick={resetAssetDepreciationSetupForm}
                  >
                    Clear Form
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetDepreciationSetup}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Depreciation Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Report</CardTitle>
            </CardHeader>
            <CardContent>
              {assetDepreciationReportRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <Calculator className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">No matching assets are ready for depreciation yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Save a depreciation setup and make sure the asset register has assets under the same account group and asset category.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Report Template</p>
                        <h4 className="mt-2 text-2xl font-semibold tracking-tight">Depreciation Report</h4>
                        <p className="mt-1 text-sm text-slate-200">
                          Asset-by-asset depreciation schedule showing setup policy, P&amp;L debit, accumulated depreciation credit, and current period movement.
                        </p>
                        <div className="mt-4 max-w-md space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">View</label>
                          <Select
                            value={selectedDepreciationReportView}
                            onValueChange={setSelectedDepreciationReportView}
                          >
                            <SelectTrigger className="border-white/20 bg-white/10 text-white focus:ring-white/30">
                              <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                              {depreciationReportViewOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                            onClick={handleExportAssetDepreciationReportExcel}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Excel
                          </Button>
                          <Button
                            type="button"
                            className="bg-white text-slate-900 hover:bg-slate-100"
                            onClick={handleExportAssetDepreciationReportPdf}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Export PDF
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Assets Loaded</p>
                          <p className="mt-1 text-lg font-semibold">{filteredAssetDepreciationReportRows.length}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Total Charge</p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatCurrency(filteredAssetDepreciationReportRows.reduce((sum, row) => sum + row.depreciationCharge, 0))}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Closing Value</p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatCurrency(filteredAssetDepreciationReportRows.reduce((sum, row) => sum + row.closingValue, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredAssetDepreciationReportRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <FileText className="mx-auto h-10 w-10 text-slate-400" />
                      <p className="mt-3 text-sm font-medium text-slate-700">No depreciation rows in this category view</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Switch the category filter or update the depreciation setup to include this category.
                      </p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[1800px]">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">S/N</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ref No</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Category</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account Sector</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Useful Life</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frequency</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rate</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Residual Value</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">P&amp;L Debit GL</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Accumulated Depreciation Credit GL</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {categoryGroupedAssetDepreciationReportRows.map((row) =>
                          row.type === 'subtotal' ? (
                            <tr key={`subtotal-${row.category}`} className="bg-slate-100">
                              <td colSpan={9} className="px-4 py-3 text-sm font-semibold text-slate-900">
                                {row.category} Total
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                {formatCurrency(row.amount)}
                              </td>
                              <td colSpan={3} className="px-4 py-3" />
                            </tr>
                          ) : (
                            <tr key={`${row.asset.setupId}-${row.asset.assetId}`} className="hover:bg-gray-50 align-top">
                              <td className="px-4 py-3 text-sm text-gray-700">{row.serialNumber}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.asset.referenceNo}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.assetCategory}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="font-medium">{row.asset.assetSector}</div>
                                <div className="text-xs text-slate-500">{row.asset.accountGroup}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.method}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.usefulLife}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.frequency}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.depreciationRate}%</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold">
                                {formatCurrency(Number.parseFloat(row.asset.residualValue || '0') || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                                {formatCurrency(row.asset.depreciationCharge)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.pnlDebitAccount}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.accumulatedDepreciationCreditAccount}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.asset.depreciationStartDate}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Saved Depreciation Setups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Setup ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account Group</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Useful Life</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frequency</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Residual Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">P&amp;L Debit Account</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Accumulated Depreciation Credit</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assetDepreciationSetups.map((setup) => (
                      <tr key={setup.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{setup.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.assetCategory}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.accountGroup}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.depreciationMethod}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.usefulLife}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.depreciationFrequency}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{setup.depreciationRate}%</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {formatCurrency(Number.parseFloat(setup.residualValue || '0') || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.pnlDebitAccount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.accumulatedDepreciationCreditAccount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setup.depreciationStartDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : assetManagementView === 'asset-revaluation' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetRevaluationView === 'setup' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetRevaluationView('setup')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Valuation Setup
              </Button>
              <Button
                variant={assetRevaluationView === 'report' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetRevaluationView('report')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Valuation Report
              </Button>
            </div>
          </div>

          {assetRevaluationView === 'setup' ? (
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/20">Asset Value Control</Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20">Revaluation Workspace</Badge>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">Valuation Setup</h3>
                  <p className="mt-1 text-sm text-slate-200">
                    Document revaluation decisions with valuation evidence, accounting routing, and the movement from old book value to the new carrying amount.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[460px]">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Reference</p>
                    <p className="mt-1 text-sm font-semibold">{assetRevaluationForm.assetReferenceNo || 'Select asset'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Old Book Value</p>
                    <p className="mt-1 text-sm font-semibold">
                      {assetRevaluationForm.oldBookValue
                        ? formatCurrency(Number.parseFloat(assetRevaluationForm.oldBookValue) || 0)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Difference</p>
                    <p className="mt-1 text-sm font-semibold">
                      {assetRevaluationForm.revaluationDifference
                        ? formatCurrency(Number.parseFloat(assetRevaluationForm.revaluationDifference) || 0)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 bg-slate-50/60 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Revaluation Inputs</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Capture the valuation event, control reference, valuation support, and accounting impact in one professional record.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Asset Reference Number</label>
                    <Select
                      value={assetRevaluationForm.assetReferenceNo}
                      onValueChange={(value) => handleAssetRevaluationFormChange('assetReferenceNo', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select asset reference number" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetRegister.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.id} - {asset.asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Revaluation Date</label>
                    <Input
                      type="date"
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.revaluationDate}
                      onChange={(event) => handleAssetRevaluationFormChange('revaluationDate', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Revaluation Type</label>
                    <Select
                      value={assetRevaluationForm.revaluationType}
                      onValueChange={(value) => handleAssetRevaluationFormChange('revaluationType', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select revaluation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Upward Revaluation', 'Downward Revaluation', 'Fair Value Review', 'Impairment Adjustment'].map((value) => (
                          <SelectItem key={value} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Old Book Value</label>
                    <Input
                      readOnly
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.oldBookValue}
                      placeholder="Auto-filled from asset register"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">New Revalued Amount</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.newRevaluedAmount}
                      onChange={(event) => handleAssetRevaluationFormChange('newRevaluedAmount', event.target.value)}
                      placeholder="Enter new revalued amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Revaluation Difference</label>
                    <Input
                      readOnly
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.revaluationDifference}
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div className="space-y-2 xl:col-span-3">
                    <label className="text-sm font-medium text-slate-700">Reason for Revaluation</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.reasonForRevaluation}
                      onChange={(event) => handleAssetRevaluationFormChange('reasonForRevaluation', event.target.value)}
                      placeholder="State why the asset requires revaluation..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valuation Method</label>
                    <Select
                      value={assetRevaluationForm.valuationMethod}
                      onValueChange={(value) => handleAssetRevaluationFormChange('valuationMethod', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select valuation method" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Market Comparison', 'Replacement Cost', 'Income Approach', 'Indexed Historical Cost', 'Independent Professional Valuation'].map((value) => (
                          <SelectItem key={value} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valuer Name</label>
                    <Input
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.valuerName}
                      onChange={(event) => handleAssetRevaluationFormChange('valuerName', event.target.value)}
                      placeholder="Enter valuer or approving authority"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valuation Report Number</label>
                    <Input
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetRevaluationForm.valuationReportNumber}
                      onChange={(event) => handleAssetRevaluationFormChange('valuationReportNumber', event.target.value)}
                      placeholder="Enter report number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Accounting Section</label>
                    <Select
                      value={assetRevaluationForm.accountingSection}
                      onValueChange={(value) => handleAssetRevaluationFormChange('accountingSection', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select accounting section" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetChartOfAccountOptions.map((group) => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Account to Debit</label>
                    <SearchableSelect
                      value={assetRevaluationForm.debitAccountId}
                      onValueChange={(value) => handleAssetRevaluationFormChange('debitAccountId', value)}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search debit account"
                      searchPlaceholder="Search debit account by number or name..."
                      emptyMessage="No matching debit account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2 xl:col-span-3">
                    <label className="text-sm font-medium text-slate-700">Account to Credit</label>
                    <SearchableSelect
                      value={assetRevaluationForm.creditAccountId}
                      onValueChange={(value) => handleAssetRevaluationFormChange('creditAccountId', value)}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search credit account"
                      searchPlaceholder="Search credit account by number or name..."
                      emptyMessage="No matching credit account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {assetRevaluationError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                  {assetRevaluationError}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Save this revaluation decision</p>
                  <p className="mt-1 text-sm text-slate-500">
                    The saved revaluation becomes part of the asset value history and preserves the accounting routing used for the adjustment.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300"
                    onClick={resetAssetRevaluationForm}
                  >
                    Clear Form
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetRevaluation}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Revaluation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Valuation Report</CardTitle>
            </CardHeader>
            <CardContent>
              {assetRevaluationRegister.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">No valuation report entries yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Save a valuation setup record and the report will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1900px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ref ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Reference</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sector</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Old Book Value</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">New Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Difference</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valuation Method</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valuer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Report No.</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Accounting Section</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Debit Account</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Credit Account</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assetRevaluationRegister.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 align-top">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.assetReferenceNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="font-medium">{record.assetName}</div>
                            <div className="text-xs text-slate-500">{record.reasonForRevaluation}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.assetCategory}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.assetSector}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.revaluationDate}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.revaluationType}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(record.oldBookValue)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(record.newRevaluedAmount)}</td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${record.revaluationDifference >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                            {formatCurrency(record.revaluationDifference)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.valuationMethod}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.valuerName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.valuationReportNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.accountingSection}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.debitAccountDisplay}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.creditAccountDisplay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      ) : assetManagementView === 'asset-transfer' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetTransferView === 'setup' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetTransferView('setup')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Transfer Setup
              </Button>
              <Button
                variant={assetTransferView === 'report' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetTransferView('report')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Transfer Report
              </Button>
            </div>
          </div>

          {assetTransferView === 'setup' ? (
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/20">Transfer Control</Badge>
                    <Badge className="bg-sky-500/20 text-sky-100 hover:bg-sky-500/20">Movement Workspace</Badge>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">Asset Transfer Form</h3>
                  <p className="mt-1 text-sm text-slate-200">
                    Capture asset movement approvals, handover details, condition checks, and receiving evidence in one controlled transfer record.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[460px]">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Transfer No</p>
                    <p className="mt-1 text-sm font-semibold">{assetTransferForm.transferNo}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Asset</p>
                    <p className="mt-1 text-sm font-semibold">{selectedAssetForTransfer?.asset || 'Select asset'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Status</p>
                    <p className="mt-1 text-sm font-semibold">{assetTransferForm.status || 'Pending Approval'}</p>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 bg-slate-50/60 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Transfer Details</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Start with the control number, transfer date, movement type, transfer reason, and present workflow status.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Transfer No</label>
                    <Input
                      readOnly
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetTransferForm.transferNo}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Transfer Date</label>
                    <Input
                      type="date"
                      className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                      value={assetTransferForm.transferDate}
                      onChange={(event) => handleAssetTransferFormChange('transferDate', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Transfer Type</label>
                    <Select
                      value={assetTransferForm.transferType}
                      onValueChange={(value) => handleAssetTransferFormChange('transferType', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select transfer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Internal Department Transfer',
                          'Inter-Branch Transfer',
                          'Temporary Relocation',
                          'Custodian Change',
                          'Repair / Workshop Transfer',
                          'Emergency Relocation',
                        ].map((value) => (
                          <SelectItem key={value} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Reason for Transfer</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                      value={assetTransferForm.reasonForTransfer}
                      onChange={(event) => handleAssetTransferFormChange('reasonForTransfer', event.target.value)}
                      placeholder="State why this asset is being transferred..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <Select
                      value={assetTransferForm.status}
                      onValueChange={(value) => handleAssetTransferFormChange('status', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select transfer status" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Pending Approval', 'Approved', 'In Transit', 'Received', 'Completed', 'Cancelled'].map((value) => (
                          <SelectItem key={value} value={value}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Asset Identity</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick the asset code and let the system bring forward the key asset details for the transfer note.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Asset Code</label>
                    <Select
                      value={assetTransferForm.assetCode}
                      onValueChange={(value) => handleAssetTransferFormChange('assetCode', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select asset code" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetRegister.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.id} - {asset.asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Asset Name</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetTransferForm.assetName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetTransferForm.assetCategory} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Serial No</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetTransferForm.serialNumber} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Current Condition</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetTransferForm.currentCondition} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">FROM</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Record the department, location, custodian, and branch or hospital where the asset is leaving.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Department</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.fromDepartment} onChange={(event) => handleAssetTransferFormChange('fromDepartment', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.fromLocation} onChange={(event) => handleAssetTransferFormChange('fromLocation', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Custodian</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.fromCustodian} onChange={(event) => handleAssetTransferFormChange('fromCustodian', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Branch/Hospital</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.fromBranchHospital} onChange={(event) => handleAssetTransferFormChange('fromBranchHospital', event.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">TO</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Capture the department, location, custodian, and branch or hospital receiving the asset.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Department</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.toDepartment} onChange={(event) => handleAssetTransferFormChange('toDepartment', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.toLocation} onChange={(event) => handleAssetTransferFormChange('toLocation', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Custodian</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.toCustodian} onChange={(event) => handleAssetTransferFormChange('toCustodian', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Branch/Hospital</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.toBranchHospital} onChange={(event) => handleAssetTransferFormChange('toBranchHospital', event.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">Approval</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Track the request, approval, release, receipt, and any transfer comments.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Requested By</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.requestedBy} onChange={(event) => handleAssetTransferFormChange('requestedBy', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Approved By</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.approvedBy} onChange={(event) => handleAssetTransferFormChange('approvedBy', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Released By</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.releasedBy} onChange={(event) => handleAssetTransferFormChange('releasedBy', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Received By</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.receivedBy} onChange={(event) => handleAssetTransferFormChange('receivedBy', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Date Received</label>
                      <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetTransferForm.dateReceived} onChange={(event) => handleAssetTransferFormChange('dateReceived', event.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Comment</label>
                      <textarea
                        className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                        value={assetTransferForm.comment}
                        onChange={(event) => handleAssetTransferFormChange('comment', event.target.value)}
                        placeholder="Add release or receiving comment..."
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">Condition Check</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Confirm the pre-transfer and post-transfer condition with any damage note and attachment or photo reference.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Condition Before</label>
                      <Select
                        value={assetTransferForm.conditionBefore}
                        onValueChange={(value) => handleAssetTransferFormChange('conditionBefore', value)}
                      >
                        <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                          <SelectValue placeholder="Select condition before" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((value) => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Condition After</label>
                      <Select
                        value={assetTransferForm.conditionAfter}
                        onValueChange={(value) => handleAssetTransferFormChange('conditionAfter', value)}
                      >
                        <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                          <SelectValue placeholder="Select condition after" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((value) => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Damage Note</label>
                      <textarea
                        className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                        value={assetTransferForm.damageNote}
                        onChange={(event) => handleAssetTransferFormChange('damageNote', event.target.value)}
                        placeholder="Describe any damage, issue, or observation noted during the transfer..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Attachment/Photo</label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                        onChange={(event) => handleAssetTransferFormChange('attachmentName', event.target.files?.[0]?.name || '')}
                      />
                      <p className="text-xs text-slate-500">{assetTransferForm.attachmentName || 'No file selected'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Accounting</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the debit and credit accounts that should be used to route the asset transfer transaction.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Account to Debit</label>
                    <SearchableSelect
                      value={assetTransferForm.debitAccountId}
                      onValueChange={(value) => handleAssetTransferFormChange('debitAccountId', value)}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search debit account"
                      searchPlaceholder="Search debit account by number or name..."
                      emptyMessage="No matching debit account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Account to Credit</label>
                    <SearchableSelect
                      value={assetTransferForm.creditAccountId}
                      onValueChange={(value) => handleAssetTransferFormChange('creditAccountId', value)}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search credit account"
                      searchPlaceholder="Search credit account by number or name..."
                      emptyMessage="No matching credit account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {assetTransferError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                  {assetTransferError}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Save this transfer movement</p>
                  <p className="mt-1 text-sm text-slate-500">
                    The saved transfer becomes part of the asset movement history with its approvals, receiving note, and condition confirmation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300"
                    onClick={resetAssetTransferForm}
                  >
                    Clear Form
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetTransfer}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Transfer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Report</CardTitle>
            </CardHeader>
            <CardContent>
              {assetTransferRegister.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">No asset transfer records yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Save an asset transfer form and the movement report will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[2200px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Transfer No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Transfer Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Asset Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">From</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">To</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Requested By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Approved By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Released By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Received By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date Received</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Debit Account</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Credit Account</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Condition Check</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Attachment</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assetTransferRegister.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 align-top">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.transferDate}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.transferType}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.assetCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="font-medium">{record.assetName}</div>
                            <div className="text-xs text-slate-500">{record.reasonForTransfer}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.assetCategory}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="font-medium">{record.fromDepartment}</div>
                            <div className="text-xs text-slate-500">{record.fromLocation} | {record.fromCustodian}</div>
                            <div className="text-xs text-slate-500">{record.fromBranchHospital}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="font-medium">{record.toDepartment}</div>
                            <div className="text-xs text-slate-500">{record.toLocation} | {record.toCustodian}</div>
                            <div className="text-xs text-slate-500">{record.toBranchHospital}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.requestedBy}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.approvedBy || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.releasedBy || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.receivedBy || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.dateReceived || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.debitAccountDisplay || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.creditAccountDisplay || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div>Before: {record.conditionBefore}</div>
                            <div>After: {record.conditionAfter}</div>
                            <div className="text-xs text-slate-500">{record.damageNote || 'No damage note'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.attachmentName || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-blue-100 text-blue-700">{record.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      ) : assetManagementView === 'insurance-claim' ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white shadow-lg">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Insurance Control</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight">Asset Insurance Register</h3>
                    <p className="mt-2 max-w-3xl text-sm text-slate-200">
                      Capture policy information, premium payment, claim tracking, supporting documents, and renewal alerts for insured hospital assets.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Active</p>
                      <p className="mt-2 text-2xl font-semibold">{assetInsuranceSummary.activePolicies}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Renewal Due</p>
                      <p className="mt-2 text-2xl font-semibold">{assetInsuranceSummary.pendingRenewal}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Open Claims</p>
                      <p className="mt-2 text-2xl font-semibold">{assetInsuranceSummary.openClaims}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Sum Insured</p>
                      <p className="mt-2 text-2xl font-semibold">{formatCurrency(assetInsuranceSummary.totalSumInsured)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="bg-white rounded-lg border shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetInsuranceView === 'setup' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetInsuranceView('setup')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Insurance Setup
              </Button>
              <Button
                variant={assetInsuranceView === 'premium-payment' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetInsuranceView('premium-payment')}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Premium Payment
              </Button>
              <Button
                variant={assetInsuranceView === 'claim' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetInsuranceView('claim')}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Insurance Claim
              </Button>
              <Button
                variant={assetInsuranceView === 'report' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetInsuranceView('report')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Insurance Report
              </Button>
            </div>
          </div>

          {assetInsuranceView === 'setup' ? (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">1. Asset Details</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Select the asset and the system will fill the asset profile, purchase cost, and current net book value.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-2 xl:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Asset ID / Asset Code</label>
                      <SearchableSelect
                        value={assetInsuranceForm.assetCode}
                        onValueChange={(value) => handleAssetInsuranceFormChange('assetCode', value)}
                        options={assetRegister.map((asset) => ({
                          value: asset.id,
                          label: `${asset.id} - ${asset.asset}`,
                          description: `${asset.category} | ${asset.department} | ${asset.location}`,
                          keywords: `${asset.id} ${asset.asset} ${asset.category} ${asset.department} ${asset.location}`,
                        }))}
                        placeholder="Search asset code or name"
                        searchPlaceholder="Search asset code or name..."
                        emptyMessage="No matching asset found."
                        className="border-slate-300 bg-white focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Asset Name</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.assetName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Asset Category</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.assetCategory} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Department</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.department} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.location} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Asset Custodian</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.assetCustodian} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Purchase Cost</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.purchaseCost} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Current Net Book Value</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.currentNetBookValue} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Current Condition</label>
                      <Input readOnly className="border-slate-300 bg-white" value={assetInsuranceForm.currentCondition} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">2. Insurance Company Details</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      ['Insurance Company Name', 'insuranceCompanyName'],
                      ['Insurance Company Address', 'insuranceCompanyAddress'],
                      ['Contact Person', 'contactPerson'],
                      ['Phone Number', 'phoneNumber'],
                      ['Email Address', 'emailAddress'],
                      ['Broker Name', 'brokerName'],
                      ['Broker Phone Number', 'brokerPhoneNumber'],
                    ].map(([label, field]) => (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">{label}</label>
                        <Input
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetInsuranceForm[field as keyof AssetInsuranceForm] as string}
                          onChange={(event) => handleAssetInsuranceFormChange(field as keyof AssetInsuranceForm, event.target.value as never)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">3. Policy Information</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Policy Number</label>
                        <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.policyNumber} onChange={(event) => handleAssetInsuranceFormChange('policyNumber', event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Insurance Type</label>
                        <Select value={assetInsuranceForm.insuranceType} onValueChange={(value) => handleAssetInsuranceFormChange('insuranceType', value)}>
                          <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select insurance type" /></SelectTrigger>
                          <SelectContent>
                            {ASSET_INSURANCE_TYPE_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Policy Start Date</label>
                        <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.policyStartDate} onChange={(event) => handleAssetInsuranceFormChange('policyStartDate', event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Policy End Date</label>
                        <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.policyEndDate} onChange={(event) => handleAssetInsuranceFormChange('policyEndDate', event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Renewal Date</label>
                        <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.renewalDate} onChange={(event) => handleAssetInsuranceFormChange('renewalDate', event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Policy Status</label>
                        <Select value={assetInsuranceForm.policyStatus} onValueChange={(value) => handleAssetInsuranceFormChange('policyStatus', value)}>
                          <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select policy status" /></SelectTrigger>
                          <SelectContent>
                            {ASSET_INSURANCE_POLICY_STATUS_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Payment Frequency</label>
                        <Select value={assetInsuranceForm.paymentFrequency} onValueChange={(value) => handleAssetInsuranceFormChange('paymentFrequency', value)}>
                          <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select payment frequency" /></SelectTrigger>
                          <SelectContent>
                            {ASSET_INSURANCE_PAYMENT_FREQUENCY_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Coverage Details</label>
                        <textarea className="min-h-[96px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500" value={assetInsuranceForm.coverageDetails} onChange={(event) => handleAssetInsuranceFormChange('coverageDetails', event.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Exclusions</label>
                        <textarea className="min-h-[96px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500" value={assetInsuranceForm.exclusions} onChange={(event) => handleAssetInsuranceFormChange('exclusions', event.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">4. Policy Value And Claim Terms</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Define the core financial cover values for the policy, including the insured value, the payable premium, the deductible, and the maximum claim limit.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Asset Value</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetInsuranceForm.assetValue}
                          onChange={(event) => handleAssetInsuranceFormChange('assetValue', event.target.value)}
                        />
                        <p className="text-xs text-slate-500">Original or current value of the asset.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Sum Insured</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetInsuranceForm.sumInsured}
                          onChange={(event) => handleAssetInsuranceFormChange('sumInsured', event.target.value)}
                        />
                        <p className="text-xs text-slate-500">Maximum amount the insurance company will cover.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Premium Amount</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetInsuranceForm.premiumAmount}
                          onChange={(event) => handleAssetInsuranceFormChange('premiumAmount', event.target.value)}
                        />
                        <p className="text-xs text-slate-500">Amount payable to the insurance company.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Deductible / Excess</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetInsuranceForm.deductibleExcess}
                          onChange={(event) => handleAssetInsuranceFormChange('deductibleExcess', event.target.value)}
                        />
                        <p className="text-xs text-slate-500">Amount the hospital bears before insurance pays.</p>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Claim Limit</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                          value={assetInsuranceForm.claimLimit}
                          onChange={(event) => handleAssetInsuranceFormChange('claimLimit', event.target.value)}
                        />
                        <p className="text-xs text-slate-500">Maximum claim allowed under the policy.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">7. Documents to Upload</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {[
                        ['Insurance policy document', 'insurancePolicyDocumentName'],
                        ['Premium receipt', 'premiumReceiptName'],
                        ['Asset photo', 'assetPhotoName'],
                        ['Claim form', 'claimFormName'],
                        ['Police report', 'policeReportName'],
                        ['Fire report', 'fireReportName'],
                        ['Damage report', 'damageReportName'],
                        ['Engineer report', 'engineerReportName'],
                        ['Valuation report', 'valuationReportName'],
                        ['Settlement letter', 'settlementLetterName'],
                      ].map(([label, field]) => (
                        <div key={field} className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">{label}</label>
                          <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange(field as keyof AssetInsuranceForm, (event.target.files?.[0]?.name || '') as never)} />
                          <p className="text-xs text-slate-500">{String(assetInsuranceForm[field as keyof AssetInsuranceForm] || 'No file selected')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900">8. Renewal Alert</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        The system highlights policies at 30 days, 14 days, 7 days, and on the expiry date.
                      </p>
                    </div>
                    <div className={`rounded-2xl border px-4 py-4 ${assetInsuranceRenewalAlert.level === 'expired' ? 'border-rose-200 bg-rose-50' : assetInsuranceRenewalAlert.level === 'due' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                      <p className="text-sm font-semibold text-slate-900">Alert Message</p>
                      <p className="mt-2 text-sm text-slate-700">
                        {assetInsuranceRenewalAlert.message || 'Select policy end date to see renewal alert guidance.'}
                      </p>
                      {assetInsuranceRenewalAlert.daysUntilExpiry !== null ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Days until expiry: {assetInsuranceRenewalAlert.daysUntilExpiry}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {assetInsuranceError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                    {assetInsuranceError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Save this insurance setup</p>
                    <p className="mt-1 text-sm text-slate-500">
                      The saved register will retain policy profile, claim progress, and renewal alert status.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" className="border-slate-300" onClick={resetAssetInsuranceForm}>
                      Clear Form
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetInsurance}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Insurance
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : assetInsuranceView === 'premium-payment' ? (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">1. Policy Information</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Policy Number</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.policyNumber} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Insurance Company</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.insuranceCompanyName} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Insurance Type</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.insuranceType} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Policy Status</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.policyStatus} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Policy Start Date</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.policyStartDate} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Policy End Date</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.policyEndDate} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Renewal Date</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.renewalDate} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">2. Asset Information</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Asset Register Reference No</label>
                          <SearchableSelect
                            value={assetInsuranceForm.assetCode}
                            onValueChange={(value) => handleAssetInsuranceFormChange('assetCode', value)}
                            options={assetRegister.map((asset) => ({
                              value: asset.id,
                              label: asset.id,
                              description: `${asset.asset} | ${asset.category} | ${asset.department}`,
                              keywords: `${asset.id} ${asset.asset} ${asset.category} ${asset.department} ${asset.location}`,
                            }))}
                            placeholder="Select asset register reference no"
                            searchPlaceholder="Search asset register reference no or asset name..."
                            emptyMessage="No matching asset register reference found."
                            className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                          />
                          <p className="text-xs text-slate-500">
                            Once you select the asset register reference, the rest of this card fills automatically.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Asset Name</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.assetName} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Asset Category</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.assetCategory} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Department</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.department} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Asset Location</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.location} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Custodian / User</label>
                          <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.assetCustodian} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Sum Insured</label>
                          <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.sumInsured} onChange={(event) => handleAssetInsuranceFormChange('sumInsured', event.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">3. Premium Payment Details</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Premium Amount</label>
                          <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.premiumAmount} onChange={(event) => handleAssetInsuranceFormChange('premiumAmount', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Amount Paid</label>
                          <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.amountPaid} onChange={(event) => handleAssetInsuranceFormChange('amountPaid', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Balance</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={Math.max((Number.parseFloat(assetInsuranceForm.premiumAmount || '0') || 0) - (Number.parseFloat(assetInsuranceForm.amountPaid || '0') || 0), 0).toString()} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Payment Date</label>
                          <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.paymentDate} onChange={(event) => handleAssetInsuranceFormChange('paymentDate', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Payment Method</label>
                          <Select value={assetInsuranceForm.paymentMethod} onValueChange={(value) => handleAssetInsuranceFormChange('paymentMethod', value)}>
                            <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                            <SelectContent>
                              {ASSET_INSURANCE_PAYMENT_METHOD_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Payment Reference</label>
                          <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.paymentReference} onChange={(event) => handleAssetInsuranceFormChange('paymentReference', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Receipt Number</label>
                          <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.receiptNumber} onChange={(event) => handleAssetInsuranceFormChange('receiptNumber', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Payment Status</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.paymentStatus} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Paid By</label>
                          <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.paidBy} onChange={(event) => handleAssetInsuranceFormChange('paidBy', event.target.value)} placeholder={accountantName} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Received By / Insurance Agent</label>
                          <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.receivedByInsuranceAgent} onChange={(event) => handleAssetInsuranceFormChange('receivedByInsuranceAgent', event.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Narration / Description</label>
                          <textarea className="min-h-[96px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500" value={assetInsuranceForm.paymentNarration} onChange={(event) => handleAssetInsuranceFormChange('paymentNarration', event.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">4. Payment Frequency</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Payment Frequency</label>
                          <Select value={assetInsuranceForm.paymentFrequency} onValueChange={(value) => handleAssetInsuranceFormChange('paymentFrequency', value)}>
                            <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select payment frequency" /></SelectTrigger>
                            <SelectContent>
                              {ASSET_INSURANCE_PAYMENT_FREQUENCY_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">5. Bank/Cash Account Affected</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account to Debit</label>
                            <SearchableSelect
                              value={assetInsuranceForm.paymentDebitAccountId}
                              onValueChange={(value) => handleAssetInsuranceFormChange('paymentDebitAccountId', value)}
                              options={searchableAssetRegisterAccountOptions}
                              placeholder="Search account to debit"
                              searchPlaceholder="Search account to debit by number or name..."
                              emptyMessage="No matching debit account found."
                              className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account to Credit</label>
                            <SearchableSelect
                              value={assetInsuranceForm.paymentCreditAccountId}
                              onValueChange={(value) => handleAssetInsuranceFormChange('paymentCreditAccountId', value)}
                              options={searchableAssetRegisterAccountOptions}
                              placeholder="Search account to credit"
                              searchPlaceholder="Search account to credit by number or name..."
                              emptyMessage="No matching credit account found."
                              className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">6. Accounting Treatment</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Accounting Treatment</label>
                            <Select value={assetInsuranceForm.accountingTreatment} onValueChange={(value) => handleAssetInsuranceFormChange('accountingTreatment', value)}>
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select accounting treatment" /></SelectTrigger>
                              <SelectContent>
                                {ASSET_INSURANCE_ACCOUNTING_TREATMENT_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            {assetInsuranceForm.accountingTreatment === 'Direct Expense'
                              ? 'Posting logic: Debit Insurance Expense and Credit the selected cash/bank account immediately.'
                              : 'Posting logic: Debit Prepaid Insurance and Credit the selected cash/bank account, then recognize monthly expense from prepaid insurance.'}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">General Ledger Posting Status</label>
                            <Select value={assetInsuranceForm.generalLedgerPostingStatus} onValueChange={(value) => handleAssetInsuranceFormChange('generalLedgerPostingStatus', value)}>
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select GL posting status" /></SelectTrigger>
                              <SelectContent>
                                {['Pending Posting', 'Posted to General Ledger'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">7. Document Upload</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Insurance Premium Receipt</label>
                            <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('premiumReceiptName', event.target.files?.[0]?.name || '')} />
                            <p className="text-xs text-slate-500">{assetInsuranceForm.premiumReceiptName || 'No file selected'}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Payment Teller</label>
                            <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('evidenceUploadName', event.target.files?.[0]?.name || '')} />
                            <p className="text-xs text-slate-500">{assetInsuranceForm.evidenceUploadName || 'No file selected'}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Policy Document</label>
                            <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('insurancePolicyDocumentName', event.target.files?.[0]?.name || '')} />
                            <p className="text-xs text-slate-500">{assetInsuranceForm.insurancePolicyDocumentName || 'No file selected'}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Invoice from Insurance Company / Renewal Notice</label>
                            <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('settlementLetterName', event.target.files?.[0]?.name || '')} />
                            <p className="text-xs text-slate-500">{assetInsuranceForm.settlementLetterName || 'No file selected'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">Approval Workflow</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Submit for Approval</label>
                            <Input readOnly className="border-slate-300 bg-slate-50" value={assetInsuranceForm.paidBy || accountantName} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Approval Status</label>
                            <Select value={assetInsuranceForm.paymentApprovalStatus} onValueChange={(value) => handleAssetInsuranceFormChange('paymentApprovalStatus', value)}>
                              <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select approval status" /></SelectTrigger>
                              <SelectContent>
                                {['Pending Approval', 'Approved', 'Rejected'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Approved By</label>
                            <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.paymentApprovedBy} onChange={(event) => handleAssetInsuranceFormChange('paymentApprovedBy', event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Approval Date</label>
                            <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.paymentApprovedDate} onChange={(event) => handleAssetInsuranceFormChange('paymentApprovedDate', event.target.value)} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-slate-900">Renewal Follow-Up</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Next Renewal Alert</label>
                            <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.nextRenewalAlertDate} onChange={(event) => handleAssetInsuranceFormChange('nextRenewalAlertDate', event.target.value)} />
                          </div>
                          <div className={`rounded-xl border px-4 py-4 ${assetInsuranceRenewalAlert.level === 'expired' ? 'border-rose-200 bg-rose-50' : assetInsuranceRenewalAlert.level === 'due' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                            <p className="text-sm font-semibold text-slate-900">Renewal Advice</p>
                            <p className="mt-2 text-sm text-slate-700">
                              {assetInsuranceRenewalAlert.message || 'Set the policy end date in Insurance Setup to activate the renewal advisory.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {assetInsuranceError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                    {assetInsuranceError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Save this premium payment</p>
                    <p className="mt-1 text-sm text-slate-500">
                      The saved insurance record will retain the payment trail and premium settlement status.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" className="border-slate-300" onClick={resetAssetInsuranceForm}>
                      Clear Form
                    </Button>
                    <Button type="button" variant="outline" className="border-slate-300" onClick={handleGenerateCurrentAssetInsuranceReceipt}>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Receipt
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetInsurance}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Premium Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : assetInsuranceView === 'claim' ? (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Claim Workflow</p>
                <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">Insurance Claim</h3>
                    <p className="mt-1 max-w-3xl text-sm text-slate-200">
                      Open a new claim, attach the insured policy and asset, document the incident, submit for approval,
                      track the insurer response, record settlement, post to accounts, close the claim, and print the claim report.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100">Approval</p>
                      <p className="mt-2 text-sm font-semibold">{assetInsuranceForm.claimApprovalStatus || 'Draft'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100">Insurer</p>
                      <p className="mt-2 text-sm font-semibold">{assetInsuranceForm.insurerSubmissionStatus || 'Not Submitted'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100">Claim Status</p>
                      <p className="mt-2 text-sm font-semibold">{assetInsuranceForm.claimStatus || 'Pending'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100">Accounts</p>
                      <p className="mt-2 text-sm font-semibold">{assetInsuranceForm.claimPostingStatus || 'Pending Posting'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">1. New Claim</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Claim Number</label>
                          <Input
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.claimNumber}
                            onChange={(event) => handleAssetInsuranceFormChange('claimNumber', event.target.value)}
                            placeholder="Enter claim number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Claim Date</label>
                          <Input
                            type="date"
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.claimDate}
                            onChange={(event) => handleAssetInsuranceFormChange('claimDate', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Select Policy ID</label>
                          <SearchableSelect
                            value={assetInsuranceForm.policyNumber}
                            onValueChange={loadAssetInsuranceClaimFromPolicy}
                            options={searchableAssetInsurancePolicyOptions}
                            placeholder="Select policy ID"
                            searchPlaceholder="Search policy ID, company, or asset..."
                            emptyMessage="No matching policy ID found."
                            className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Policy ID</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.policyNumber} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Insurance Company</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.insuranceCompanyName} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Insurance Type</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.insuranceType} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Policy End Date</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.policyEndDate} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Select Asset</label>
                          <SearchableSelect
                            value={assetInsuranceForm.assetCode}
                            onValueChange={(value) => handleAssetInsuranceFormChange('assetCode', value)}
                            options={assetRegister.map((asset) => ({
                              value: asset.id,
                              label: asset.id,
                              description: `${asset.asset} | ${asset.category} | ${asset.department}`,
                              keywords: `${asset.id} ${asset.asset} ${asset.category} ${asset.department} ${asset.location}`,
                            }))}
                            placeholder="Select insured asset"
                            searchPlaceholder="Search asset reference, name, or department..."
                            emptyMessage="No matching asset found."
                            className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Asset Name</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.assetName} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Asset Category</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.assetCategory} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Sum Insured</label>
                          <Input
                            readOnly
                            className="border-slate-300 bg-slate-100 text-slate-700"
                            value={assetInsuranceForm.sumInsured}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Department</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.department} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Location</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.location} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">2. Add Incident Details</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Incident Date</label>
                          <Input
                            type="date"
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.incidentDate}
                            onChange={(event) => handleAssetInsuranceFormChange('incidentDate', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Incident Type</label>
                          <Select value={assetInsuranceForm.incidentType} onValueChange={(value) => handleAssetInsuranceFormChange('incidentType', value)}>
                            <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select incident type" /></SelectTrigger>
                            <SelectContent>
                              {ASSET_INSURANCE_INCIDENT_TYPE_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Description of Incident</label>
                          <textarea
                            className="min-h-[120px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.incidentDescription}
                            onChange={(event) => handleAssetInsuranceFormChange('incidentDescription', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Claim Amount</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.claimAmount}
                            onChange={(event) => handleAssetInsuranceFormChange('claimAmount', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Current Claim Status</label>
                          <Select value={assetInsuranceForm.claimStatus} onValueChange={(value) => handleAssetInsuranceFormChange('claimStatus', value)}>
                            <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select claim status" /></SelectTrigger>
                            <SelectContent>
                              {ASSET_INSURANCE_CLAIM_STATUS_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">3. Upload Evidence</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Evidence Upload</label>
                          <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('evidenceUploadName', event.target.files?.[0]?.name || '')} />
                          <p className="text-xs text-slate-500">{assetInsuranceForm.evidenceUploadName || 'No file selected'}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Claim Form</label>
                          <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('claimFormName', event.target.files?.[0]?.name || '')} />
                          <p className="text-xs text-slate-500">{assetInsuranceForm.claimFormName || 'No file selected'}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Police Report</label>
                          <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('policeReportName', event.target.files?.[0]?.name || '')} />
                          <p className="text-xs text-slate-500">{assetInsuranceForm.policeReportName || 'No file selected'}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Damage / Engineer Report</label>
                          <Input type="file" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" onChange={(event) => handleAssetInsuranceFormChange('engineerReportName', event.target.files?.[0]?.name || '')} />
                          <p className="text-xs text-slate-500">{assetInsuranceForm.engineerReportName || 'No file selected'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">4. Approval And Insurer Handling</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Submit for Approval</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.claimApprovalStatus} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Approve Claim Internally</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.claimApprovedBy || accountantName} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Approval Date</label>
                          <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.claimApprovedDate} onChange={(event) => handleAssetInsuranceFormChange('claimApprovedDate', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Submit to Insurance Company</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.insurerSubmissionStatus} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Submission Date</label>
                          <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.insurerSubmissionDate} onChange={(event) => handleAssetInsuranceFormChange('insurerSubmissionDate', event.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Update Insurer Response</label>
                          <textarea
                            className="min-h-[96px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.insuranceCompanyResponse}
                            onChange={(event) => handleAssetInsuranceFormChange('insuranceCompanyResponse', event.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">5. Settlement And Posting</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Record Approved Amount</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.approvedClaimAmount}
                            onChange={(event) => handleAssetInsuranceFormChange('approvedClaimAmount', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Record Settlement</label>
                          <Input
                            type="date"
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.settlementDate}
                            onChange={(event) => handleAssetInsuranceFormChange('settlementDate', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Amount Received</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                            value={assetInsuranceForm.amountReceived}
                            onChange={(event) => handleAssetInsuranceFormChange('amountReceived', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Post to Accounts</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.claimPostingStatus} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Close Claim</label>
                          <Input readOnly className="border-slate-300 bg-slate-100 text-slate-700" value={assetInsuranceForm.claimClosedBy || '-'} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Closed Date</label>
                          <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetInsuranceForm.claimClosedDate} onChange={(event) => handleAssetInsuranceFormChange('claimClosedDate', event.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">Claim Workflow Actions</p>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('submit-for-approval')}>Submit for Approval</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('approve-internally')}>Approve Claim Internally</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('submit-to-insurer')}>Submit to Insurance Company</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('update-insurer-response')}>Update Insurer Response</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('record-approved-amount')}>Record Approved Amount</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('record-settlement')}>Record Settlement</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('post-to-accounts')}>Post to Accounts</Button>
                        <Button type="button" variant="outline" className="justify-start border-slate-300" onClick={() => handleAssetInsuranceClaimAction('close-claim')}>Close Claim</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {assetInsuranceError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                    {assetInsuranceError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Save and print this claim record</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Save the selected policy claim, keep the insurer workflow trail, and print a formal claim report when needed.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" className="border-slate-300" onClick={resetAssetInsuranceForm}>
                      Clear Form
                    </Button>
                    <Button type="button" variant="outline" className="border-slate-300" onClick={handlePrintCurrentAssetInsuranceClaimReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Print Claim Report
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetInsurance}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Insurance Claim
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">Report Workspace</p>
                    <h3 className="mt-2 text-2xl font-semibold">Insurance Report</h3>
                    <p className="mt-1 max-w-3xl text-sm text-slate-200">
                      Review the insurance register, premium payment history, and insurance claim activity from one standard reporting workspace.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={handleExportAssetInsuranceReportExcel}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button type="button" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={handleExportAssetInsuranceReportPdf}>
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-6 p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={assetInsuranceReportView === 'registered' ? 'default' : 'ghost'}
                      className="flex-1 min-w-[220px]"
                      onClick={() => setAssetInsuranceReportView('registered')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Insurance Registered Report
                    </Button>
                    <Button
                      variant={assetInsuranceReportView === 'premium-paid' ? 'default' : 'ghost'}
                      className="flex-1 min-w-[220px]"
                      onClick={() => setAssetInsuranceReportView('premium-paid')}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Premium Paid Report
                    </Button>
                    <Button
                      variant={assetInsuranceReportView === 'claim' ? 'default' : 'ghost'}
                      className="flex-1 min-w-[220px]"
                      onClick={() => setAssetInsuranceReportView('claim')}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Insurance Claim Report
                    </Button>
                  </div>
                </div>

                {assetInsuranceRegister.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-700">No insurance records yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Save an asset insurance record and the report will appear here.
                    </p>
                  </div>
                ) : assetInsuranceReportView === 'registered' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Registered Policies</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{assetInsuranceRegisteredReportRows.length}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Active Policies</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{assetInsuranceSummary.activePolicies}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Renewal Due</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{assetInsuranceSummary.pendingRenewal}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Total Sum Insured</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(assetInsuranceSummary.totalSumInsured)}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[1200px]">
                        <thead className="border-b bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset Name</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Cost Purchased</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Asset Value</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Sum Insured</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Claim Limit</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Policy Num</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {assetInsuranceRegisteredReportRows.map((row) => (
                            <tr key={`${row.assetCode}-${row.policyNumber}`} className="hover:bg-slate-50/80">
                              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{row.assetCode}</td>
                              <td className="px-4 py-4 text-sm text-slate-700">{row.assetName}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.purchaseCost)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.assetValue)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.sumInsured)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.claimLimit)}</td>
                              <td className="px-4 py-4 text-sm text-slate-700">{row.policyNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : assetInsuranceReportView === 'premium-paid' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Payments Logged</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{assetInsurancePremiumPaidReportRows.length}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Total Premium</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(assetInsurancePremiumPaidSummary.totalPremium)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Total Paid</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(assetInsurancePremiumPaidSummary.totalPaid)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Outstanding Balance</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(assetInsurancePremiumPaidSummary.totalBalance)}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[1700px]">
                        <thead className="border-b bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Policy</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset / Company</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Premium</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Amount Paid</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Balance</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Payment Trail</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">GL Posting</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {assetInsurancePremiumPaidReportRows.map((row) => (
                            <tr key={`${row.policyNumber}-${row.receiptNumber}-${row.paymentDate}`} className="align-top hover:bg-slate-50/80">
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div className="font-semibold text-slate-900">{row.policyNumber}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.paymentStatus}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>{row.assetName}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.insuranceCompanyName}</div>
                              </td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.premiumAmount)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.amountPaid)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.balance)}</td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>{row.paymentDate || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.paymentMethod || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">Approval: {row.paymentApprovalStatus || '-'}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>Dr: {row.paymentDebitAccountDisplay || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">Cr: {row.paymentCreditAccountDisplay || '-'}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div className="font-medium">{row.receiptNumber || '-'}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Claims Logged</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{assetInsuranceClaimReportRows.length}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Open Claims</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{assetInsuranceSummary.openClaims}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Approved Claims</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {assetInsuranceClaimReportRows.filter((row) => row.claimStatus.toLowerCase() === 'approved').length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Settled Amount</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {formatCurrency(assetInsuranceClaimReportRows.reduce((sum, row) => sum + row.amountReceived, 0))}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[1600px]">
                        <thead className="border-b bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Claim</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Policy / Asset</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Incident</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Claim Amount</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Approved</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Received</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Workflow</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Closure</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {assetInsuranceClaimReportRows.map((row) => (
                            <tr key={`${row.policyNumber}-${row.claimNumber || row.assetName}`} className="align-top hover:bg-slate-50/80">
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div className="font-semibold text-slate-900">{row.claimNumber || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.claimStatus || '-'}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>{row.policyNumber}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.assetName}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>{row.incidentDate || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.incidentType || '-'}</div>
                              </td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.claimAmount)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.approvedClaimAmount)}</td>
                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.amountReceived)}</td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>Approval: {row.claimApprovalStatus || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">Insurer: {row.insurerSubmissionStatus || '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">Posting: {row.claimPostingStatus || '-'}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                <div>{row.claimClosedDate || '-'}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetDisposalView === 'setup' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetDisposalView('setup')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Disposal Setup
              </Button>
              <Button
                variant={assetDisposalView === 'report' ? 'default' : 'ghost'}
                className="flex-1 min-w-[220px]"
                onClick={() => setAssetDisposalView('report')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Disposal Report
              </Button>
            </div>
          </div>

          {assetDisposalView === 'setup' ? (
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/20">Disposal Control</Badge>
                    <Badge className="bg-rose-500/20 text-rose-100 hover:bg-rose-500/20">Asset Exit Workspace</Badge>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">Asset Disposal Form</h3>
                  <p className="mt-1 text-sm text-slate-200">
                    Record asset retirement, sale, loss, or write-off with approvals, supporting documents, and automatic accounting outcome preview.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[460px]">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Disposal No</p>
                    <p className="mt-1 text-sm font-semibold">{assetDisposalForm.disposalNo}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Net Book Value</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(Number.parseFloat(assetDisposalForm.netBookValue || '0') || 0)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200">Profit / Loss</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(Number.parseFloat(assetDisposalForm.profitOrLoss || '0') || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 bg-slate-50/60 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">1. Asset Details</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Select the asset and let the system populate the core asset profile before disposal processing begins.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Asset Code / Asset ID</label>
                    <Select
                      value={assetDisposalForm.assetCode}
                      onValueChange={(value) => handleAssetDisposalFormChange('assetCode', value)}
                    >
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                        <SelectValue placeholder="Select asset code" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetRegister.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.id} - {asset.asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Asset Name</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.assetName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Asset Category</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.assetCategory} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Asset Location</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.assetLocation} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Department</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.department} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Asset Custodian</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.custodian} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Purchase Date</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.purchaseDate} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Purchase Cost</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.purchaseCost} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Supplier Name</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.supplierName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Serial Number</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.serialNumber} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Model Number</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.modelNumber} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Current Condition</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.currentCondition} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">2. Depreciation Details</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the accumulated depreciation position, net book value, and remaining useful life before disposal.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Accumulated Depreciation</label>
                    <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.accumulatedDepreciation} onChange={(event) => handleAssetDisposalFormChange('accumulatedDepreciation', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Net Book Value</label>
                    <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.netBookValue} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Last Depreciation Date</label>
                    <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" type="date" value={assetDisposalForm.lastDepreciationDate} onChange={(event) => handleAssetDisposalFormChange('lastDepreciationDate', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Remaining Useful Life</label>
                    <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.remainingUsefulLife} onChange={(event) => handleAssetDisposalFormChange('remainingUsefulLife', event.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">3. Disposal Type</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose the disposal type and provide the reason and current approval workflow status.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Disposal Type</label>
                      <Select value={assetDisposalForm.disposalType} onValueChange={(value) => handleAssetDisposalFormChange('disposalType', value)}>
                        <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                          <SelectValue placeholder="Select disposal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Sold',
                            'Scrapped',
                            'Donated',
                            'Stolen',
                            'Damaged beyond repair',
                            'Lost',
                            'Exchanged / Trade-in',
                            'Written off',
                            'Returned to supplier',
                            'Obsolete / no longer useful',
                          ].map((value) => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Disposal Date</label>
                      <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.disposalDate} onChange={(event) => handleAssetDisposalFormChange('disposalDate', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Approval Status</label>
                      <Select value={assetDisposalForm.approvalStatus} onValueChange={(value) => handleAssetDisposalFormChange('approvalStatus', value)}>
                        <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                          <SelectValue placeholder="Select approval status" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Pending', 'Approved', 'Rejected'].map((value) => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Reason for Disposal</label>
                      <textarea
                        className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                        value={assetDisposalForm.reasonForDisposal}
                        onChange={(event) => handleAssetDisposalFormChange('reasonForDisposal', event.target.value)}
                        placeholder="State why the asset is being disposed..."
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-slate-900">4. Disposal Financial Details</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Capture the amount sold, disposal expense, and the resulting profit or loss on disposal.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Amount Sold / Selling Price</label>
                      <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.disposalValue} onChange={(event) => handleAssetDisposalFormChange('disposalValue', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Buyer Name</label>
                      <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.buyerName} onChange={(event) => handleAssetDisposalFormChange('buyerName', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Payment Method</label>
                      <Select value={assetDisposalForm.paymentMethod} onValueChange={(value) => handleAssetDisposalFormChange('paymentMethod', value)}>
                        <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Cash', 'Bank Transfer', 'Cheque'].map((value) => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Disposal Expense</label>
                      <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.disposalExpense} onChange={(event) => handleAssetDisposalFormChange('disposalExpense', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Profit or Loss on Disposal</label>
                      <Input readOnly className="border-slate-300 bg-slate-50" value={assetDisposalForm.profitOrLoss} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">5. Approval Section</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Asset disposal is sensitive, so the request, checking, approval, and management comment should all be captured here.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Requested By</label>
                    <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.requestedBy} onChange={(event) => handleAssetDisposalFormChange('requestedBy', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Checked By</label>
                    <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.checkedBy} onChange={(event) => handleAssetDisposalFormChange('checkedBy', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Approved By</label>
                    <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.approvedBy} onChange={(event) => handleAssetDisposalFormChange('approvedBy', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Approval Date</label>
                    <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={assetDisposalForm.approvalDate} onChange={(event) => handleAssetDisposalFormChange('approvalDate', event.target.value)} />
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Management Comment</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                      value={assetDisposalForm.managementComment}
                      onChange={(event) => handleAssetDisposalFormChange('managementComment', event.target.value)}
                      placeholder="Management comment on the disposal..."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">6. Supporting Documents</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Attach the supporting evidence that justifies and proves the disposal event.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Asset picture', field: 'assetPictureName' as const },
                    { label: 'Disposal approval memo', field: 'disposalApprovalMemoName' as const },
                    { label: 'Buyer receipt', field: 'buyerReceiptName' as const },
                    { label: 'Police report', field: 'policeReportName' as const },
                    { label: 'Damage report', field: 'damageReportName' as const },
                    { label: 'Valuation report', field: 'valuationReportName' as const },
                    { label: 'Board approval document', field: 'boardApprovalDocumentName' as const },
                    { label: 'Supplier return document', field: 'supplierReturnDocumentName' as const },
                  ].map((document) => (
                    <div key={document.field} className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">{document.label}</label>
                      <Input
                        type="file"
                        className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500"
                        onChange={(event) => handleAssetDisposalFormChange(document.field, event.target.files?.[0]?.name || '')}
                      />
                      <p className="text-xs text-slate-500">{assetDisposalForm[document.field] || 'No file selected'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">7. Accounting Posting</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter or review the posting amount, attach the account GL to debit and the account GL to credit, then review the automatic posting preview for sale, loss, scrap, and write-off cases.
                  </p>
                </div>
                <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Amount to Debit</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="border-slate-300 bg-white focus-visible:ring-blue-500"
                      value={assetDisposalForm.disposalValue}
                      onChange={(event) => handleAssetDisposalFormChange('disposalValue', event.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      This is the disposal proceeds or amount received on sale.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Account to Debit</label>
                    <SearchableSelect
                      value={assetDisposalForm.debitAccountId}
                      onValueChange={(value) => handleAssetDisposalFormChange('debitAccountId', value)}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Select account GL to debit"
                      searchPlaceholder="Search account GL to debit by number or name..."
                      emptyMessage="No matching debit GL account found."
                      className="border-slate-300 bg-white focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">
                      Choose the GL account that should receive the disposal proceeds or debit-side posting.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Amount to Credit</label>
                    <Input
                      readOnly
                      className="border-slate-300 bg-slate-100 text-slate-700"
                      value={assetDisposalForm.netBookValue}
                    />
                    <p className="text-xs text-slate-500">
                      This is the current net book value being cleared from the asset side.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Account to Credit</label>
                    <SearchableSelect
                      value={assetDisposalForm.creditAccountId}
                      onValueChange={(value) => handleAssetDisposalFormChange('creditAccountId', value)}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Select account GL to credit"
                      searchPlaceholder="Search account GL to credit by number or name..."
                      emptyMessage="No matching credit GL account found."
                      className="border-slate-300 bg-white focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">
                      Choose the GL account that should carry the disposal credit-side posting.
                    </p>
                  </div>
                </div>
                <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                  <div
                    className={`rounded-2xl border px-4 py-4 ${
                      assetDisposalValueAdvice?.adviceType === 'gain'
                        ? 'border-emerald-200 bg-emerald-50'
                        : assetDisposalValueAdvice?.adviceType === 'shortage'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">Gain / Shortage Advice</p>
                    {assetDisposalValueAdvice ? (
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        <p>
                          Net book value: <span className="font-semibold">{formatCurrency(Number.parseFloat(assetDisposalForm.netBookValue || '0') || 0)}</span>
                        </p>
                        <p>
                          Amount sold: <span className="font-semibold">{formatCurrency(Number.parseFloat(assetDisposalForm.disposalValue || '0') || 0)}</span>
                        </p>
                        <p>
                          Difference: <span className="font-semibold">{formatCurrency(Math.abs(assetDisposalValueAdvice.grossDifference))}</span>
                        </p>
                        <p className="pt-1 text-sm font-medium">
                          {assetDisposalValueAdvice.adviceType === 'gain'
                            ? 'Advice: The amount sold is above net book value, so this disposal is showing a gain before disposal expense.'
                            : assetDisposalValueAdvice.adviceType === 'shortage'
                              ? 'Advice: The amount sold is below net book value, so this disposal is showing a shortage/loss before disposal expense.'
                              : 'Advice: The amount sold matches net book value, so there is no gain or shortage before disposal expense.'}
                        </p>
                        {assetDisposalValueAdvice.disposalExpense > 0 ? (
                          <p className="text-xs text-slate-500">
                            After disposal expense, the recognized result becomes {formatCurrency(assetDisposalValueAdvice.recognizedResult)}.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Select an asset and enter the disposal amount to see whether the outcome is a gain, a shortage, or balanced.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">Posting Balance Check</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <span>Total Debit</span>
                        <span className="font-semibold">{formatCurrency(assetDisposalPostingTotals.totalDebit)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Total Credit</span>
                        <span className="font-semibold">{formatCurrency(assetDisposalPostingTotals.totalCredit)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                        <span>Status</span>
                        <span className={`font-semibold ${assetDisposalPostingTotals.isBalanced ? 'text-emerald-700' : 'text-red-600'}`}>
                          {assetDisposalPostingTotals.isBalanced ? 'Balanced' : 'Not Balanced'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      The disposal cannot be saved until total debit equals total credit.
                    </p>
                  </div>
                </div>
                {assetDisposalPostingPreviewRows.length > 0 ? <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[820px]">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Debit</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assetDisposalPostingPreviewRows.map((row, index) => (
                          <tr key={`${row.account}-${index}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{row.account}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{row.debit ? formatCurrency(row.debit) : '—'}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{row.credit ? formatCurrency(row.credit) : '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div> : null}
              </div>

              {assetDisposalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                  {assetDisposalError}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Save this asset disposal</p>
                  <p className="mt-1 text-sm text-slate-500">
                    The saved disposal will preserve the financial outcome, supporting documents, approval trail, and accounting impact.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" className="border-slate-300" onClick={resetAssetDisposalForm}>
                    Clear Form
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAssetDisposal}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Disposal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Disposal Report</CardTitle>
            </CardHeader>
            <CardContent>
              {assetDisposalReportRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">No asset disposal records yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Save an asset disposal form and the disposal report will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white shadow-lg">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Report Template</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Asset Disposal Report</h3>
                        <p className="mt-2 max-w-3xl text-sm text-slate-200">
                          Review disposal history, financial outcome, approval trail, and GL posting impact in one export-ready schedule.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-400/60 bg-white/5 text-white hover:bg-white/10"
                          onClick={handleExportAssetDisposalReportExcel}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export Excel
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-400/60 bg-white/5 text-white hover:bg-white/10"
                          onClick={handleExportAssetDisposalReportPdf}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Disposals Logged</p>
                        <p className="mt-2 text-3xl font-semibold">{assetDisposalReportSummary.totalDisposals}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Net Book Value</p>
                        <p className="mt-2 text-3xl font-semibold">{formatCurrency(assetDisposalReportSummary.totalNetBookValue)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Amount Sold</p>
                        <p className="mt-2 text-3xl font-semibold">{formatCurrency(assetDisposalReportSummary.totalDisposalValue)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Net Gain / Loss</p>
                        <p className={`mt-2 text-3xl font-semibold ${assetDisposalReportSummary.totalProfitOrLoss >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                          {formatCurrency(assetDisposalReportSummary.totalProfitOrLoss)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Approved</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{assetDisposalReportSummary.approvedCount}</p>
                      <p className="mt-1 text-sm text-slate-500">Disposals already cleared through approval.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Pending Review</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{assetDisposalReportSummary.totalDisposals - assetDisposalReportSummary.approvedCount}</p>
                      <p className="mt-1 text-sm text-slate-500">Records still awaiting full approval clearance.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Print Date</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{getTodayIsoDate()}</p>
                      <p className="mt-1 text-sm text-slate-500">Current export-ready reporting date.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full min-w-[2350px]">
                      <thead className="border-b bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Disposal Ref</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset Details</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Disposal Profile</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Purchase Cost</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Accum. Depreciation</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Net Book Value</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Amount Sold</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Expense</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Profit / Loss</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">GL Posting</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Approval Trail</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Supporting Documents</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {assetDisposalReportRows.map((record) => (
                          <tr key={record.id} className="align-top hover:bg-slate-50/80">
                            <td className="px-4 py-4 text-sm text-slate-700">
                              <div className="font-semibold text-slate-900">{record.id}</div>
                              <div className="mt-1 text-xs text-slate-500">{record.disposalDate}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              <div className="font-semibold text-slate-900">{record.assetName}</div>
                              <div className="mt-1 text-xs text-slate-500">{record.assetCode} | {record.assetCategory}</div>
                              <div className="mt-1 text-xs text-slate-500">{record.department} | {record.assetLocation}</div>
                              <div className="mt-1 text-xs text-slate-500">Custodian: {record.custodian || '-'}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              <div className="font-medium">{record.disposalType}</div>
                              <div className="mt-1 text-xs text-slate-500">Condition: {record.currentCondition || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Buyer: {record.buyerName || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Payment: {record.paymentMethod || '-'}</div>
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.purchaseCost)}</td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.accumulatedDepreciation)}</td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.netBookValue)}</td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.disposalValue)}</td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.disposalExpense)}</td>
                            <td className={`px-4 py-4 text-right text-sm font-semibold ${record.profitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {formatCurrency(record.profitOrLoss)}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              <div>Debit: {record.debitAccountDisplay || '-'}</div>
                              <div className="mt-1">Credit: {record.creditAccountDisplay || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Asset: {record.assetAccountDisplay || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Accum Dep: {record.accumulatedDepreciationAccountDisplay || '-'}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              <Badge className={record.approvalStatus.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' : record.approvalStatus.toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                                {record.approvalStatus}
                              </Badge>
                              <div className="mt-2 text-xs text-slate-500">Requested: {record.requestedBy || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Checked: {record.checkedBy || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Approved: {record.approvedBy || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Reason: {record.reasonForDisposal || '-'}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              <div>{record.assetPictureName || 'No asset picture'}</div>
                              <div className="mt-1">{record.disposalApprovalMemoName || 'No approval memo'}</div>
                              <div className="mt-1">{record.buyerReceiptName || 'No buyer receipt'}</div>
                              <div className="mt-1">{record.policeReportName || 'No police report'}</div>
                              <div className="mt-1">{record.damageReportName || 'No damage report'}</div>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                          <td className="px-4 py-4 text-sm" colSpan={5}>Report Totals</td>
                          <td className="px-4 py-4 text-right text-sm">{formatCurrency(assetDisposalReportSummary.totalNetBookValue)}</td>
                          <td className="px-4 py-4 text-right text-sm">{formatCurrency(assetDisposalReportSummary.totalDisposalValue)}</td>
                          <td className="px-4 py-4 text-right text-sm">-</td>
                          <td className={`px-4 py-4 text-right text-sm ${assetDisposalReportSummary.totalProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {formatCurrency(assetDisposalReportSummary.totalProfitOrLoss)}
                          </td>
                          <td className="px-4 py-4 text-sm" colSpan={3}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      )}
    </div>
  );

  const handleStaffRegistrationFormChange = <K extends keyof StaffRegistrationForm>(
    field: K,
    value: StaffRegistrationForm[K],
  ) => {
    setStaffRegistrationForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (staffRegistrationError) {
      setStaffRegistrationError(null);
    }
  };

  const resetStaffRegistrationForm = () => {
    setStaffRegistrationForm(createBlankStaffRegistrationForm());
    setStaffRegistrationError(null);
  };

  const handleSaveStaffRegistration = () => {
    const grossSalary = Number.parseFloat(staffRegistrationForm.grossSalary || '0') || 0;

    if (
      !staffRegistrationForm.staffId.trim() ||
      !staffRegistrationForm.fullName.trim() ||
      !staffRegistrationForm.department.trim() ||
      !staffRegistrationForm.designation.trim() ||
      !staffRegistrationForm.staffGroup.trim() ||
      !staffRegistrationForm.employmentDate ||
      grossSalary <= 0
    ) {
      setStaffRegistrationError('Complete the required staff registration fields before saving.');
      return;
    }

    const duplicateStaff = staffRegistrationRegister.some(
      (staff) => staff.staffId.toLowerCase() === staffRegistrationForm.staffId.trim().toLowerCase(),
    );
    if (duplicateStaff) {
      setStaffRegistrationError('Staff ID already exists in the staff register.');
      return;
    }

    setStaffRegistrationRegister((prev) => [
      {
        id: `STAFF-REG-${(prev.length + 1).toString().padStart(3, '0')}`,
        staffId: staffRegistrationForm.staffId.trim(),
        title: staffRegistrationForm.title,
        fullName: staffRegistrationForm.fullName.trim(),
        gender: staffRegistrationForm.gender,
        dateOfBirth: staffRegistrationForm.dateOfBirth,
        phone: staffRegistrationForm.phone.trim(),
        email: staffRegistrationForm.email.trim(),
        homeAddress: staffRegistrationForm.homeAddress.trim(),
        stateOfOrigin: staffRegistrationForm.stateOfOrigin.trim(),
        nextOfKinName: staffRegistrationForm.nextOfKinName.trim(),
        nextOfKinPhone: staffRegistrationForm.nextOfKinPhone.trim(),
        nextOfKinRelationship: staffRegistrationForm.nextOfKinRelationship.trim(),
        department: staffRegistrationForm.department.trim(),
        designation: staffRegistrationForm.designation.trim(),
        staffGroup: staffRegistrationForm.staffGroup.trim(),
        employmentType: staffRegistrationForm.employmentType,
        employmentDate: staffRegistrationForm.employmentDate,
        salaryGrade: staffRegistrationForm.salaryGrade.trim(),
        grossSalary,
        taxId: staffRegistrationForm.taxId.trim(),
        pensionPin: staffRegistrationForm.pensionPin.trim(),
        nhfNumber: staffRegistrationForm.nhfNumber.trim(),
        bankName: staffRegistrationForm.bankName.trim(),
        accountNumber: staffRegistrationForm.accountNumber.trim(),
        paymentMode: staffRegistrationForm.paymentMode,
        status: staffRegistrationForm.status,
      },
      ...prev,
    ]);
    resetStaffRegistrationForm();
    toast.success('Staff registration saved.');
  };

  const handleStaffSalaryAdvanceFormChange = <K extends keyof StaffSalaryAdvanceForm>(
    field: K,
    value: StaffSalaryAdvanceForm[K],
  ) => {
    setStaffSalaryAdvanceForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (staffSalaryAdvanceError) {
      setStaffSalaryAdvanceError(null);
    }
  };

  const resetStaffSalaryAdvanceForm = () => {
    setStaffSalaryAdvanceForm(createBlankStaffSalaryAdvanceForm());
    setStaffSalaryAdvanceError(null);
  };

  const handleSaveStaffSalaryAdvance = () => {
    const amount = Number.parseFloat(staffSalaryAdvanceForm.amount || '0') || 0;

    if (
      !staffSalaryAdvanceForm.staffId.trim() ||
      !selectedSalaryAdvanceStaff ||
      !staffSalaryAdvanceForm.requestDate ||
      amount <= 0 ||
      !staffSalaryAdvanceForm.reason.trim()
    ) {
      setStaffSalaryAdvanceError('Select the staff member and complete the salary advance details before saving.');
      return;
    }

    setStaffSalaryAdvanceRegister((prev) => [
      {
        id: `SALADV${new Date(staffSalaryAdvanceForm.requestDate).getFullYear().toString().slice(-2)}${(prev.length + 1)
          .toString()
          .padStart(5, '0')}`,
        staffId: selectedSalaryAdvanceStaff.staffId,
        staffName: selectedSalaryAdvanceStaff.fullName,
        department: selectedSalaryAdvanceStaff.department,
        requestDate: staffSalaryAdvanceForm.requestDate,
        amount,
        reason: staffSalaryAdvanceForm.reason.trim(),
        repaymentMonths: staffSalaryAdvanceForm.repaymentMonths.trim() || '-',
        status: staffSalaryAdvanceForm.status.trim(),
        approvedBy: staffSalaryAdvanceForm.approvedBy.trim() || accountantName,
      },
      ...prev,
    ]);
    resetStaffSalaryAdvanceForm();
    toast.success('Staff salary advance saved.');
  };

  const renderStaffPayroll = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-6 py-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-200">Payroll Workspace</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Staff Payroll</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-200">
              Manage payroll setup, register staff for payroll processing, and track staff salary advance requests in one professional workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Gross Payroll</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(payrollGross)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Net Payroll</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(payrollNet)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Salary Advance</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(payrollAdvanceTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={staffPayrollView === 'setup' ? 'default' : 'ghost'}
            className="flex-1 min-w-[220px]"
            onClick={() => setStaffPayrollView('setup')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Setup
          </Button>
          <Button
            variant={staffPayrollView === 'staff-registration' ? 'default' : 'ghost'}
            className="flex-1 min-w-[220px]"
            onClick={() => setStaffPayrollView('staff-registration')}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Staff Registration
          </Button>
          <Button
            variant={staffPayrollView === 'salary-advance' ? 'default' : 'ghost'}
            className="flex-1 min-w-[220px]"
            onClick={() => setStaffPayrollView('salary-advance')}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Staff Salary Advance
          </Button>
        </div>
      </div>

      {staffPayrollView === 'setup' ? (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="border-b bg-gradient-to-r from-slate-50 to-rose-50 px-6 py-5">
            <h4 className="text-lg font-semibold text-slate-900">Payroll Setup</h4>
            <p className="mt-1 text-sm text-slate-600">
              Configure the payroll posting accounts, frequency, and next payroll processing date.
            </p>
          </div>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Payroll Frequency</label>
                    <Select value={payrollSetup.payrollFrequency} onValueChange={(value) => setPayrollSetup((prev) => ({ ...prev, payrollFrequency: value }))}>
                      <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select payroll frequency" /></SelectTrigger>
                      <SelectContent>
                        {['Weekly', 'Bi-Weekly', 'Monthly'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Next Payroll Date</label>
                    <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={payrollSetup.nextPayrollDate} onChange={(event) => setPayrollSetup((prev) => ({ ...prev, nextPayrollDate: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Salary Expense GL</label>
                    <SearchableSelect
                      value={payrollSetup.salaryExpenseAccountId}
                      onValueChange={(value) => setPayrollSetup((prev) => ({ ...prev, salaryExpenseAccountId: value }))}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search salary expense GL"
                      searchPlaceholder="Search salary expense GL by number or name..."
                      emptyMessage="No matching salary expense account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Salary Payable GL</label>
                    <SearchableSelect
                      value={payrollSetup.salaryPayableAccountId}
                      onValueChange={(value) => setPayrollSetup((prev) => ({ ...prev, salaryPayableAccountId: value }))}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search salary payable GL"
                      searchPlaceholder="Search salary payable GL by number or name..."
                      emptyMessage="No matching salary payable account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Salary Advance GL</label>
                    <SearchableSelect
                      value={payrollSetup.salaryAdvanceAccountId}
                      onValueChange={(value) => setPayrollSetup((prev) => ({ ...prev, salaryAdvanceAccountId: value }))}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search salary advance GL"
                      searchPlaceholder="Search salary advance GL by number or name..."
                      emptyMessage="No matching salary advance account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Payroll Bank / Cash GL</label>
                    <SearchableSelect
                      value={payrollSetup.payrollBankAccountId}
                      onValueChange={(value) => setPayrollSetup((prev) => ({ ...prev, payrollBankAccountId: value }))}
                      options={searchableAssetRegisterAccountOptions}
                      placeholder="Search payroll bank/cash GL"
                      searchPlaceholder="Search payroll bank/cash GL by number or name..."
                      emptyMessage="No matching bank/cash account found."
                      className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Current Payroll Mapping</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                    <span>Salary Expense GL</span>
                    <span className="font-semibold text-right">{assetRegisterAccountLookup.get(payrollSetup.salaryExpenseAccountId)?.displayLabel || 'Not attached'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                    <span>Salary Payable GL</span>
                    <span className="font-semibold text-right">{assetRegisterAccountLookup.get(payrollSetup.salaryPayableAccountId)?.displayLabel || 'Not attached'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                    <span>Salary Advance GL</span>
                    <span className="font-semibold text-right">{assetRegisterAccountLookup.get(payrollSetup.salaryAdvanceAccountId)?.displayLabel || 'Not attached'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                    <span>Payroll Bank / Cash GL</span>
                    <span className="font-semibold text-right">{assetRegisterAccountLookup.get(payrollSetup.payrollBankAccountId)?.displayLabel || 'Not attached'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Next Payroll Run</span>
                    <span className="font-semibold text-right">{payrollSetup.nextPayrollDate || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm flex gap-2">
                <Button
                  variant={setupSubView === 'deduction' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setSetupSubView('deduction')}
                >
                  Deduction
                </Button>
                <Button
                  variant={setupSubView === 'allowance' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setSetupSubView('allowance')}
                >
                  Allowance
                </Button>
              </div>

              {/* Staff selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Select Staff ID</label>
                  <Select value={selectedProfileStaffId} onValueChange={(v) => {
                    setSelectedProfileStaffId(v);
                    setStaffPayrollProfiles((prev) => {
                      if (prev.find((p) => p.staffId === v)) return prev;
                      return [...prev, {
                        staffId: v,
                        deductions: deductionRecords.map((d) => ({ deductionId: d.id, enabled: d.enabled, valueOverride: null })),
                        allowances: allowanceRecords.map((a) => ({ allowanceId: a.id, enabled: a.enabled, valueOverride: null })),
                      }];
                    });
                  }}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-rose-500">
                      <SelectValue placeholder="— Select a staff member —" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRegistrationRegister.map((s) => (
                        <SelectItem key={s.staffId} value={s.staffId}>
                          {s.staffId} — {s.fullName} ({s.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProfileStaffId && (() => {
                  const reg = staffRegistrationRegister.find((s) => s.staffId === selectedProfileStaffId);
                  if (!reg) return null;
                  return (
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span><span className="font-medium">Name:</span> {reg.fullName}</span>
                      <span><span className="font-medium">Department:</span> {reg.department}</span>
                      <span><span className="font-medium">Designation:</span> {reg.designation}</span>
                      <span><span className="font-medium">Gross Salary:</span> ₦{reg.grossSalary.toLocaleString()}</span>
                    </div>
                  );
                })()}
              </div>

              {!selectedProfileStaffId ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-400">Select a staff member above to assign deductions and allowances.</p>
                </div>
              ) : setupSubView === 'allowance' ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b bg-purple-50">
                    <p className="text-sm font-semibold text-slate-900">Allowances for {selectedProfileStaffId}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Enable allowances and optionally override the default value for this staff.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-4 py-3 text-left font-medium text-slate-700 w-8">On</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Allowance Name</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700 w-36">Default</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700 w-44">Override Amount / Rate</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">GL Account</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allowanceRecords.map((alw) => {
                          const profile = staffPayrollProfiles.find((p) => p.staffId === selectedProfileStaffId);
                          const item = profile?.allowances.find((a) => a.allowanceId === alw.id);
                          const isOn = item?.enabled ?? alw.enabled;
                          const override = item?.valueOverride;
                          return (
                            <tr key={alw.id} className={`hover:bg-slate-50/80 transition-colors ${!isOn ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-3">
                                <input type="checkbox" checked={isOn}
                                  onChange={(e) => setStaffPayrollProfiles((prev) => prev.map((p) => p.staffId !== selectedProfileStaffId ? p : {
                                    ...p, allowances: p.allowances.map((a) => a.allowanceId === alw.id ? { ...a, enabled: e.target.checked } : a),
                                  }))}
                                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">{alw.name}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                {alw.calcType === 'fixed' ? `₦${alw.value.toLocaleString()}` : `${alw.value}% of gross`}
                              </td>
                              <td className="px-4 py-3">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                    {alw.calcType === 'fixed' ? '₦' : '%'}
                                  </span>
                                  <Input type="number" min="0" step="0.01"
                                    placeholder="Default"
                                    value={override ?? ''}
                                    onChange={(e) => setStaffPayrollProfiles((prev) => prev.map((p) => p.staffId !== selectedProfileStaffId ? p : {
                                      ...p, allowances: p.allowances.map((a) => a.allowanceId === alw.id ? { ...a, valueOverride: e.target.value === '' ? null : parseFloat(e.target.value) } : a),
                                    }))}
                                    className="h-8 pl-7 border-slate-300 bg-slate-50 text-sm focus-visible:ring-purple-500"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <SearchableSelect
                                  value={alw.glAccountId}
                                  onValueChange={(value) => setAllowanceRecords((prev) => prev.map((a) => a.id === alw.id ? { ...a, glAccountId: value } : a))}
                                  options={searchableAssetRegisterAccountOptions}
                                  placeholder="Attach GL…"
                                  searchPlaceholder="Search GL account…"
                                  emptyMessage="No matching account found."
                                  className="h-8 border-slate-300 bg-slate-50 text-xs focus:ring-purple-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
              <>{(['statutory', 'voluntary', 'disciplinary'] as DeductionCategory[]).map((category) => {
                const categoryDeductions = deductionRecords.filter((d) => d.category === category);
                const categoryLabel = category === 'statutory' ? 'Statutory Deductions' : category === 'voluntary' ? 'Voluntary / Staff Deductions' : 'Disciplinary Deductions';
                const categoryDesc = category === 'statutory' ? 'Government-mandated: PAYE, Pension, NHF, Health Insurance' : category === 'voluntary' ? 'Staff-elected or employer-authorized recurring deductions' : 'Deductions from attendance, conduct, or asset damage';
                return (
                  <div key={category} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className={`px-5 py-3 border-b ${category === 'statutory' ? 'bg-blue-50' : category === 'voluntary' ? 'bg-green-50' : 'bg-amber-50'}`}>
                      <p className="text-sm font-semibold text-slate-900">{categoryLabel}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{categoryDesc}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-3 text-left font-medium text-slate-700 w-8">On</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Deduction Name</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700 w-40">Calc Type</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700 w-36">Default</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700 w-44">Override Amount / Rate</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">GL Account</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {categoryDeductions.map((ded) => {
                            const profile = staffPayrollProfiles.find((p) => p.staffId === selectedProfileStaffId);
                            const item = profile?.deductions.find((di) => di.deductionId === ded.id);
                            const isOn = item?.enabled ?? ded.enabled;
                            const override = item?.valueOverride;
                            return (
                            <tr key={ded.id} className={`hover:bg-slate-50/80 transition-colors ${!isOn ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isOn}
                                  onChange={(e) => setStaffPayrollProfiles((prev) => prev.map((p) => p.staffId !== selectedProfileStaffId ? p : {
                                    ...p, deductions: p.deductions.map((di) => di.deductionId === ded.id ? { ...di, enabled: e.target.checked } : di),
                                  }))}
                                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">{ded.name}</td>
                              <td className="px-4 py-3">
                                <Select
                                  value={ded.calcType}
                                  onValueChange={(value) => setDeductionRecords((prev) => prev.map((d) => d.id === ded.id ? { ...d, calcType: value as DeductionCalcType } : d))}
                                >
                                  <SelectTrigger className="h-8 border-slate-300 bg-slate-50 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                                    <SelectItem value="percentage">% of Gross</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                {ded.calcType === 'fixed' ? `₦${ded.value.toLocaleString()}` : `${ded.value}% of gross`}
                              </td>
                              <td className="px-4 py-3">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                    {ded.calcType === 'fixed' ? '₦' : '%'}
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step={ded.calcType === 'percentage' ? '0.01' : '1'}
                                    placeholder="Default"
                                    value={override ?? ''}
                                    onChange={(e) => setStaffPayrollProfiles((prev) => prev.map((p) => p.staffId !== selectedProfileStaffId ? p : {
                                      ...p, deductions: p.deductions.map((di) => di.deductionId === ded.id ? { ...di, valueOverride: e.target.value === '' ? null : parseFloat(e.target.value) } : di),
                                    }))}
                                    className="h-8 pl-7 border-slate-300 bg-slate-50 text-sm focus-visible:ring-rose-500"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <SearchableSelect
                                  value={ded.glAccountId}
                                  onValueChange={(value) => setDeductionRecords((prev) => prev.map((d) => d.id === ded.id ? { ...d, glAccountId: value } : d))}
                                  options={searchableAssetRegisterAccountOptions}
                                  placeholder="Attach GL…"
                                  searchPlaceholder="Search GL account…"
                                  emptyMessage="No matching account found."
                                  className="h-8 border-slate-300 bg-slate-50 text-xs focus:ring-rose-500"
                                />
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}</>
              )}

              {/* Save button */}
              {selectedProfileStaffId && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm text-slate-600">
                    {savedProfileIds.includes(selectedProfileStaffId) ? (
                      <span className="text-green-600 font-medium">✓ Profile saved for {selectedProfileStaffId}</span>
                    ) : (
                      <span className="text-slate-400">Unsaved changes for {selectedProfileStaffId}</span>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSavedProfileIds((prev) => prev.includes(selectedProfileStaffId) ? prev : [...prev, selectedProfileStaffId]);
                      toast.success(`Deduction & allowance profile saved for ${selectedProfileStaffId}`);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Save Profile for {selectedProfileStaffId}
                  </Button>
                </div>
              )}

              {/* Saved profiles summary */}
              {savedProfileIds.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Saved Staff Profiles</p>
                  <div className="space-y-3">
                    {savedProfileIds.map((sid) => {
                      const reg = staffRegistrationRegister.find((s) => s.staffId === sid);
                      const profile = staffPayrollProfiles.find((p) => p.staffId === sid);
                      const activeDeductions = profile?.deductions.filter((d) => d.enabled).length ?? 0;
                      const activeAllowances = profile?.allowances.filter((a) => a.enabled).length ?? 0;
                      return (
                        <div key={sid} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                          <div>
                            <span className="font-semibold text-slate-900">{sid}</span>
                            {reg && <span className="ml-2 text-slate-500">{reg.fullName} — {reg.department}</span>}
                          </div>
                          <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 font-medium">{activeDeductions} deduction{activeDeductions !== 1 ? 's' : ''}</span>
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700 font-medium">{activeAllowances} allowance{activeAllowances !== 1 ? 's' : ''}</span>
                            <button
                              onClick={() => { setSelectedProfileStaffId(sid); setSetupSubView('deduction'); }}
                              className="text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : staffPayrollView === 'staff-registration' ? (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="border-b bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5">
            <h4 className="text-lg font-semibold text-slate-900">Staff Registration</h4>
            <p className="mt-1 text-sm text-slate-600">
              Register staff into payroll with their department, employment profile, salary, and bank payment details.
            </p>
          </div>
          <CardContent className="space-y-6 p-6">
            {/* Section: Personal Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Personal Information</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Staff ID <span className="text-red-500">*</span></label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.staffId} onChange={(e) => handleStaffRegistrationFormChange('staffId', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Select value={staffRegistrationForm.title} onValueChange={(v) => handleStaffRegistrationFormChange('title', v)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select title" /></SelectTrigger>
                    <SelectContent>
                      {['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Engr.', 'Pharm.', 'Nurse'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.fullName} onChange={(e) => handleStaffRegistrationFormChange('fullName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Gender</label>
                  <Select value={staffRegistrationForm.gender} onValueChange={(v) => handleStaffRegistrationFormChange('gender', v)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {['Male', 'Female', 'Other'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                  <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.dateOfBirth} onChange={(e) => handleStaffRegistrationFormChange('dateOfBirth', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.phone} onChange={(e) => handleStaffRegistrationFormChange('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <Input type="email" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.email} onChange={(e) => handleStaffRegistrationFormChange('email', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Home Address</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.homeAddress} onChange={(e) => handleStaffRegistrationFormChange('homeAddress', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">State of Origin</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.stateOfOrigin} onChange={(e) => handleStaffRegistrationFormChange('stateOfOrigin', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section: Next of Kin */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Next of Kin</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.nextOfKinName} onChange={(e) => handleStaffRegistrationFormChange('nextOfKinName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.nextOfKinPhone} onChange={(e) => handleStaffRegistrationFormChange('nextOfKinPhone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Relationship</label>
                  <Select value={staffRegistrationForm.nextOfKinRelationship} onValueChange={(v) => handleStaffRegistrationFormChange('nextOfKinRelationship', v)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      {['Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Employment Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Employment Details</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Department <span className="text-red-500">*</span></label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.department} onChange={(e) => handleStaffRegistrationFormChange('department', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Designation <span className="text-red-500">*</span></label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.designation} onChange={(e) => handleStaffRegistrationFormChange('designation', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Staff Group <span className="text-red-500">*</span></label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.staffGroup} onChange={(e) => handleStaffRegistrationFormChange('staffGroup', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Employment Type</label>
                  <Select value={staffRegistrationForm.employmentType} onValueChange={(v) => handleStaffRegistrationFormChange('employmentType', v)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Full-time', 'Part-time', 'Contract', 'Intern', 'Locum'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Employment Date <span className="text-red-500">*</span></label>
                  <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.employmentDate} onChange={(e) => handleStaffRegistrationFormChange('employmentDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Salary Grade / Level</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" placeholder="e.g. GL 10 / Step 3" value={staffRegistrationForm.salaryGrade} onChange={(e) => handleStaffRegistrationFormChange('salaryGrade', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Gross Salary (₦) <span className="text-red-500">*</span></label>
                  <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.grossSalary} onChange={(e) => handleStaffRegistrationFormChange('grossSalary', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <Select value={staffRegistrationForm.status} onValueChange={(v) => handleStaffRegistrationFormChange('status', v)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Active', 'Inactive', 'On Leave', 'Suspended', 'Terminated'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Statutory & Tax IDs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Statutory & Tax Information</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tax ID / TIN</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.taxId} onChange={(e) => handleStaffRegistrationFormChange('taxId', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pension PIN (RSA)</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.pensionPin} onChange={(e) => handleStaffRegistrationFormChange('pensionPin', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">NHF Number</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.nhfNumber} onChange={(e) => handleStaffRegistrationFormChange('nhfNumber', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section: Bank / Payment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Bank & Payment Details</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bank Name</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.bankName} onChange={(e) => handleStaffRegistrationFormChange('bankName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Account Number</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffRegistrationForm.accountNumber} onChange={(e) => handleStaffRegistrationFormChange('accountNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Payment Mode</label>
                  <Select value={staffRegistrationForm.paymentMode} onValueChange={(v) => handleStaffRegistrationFormChange('paymentMode', v)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Bank Transfer', 'Cash', 'Cheque'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {staffRegistrationError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {staffRegistrationError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="border-slate-300" onClick={resetStaffRegistrationForm}>Clear Form</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveStaffRegistration}>
                <Save className="mr-2 h-4 w-4" />
                Save Staff Registration
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[1300px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Staff ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Full Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Designation</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Staff Group</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Gross Salary</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Bank Details</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {staffRegistrationRegister.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{staff.staffId}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{staff.fullName}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{staff.department}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{staff.designation}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{staff.staffGroup}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(staff.grossSalary)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{staff.bankName || '-'}</div>
                        <div className="mt-1 text-xs text-slate-500">{staff.accountNumber || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{staff.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="border-b bg-gradient-to-r from-slate-50 to-amber-50 px-6 py-5">
            <h4 className="text-lg font-semibold text-slate-900">Staff Salary Advance</h4>
            <p className="mt-1 text-sm text-slate-600">
              Record salary advance requests, repayment terms, approval status, and the responsible payroll approver.
            </p>
          </div>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 xl:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Staff</label>
                  <SearchableSelect
                    value={staffSalaryAdvanceForm.staffId}
                    onValueChange={(value) => handleStaffSalaryAdvanceFormChange('staffId', value)}
                    options={searchableStaffRegistrationOptions}
                    placeholder="Search staff by ID or name"
                    searchPlaceholder="Search staff registration by ID, name, or department..."
                    emptyMessage="No matching staff found."
                    className="border-slate-300 bg-slate-50 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Request Date</label>
                  <Input type="date" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffSalaryAdvanceForm.requestDate} onChange={(event) => handleStaffSalaryAdvanceFormChange('requestDate', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Amount</label>
                  <Input type="number" min="0" step="0.01" className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffSalaryAdvanceForm.amount} onChange={(event) => handleStaffSalaryAdvanceFormChange('amount', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Repayment Months</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffSalaryAdvanceForm.repaymentMonths} onChange={(event) => handleStaffSalaryAdvanceFormChange('repaymentMonths', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <Select value={staffSalaryAdvanceForm.status} onValueChange={(value) => handleStaffSalaryAdvanceFormChange('status', value)}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 focus:ring-blue-500"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {['Pending Approval', 'Approved', 'Rejected', 'Disbursed'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Approved By</label>
                  <Input className="border-slate-300 bg-slate-50 focus-visible:ring-blue-500" value={staffSalaryAdvanceForm.approvedBy} onChange={(event) => handleStaffSalaryAdvanceFormChange('approvedBy', event.target.value)} placeholder={accountantName} />
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <label className="text-sm font-medium text-slate-700">Reason</label>
                  <textarea className="min-h-[110px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500" value={staffSalaryAdvanceForm.reason} onChange={(event) => handleStaffSalaryAdvanceFormChange('reason', event.target.value)} />
                </div>
              </div>
            </div>

            {selectedSalaryAdvanceStaff ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Selected Staff Preview</p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 text-sm text-slate-700">
                  <div><span className="font-semibold">Name:</span> {selectedSalaryAdvanceStaff.fullName}</div>
                  <div><span className="font-semibold">Department:</span> {selectedSalaryAdvanceStaff.department}</div>
                  <div><span className="font-semibold">Gross Salary:</span> {formatCurrency(selectedSalaryAdvanceStaff.grossSalary)}</div>
                </div>
              </div>
            ) : null}

            {staffSalaryAdvanceError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {staffSalaryAdvanceError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="border-slate-300" onClick={resetStaffSalaryAdvanceForm}>Clear Form</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveStaffSalaryAdvance}>
                <Save className="mr-2 h-4 w-4" />
                Save Salary Advance
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[1200px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Advance Ref</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Staff</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Request Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Repayment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {staffSalaryAdvanceRegister.map((advance) => (
                    <tr key={advance.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{advance.id}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{advance.staffName}</div>
                        <div className="mt-1 text-xs text-slate-500">{advance.staffId}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{advance.department}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{advance.requestDate}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(advance.amount)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{advance.repaymentMonths}</td>
                      <td className="px-4 py-4">
                        <Badge className={advance.status === 'Approved' || advance.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{advance.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{advance.approvedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const pendingMaintenanceApprovals = maintenanceApprovalQueue.filter(
    (record) => record.routeTo === 'Accountant Approval Queue',
  );
  const pendingAssetPurchaseApprovals = assetPurchaseApprovalQueue.filter(
    (record) => record.routeTo === 'Accountant Purchase Approval Queue',
  );

  const handleApproveMaintenanceRequest = (requestId: string) => {
    const request = maintenanceApprovalQueue.find((record) => record.id === requestId);
    if (!request) {
      toast.error('Maintenance request not found.');
      return;
    }

    if (!request.expenseGlId || !request.assetGlId || request.repairCost <= 0) {
      toast.error('This maintenance request is missing the repair amount or GL links.');
      return;
    }

    const expenseAccount = generalLedgerAccounts.find((account) => account.id === request.expenseGlId);
    const assetAccount = generalLedgerAccounts.find((account) => account.id === request.assetGlId);

    if (!expenseAccount || !assetAccount) {
      toast.error('The maintenance GL accounts could not be found.');
      return;
    }

    const approvalDate = getTodayIsoDate();
    const ledgerReference = getNextMaintenanceApprovalReference(maintenanceApprovalQueue, approvalDate);
    const result = addGeneralLedgerEntry({
      reference: ledgerReference,
      narration: `Maintenance approval for ${request.equipmentName} (${request.assetReferenceNo})`,
      postedBy: accountantName,
      date: approvalDate,
      lines: [
        {
          accountId: expenseAccount.id,
          accountDetail: expenseAccount.accountDetail || expenseAccount.name,
          description: request.issue,
          type: 'debit',
          amount: request.repairCost,
        },
        {
          accountId: assetAccount.id,
          accountDetail: assetAccount.accountDetail || assetAccount.name,
          description: request.issue,
          type: 'credit',
          amount: request.repairCost,
        },
      ],
    });

    if (!result) {
      toast.error('Could not post the maintenance approval to the general ledger.');
      return;
    }

    setMaintenanceApprovalQueue((prev) =>
      prev.map((record) =>
        record.id === requestId
          ? {
              ...record,
              accountantApprovalStatus: 'Approved',
              approvalComment: record.approvalComment || 'Approved and posted to general ledger.',
              approvedBy: accountantName,
              approvalDate,
              ledgerReference,
            }
          : record,
      ),
    );
    toast.success(`Maintenance request ${request.assetReferenceNo} approved and posted.`);
  };

  const handleDeclineMaintenanceRequest = (requestId: string) => {
    setMaintenanceApprovalQueue((prev) =>
      prev.map((record) =>
        record.id === requestId
          ? {
              ...record,
              accountantApprovalStatus: 'Declined',
              approvalComment: record.approvalComment || 'Declined by accountant.',
              approvedBy: accountantName,
              approvalDate: getTodayIsoDate(),
            }
          : record,
      ),
    );
    toast.success('Maintenance request declined.');
  };

  const handleApproveAssetPurchaseRequest = (requestId: string) => {
    setAssetPurchaseApprovalQueue((prev) =>
      prev.map((record) =>
        record.id === requestId
          ? {
              ...record,
              approvalStatus: 'Approved',
              approvalComment: record.approvalComment || 'Approved for asset procurement.',
              approvedBy: accountantName,
              approvalDate: getTodayIsoDate(),
            }
          : record,
      ),
    );
    toast.success('Asset purchase request approved.');
  };

  const handleDeclineAssetPurchaseRequest = (requestId: string) => {
    setAssetPurchaseApprovalQueue((prev) =>
      prev.map((record) =>
        record.id === requestId
          ? {
              ...record,
              approvalStatus: 'Declined',
              approvalComment: record.approvalComment || 'Declined by accountant.',
              approvedBy: accountantName,
              approvalDate: getTodayIsoDate(),
            }
          : record,
      ),
    );
    toast.success('Asset purchase request declined.');
  };

  const renderAccountsSetup = () => (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">Accounts Setup</h3>
        <p className="text-xs text-blue-700">
          Attach operational modules to the GL accounts they should post into. These setup selections are saved on this workstation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Attach Cashier To GL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Select the GL account the cashier module should use.</p>
              <Select
                value={accountsSetup.cashierGlAccountId}
                onValueChange={(value) =>
                  setAccountsSetup((prev) => ({
                    ...prev,
                    cashierGlAccountId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose cashier GL account" />
                </SelectTrigger>
                <SelectContent>
                  {generalLedgerAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {(account.accountDetail || account.name)} ({account.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Mapping</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedCashierGlAccount
                  ? `${selectedCashierGlAccount.accountDetail || selectedCashierGlAccount.name} (${selectedCashierGlAccount.code})`
                  : 'No cashier GL attached yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock GL To Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Select the GL account that should represent inventory stock.</p>
              <Select
                value={accountsSetup.inventoryStockGlAccountId}
                onValueChange={(value) =>
                  setAccountsSetup((prev) => ({
                    ...prev,
                    inventoryStockGlAccountId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose inventory stock GL account" />
                </SelectTrigger>
                <SelectContent>
                  {generalLedgerAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {(account.accountDetail || account.name)} ({account.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Mapping</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedInventoryStockGlAccount
                  ? `${selectedInventoryStockGlAccount.accountDetail || selectedInventoryStockGlAccount.name} (${selectedInventoryStockGlAccount.code})`
                  : 'No inventory stock GL attached yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attach Wallet To GL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Select the GL account that the patient wallet should post into.</p>
              <Select
                value={accountsSetup.walletGlAccountId}
                onValueChange={(value) =>
                  setAccountsSetup((prev) => ({
                    ...prev,
                    walletGlAccountId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose wallet GL account" />
                </SelectTrigger>
                <SelectContent>
                  {generalLedgerAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {(account.accountDetail || account.name)} ({account.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Mapping</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedWalletGlAccount
                  ? `${selectedWalletGlAccount.accountDetail || selectedWalletGlAccount.name} (${selectedWalletGlAccount.code})`
                  : 'No wallet GL attached yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Income To GL</CardTitle>
          <p className="text-sm text-slate-600">
            Map each revenue-generating department to its own income GL account. Each department can post to a different account.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {DEPARTMENT_INCOME_OPTIONS.map((dept) => {
              const selectedId = accountsSetup.departmentIncomeGlAccounts[dept.key] || '';
              const selectedAccount =
                incomeGlAccounts.find((account) => account.id === selectedId) ||
                setupIncomeGlOptions.find((account) => account.id === selectedId) ||
                null;
              return (
                <div
                  key={dept.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center px-4 md:px-6 py-3"
                >
                  <div className="md:col-span-4">
                    <p className="text-sm font-semibold text-slate-900">{dept.label}</p>
                    <p className="text-xs text-slate-500">{dept.description}</p>
                  </div>
                  <div className="md:col-span-5">
                    <Select
                      value={selectedId}
                      onValueChange={(value) => {
                        const selectedOption = setupIncomeGlOptions.find((account) => account.id === value) || null;
                        const resolvedAccountId =
                          value.startsWith('CATALOG::') && selectedOption
                            ? addGeneralLedgerAccount({
                                name: selectedOption.name,
                                code: selectedOption.code,
                                accountClass: selectedOption.accountClass,
                                accountCategory: selectedOption.accountCategory,
                                chartOfAccount: selectedOption.chartOfAccount,
                                accountDetail: selectedOption.accountDetail,
                              })?.id || value
                            : value;

                        setAccountsSetup((prev) => ({
                          ...prev,
                          departmentIncomeGlAccounts: {
                            ...prev.departmentIncomeGlAccounts,
                            [dept.key]: resolvedAccountId,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose income GL account" />
                      </SelectTrigger>
                      <SelectContent>
                        {setupIncomeGlOptions.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {(account.accountDetail || account.name)} ({account.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Current Mapping</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900 truncate">
                      {selectedAccount
                        ? `${selectedAccount.accountDetail || selectedAccount.name} (${selectedAccount.code})`
                        : 'Not yet attached'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Departmental Expenses To GL</CardTitle>
          <p className="text-sm text-slate-600">
            Map each department to its own expense GL account. Each department can post costs to a different account.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {DEPARTMENT_EXPENSE_OPTIONS.map((dept) => {
              const selectedId = accountsSetup.departmentExpenseGlAccounts[dept.key] || '';
              const selectedAccount =
                expenseGlAccounts.find((account) => account.id === selectedId) ||
                setupExpenseGlOptions.find((account) => account.id === selectedId) ||
                null;
              return (
                <div
                  key={dept.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center px-4 md:px-6 py-3"
                >
                  <div className="md:col-span-4">
                    <p className="text-sm font-semibold text-slate-900">{dept.label}</p>
                    <p className="text-xs text-slate-500">{dept.description}</p>
                  </div>
                  <div className="md:col-span-5">
                    <Select
                      value={selectedId}
                      onValueChange={(value) => {
                        const selectedOption = setupExpenseGlOptions.find((account) => account.id === value) || null;
                        const resolvedAccountId =
                          value.startsWith('CATALOG::') && selectedOption
                            ? addGeneralLedgerAccount({
                                name: selectedOption.name,
                                code: selectedOption.code,
                                accountClass: selectedOption.accountClass,
                                accountCategory: selectedOption.accountCategory,
                                chartOfAccount: selectedOption.chartOfAccount,
                                accountDetail: selectedOption.accountDetail,
                              })?.id || value
                            : value;

                        setAccountsSetup((prev) => ({
                          ...prev,
                          departmentExpenseGlAccounts: {
                            ...prev.departmentExpenseGlAccounts,
                            [dept.key]: resolvedAccountId,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose expense GL account" />
                      </SelectTrigger>
                      <SelectContent>
                        {setupExpenseGlOptions.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {(account.accountDetail || account.name)} ({account.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Current Mapping</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900 truncate">
                      {selectedAccount
                        ? `${selectedAccount.accountDetail || selectedAccount.name} (${selectedAccount.code})`
                        : 'Not yet attached'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Approval Queue</CardTitle>
          <p className="text-sm text-slate-600">
            Review maintenance requests routed from the Maintenance register. Approving will debit the wired repair expense GL and credit the linked asset GL automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingMaintenanceApprovals.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[1350px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset Ref</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Issue</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Reported By</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Debit Expense GL</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Credit Asset GL</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Photo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {pendingMaintenanceApprovals.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{record.assetReferenceNo}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{record.equipmentName}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.location}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.issue}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{record.reportedBy}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.reportedAt}</div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.repairCost)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.expenseGlDisplay || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.assetGlDisplay || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.photoName || 'No upload'}</td>
                      <td className="px-4 py-4">
                        <Badge className={record.accountantApprovalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : record.accountantApprovalStatus === 'Declined' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                          {record.accountantApprovalStatus}
                        </Badge>
                        {record.ledgerReference ? (
                          <div className="mt-1 text-xs text-slate-500">GL Ref: {record.ledgerReference}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={record.accountantApprovalStatus === 'Approved'}
                            onClick={() => handleApproveMaintenanceRequest(record.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            disabled={record.accountantApprovalStatus === 'Declined'}
                            onClick={() => handleDeclineMaintenanceRequest(record.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No maintenance requests are waiting in the accountant approval queue yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Purchase Approval Queue</CardTitle>
          <p className="text-sm text-slate-600">
            Review new asset purchase requests raised by maintenance and decide whether procurement can proceed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingAssetPurchaseApprovals.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[1280px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Request Ref</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Asset Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Reason</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Estimated Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Requested By</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Evidence</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {pendingAssetPurchaseApprovals.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{record.id}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{record.assetName}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.location || 'No location entered'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.assetCategory}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.department}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{record.reason}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.specification || 'No specification note'}</div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{record.quantity}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(record.estimatedCost)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{record.requestedBy}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.requestedAt}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{record.photoName || 'No evidence'}</td>
                      <td className="px-4 py-4">
                        <Badge className={record.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : record.approvalStatus === 'Declined' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                          {record.approvalStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={record.approvalStatus === 'Approved'}
                            onClick={() => handleApproveAssetPurchaseRequest(record.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            disabled={record.approvalStatus === 'Declined'}
                            onClick={() => handleDeclineAssetPurchaseRequest(record.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No asset purchase requests are waiting for accountant approval yet.
            </div>
          )}
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
          <Button
            variant={accountingView === 'setup' ? 'default' : 'ghost'}
            className="flex-1 min-w-[180px]"
            onClick={() => setAccountingView('setup')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Setup
          </Button>
        </div>
      </div>

      {accountingView === 'setup'
        ? renderAccountsSetup()
        : accountingView === 'lab-wallet'
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Accounts</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Accounts Control Center</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use the blue navigation bar to switch between account sections.
            </p>
          </div>
          {accountsLayer === 'accounting' && (() => {
            const { label: activeLabel, Icon: ActiveIcon } = ACCOUNTING_VIEW_INFO[accountingView];
            return (
              <Button
                variant="outline"
                className="shrink-0 pointer-events-none"
                aria-label={`Currently viewing ${activeLabel}`}
              >
                <ActiveIcon className="w-4 h-4 mr-2" />
                {activeLabel}
              </Button>
            );
          })()}
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
