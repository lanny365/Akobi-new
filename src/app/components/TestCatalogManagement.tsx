import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { TestTube, Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

interface LabTest {
  id: string;
  catalogNumber: string;
  name: string;
  category: string;
  price: number;
  turnaroundTime: number; // in hours
  sampleType: string;
  description: string;
  status: 'active' | 'inactive';
}

const TEST_CATEGORIES = [
  {
    name: 'Hematology',
    tests: ['Full Blood Count (FBC)', 'ESR', 'PCV']
  },
  {
    name: 'Clinical Chemistry',
    tests: ['Blood sugar (Glucose)', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'Lipid profile']
  },
  {
    name: 'Microbiology',
    tests: ['Urine culture', 'Blood culture', 'Stool analysis', 'Sensitivity test']
  },
  {
    name: 'Parasitology',
    tests: ['Malaria parasite test', 'Worm infestation test']
  },
  {
    name: 'Serology / Immunology',
    tests: ['HIV test', 'Hepatitis B & C', 'Typhoid test (Widal)']
  },
  {
    name: 'Histopathology',
    tests: ['Tissue biopsy', 'Cytology']
  }
];

export function TestCatalogManagement() {
  const [testCatalog, setTestCatalog] = useState<LabTest[]>([
    {
      id: '1',
      catalogNumber: 'HEM-001',
      name: 'Full Blood Count (FBC)',
      category: 'Hematology',
      price: 3500,
      turnaroundTime: 2,
      sampleType: 'Blood',
      description: 'Complete blood count analysis including RBC, WBC, platelets',
      status: 'active'
    },
    {
      id: '2',
      catalogNumber: 'CHEM-001',
      name: 'Blood sugar (Glucose)',
      category: 'Clinical Chemistry',
      price: 1500,
      turnaroundTime: 1,
      sampleType: 'Blood',
      description: 'Fasting blood glucose measurement',
      status: 'active'
    },
    {
      id: '3',
      catalogNumber: 'PARA-001',
      name: 'Malaria parasite test',
      category: 'Parasitology',
      price: 2000,
      turnaroundTime: 1,
      sampleType: 'Blood',
      description: 'Microscopic examination for malaria parasites',
      status: 'active'
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    catalogNumber: '',
    name: '',
    category: '',
    price: '',
    turnaroundTime: '',
    sampleType: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Generate catalog number based on category
  const generateCatalogNumber = (category: string) => {
    const categoryPrefix: Record<string, string> = {
      'Hematology': 'HEM',
      'Clinical Chemistry': 'CHEM',
      'Microbiology': 'MICRO',
      'Parasitology': 'PARA',
      'Serology / Immunology': 'SERO',
      'Histopathology': 'HISTO'
    };

    const prefix = categoryPrefix[category] || 'LAB';
    const existingTests = testCatalog.filter(t => t.catalogNumber.startsWith(prefix));
    const nextNumber = existingTests.length + 1;
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleAddTest = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.turnaroundTime || !formData.sampleType) {
      toast.error('Please fill all required fields');
      return;
    }

    const catalogNumber = editingTest ? formData.catalogNumber : generateCatalogNumber(formData.category);

    const newTest: LabTest = {
      id: editingTest ? editingTest.id : (testCatalog.length + 1).toString(),
      catalogNumber,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      turnaroundTime: parseFloat(formData.turnaroundTime),
      sampleType: formData.sampleType,
      description: formData.description,
      status: formData.status
    };

    if (editingTest) {
      setTestCatalog(testCatalog.map(test => test.id === editingTest.id ? newTest : test));
      toast.success('Test updated successfully');
    } else {
      setTestCatalog([...testCatalog, newTest]);
      toast.success(`Test added to catalog: ${catalogNumber}`);
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (test: LabTest) => {
    setEditingTest(test);
    setFormData({
      catalogNumber: test.catalogNumber,
      name: test.name,
      category: test.category,
      price: test.price.toString(),
      turnaroundTime: test.turnaroundTime.toString(),
      sampleType: test.sampleType,
      description: test.description,
      status: test.status
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTestCatalog(testCatalog.filter(test => test.id !== id));
    toast.success('Test deleted from catalog');
  };

  const toggleStatus = (id: string) => {
    setTestCatalog(testCatalog.map(test =>
      test.id === id ? { ...test, status: test.status === 'active' ? 'inactive' : 'active' } : test
    ));
    toast.success('Test status updated');
  };

  const resetForm = () => {
    setFormData({
      catalogNumber: '',
      name: '',
      category: '',
      price: '',
      turnaroundTime: '',
      sampleType: '',
      description: '',
      status: 'active'
    });
    setEditingTest(null);
  };

  const handleQuickAdd = (category: string, testName: string) => {
    setFormData({
      ...formData,
      category,
      name: testName,
      catalogNumber: generateCatalogNumber(category)
    });
    setIsAddDialogOpen(true);
  };

  const filteredTests = testCatalog.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.catalogNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || test.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Hematology': 'bg-red-500',
      'Clinical Chemistry': 'bg-blue-500',
      'Microbiology': 'bg-green-500',
      'Parasitology': 'bg-yellow-500',
      'Serology / Immunology': 'bg-purple-500',
      'Histopathology': 'bg-pink-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Test Catalog Management</h2>
        <p className="text-gray-600 mt-1">Configure available laboratory tests with catalog numbers and pricing</p>
      </div>

      {/* Quick Add Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-purple-600" />
            Quick Add from Standard Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEST_CATEGORIES.map((category) => (
              <div key={category.name} className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-sm text-purple-900 mb-2">{category.name}</h4>
                <div className="space-y-1">
                  {category.tests.map((test) => (
                    <button
                      key={test}
                      onClick={() => handleQuickAdd(category.name, test)}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-purple-50 rounded transition-colors text-gray-700 hover:text-purple-700"
                    >
                      + {test}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or catalog number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TEST_CATEGORIES.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
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
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTest ? 'Edit' : 'Add New'} Laboratory Test</DialogTitle>
              <DialogDescription>
                Configure test details, pricing, and catalog information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Test Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Full Blood Count"
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_CATEGORIES.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sample Type *</Label>
                  <Select value={formData.sampleType} onValueChange={(value) => setFormData({ ...formData, sampleType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sample type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blood">Blood</SelectItem>
                      <SelectItem value="Urine">Urine</SelectItem>
                      <SelectItem value="Stool">Stool</SelectItem>
                      <SelectItem value="Tissue">Tissue</SelectItem>
                      <SelectItem value="Swab">Swab</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Price (₦) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 3500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Turnaround Time (hours) *</Label>
                  <Input
                    type="number"
                    value={formData.turnaroundTime}
                    onChange={(e) => setFormData({ ...formData, turnaroundTime: e.target.value })}
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

              {formData.category && !editingTest && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900">
                    Catalog Number: <span className="text-purple-600">{generateCatalogNumber(formData.category)}</span>
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Auto-generated based on category</p>
                </div>
              )}

              {editingTest && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    Catalog Number: <span className="text-gray-600">{formData.catalogNumber}</span>
                  </p>
                </div>
              )}

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
                <Button onClick={handleAddTest} className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700">
                  {editingTest ? 'Update Test' : 'Add to Catalog'}
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Catalog List */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No tests found in catalog</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new test</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row items-start gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 flex-shrink-0 ${getCategoryColor(test.category)} rounded-lg flex items-center justify-center`}>
                    <TestTube className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700 font-mono text-xs">
                        {test.catalogNumber}
                      </Badge>
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
                        <span className="font-semibold text-gray-700">Sample:</span>
                        <span className="text-gray-600">{test.sampleType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">TAT:</span>
                        <span className="text-gray-600">{test.turnaroundTime}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-700 text-lg">₦{test.price.toLocaleString()}</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold">Total Tests</p>
            <p className="text-2xl font-bold text-purple-700">{testCatalog.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold">Active Tests</p>
            <p className="text-2xl font-bold text-green-700">
              {testCatalog.filter(t => t.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold">Categories</p>
            <p className="text-2xl font-bold text-blue-700">
              {new Set(testCatalog.map(t => t.category)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold">Avg. Price</p>
            <p className="text-2xl font-bold text-teal-700">
              ₦{Math.round(testCatalog.reduce((sum, t) => sum + t.price, 0) / testCatalog.length || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
