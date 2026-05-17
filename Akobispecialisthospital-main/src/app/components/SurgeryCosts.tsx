import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Scissors, Plus, Edit, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface Surgery {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in hours
  description: string;
  complexity: 'Minor' | 'Moderate' | 'Major' | 'Critical';
  anesthesia: string;
  status: 'active' | 'inactive';
}

export function SurgeryCosts() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([
    { 
      id: '1', 
      name: 'Appendectomy', 
      category: 'General Surgery',
      price: 150000, 
      duration: 2,
      complexity: 'Moderate',
      anesthesia: 'General',
      description: 'Surgical removal of the appendix, typically for appendicitis',
      status: 'active'
    },
    { 
      id: '2', 
      name: 'Cesarean Section (C-Section)', 
      category: 'Obstetrics',
      price: 200000, 
      duration: 1.5,
      complexity: 'Major',
      anesthesia: 'Spinal/Epidural',
      description: 'Surgical delivery of a baby through incisions in the abdomen and uterus',
      status: 'active'
    },
    { 
      id: '3', 
      name: 'Hernia Repair', 
      category: 'General Surgery',
      price: 120000, 
      duration: 2,
      complexity: 'Moderate',
      anesthesia: 'General',
      description: 'Surgical repair of hernia with mesh reinforcement',
      status: 'active'
    },
    { 
      id: '4', 
      name: 'Tonsillectomy', 
      category: 'ENT Surgery',
      price: 80000, 
      duration: 1,
      complexity: 'Minor',
      anesthesia: 'General',
      description: 'Surgical removal of the tonsils',
      status: 'active'
    },
    { 
      id: '5', 
      name: 'Cataract Surgery', 
      category: 'Ophthalmology',
      price: 100000, 
      duration: 1,
      complexity: 'Minor',
      anesthesia: 'Local',
      description: 'Removal of clouded lens and replacement with artificial intraocular lens',
      status: 'active'
    },
    { 
      id: '6', 
      name: 'Open Heart Surgery', 
      category: 'Cardiothoracic',
      price: 2500000, 
      duration: 6,
      complexity: 'Critical',
      anesthesia: 'General',
      description: 'Major cardiac surgery requiring heart-lung bypass machine',
      status: 'active'
    },
    { 
      id: '7', 
      name: 'Knee Replacement', 
      category: 'Orthopedic',
      price: 800000, 
      duration: 3,
      complexity: 'Major',
      anesthesia: 'General/Spinal',
      description: 'Total knee arthroplasty with prosthetic joint replacement',
      status: 'active'
    },
    { 
      id: '8', 
      name: 'Laparoscopic Cholecystectomy', 
      category: 'General Surgery',
      price: 180000, 
      duration: 2,
      complexity: 'Moderate',
      anesthesia: 'General',
      description: 'Minimally invasive gallbladder removal surgery',
      status: 'active'
    },
  ]);

  const [selectedSurgeryId, setSelectedSurgeryId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSurgery, setEditedSurgery] = useState<Surgery | null>(null);

  const selectedSurgery = surgeries.find(s => s.id === selectedSurgeryId);

  const handleDeleteSurgery = (surgeryId: string) => {
    setSurgeries(surgeries.filter(s => s.id !== surgeryId));
    setSelectedSurgeryId('');
    toast.success('Surgery cost deleted successfully');
  };

  const handleToggleSurgeryStatus = (surgeryId: string) => {
    setSurgeries(surgeries.map(s =>
      s.id === surgeryId
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : s
    ));
    toast.success('Surgery status updated');
  };

  const handleEditSurgery = () => {
    if (selectedSurgery) {
      setEditedSurgery({ ...selectedSurgery });
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedSurgery) {
      setSurgeries(surgeries.map(s => s.id === editedSurgery.id ? editedSurgery : s));
      setIsEditMode(false);
      setEditedSurgery(null);
      toast.success('Surgery cost updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedSurgery(null);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Minor': return 'bg-green-100 text-green-700 border-green-300';
      case 'Moderate': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Major': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const stats = [
    { label: 'Total Procedures', value: surgeries.length.toString(), color: 'bg-red-500' },
    { label: 'Active Procedures', value: surgeries.filter(s => s.status === 'active').length.toString(), color: 'bg-green-500' },
    { label: 'Categories', value: new Set(surgeries.map(s => s.category)).size.toString(), color: 'bg-blue-500' },
    { label: 'Average Cost', value: `₦${Math.round(surgeries.reduce((acc, s) => acc + s.price, 0) / surgeries.length).toLocaleString()}`, color: 'bg-orange-500' },
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
                  <Scissors className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Surgery Costs Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-red-600" />
              <CardTitle className="text-2xl">Surgery (Theatre) Costs</CardTitle>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Procedure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Surgical Procedure</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Create a new surgical procedure with cost information.
                </DialogDescription>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Procedure Name</Label>
                    <Input placeholder="e.g., Thyroidectomy" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Surgery</SelectItem>
                        <SelectItem value="orthopedic">Orthopedic</SelectItem>
                        <SelectItem value="cardiothoracic">Cardiothoracic</SelectItem>
                        <SelectItem value="neurosurgery">Neurosurgery</SelectItem>
                        <SelectItem value="obstetrics">Obstetrics</SelectItem>
                        <SelectItem value="ent">ENT Surgery</SelectItem>
                        <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Complexity</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Anesthesia Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select anesthesia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="spinal">Spinal</SelectItem>
                        <SelectItem value="epidural">Epidural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cost (₦)</Label>
                    <Input type="number" placeholder="150000" />
                  </div>
                  <div>
                    <Label>Duration (hours)</Label>
                    <Input type="number" placeholder="2" step="0.5" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Brief description of the procedure" />
                  </div>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => toast.success('Surgical procedure added successfully')}
                  >
                    Add Procedure
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manage surgical procedure costs and theatre pricing
          </p>
        </CardHeader>
        <CardContent>
          {/* Surgery Selector */}
          <div className="mb-6">
            <Label htmlFor="surgery-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select Surgical Procedure
            </Label>
            <select
              id="surgery-select"
              value={selectedSurgeryId}
              onChange={(e) => {
                setSelectedSurgeryId(e.target.value);
                setIsEditMode(false);
                setEditedSurgery(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">-- Choose a surgical procedure to view details --</option>
              {surgeries.map(surgery => (
                <option key={surgery.id} value={surgery.id}>
                  {surgery.name} - ₦{surgery.price.toLocaleString()} ({surgery.complexity})
                  {surgery.status === 'inactive' ? ' • Inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Surgery Details */}
          {selectedSurgery ? (
            <div className="space-y-6">
              {/* Surgery Info Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-md">
                  <Scissors className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{selectedSurgery.name}</h3>
                    <Badge variant={selectedSurgery.status === 'active' ? 'default' : 'secondary'}>
                      {selectedSurgery.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedSurgery.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ₦{selectedSurgery.price.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedSurgery.duration}h
                    </Badge>
                    <Badge className={`text-xs ${getComplexityColor(selectedSurgery.complexity)}`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {selectedSurgery.complexity}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditMode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditSurgery}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteSurgery(selectedSurgery.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Surgery Details */}
              {isEditMode && editedSurgery ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Edit Surgical Procedure</h4>
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
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Procedure Name</Label>
                      <Input
                        value={editedSurgery.name}
                        onChange={(e) => setEditedSurgery({ ...editedSurgery, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={editedSurgery.category}
                        onChange={(e) => setEditedSurgery({ ...editedSurgery, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Complexity</Label>
                      <Select
                        value={editedSurgery.complexity.toLowerCase()}
                        onValueChange={(value) => setEditedSurgery({ ...editedSurgery, complexity: (value.charAt(0).toUpperCase() + value.slice(1)) as Surgery['complexity'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Anesthesia Type</Label>
                      <Input
                        value={editedSurgery.anesthesia}
                        onChange={(e) => setEditedSurgery({ ...editedSurgery, anesthesia: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cost (₦)</Label>
                      <Input
                        type="number"
                        value={editedSurgery.price}
                        onChange={(e) => setEditedSurgery({ ...editedSurgery, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Duration (hours)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editedSurgery.duration}
                        onChange={(e) => setEditedSurgery({ ...editedSurgery, duration: Number(e.target.value) })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editedSurgery.description}
                        onChange={(e) => setEditedSurgery({ ...editedSurgery, description: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <Label className="text-sm font-medium">Procedure Status</Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {editedSurgery.status === 'active' ? 'Procedure is available for scheduling' : 'Procedure is disabled'}
                          </p>
                        </div>
                        <Switch
                          checked={editedSurgery.status === 'active'}
                          onCheckedChange={(checked) => 
                            setEditedSurgery({ ...editedSurgery, status: checked ? 'active' : 'inactive' })
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
                    <h4 className="text-sm font-semibold text-gray-700">Procedure Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Scissors className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Procedure Cost</Label>
                      </div>
                      <p className="text-2xl font-bold text-red-600">₦{selectedSurgery.price.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Surgery Duration</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedSurgery.duration} hours</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Complexity Level</Label>
                      </div>
                      <Badge className={getComplexityColor(selectedSurgery.complexity)}>
                        {selectedSurgery.complexity}
                      </Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs text-gray-600">Anesthesia Type</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedSurgery.anesthesia}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Procedure Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                      {selectedSurgery.description}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleToggleSurgeryStatus(selectedSurgery.id)}
                      >
                        {selectedSurgery.status === 'active' ? 'Deactivate Procedure' : 'Activate Procedure'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.info('Viewing surgery schedule for ' + selectedSurgery.name)}
                      >
                        View Surgery Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Procedure Selected</h3>
              <p className="text-sm text-gray-500">
                Select a surgical procedure from the dropdown above to view and manage details
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
