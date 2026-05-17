import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { DollarSign, Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

interface ConsultationFee {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  description: string;
  status: 'active' | 'inactive';
}

export function ConsultationFees() {
  const [consultationFees, setConsultationFees] = useState<ConsultationFee[]>([
    { 
      id: '1', 
      name: 'General Consultation', 
      category: 'General Practice',
      price: 5000, 
      duration: 30,
      description: 'Standard consultation with general practitioner for common health concerns',
      status: 'active'
    },
    { 
      id: '2', 
      name: 'Specialist Consultation', 
      category: 'Specialist',
      price: 10000, 
      duration: 45,
      description: 'Consultation with specialized medical professionals',
      status: 'active'
    },
    { 
      id: '3', 
      name: 'Emergency Consultation', 
      category: 'Emergency',
      price: 15000, 
      duration: 20,
      description: 'Urgent medical attention for emergency cases',
      status: 'active'
    },
    { 
      id: '4', 
      name: 'Follow-up Consultation', 
      category: 'Follow-up',
      price: 3000, 
      duration: 20,
      description: 'Follow-up visit for ongoing treatment monitoring',
      status: 'active'
    },
    { 
      id: '5', 
      name: 'Pediatric Consultation', 
      category: 'Pediatrics',
      price: 8000, 
      duration: 40,
      description: 'Specialized consultation for children and infants',
      status: 'active'
    },
    { 
      id: '6', 
      name: 'Antenatal Consultation', 
      category: 'Maternity',
      price: 7000, 
      duration: 35,
      description: 'Pregnancy care and monitoring consultation',
      status: 'active'
    },
  ]);

  const [selectedFeeId, setSelectedFeeId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedFee, setEditedFee] = useState<ConsultationFee | null>(null);

  const selectedFee = consultationFees.find(f => f.id === selectedFeeId);

  const handleDeleteFee = (feeId: string) => {
    setConsultationFees(consultationFees.filter(f => f.id !== feeId));
    setSelectedFeeId('');
    toast.success('Consultation fee deleted successfully');
  };

  const handleToggleFeeStatus = (feeId: string) => {
    setConsultationFees(consultationFees.map(f =>
      f.id === feeId
        ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : f
    ));
    toast.success('Consultation fee status updated');
  };

  const handleEditFee = () => {
    if (selectedFee) {
      setEditedFee({ ...selectedFee });
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedFee) {
      setConsultationFees(consultationFees.map(f => f.id === editedFee.id ? editedFee : f));
      setIsEditMode(false);
      setEditedFee(null);
      toast.success('Consultation fee updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedFee(null);
  };

  const stats = [
    { label: 'Total Fee Types', value: consultationFees.length.toString(), color: 'bg-blue-500' },
    { label: 'Active Fees', value: consultationFees.filter(f => f.status === 'active').length.toString(), color: 'bg-green-500' },
    { label: 'Categories', value: new Set(consultationFees.map(f => f.category)).size.toString(), color: 'bg-purple-500' },
    { label: 'Average Fee', value: `₦${Math.round(consultationFees.reduce((acc, f) => acc + f.price, 0) / consultationFees.length).toLocaleString()}`, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
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
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Consultation Fees Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-2xl">Consultation Fees</CardTitle>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Fee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Consultation Fee</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Create a new consultation fee type for the hospital.
                </DialogDescription>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Consultation Name</Label>
                    <Input placeholder="e.g., Orthopedic Consultation" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input placeholder="e.g., Specialist" />
                  </div>
                  <div>
                    <Label>Fee Amount (₦)</Label>
                    <Input type="number" placeholder="5000" />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input type="number" placeholder="30" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Brief description of the consultation type" />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => toast.success('Consultation fee added successfully')}
                  >
                    Add Fee
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manage consultation fees and pricing for different service types
          </p>
        </CardHeader>
        <CardContent>
          {/* Fee Selector */}
          <div className="mb-6">
            <Label htmlFor="fee-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select Consultation Fee
            </Label>
            <select
              id="fee-select"
              value={selectedFeeId}
              onChange={(e) => {
                setSelectedFeeId(e.target.value);
                setIsEditMode(false);
                setEditedFee(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Choose a consultation fee to view details --</option>
              {consultationFees.map(fee => (
                <option key={fee.id} value={fee.id}>
                  {fee.name} - ₦{fee.price.toLocaleString()} ({fee.category})
                  {fee.status === 'inactive' ? ' • Inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Fee Details */}
          {selectedFee ? (
            <div className="space-y-6">
              {/* Fee Info Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{selectedFee.name}</h3>
                    <Badge variant={selectedFee.status === 'active' ? 'default' : 'secondary'}>
                      {selectedFee.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedFee.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ₦{selectedFee.price.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedFee.duration} mins
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditMode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditFee}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteFee(selectedFee.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Fee Details */}
              {isEditMode && editedFee ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Edit Consultation Fee</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Consultation Name</Label>
                      <Input
                        value={editedFee.name}
                        onChange={(e) => setEditedFee({ ...editedFee, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={editedFee.category}
                        onChange={(e) => setEditedFee({ ...editedFee, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Fee Amount (₦)</Label>
                      <Input
                        type="number"
                        value={editedFee.price}
                        onChange={(e) => setEditedFee({ ...editedFee, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={editedFee.duration}
                        onChange={(e) => setEditedFee({ ...editedFee, duration: Number(e.target.value) })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editedFee.description}
                        onChange={(e) => setEditedFee({ ...editedFee, description: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <Label className="text-sm font-medium">Fee Status</Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {editedFee.status === 'active' ? 'Fee is available for use' : 'Fee is disabled'}
                          </p>
                        </div>
                        <Switch
                          checked={editedFee.status === 'active'}
                          onCheckedChange={(checked) => 
                            setEditedFee({ ...editedFee, status: checked ? 'active' : 'inactive' })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Fee Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Fee Amount</Label>
                      </div>
                      <p className="text-2xl font-bold text-green-600">₦{selectedFee.price.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Consultation Duration</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedFee.duration} minutes</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Category</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedFee.category}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={selectedFee.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {selectedFee.status}
                        </Badge>
                      </div>
                      <Label className="text-xs text-gray-600">Status</Label>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedFee.status === 'active' ? 'Available for appointments' : 'Currently disabled'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                      {selectedFee.description}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleToggleFeeStatus(selectedFee.id)}
                      >
                        {selectedFee.status === 'active' ? 'Deactivate Fee' : 'Activate Fee'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.info('Viewing usage statistics for ' + selectedFee.name)}
                      >
                        View Usage Statistics
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Fee Selected</h3>
              <p className="text-sm text-gray-500">
                Select a consultation fee from the dropdown above to view and manage details
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
