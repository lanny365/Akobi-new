import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  FlaskConical,
  FileText,
  Clock,
  CheckCircle,
  Search,
  Upload,
  Send,
  Pencil,
  X,
  TestTube,
  ClipboardList,
  LogOut,
  User,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useLabTechnicianAuth } from '../context/LabTechnicianAuthContext';
import { TestCatalogManagement } from './TestCatalogManagement';
import { InProgressPatients } from './InProgressPatients';
import { LabWalletInventory } from './LabWalletInventory';

interface LabRequest {
  id: string;
  patientName: string;
  cardNumber: string;
  requestedBy: string;
  tests: string[];
  status: 'pending' | 'in-progress' | 'completed';
  requestedAt: string;
  completedAt?: string;
}

export function Laboratory() {
  const { labTechnician, login, logout, isAuthenticated } = useLabTechnicianAuth();

  // Get tab from URL
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    return params.get('tab') || 'technician';
  };

  const [activeTab, setActiveTab] = useState<'technician' | 'management'>(getTabFromUrl() as 'technician' | 'management');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [testResults, setTestResults] = useState('');
  const [labNotes, setLabNotes] = useState('');

  // Lab Management view state
  const [showTestCatalog, setShowTestCatalog] = useState(false);
  const [showWalletInventory, setShowWalletInventory] = useState(false);
  const [showInProgressPatients, setShowInProgressPatients] = useState(false);
  const [selectedInProgressPatient, setSelectedInProgressPatient] = useState<LabRequest | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Listen for tab changes
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromUrl();
      setActiveTab(tab as 'technician' | 'management');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful! Welcome to Lab Technician Portal');
        setEmail('');
        setPassword('');
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  // Handwriting canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [handwritingNotes, setHandwritingNotes] = useState('');

  const [labRequests, setLabRequests] = useState<LabRequest[]>([
    {
      id: 'LAB-001',
      patientName: 'James Anderson',
      cardNumber: 'PT-2026-0001',
      requestedBy: 'Dr. Sarah Johnson',
      tests: ['Complete Blood Count (CBC)', 'Malaria Test'],
      status: 'pending',
      requestedAt: '2026-04-21 09:50'
    },
    {
      id: 'LAB-002',
      patientName: 'Grace Okonkwo',
      cardNumber: 'PT-2026-0002',
      requestedBy: 'Dr. Sarah Johnson',
      tests: ['Urinalysis'],
      status: 'in-progress',
      requestedAt: '2026-04-21 09:35'
    },
    {
      id: 'LAB-003',
      patientName: 'Mohammed Ibrahim',
      cardNumber: 'PT-2025-1234',
      requestedBy: 'Dr. Sarah Johnson',
      tests: ['Blood Sugar (Fasting)', 'HbA1c'],
      status: 'completed',
      requestedAt: '2026-04-21 08:00',
      completedAt: '2026-04-21 09:15'
    },
  ]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const interpretHandwriting = () => {
    toast.success('Handwriting interpreted');
    setHandwritingNotes('Simulated lab notes: Sample collected and processed. All tests conducted according to standard protocols. Quality control checks passed.');
  };

  const handleStartTest = () => {
    if (!selectedRequest) return;

    setLabRequests(labRequests.map(req =>
      req.id === selectedRequest.id
        ? { ...req, status: 'in-progress' as const }
        : req
    ));

    setSelectedRequest({ ...selectedRequest, status: 'in-progress' });
    toast.success('Test marked as in progress');
  };

  const handleQueueItemClick = (request: LabRequest) => {
    // If pending, automatically mark as in-progress
    if (request.status === 'pending') {
      const updatedRequest = { ...request, status: 'in-progress' as const };
      setLabRequests(labRequests.map(req =>
        req.id === request.id ? updatedRequest : req
      ));
      setSelectedRequest(updatedRequest);
      toast.success(`${request.patientName} - Test moved to In-Progress`);
    } else {
      setSelectedRequest(request);
    }
  };

  const handleSendResultToDoctor = (request: LabRequest, results: string, notes: string) => {
    setLabRequests(labRequests.map(req =>
      req.id === request.id
        ? {
            ...req,
            status: 'completed' as const,
            completedAt: new Date().toLocaleString()
          }
        : req
    ));

    toast.success(`Test results sent to ${request.requestedBy} for ${request.patientName}`);
    setSelectedInProgressPatient(null);
  };

  const handleCompleteTest = () => {
    if (!selectedRequest) return;

    if (!testResults.trim()) {
      toast.error('Please enter test results');
      return;
    }

    setLabRequests(labRequests.map(req =>
      req.id === selectedRequest.id
        ? {
            ...req,
            status: 'completed' as const,
            completedAt: new Date().toLocaleString()
          }
        : req
    ));

    toast.success(`Test results completed and sent to ${selectedRequest.requestedBy}`);
    setSelectedRequest(null);
    setTestResults('');
    setLabNotes('');
    clearCanvas();
    setHandwritingNotes('');
  };

  const stats = [
    {
      label: 'Pending Tests',
      value: labRequests.filter(r => r.status === 'pending').length.toString(),
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      label: 'In Progress',
      value: labRequests.filter(r => r.status === 'in-progress').length.toString(),
      icon: FlaskConical,
      color: 'bg-blue-500'
    },
    {
      label: 'Completed Today',
      value: labRequests.filter(r => r.status === 'completed').length.toString(),
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      label: 'Total Requests',
      value: labRequests.length.toString(),
      icon: FileText,
      color: 'bg-purple-500'
    },
  ];

  const filteredRequests = labRequests.filter(req =>
    req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lab Technician Login Screen
  if (activeTab === 'technician' && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-600/30">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Lab Technician Portal</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Sign in to access lab test queue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="technician@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-800 font-medium mb-2">Demo Credentials:</p>
              <p className="text-xs text-purple-600">Email: any valid email</p>
              <p className="text-xs text-purple-600">Password: any 4+ characters</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Lab Management View
  if (activeTab === 'management') {
    if (showTestCatalog) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTestCatalog(false)}
              className="flex items-center gap-2"
            >
              ← Back to Lab Management
            </Button>
          </div>
          <TestCatalogManagement />
        </div>
      );
    }

    if (showWalletInventory) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowWalletInventory(false)}
              className="flex items-center gap-2"
            >
              ← Back to Lab Management
            </Button>
          </div>
          <LabWalletInventory />
        </div>
      );
    }

    const inProgressPatients = labRequests.filter(r => r.status === 'in-progress');
    const managementStats = [
      {
        label: 'Active Tests',
        value: labRequests.filter(r => r.status !== 'completed').length,
        icon: FlaskConical,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600'
      },
      {
        label: 'In Progress',
        value: inProgressPatients.length,
        icon: Clock,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600'
      },
      {
        label: 'Completed Today',
        value: labRequests.filter(r => r.status === 'completed').length,
        icon: CheckCircle,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        textColor: 'text-green-600'
      },
      {
        label: 'Total Requests',
        value: labRequests.length,
        icon: FileText,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-600'
      },
    ];

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lab Management Dashboard</h1>
              <p className="text-purple-100 mt-1">Administrative controls, analytics, and oversight</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {managementStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-4xl font-bold mt-2 text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* In-Progress Patients */}
        {inProgressPatients.length > 0 && (
          <InProgressPatients
            patients={inProgressPatients}
            onSendResult={handleSendResultToDoctor}
          />
        )}

        {/* Management Modules */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-200">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TestTube className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Test Catalog</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">Configure available tests, pricing, categories, and specifications</p>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
                  onClick={() => setShowTestCatalog(true)}
                >
                  Manage Catalog
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-200">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Staff Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">Manage lab technicians, schedules, and work assignments</p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                  Manage Staff
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-200">
              <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 border-b border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Reports & Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">Performance metrics, statistics, and comprehensive reports</p>
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-200">
              <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Quality Control</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">Quality assurance protocols and compliance monitoring</p>
                <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg">
                  Manage QC
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-200">
              <CardHeader className="bg-gradient-to-br from-teal-50 to-teal-100 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FlaskConical className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Lab Wallet & Inventory</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">Manage consumables from pharmacy and track lab wallet balance</p>
                <Button
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg"
                  onClick={() => setShowWalletInventory(true)}
                >
                  Manage Wallet & Inventory
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-200">
              <CardHeader className="bg-gradient-to-br from-pink-50 to-pink-100 border-b border-pink-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Accreditation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">Compliance tracking and accreditation management</p>
                <Button className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 shadow-lg">
                  View Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Lab Technician View (default)
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Bar with Login Info */}
      {isAuthenticated && labTechnician && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lab Technician Portal</h2>
                  <p className="text-sm text-gray-600">Test Request Queue Management</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{labTechnician.name}</p>
                  <p className="text-xs text-gray-600">{labTechnician.email}</p>
                  <p className="text-xs text-purple-600 font-medium">{labTechnician.licenseNumber}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors group border border-gray-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full Width */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="space-y-6">

            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Request Queue</h1>
              <p className="text-gray-600 mt-1">Lab tests routed from doctors - Process and record results</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      </div>
                      <div className={`${stat.color} p-4 rounded-xl shadow-lg`}>
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Lab Requests Queue */}
              <Card className="lg:col-span-2 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-200">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                    Doctor Requests Queue
                  </CardTitle>
                  <p className="text-xs text-purple-600 mt-1">Tests routed by doctors</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search requests..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No lab requests found</p>
                        <p className="text-xs mt-1">
                          {searchQuery ? 'Try a different search term' : 'Waiting for doctor requests'}
                        </p>
                      </div>
                    ) : (
                      filteredRequests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => handleQueueItemClick(request)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-[1.02] ${
                          selectedRequest?.id === request.id
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 hover:border-purple-400 hover:shadow-lg hover:bg-purple-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{request.patientName}</h4>
                            <p className="text-xs text-gray-600">{request.cardNumber}</p>
                            <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Requested by: {request.requestedBy}
                            </p>
                          </div>
                          <Badge variant={
                            request.status === 'pending' ? 'secondary' :
                            request.status === 'in-progress' ? 'default' :
                            'outline'
                          } className="text-xs">
                            {request.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 mt-2">
                          <p className="text-xs font-semibold text-gray-700">Tests Requested:</p>
                          {request.tests.map((test, idx) => (
                            <p key={idx} className="text-sm text-gray-700 pl-2">• {test}</p>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {request.requestedAt}
                        </p>
                      </div>
                    ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Results Form */}
              <Card className="lg:col-span-3 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {selectedRequest ? `Test Results - ${selectedRequest.patientName}` : 'Select a Request'}
                  </CardTitle>
                  {selectedRequest && (
                    <p className="text-xs text-blue-600 mt-1">Enter and submit test results</p>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedRequest ? (
                    <div className="space-y-6">
                      {/* Request Info */}
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Patient</p>
                              <p className="font-semibold">{selectedRequest.patientName}</p>
                              <p className="text-sm text-gray-600">{selectedRequest.cardNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Requested By</p>
                              <p className="font-semibold">{selectedRequest.requestedBy}</p>
                              <p className="text-sm text-gray-600">{selectedRequest.requestedAt}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tests */}
                      <div>
                        <Label className="text-base font-semibold">Requested Tests</Label>
                        <div className="mt-2 space-y-2">
                          {selectedRequest.tests.map((test, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="font-medium text-gray-900">{test}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Results Entry */}
                      {selectedRequest.status !== 'completed' && (
                        <>
                          {/* Status Control */}
                          {selectedRequest.status === 'pending' && (
                            <Button
                              onClick={handleStartTest}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <FlaskConical className="w-4 h-4 mr-2" />
                              Start Processing Test
                            </Button>
                          )}

                          {selectedRequest.status === 'in-progress' && (
                            <Badge className="bg-blue-600 text-white px-4 py-2 w-full justify-center">
                              Test In Progress
                            </Badge>
                          )}

                          <div>
                            <Label>Test Results</Label>
                            <Textarea
                              placeholder="Enter detailed test results and findings..."
                              rows={6}
                              className="mt-1"
                              value={testResults}
                              onChange={(e) => setTestResults(e.target.value)}
                            />
                          </div>

                          {/* Handwriting Notes */}
                          <div>
                            <Label className="text-sm font-semibold">Lab Technician Handwriting Notes</Label>
                            <div className="mt-2 border rounded-lg p-2 bg-white">
                              <canvas
                                ref={canvasRef}
                                width={600}
                                height={150}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                className="border rounded cursor-crosshair bg-gray-50 w-full"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={clearCanvas}>
                                  <X className="w-4 h-4 mr-1" />
                                  Clear
                                </Button>
                                <Button size="sm" onClick={interpretHandwriting}>
                                  <Pencil className="w-4 h-4 mr-1" />
                                  Interpret Handwriting
                                </Button>
                              </div>
                              {handwritingNotes && (
                                <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                                  {handwritingNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Additional Lab Notes</Label>
                            <Textarea
                              placeholder="Additional observations, quality control notes, or comments..."
                              rows={3}
                              className="mt-1"
                              value={labNotes}
                              onChange={(e) => setLabNotes(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label>Upload Report (Optional)</Label>
                            <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => toast.success('Draft saved')}
                            >
                              Save as Draft
                            </Button>
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={handleCompleteTest}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Complete & Send to {selectedRequest.requestedBy}
                            </Button>
                          </div>
                        </>
                      )}

                      {selectedRequest.status === 'completed' && (
                        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                          <p className="font-semibold text-green-900">Test Completed</p>
                          <p className="text-sm text-green-700 mt-1">
                            Results sent to {selectedRequest.requestedBy}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Completed at: {selectedRequest.completedAt}
                          </p>
                          <Button variant="outline" className="mt-4">
                            <FileText className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Select a lab request from the queue</p>
                      <p className="text-sm mt-2">Doctor-routed tests will appear in the queue</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
