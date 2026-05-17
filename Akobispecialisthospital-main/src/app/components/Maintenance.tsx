import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Search,
  Plus,
  Camera,
  Send,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'maintenance' | 'faulty' | 'out-of-service';
  lastMaintenance: string;
  nextMaintenance: string;
}

type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
type MaintenanceStatus = 'pending' | 'assigned' | 'in-progress' | 'completed';
type MaintenanceApprovalStatus = 'Not Routed' | 'Pending Approval' | 'Approved' | 'Declined';
type AssetPurchaseApprovalStatus = 'Pending Approval' | 'Approved' | 'Declined';

interface AssetRegisterReference {
  id: string;
  asset: string;
  category: string;
  location: string;
  department: string;
  custodian: string;
  debitAccountId: string;
  debitAccountDisplay: string;
}

interface GeneralLedgerAccountOption {
  id: string;
  code: string;
  name: string;
  accountDetail?: string;
  accountClass: 'asset' | 'liability' | 'income' | 'expense';
  chartOfAccount?: string;
}

interface MaintenanceRequest {
  id: string;
  assetReferenceNo: string;
  equipmentName: string;
  location: string;
  issue: string;
  priority: MaintenancePriority;
  reportedBy: string;
  reportedAt: string;
  status: MaintenanceStatus;
  assignedTo?: string;
  repairCost: number;
  photoName: string;
  routeTo: string;
  accountantApprovalStatus: MaintenanceApprovalStatus;
  approvalComment: string;
  expenseGlId: string;
  expenseGlDisplay: string;
  assetGlId: string;
  assetGlDisplay: string;
  department: string;
  custodian: string;
  ledgerReference: string;
}

interface AssetPurchaseRequest {
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
  approvalStatus: AssetPurchaseApprovalStatus;
  approvalComment: string;
  approvedBy?: string;
  approvalDate?: string;
}

type MaintenanceRequestForm = {
  assetReferenceNo: string;
  equipmentName: string;
  location: string;
  department: string;
  custodian: string;
  priority: MaintenancePriority;
  issue: string;
  reportedBy: string;
  repairCost: string;
  expenseGlId: string;
  assetGlId: string;
  photoName: string;
  routeTo: string;
};

type AssetPurchaseRequestForm = {
  assetName: string;
  assetCategory: string;
  department: string;
  location: string;
  specification: string;
  reason: string;
  quantity: string;
  estimatedCost: string;
  vendorName: string;
  requestedBy: string;
  photoName: string;
  routeTo: string;
};

const ASSET_REGISTER_STORAGE_KEY = 'akobi_asset_register';
const GENERAL_LEDGER_ACCOUNTS_STORAGE_KEY = 'akobi_general_ledger_accounts';
const MAINTENANCE_REGISTER_STORAGE_KEY = 'akobi_maintenance_register';
const ASSET_PURCHASE_REQUEST_STORAGE_KEY = 'akobi_asset_purchase_requests';

const sampleEquipment: Equipment[] = [
  {
    id: 'EQ-001',
    name: 'X-Ray Machine',
    location: 'Radiology Department',
    status: 'operational',
    lastMaintenance: '2026-03-15',
    nextMaintenance: '2026-06-15',
  },
  {
    id: 'EQ-002',
    name: 'Ventilator #3',
    location: 'ICU',
    status: 'maintenance',
    lastMaintenance: '2026-04-01',
    nextMaintenance: '2026-07-01',
  },
  {
    id: 'EQ-003',
    name: 'CT Scanner',
    location: 'Radiology Department',
    status: 'faulty',
    lastMaintenance: '2026-02-20',
    nextMaintenance: '2026-05-20',
  },
  {
    id: 'EQ-004',
    name: 'Autoclave Sterilizer',
    location: 'Theatre 1',
    status: 'operational',
    lastMaintenance: '2026-04-10',
    nextMaintenance: '2026-07-10',
  },
];

const initialMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 'MNT-001',
    assetReferenceNo: 'EQ-003',
    equipmentName: 'CT Scanner',
    location: 'Radiology',
    issue: 'Scanner not powering on. Display shows error code E-403',
    priority: 'critical',
    reportedBy: 'Dr. Sarah Johnson',
    reportedAt: '2026-04-21 08:30',
    status: 'in-progress',
    assignedTo: 'Technician Mike',
    repairCost: 0,
    photoName: '',
    routeTo: 'Internal Maintenance Workflow',
    accountantApprovalStatus: 'Not Routed',
    approvalComment: '',
    expenseGlId: '',
    expenseGlDisplay: '',
    assetGlId: '',
    assetGlDisplay: '',
    department: 'Radiology',
    custodian: 'Radiology Unit',
    ledgerReference: '',
  },
  {
    id: 'MNT-002',
    assetReferenceNo: 'EQ-005',
    equipmentName: 'Blood Pressure Monitor',
    location: 'Ward A',
    issue: 'Readings appear inconsistent',
    priority: 'medium',
    reportedBy: 'Nurse Mary',
    reportedAt: '2026-04-21 09:00',
    status: 'assigned',
    assignedTo: 'Technician John',
    repairCost: 0,
    photoName: '',
    routeTo: 'Internal Maintenance Workflow',
    accountantApprovalStatus: 'Not Routed',
    approvalComment: '',
    expenseGlId: '',
    expenseGlDisplay: '',
    assetGlId: '',
    assetGlDisplay: '',
    department: 'Ward A',
    custodian: 'Ward A Team',
    ledgerReference: '',
  },
];

const createBlankMaintenanceRequestForm = (): MaintenanceRequestForm => ({
  assetReferenceNo: '',
  equipmentName: '',
  location: '',
  department: '',
  custodian: '',
  priority: 'medium',
  issue: '',
  reportedBy: '',
  repairCost: '',
  expenseGlId: '',
  assetGlId: '',
  photoName: '',
  routeTo: 'Accountant Approval Queue',
});

const createBlankAssetPurchaseRequestForm = (): AssetPurchaseRequestForm => ({
  assetName: '',
  assetCategory: '',
  department: '',
  location: '',
  specification: '',
  reason: '',
  quantity: '1',
  estimatedCost: '',
  vendorName: '',
  requestedBy: '',
  photoName: '',
  routeTo: 'Accountant Purchase Approval Queue',
});

const getStoredAssetReferences = (): AssetRegisterReference[] => {
  if (typeof window === 'undefined') return [];
  try {
    const v = window.localStorage.getItem(ASSET_REGISTER_STORAGE_KEY);
    if (!v) return [];
    const p = JSON.parse(v) as AssetRegisterReference[];
    return Array.isArray(p) ? p : [];
  } catch { return []; }
};

const getStoredExpenseGlOptions = (): GeneralLedgerAccountOption[] => {
  if (typeof window === 'undefined') return [];
  try {
    const v = window.localStorage.getItem(GENERAL_LEDGER_ACCOUNTS_STORAGE_KEY);
    if (!v) return [];
    const p = JSON.parse(v) as GeneralLedgerAccountOption[];
    return Array.isArray(p) ? p.filter((a) => a.accountClass === 'expense') : [];
  } catch { return []; }
};

const getStoredMaintenanceRequests = (): MaintenanceRequest[] => {
  if (typeof window === 'undefined') return initialMaintenanceRequests;
  try {
    const v = window.localStorage.getItem(MAINTENANCE_REGISTER_STORAGE_KEY);
    if (!v) return initialMaintenanceRequests;
    const p = JSON.parse(v) as MaintenanceRequest[];
    return Array.isArray(p) ? p : initialMaintenanceRequests;
  } catch {
    window.localStorage.removeItem(MAINTENANCE_REGISTER_STORAGE_KEY);
    return initialMaintenanceRequests;
  }
};

const getStoredAssetPurchaseRequests = (): AssetPurchaseRequest[] => {
  if (typeof window === 'undefined') return [];
  try {
    const v = window.localStorage.getItem(ASSET_PURCHASE_REQUEST_STORAGE_KEY);
    if (!v) return [];
    const p = JSON.parse(v) as AssetPurchaseRequest[];
    return Array.isArray(p) ? p : [];
  } catch {
    window.localStorage.removeItem(ASSET_PURCHASE_REQUEST_STORAGE_KEY);
    return [];
  }
};

const formatDateTime = (date = new Date()) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;

// ─── Isolated dialog components — form state lives here, not in Maintenance ───

interface MaintenanceRequestDialogProps {
  assetReferences: AssetRegisterReference[];
  expenseGlOptions: GeneralLedgerAccountOption[];
  onSubmit: (request: MaintenanceRequest) => void;
}

function MaintenanceRequestDialog({ assetReferences, expenseGlOptions, onSubmit }: MaintenanceRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MaintenanceRequestForm>(createBlankMaintenanceRequestForm);
  const [error, setError] = useState<string | null>(null);

  const selectedAsset = useMemo(
    () => assetReferences.find((a) => a.id === form.assetReferenceNo) || null,
    [assetReferences, form.assetReferenceNo],
  );

  const handleChange = (field: keyof MaintenanceRequestForm, value: string) => {
    setError(null);
    if (field === 'assetReferenceNo') {
      const asset = assetReferences.find((a) => a.id === value);
      if (!asset) {
        setForm((prev) => ({ ...prev, assetReferenceNo: value, equipmentName: '', location: '', department: '', custodian: '', assetGlId: '' }));
      } else {
        setForm((prev) => ({ ...prev, assetReferenceNo: value, equipmentName: asset.asset, location: asset.location, department: asset.department, custodian: asset.custodian, assetGlId: asset.debitAccountId || '' }));
      }
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.photoName.trim()) {
      setError('A photo or file evidence is required. Upload a photo before routing — records without evidence are marked incomplete and cannot be routed.');
      return;
    }
    if (!form.assetReferenceNo.trim() || !form.equipmentName.trim() || !form.issue.trim() || !form.reportedBy.trim() || !form.expenseGlId.trim() || !form.assetGlId.trim() || !form.repairCost.trim()) {
      setError('Select the asset reference, enter the issue, choose the expense GL, and enter the repair amount before routing.');
      return;
    }
    const expenseGl = expenseGlOptions.find((a) => a.id === form.expenseGlId);
    const repairCost = Number.parseFloat(form.repairCost || '0') || 0;
    if (!expenseGl || repairCost <= 0) {
      setError('Choose a valid maintenance expense GL account and enter a repair amount above zero.');
      return;
    }
    onSubmit({
      id: `MNT-${Date.now()}`,
      assetReferenceNo: form.assetReferenceNo.trim(),
      equipmentName: form.equipmentName.trim(),
      location: form.location.trim(),
      issue: form.issue.trim(),
      priority: form.priority,
      reportedBy: form.reportedBy.trim(),
      reportedAt: formatDateTime(),
      status: 'pending',
      repairCost,
      photoName: form.photoName.trim(),
      routeTo: form.routeTo.trim() || 'Accountant Approval Queue',
      accountantApprovalStatus: 'Pending Approval',
      approvalComment: '',
      expenseGlId: expenseGl.id,
      expenseGlDisplay: `${expenseGl.accountDetail || expenseGl.name} (${expenseGl.code})`,
      assetGlId: form.assetGlId,
      assetGlDisplay: selectedAsset?.debitAccountDisplay || 'Asset GL not linked',
      department: form.department.trim(),
      custodian: form.custodian.trim(),
      ledgerReference: '',
    });
    setForm(createBlankMaintenanceRequestForm());
    setError(null);
    setOpen(false);
    toast.success('Maintenance request routed to accountant approval.');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New Maintenance Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Maintenance Register Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Asset Reference</h4>
            <p className="mt-1 text-sm text-slate-500">Select the asset reference first so the equipment, location, and asset GL can load automatically.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>Asset Reference No</Label>
                <Select value={form.assetReferenceNo} onValueChange={(v) => handleChange('assetReferenceNo', v)}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select asset reference" /></SelectTrigger>
                  <SelectContent>
                    {assetReferences.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.id} - {a.asset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipment / Asset Name</Label>
                <Input readOnly className="bg-white" value={form.equipmentName} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input readOnly className="bg-white" value={form.location} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input readOnly className="bg-white" value={form.department} />
              </div>
              <div className="space-y-2">
                <Label>Custodian</Label>
                <Input readOnly className="bg-white" value={form.custodian} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => handleChange('priority', v)}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical - Immediate attention</SelectItem>
                    <SelectItem value="high">High - Within 4 hours</SelectItem>
                    <SelectItem value="medium">Medium - Within 24 hours</SelectItem>
                    <SelectItem value="low">Low - Routine maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Issue & Evidence</h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>Reported By</Label>
                <Input value={form.reportedBy} onChange={(e) => handleChange('reportedBy', e.target.value)} placeholder="Staff who reported the issue" />
              </div>
              <div className="space-y-2">
                <Label>Estimated Repair Amount</Label>
                <Input type="number" min="0" step="0.01" value={form.repairCost} onChange={(e) => handleChange('repairCost', e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-3">
                <Label>Photo / Evidence</Label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Take Photo</p>
                    <Input type="file" accept="image/*" capture="environment" className="mt-2 bg-white" onChange={(e) => handleChange('photoName', e.target.files?.[0]?.name || '')} />
                    <p className="mt-2 text-xs text-blue-700">Open camera directly on supported phones and tablets.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Upload Existing Photo</p>
                    <Input type="file" accept="image/*" className="mt-2 bg-white" onChange={(e) => handleChange('photoName', e.target.files?.[0]?.name || '')} />
                  </div>
                </div>
                <p className="text-xs text-slate-500">{form.photoName || 'No photo selected yet.'}</p>
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <Label>Issue Description</Label>
                <Textarea value={form.issue} onChange={(e) => handleChange('issue', e.target.value)} placeholder="Describe the fault, repair need, or maintenance reason..." rows={4} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Routing & Posting</h4>
            <p className="mt-1 text-sm text-slate-500">Route the request to the accountant. Once approved, the system will debit the chosen repair expense GL and credit the asset GL linked to the selected asset.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Route To</Label>
                <Select value={form.routeTo} onValueChange={(v) => handleChange('routeTo', v)}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select routing destination" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accountant Approval Queue">Accountant Approval Queue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expense GL To Debit</Label>
                <Select value={form.expenseGlId} onValueChange={(v) => handleChange('expenseGlId', v)}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select repair expense GL" /></SelectTrigger>
                  <SelectContent>
                    {expenseGlOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{(a.accountDetail || a.name)} ({a.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asset GL To Credit</Label>
                <Input readOnly className="bg-slate-50" value={selectedAsset?.debitAccountDisplay || 'Loads from selected asset register'} />
              </div>
              <div className="space-y-2">
                <Label>Approval Status</Label>
                <Input readOnly className="bg-slate-50" value="Pending Approval" />
              </div>
            </div>
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setForm(createBlankMaintenanceRequestForm())}>Clear Form</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Route To Accountant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AssetPurchaseRequestDialogProps {
  onSubmit: (request: AssetPurchaseRequest) => void;
}

function AssetPurchaseRequestDialog({ onSubmit }: AssetPurchaseRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AssetPurchaseRequestForm>(createBlankAssetPurchaseRequestForm);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof AssetPurchaseRequestForm, value: string) => {
    setError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.photoName.trim()) {
      setError('A photo or quotation file is required. Upload evidence before sending — records without a file are marked incomplete and cannot be routed.');
      return;
    }
    if (!form.assetName.trim() || !form.assetCategory.trim() || !form.department.trim() || !form.reason.trim() || !form.requestedBy.trim() || !form.estimatedCost.trim()) {
      setError('Complete the asset details, reason, requester, and estimated cost before sending to the accountant.');
      return;
    }
    const quantity = Number.parseInt(form.quantity || '1', 10);
    const estimatedCost = Number.parseFloat(form.estimatedCost || '0') || 0;
    if (quantity <= 0 || estimatedCost <= 0) {
      setError('Quantity and estimated cost must both be above zero.');
      return;
    }
    onSubmit({
      id: `APR-${Date.now()}`,
      assetName: form.assetName.trim(),
      assetCategory: form.assetCategory.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      specification: form.specification.trim(),
      reason: form.reason.trim(),
      quantity,
      estimatedCost,
      vendorName: form.vendorName.trim(),
      requestedBy: form.requestedBy.trim(),
      requestedAt: formatDateTime(),
      photoName: form.photoName.trim(),
      routeTo: form.routeTo.trim() || 'Accountant Purchase Approval Queue',
      approvalStatus: 'Pending Approval',
      approvalComment: '',
    });
    setForm(createBlankAssetPurchaseRequestForm());
    setError(null);
    setOpen(false);
    toast.success('Asset purchase request routed to accountant approval.');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
          <Plus className="mr-2 h-4 w-4" />
          Asset Purchase Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Asset Purchase Request Form</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Purchase Details</h4>
            <p className="mt-1 text-sm text-slate-500">Use this form when maintenance needs to buy a new asset and send the request to the accountant for approval.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input value={form.assetName} onChange={(e) => handleChange('assetName', e.target.value)} placeholder="e.g. Oxygen Concentrator" />
              </div>
              <div className="space-y-2">
                <Label>Asset Category</Label>
                <Input value={form.assetCategory} onChange={(e) => handleChange('assetCategory', e.target.value)} placeholder="e.g. Medical Equipment" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Department requesting asset" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Ward, room, or unit" />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estimated Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(e) => handleChange('estimatedCost', e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2 xl:col-span-3">
                <Label>Specification</Label>
                <Textarea value={form.specification} onChange={(e) => handleChange('specification', e.target.value)} placeholder="Describe the technical requirement or asset specification..." rows={3} />
              </div>
              <div className="space-y-2 xl:col-span-3">
                <Label>Reason for Purchase</Label>
                <Textarea value={form.reason} onChange={(e) => handleChange('reason', e.target.value)} placeholder="Why does maintenance need this asset purchase?" rows={4} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Request & Evidence</h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>Requested By</Label>
                <Input value={form.requestedBy} onChange={(e) => handleChange('requestedBy', e.target.value)} placeholder="Maintenance officer or supervisor" />
              </div>
              <div className="space-y-2">
                <Label>Suggested Vendor</Label>
                <Input value={form.vendorName} onChange={(e) => handleChange('vendorName', e.target.value)} placeholder="Optional vendor name" />
              </div>
              <div className="space-y-2">
                <Label>Route To</Label>
                <Input readOnly className="bg-slate-50" value={form.routeTo} />
              </div>
              <div className="space-y-3 xl:col-span-3">
                <Label>Photo / Quotation Evidence</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Take Photo</p>
                    <Input type="file" accept="image/*" capture="environment" className="mt-2 bg-white" onChange={(e) => handleChange('photoName', e.target.files?.[0]?.name || '')} />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Upload Quotation / Photo</p>
                    <Input type="file" accept="image/*,.pdf" className="mt-2 bg-white" onChange={(e) => handleChange('photoName', e.target.files?.[0]?.name || '')} />
                  </div>
                </div>
                <p className="text-xs text-slate-500">{form.photoName || 'No evidence selected yet.'}</p>
              </div>
            </div>
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setForm(createBlankAssetPurchaseRequestForm())}>Clear Form</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Send To Accountant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Maintenance page ────────────────────────────────────────────────────

export function Maintenance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [equipment] = useState<Equipment[]>(sampleEquipment);
  const [requests, setRequests] = useState<MaintenanceRequest[]>(() => getStoredMaintenanceRequests());
  const [assetReferences, setAssetReferences] = useState<AssetRegisterReference[]>(() => getStoredAssetReferences());
  const [expenseGlOptions, setExpenseGlOptions] = useState<GeneralLedgerAccountOption[]>(() => getStoredExpenseGlOptions());
  const [purchaseRequests, setPurchaseRequests] = useState<AssetPurchaseRequest[]>(() => getStoredAssetPurchaseRequests());

  useEffect(() => {
    window.localStorage.setItem(MAINTENANCE_REGISTER_STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    window.localStorage.setItem(ASSET_PURCHASE_REQUEST_STORAGE_KEY, JSON.stringify(purchaseRequests));
  }, [purchaseRequests]);

  useEffect(() => {
    const sync = () => {
      setAssetReferences(getStoredAssetReferences());
      setExpenseGlOptions(getStoredExpenseGlOptions());
      setRequests(getStoredMaintenanceRequests());
      setPurchaseRequests(getStoredAssetPurchaseRequests());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = [
    { label: 'Total Equipment', value: equipment.length.toString(), icon: Settings, color: 'bg-blue-500' },
    {
      label: 'Operational',
      value: equipment.filter((item) => item.status === 'operational').length.toString(),
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Under Maintenance',
      value: requests.filter((item) => item.status === 'in-progress' || item.status === 'assigned').length.toString(),
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      label: 'Waiting Approval',
      value: (
        requests.filter((item) => item.accountantApprovalStatus === 'Pending Approval').length +
        purchaseRequests.filter((item) => item.approvalStatus === 'Pending Approval').length
      ).toString(),
      icon: AlertTriangle,
      color: 'bg-rose-500',
    },
  ];

  const getPriorityBadge = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-600">High</Badge>;
      case 'medium': return <Badge variant="default">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return null;
    }
  };

  const getApprovalBadge = (status: MaintenanceApprovalStatus) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>;
      case 'Declined': return <Badge className="bg-rose-100 text-rose-700">Declined</Badge>;
      case 'Pending Approval': return <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>;
      default: return <Badge variant="outline">Not Routed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maintenance Register</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Capture the asset reference, upload maintenance evidence, and route the repair request to the accountant for approval and GL posting.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <AssetPurchaseRequestDialog
                onSubmit={(r) => setPurchaseRequests((prev) => [r, ...prev])}
              />
              <MaintenanceRequestDialog
                assetReferences={assetReferences}
                expenseGlOptions={expenseGlOptions}
                onSubmit={(r) => setRequests((prev) => [r, ...prev])}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h4 className="font-semibold text-gray-900">{request.equipmentName}</h4>
                      {getPriorityBadge(request.priority)}
                      <Badge variant={request.status === 'completed' ? 'default' : request.status === 'in-progress' ? 'secondary' : 'outline'}>
                        {request.status}
                      </Badge>
                      {!request.photoName && (
                        <Badge className="bg-red-100 text-red-700">Incomplete — No Evidence</Badge>
                      )}
                      {getApprovalBadge(request.accountantApprovalStatus)}
                    </div>
                    <p className="mb-2 text-sm text-gray-700">{request.issue}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-gray-600">Asset Ref</p>
                        <p className="font-medium">{request.assetReferenceNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium">{request.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reported By</p>
                        <p className="font-medium">{request.reportedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reported At</p>
                        <p className="font-medium">{request.reportedAt}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Repair Amount</p>
                        <p className="font-medium">₦{request.repairCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expense GL</p>
                        <p className="font-medium">{request.expenseGlDisplay || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Asset GL</p>
                        <p className="font-medium">{request.assetGlDisplay || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Photo</p>
                        <p className="font-medium">{request.photoName || 'No photo yet'}</p>
                      </div>
                    </div>
                    {request.routeTo ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Routed To: <span className="font-semibold text-slate-900">{request.routeTo}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {request.photoName ? (
                      <Button size="sm" variant="outline">
                        <Camera className="mr-1 h-4 w-4" />
                        Evidence
                      </Button>
                    ) : null}
                    {request.status === 'pending' ? <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Assign</Button> : null}
                    {request.status === 'in-progress' ? (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Complete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search equipment by name or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Equipment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Maintenance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Next Maintenance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{eq.name}</p>
                        <p className="text-sm text-gray-500">{eq.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{eq.location}</td>
                    <td className="px-4 py-3">
                      <Badge variant={eq.status === 'operational' ? 'default' : eq.status === 'maintenance' ? 'secondary' : eq.status === 'faulty' ? 'destructive' : 'outline'}>
                        {eq.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{eq.lastMaintenance}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{eq.nextMaintenance}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View History</Button>
                        <Button size="sm" variant="outline"><Wrench className="h-4 w-4" /></Button>
                      </div>
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
}
