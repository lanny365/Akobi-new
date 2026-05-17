import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { FlaskConical, Plus, Edit, Trash2, Clock, TestTube2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in hours
  description: string;
  sampleType: string;
  status: 'active' | 'inactive';
}

export function LaboratoryPrices() {
  const [labTests, setLabTests] = useState<LabTest[]>([
    { 
      id: '1', 
      name: 'Complete Blood Count (CBC)', 
      category: 'Hematology',
      price: 3500, 
      duration: 2,
      sampleType: 'Blood',
      description: 'Comprehensive blood cell analysis including RBC, WBC, and platelet counts',
      status: 'active'
    },
    { 
      id: '2', 
      name: 'Lipid Profile', 
      category: 'Biochemistry',
      price: 5000, 
      duration: 3,
      sampleType: 'Blood',
      description: 'Cholesterol levels including HDL, LDL, and triglycerides',
      status: 'active'
    },
    { 
      id: '3', 
      name: 'Liver Function Test (LFT)', 
      category: 'Biochemistry',
      price: 6500, 
      duration: 4,
      sampleType: 'Blood',
      description: 'Assessment of liver enzymes and function markers',
      status: 'active'
    },
    { 
      id: '4', 
      name: 'Urine Analysis', 
      category: 'Urinalysis',
      price: 2000, 
      duration: 1,
      sampleType: 'Urine',
      description: 'Complete urine examination for infections and abnormalities',
      status: 'active'
    },
    { 
      id: '5', 
      name: 'Thyroid Function Test (TFT)', 
      category: 'Endocrinology',
      price: 8000, 
      duration: 6,
      sampleType: 'Blood',
      description: 'T3, T4, and TSH hormone level assessment',
      status: 'active'
    },
    { 
      id: '6', 
      name: 'X-Ray (Chest)', 
      category: 'Radiology',
      price: 8000, 
      duration: 1,
      sampleType: 'Imaging',
      description: 'Chest radiograph for lung and heart examination',
      status: 'active'
    },
    { 
      id: '7', 
      name: 'CT Scan', 
      category: 'Radiology',
      price: 45000, 
      duration: 4,
      sampleType: 'Imaging',
      description: 'Computed tomography scan for detailed internal imaging',
      status: 'active'
    },
    { 
      id: '8', 
      name: 'Malaria Parasite Test', 
      category: 'Microbiology',
      price: 1500, 
      duration: 1,
      sampleType: 'Blood',
      description: 'Microscopic examination for malaria parasites',
      status: 'active'
    },
  ]);

  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTest, setEditedTest] = useState<LabTest | null>(null);

  const selectedTest = labTests.find(t => t.id === selectedTestId);

  const handleDeleteTest = (testId: string) => {
    setLabTests(labTests.filter(t => t.id !== testId));
    setSelectedTestId('');
    toast.success('Laboratory test deleted successfully');
  };

  const handleToggleTestStatus = (testId: string) => {
    setLabTests(labTests.map(t =>
      t.id === testId
        ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : t
    ));
    toast.success('Laboratory test status updated');
  };

  const handleEditTest = () => {
    if (selectedTest) {
      setEditedTest({ ...selectedTest });
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedTest) {
      setLabTests(labTests.map(t => t.id === editedTest.id ? editedTest : t));
      setIsEditMode(false);
      setEditedTest(null);
      toast.success('Laboratory test updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedTest(null);
  };

  const stats = [
    { label: 'Total Tests', value: labTests.length.toString(), color: 'bg-purple-500' },
    { label: 'Active Tests', value: labTests.filter(t => t.status === 'active').length.toString(), color: 'bg-green-500' },
    { label: 'Categories', value: new Set(labTests.map(t => t.category)).size.toString(), color: 'bg-blue-500' },
    { label: 'Average Price', value: `₦${Math.round(labTests.reduce((acc, t) => acc + t.price, 0) / labTests.length).toLocaleString()}`, color: 'bg-orange-500' },
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
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Laboratory Test Prices Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-2xl">Laboratory Test Prices</CardTitle>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Laboratory Test</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Create a new laboratory test with pricing information.
                </DialogDescription>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Test Name</Label>
                    <Input placeholder="e.g., Blood Sugar Test" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hematology">Hematology</SelectItem>
                        <SelectItem value="biochemistry">Biochemistry</SelectItem>
                        <SelectItem value="microbiology">Microbiology</SelectItem>
                        <SelectItem value="radiology">Radiology</SelectItem>
                        <SelectItem value="endocrinology">Endocrinology</SelectItem>
                        <SelectItem value="urinalysis">Urinalysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sample Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sample type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blood">Blood</SelectItem>
                        <SelectItem value="urine">Urine</SelectItem>
                        <SelectItem value="stool">Stool</SelectItem>
                        <SelectItem value="imaging">Imaging</SelectItem>
                        <SelectItem value="swab">Swab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price (₦)</Label>
                    <Input type="number" placeholder="5000" />
                  </div>
                  <div>
                    <Label>Duration (hours)</Label>
                    <Input type="number" placeholder="2" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Brief description of the test" />
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => toast.success('Laboratory test added successfully')}
                  >
                    Add Test
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manage laboratory test pricing and test information
          </p>
        </CardHeader>
        <CardContent>
          {/* Test Selector */}
          <div className="mb-6">
            <Label htmlFor="test-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select Laboratory Test
            </Label>
            <select
              id="test-select"
              value={selectedTestId}
              onChange={(e) => {
                setSelectedTestId(e.target.value);
                setIsEditMode(false);
                setEditedTest(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">-- Choose a laboratory test to view details --</option>
              {labTests.map(test => (
                <option key={test.id} value={test.id}>
                  {test.name} - ₦{test.price.toLocaleString()} ({test.category})
                  {test.status === 'inactive' ? ' • Inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Test Details */}
          {selectedTest ? (
            <div className="space-y-6">
              {/* Test Info Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-md">
                  <FlaskConical className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{selectedTest.name}</h3>
                    <Badge variant={selectedTest.status === 'active' ? 'default' : 'secondary'}>
                      {selectedTest.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedTest.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ₦{selectedTest.price.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedTest.duration}h
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <TestTube2 className="w-3 h-3 mr-1" />
                      {selectedTest.sampleType}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditMode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditTest}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteTest(selectedTest.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Test Details */}
              {isEditMode && editedTest ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Edit Laboratory Test</h4>
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
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Test Name</Label>
                      <Input
                        value={editedTest.name}
                        onChange={(e) => setEditedTest({ ...editedTest, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={editedTest.category}
                        onChange={(e) => setEditedTest({ ...editedTest, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Sample Type</Label>
                      <Input
                        value={editedTest.sampleType}
                        onChange={(e) => setEditedTest({ ...editedTest, sampleType: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Price (₦)</Label>
                      <Input
                        type="number"
                        value={editedTest.price}
                        onChange={(e) => setEditedTest({ ...editedTest, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Duration (hours)</Label>
                      <Input
                        type="number"
                        value={editedTest.duration}
                        onChange={(e) => setEditedTest({ ...editedTest, duration: Number(e.target.value) })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editedTest.description}
                        onChange={(e) => setEditedTest({ ...editedTest, description: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <Label className="text-sm font-medium">Test Status</Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {editedTest.status === 'active' ? 'Test is available for ordering' : 'Test is disabled'}
                          </p>
                        </div>
                        <Switch
                          checked={editedTest.status === 'active'}
                          onCheckedChange={(checked) => 
                            setEditedTest({ ...editedTest, status: checked ? 'active' : 'inactive' })
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
                    <h4 className="text-sm font-semibold text-gray-700">Test Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Test Price</Label>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">₦{selectedTest.price.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Processing Time</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedTest.duration} hours</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TestTube2 className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Sample Type</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedTest.sampleType}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={selectedTest.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {selectedTest.status}
                        </Badge>
                      </div>
                      <Label className="text-xs text-gray-600">Status</Label>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedTest.status === 'active' ? 'Available for orders' : 'Currently disabled'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Test Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                      {selectedTest.description}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleToggleTestStatus(selectedTest.id)}
                      >
                        {selectedTest.status === 'active' ? 'Deactivate Test' : 'Activate Test'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.info('Viewing order history for ' + selectedTest.name)}
                      >
                        View Order History
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Test Selected</h3>
              <p className="text-sm text-gray-500">
                Select a laboratory test from the dropdown above to view and manage details
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
