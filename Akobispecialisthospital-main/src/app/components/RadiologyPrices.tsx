import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScanLine, Plus, Edit, Trash2, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface RadiologyTest {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in hours
  description: string;
  bodyPart: string;
  status: 'active' | 'inactive';
}

export function RadiologyPrices() {
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([
    {
      id: '1',
      name: 'X-Ray (Chest)',
      category: 'X-Ray',
      price: 8000,
      duration: 1,
      bodyPart: 'Chest',
      description: 'Chest radiograph for lung and heart examination',
      status: 'active'
    },
    {
      id: '2',
      name: 'X-Ray (Abdomen)',
      category: 'X-Ray',
      price: 7500,
      duration: 1,
      bodyPart: 'Abdomen',
      description: 'Abdominal radiograph for digestive system examination',
      status: 'active'
    },
    {
      id: '3',
      name: 'CT Scan (Head)',
      category: 'CT Scan',
      price: 45000,
      duration: 4,
      bodyPart: 'Head',
      description: 'Computed tomography scan of the head and brain',
      status: 'active'
    },
    {
      id: '4',
      name: 'MRI (Brain)',
      category: 'MRI',
      price: 85000,
      duration: 6,
      bodyPart: 'Brain',
      description: 'Magnetic resonance imaging of the brain',
      status: 'active'
    },
    {
      id: '5',
      name: 'Ultrasound (Abdomen)',
      category: 'Ultrasound',
      price: 12000,
      duration: 2,
      bodyPart: 'Abdomen',
      description: 'Abdominal ultrasound for organ examination',
      status: 'active'
    },
    {
      id: '6',
      name: 'Mammography',
      category: 'X-Ray',
      price: 15000,
      duration: 1,
      bodyPart: 'Breast',
      description: 'Breast imaging for cancer screening',
      status: 'active'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<RadiologyTest | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    bodyPart: '',
    status: 'active' as 'active' | 'inactive'
  });

  const categories = ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Fluoroscopy', 'PET Scan'];

  const handleAddTest = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.duration || !formData.bodyPart) {
      toast.error('Please fill all required fields');
      return;
    }

    const newTest: RadiologyTest = {
      id: editingTest ? editingTest.id : (radiologyTests.length + 1).toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      duration: parseFloat(formData.duration),
      description: formData.description,
      bodyPart: formData.bodyPart,
      status: formData.status
    };

    if (editingTest) {
      setRadiologyTests(radiologyTests.map(test => test.id === editingTest.id ? newTest : test));
      toast.success('Radiology test updated successfully');
    } else {
      setRadiologyTests([...radiologyTests, newTest]);
      toast.success('Radiology test added successfully');
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (test: RadiologyTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      category: test.category,
      price: test.price.toString(),
      duration: test.duration.toString(),
      description: test.description,
      bodyPart: test.bodyPart,
      status: test.status
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRadiologyTests(radiologyTests.filter(test => test.id !== id));
    toast.success('Radiology test deleted successfully');
  };

  const toggleStatus = (id: string) => {
    setRadiologyTests(radiologyTests.map(test =>
      test.id === id ? { ...test, status: test.status === 'active' ? 'inactive' : 'active' } : test
    ));
    toast.success('Test status updated');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
      bodyPart: '',
      status: 'active'
    });
    setEditingTest(null);
  };

  const filteredTests = radiologyTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.bodyPart.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || test.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'X-Ray': 'bg-blue-500',
      'CT Scan': 'bg-purple-500',
      'MRI': 'bg-pink-500',
      'Ultrasound': 'bg-teal-500',
      'Fluoroscopy': 'bg-orange-500',
      'PET Scan': 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-md">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-2xl break-words">Radiology Prices</CardTitle>
            <p className="text-sm text-gray-600 mt-1 break-words">
              Manage pricing for imaging and radiology procedures
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4 items-start lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3 flex-1 min-w-0">
              <Input
                placeholder="Search radiology tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:max-w-xs"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 w-full lg:w-auto flex-shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Radiology Test
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTest ? 'Edit' : 'Add New'} Radiology Test</DialogTitle>
                  <DialogDescription>
                    Configure radiology test details and pricing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 overflow-hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Test Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., X-Ray (Chest)"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Body Part *</Label>
                      <Input
                        value={formData.bodyPart}
                        onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                        placeholder="e.g., Chest, Abdomen, Brain"
                      />
                    </div>
                    <div>
                      <Label>Price (₦) *</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g., 8000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration (hours) *</Label>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label>Status</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Inactive</span>
                        <Switch
                          checked={formData.status === 'active'}
                          onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                        />
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the test..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleAddTest} className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700">
                      {editingTest ? 'Update Test' : 'Add Test'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tests List */}
          <div className="space-y-3">
            {filteredTests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <ScanLine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No radiology tests found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new test</p>
              </div>
            ) : (
              filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-teal-300 transition-all overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row items-start gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 flex-shrink-0 ${getCategoryColor(test.category)} rounded-lg flex items-center justify-center`}>
                        <ScanLine className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 break-words">{test.name}</h3>
                          <Badge variant={test.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                            {test.status}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50 flex-shrink-0">
                            {test.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 break-words">{test.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Body Part:</span>
                            <span className="text-gray-600">{test.bodyPart}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600">{test.duration}h turnaround</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-700 text-lg">₦{test.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex lg:flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleEdit(test)}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => toggleStatus(test.id)}
                        variant="outline"
                        size="sm"
                        className={test.status === 'active' ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}
                      >
                        {test.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => handleDelete(test.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-2">
                <p className="text-sm text-teal-700 font-semibold">Total Tests</p>
                <p className="text-2xl font-bold text-teal-900 break-words">{radiologyTests.length}</p>
              </div>
              <div className="p-2">
                <p className="text-sm text-teal-700 font-semibold">Active Tests</p>
                <p className="text-2xl font-bold text-teal-900 break-words">
                  {radiologyTests.filter(t => t.status === 'active').length}
                </p>
              </div>
              <div className="p-2">
                <p className="text-sm text-teal-700 font-semibold">Categories</p>
                <p className="text-2xl font-bold text-teal-900 break-words">
                  {new Set(radiologyTests.map(t => t.category)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
