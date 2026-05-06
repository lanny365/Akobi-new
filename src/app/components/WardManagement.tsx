import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Bed, Plus, Edit, Trash2, Building2, DollarSign, Users, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface Ward {
  id: string;
  wardNumber: string;
  wardType: 'General' | 'Private' | 'Semi-Private' | 'ICU' | 'Maternity' | 'Shared';
  cost: number;
  discountedPrice?: number;
  billingType: 'Daily' | 'Weekly' | 'Hourly';
  extraCharges: {
    nursingCare: number;
    oxygen: number;
    equipmentUsage: number;
  };
  maxPatients: number;
  visitorsRestriction: number;
  status: 'active' | 'inactive';
  description: string;
}

export function WardManagement() {
  const [wards, setWards] = useState<Ward[]>([
    {
      id: '1',
      wardNumber: 'Ward 1',
      wardType: 'Shared',
      cost: 5000,
      billingType: 'Daily',
      extraCharges: {
        nursingCare: 1000,
        oxygen: 2000,
        equipmentUsage: 1500,
      },
      maxPatients: 6,
      visitorsRestriction: 2,
      status: 'active',
      description: 'Shared ward with basic amenities'
    },
    {
      id: '2',
      wardNumber: 'Ward 2',
      wardType: 'Private',
      cost: 25000,
      discountedPrice: 22000,
      billingType: 'Daily',
      extraCharges: {
        nursingCare: 3000,
        oxygen: 2500,
        equipmentUsage: 2000,
      },
      maxPatients: 1,
      visitorsRestriction: 4,
      status: 'active',
      description: 'Private ward with premium facilities'
    },
    {
      id: '3',
      wardNumber: 'ICU-1',
      wardType: 'ICU',
      cost: 15000,
      billingType: 'Hourly',
      extraCharges: {
        nursingCare: 5000,
        oxygen: 5000,
        equipmentUsage: 7500,
      },
      maxPatients: 1,
      visitorsRestriction: 1,
      status: 'active',
      description: 'Intensive Care Unit with 24/7 monitoring'
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentWard, setCurrentWard] = useState<Ward | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Ward>>({
    wardNumber: '',
    wardType: 'General',
    cost: 0,
    discountedPrice: undefined,
    billingType: 'Daily',
    extraCharges: {
      nursingCare: 0,
      oxygen: 0,
      equipmentUsage: 0,
    },
    maxPatients: 1,
    visitorsRestriction: 2,
    status: 'active',
    description: '',
  });

  const wardTypeColors = {
    'General': 'bg-blue-100 text-blue-700 border-blue-200',
    'Private': 'bg-purple-100 text-purple-700 border-purple-200',
    'Semi-Private': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'ICU': 'bg-red-100 text-red-700 border-red-200',
    'Maternity': 'bg-pink-100 text-pink-700 border-pink-200',
    'Shared': 'bg-green-100 text-green-700 border-green-200',
  };

  const handleOpenDialog = (ward?: Ward) => {
    if (ward) {
      setEditMode(true);
      setCurrentWard(ward);
      setFormData(ward);
    } else {
      setEditMode(false);
      setCurrentWard(null);
      // Auto-generate ward number for shared wards
      const sharedWards = wards.filter(w => w.wardType === 'Shared');
      const nextWardNumber = sharedWards.length + 1;
      setFormData({
        wardNumber: `Ward ${nextWardNumber}`,
        wardType: 'General',
        cost: 0,
        discountedPrice: undefined,
        billingType: 'Daily',
        extraCharges: {
          nursingCare: 0,
          oxygen: 0,
          equipmentUsage: 0,
        },
        maxPatients: 1,
        visitorsRestriction: 2,
        status: 'active',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditMode(false);
    setCurrentWard(null);
    setFormData({
      wardNumber: '',
      wardType: 'General',
      cost: 0,
      discountedPrice: undefined,
      billingType: 'Daily',
      extraCharges: {
        nursingCare: 0,
        oxygen: 0,
        equipmentUsage: 0,
      },
      maxPatients: 1,
      visitorsRestriction: 2,
      status: 'active',
      description: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.wardNumber || !formData.cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editMode && currentWard) {
      // Update existing ward
      setWards(wards.map(w => w.id === currentWard.id ? { ...formData, id: currentWard.id } as Ward : w));
      toast.success('Ward updated successfully');
    } else {
      // Add new ward
      const newWard: Ward = {
        id: Date.now().toString(),
        ...formData,
      } as Ward;
      setWards([...wards, newWard]);
      toast.success('Ward registered successfully');
    }

    handleCloseDialog();
  };

  const handleDeleteWard = (wardId: string) => {
    setWards(wards.filter(w => w.id !== wardId));
    toast.success('Ward deleted successfully');
  };

  const handleToggleStatus = (wardId: string) => {
    setWards(wards.map(w =>
      w.id === wardId
        ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : w
    ));
    toast.success('Ward status updated');
  };

  const handleWardTypeChange = (type: Ward['wardType']) => {
    // Auto-generate ward numbers for shared wards
    if (type === 'Shared') {
      const sharedWards = wards.filter(w => w.wardType === 'Shared');
      const nextWardNumber = sharedWards.length + 1;
      setFormData({
        ...formData,
        wardType: type,
        wardNumber: `Ward ${nextWardNumber}`,
        billingType: 'Daily',
      });
    } else if (type === 'ICU') {
      setFormData({
        ...formData,
        wardType: type,
        billingType: 'Hourly', // ICU defaults to hourly billing
      });
    } else {
      setFormData({
        ...formData,
        wardType: type,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Ward Registration & Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Register and maintain hospital wards with pricing and capacity
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register Ward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  {editMode ? 'Edit Ward' : 'Register New Ward'}
                </DialogTitle>
                <DialogDescription>
                  {editMode ? 'Update ward information and pricing details' : 'Add a new ward to the hospital system'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Ward Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wardType" className="text-sm font-semibold">
                      Ward Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="wardType"
                      value={formData.wardType}
                      onChange={(e) => handleWardTypeChange(e.target.value as Ward['wardType'])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="General">General</option>
                      <option value="Private">Private</option>
                      <option value="Semi-Private">Semi-Private</option>
                      <option value="ICU">ICU (Intensive Care Unit)</option>
                      <option value="Maternity">Maternity</option>
                      <option value="Shared">Shared</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wardNumber" className="text-sm font-semibold">
                      Ward Number/Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="wardNumber"
                      value={formData.wardNumber}
                      onChange={(e) => setFormData({ ...formData, wardNumber: e.target.value })}
                      placeholder="e.g., Ward 1, ICU-1"
                      required
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Pricing Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost" className="text-sm font-semibold">
                        Cost {formData.billingType === 'Daily' && '(Per Day)'}
                        {formData.billingType === 'Weekly' && '(Per Week)'}
                        {formData.billingType === 'Hourly' && '(Per Hour)'}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cost"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountedPrice" className="text-sm font-semibold">
                        Discounted Price (Optional)
                      </Label>
                      <Input
                        id="discountedPrice"
                        type="number"
                        value={formData.discountedPrice || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          discountedPrice: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingType" className="text-sm font-semibold">
                        Billing Type <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="billingType"
                        value={formData.billingType}
                        onChange={(e) => setFormData({ ...formData, billingType: e.target.value as Ward['billingType'] })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Hourly">Hourly (for ICU)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Extra Charges Section */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Extra Charges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nursingCare" className="text-sm font-semibold">
                        Nursing Care
                      </Label>
                      <Input
                        id="nursingCare"
                        type="number"
                        value={formData.extraCharges?.nursingCare}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          extraCharges: { 
                            ...formData.extraCharges!, 
                            nursingCare: Number(e.target.value) 
                          } 
                        })}
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oxygen" className="text-sm font-semibold">
                        Oxygen
                      </Label>
                      <Input
                        id="oxygen"
                        type="number"
                        value={formData.extraCharges?.oxygen}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          extraCharges: { 
                            ...formData.extraCharges!, 
                            oxygen: Number(e.target.value) 
                          } 
                        })}
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="equipmentUsage" className="text-sm font-semibold">
                        Equipment Usage
                      </Label>
                      <Input
                        id="equipmentUsage"
                        type="number"
                        value={formData.extraCharges?.equipmentUsage}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          extraCharges: { 
                            ...formData.extraCharges!, 
                            equipmentUsage: Number(e.target.value) 
                          } 
                        })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity and Restrictions */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Capacity & Visitor Restrictions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxPatients" className="text-sm font-semibold">
                        Maximum Patients Allowed <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="maxPatients"
                        type="number"
                        value={formData.maxPatients}
                        onChange={(e) => setFormData({ ...formData, maxPatients: Number(e.target.value) })}
                        placeholder="1"
                        min="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visitorsRestriction" className="text-sm font-semibold">
                        Visitors Restriction (Max per patient)
                      </Label>
                      <Input
                        id="visitorsRestriction"
                        type="number"
                        value={formData.visitorsRestriction}
                        onChange={(e) => setFormData({ ...formData, visitorsRestriction: Number(e.target.value) })}
                        placeholder="2"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">
                    Ward Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter ward description, facilities, and any special notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold">Ward Status</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.status === 'active' ? 'Ward is active and available' : 'Ward is inactive'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      status: checked ? 'active' : 'inactive' 
                    })}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
                  >
                    {editMode ? 'Update Ward' : 'Register Ward'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bed className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Total Wards</p>
                <p className="text-2xl font-bold text-blue-900">{wards.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium">Active Wards</p>
                <p className="text-2xl font-bold text-green-900">
                  {wards.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-700 font-medium">Total Capacity</p>
                <p className="text-2xl font-bold text-purple-900">
                  {wards.reduce((sum, w) => sum + w.maxPatients, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-700 font-medium">ICU Wards</p>
                <p className="text-2xl font-bold text-orange-900">
                  {wards.filter(w => w.wardType === 'ICU').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wards List */}
        {wards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Wards Registered</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start by registering your first ward
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Register Ward
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {wards.map((ward) => (
              <div
                key={ward.id}
                className="p-5 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
                        <Bed className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{ward.wardNumber}</h3>
                        <Badge className={`${wardTypeColors[ward.wardType]} text-xs px-2 py-1 border`}>
                          {ward.wardType}
                        </Badge>
                      </div>
                      <Badge variant={ward.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                        {ward.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {ward.description && (
                      <p className="text-sm text-gray-600 mb-3">{ward.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium mb-1">Base Cost</p>
                        <p className="text-lg font-bold text-blue-900">
                          ₦{ward.cost.toLocaleString()}
                          <span className="text-xs font-normal text-blue-600">
                            /{ward.billingType === 'Daily' ? 'day' : ward.billingType === 'Weekly' ? 'week' : 'hour'}
                          </span>
                        </p>
                        {ward.discountedPrice && (
                          <p className="text-xs text-green-600 font-medium">
                            Discounted: ₦{ward.discountedPrice.toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 font-medium mb-1">Extra Charges</p>
                        <p className="text-xs text-green-900">
                          Nursing: ₦{ward.extraCharges.nursingCare.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-900">
                          Oxygen: ₦{ward.extraCharges.oxygen.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-900">
                          Equipment: ₦{ward.extraCharges.equipmentUsage.toLocaleString()}
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-700 font-medium mb-1">Capacity</p>
                        <p className="text-lg font-bold text-purple-900 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {ward.maxPatients} {ward.maxPatients === 1 ? 'Patient' : 'Patients'}
                        </p>
                      </div>

                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-700 font-medium mb-1">Visitors</p>
                        <p className="text-lg font-bold text-orange-900 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max {ward.visitorsRestriction}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(ward)}
                      className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(ward.id)}
                      className={ward.status === 'active' 
                        ? 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300' 
                        : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                      }
                    >
                      {ward.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWard(ward.id)}
                      className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}