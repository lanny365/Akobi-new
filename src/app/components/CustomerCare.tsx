import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Headset,
  MessageSquare,
  Mail,
  Send,
  Users,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  Phone,
  Smartphone,
  MessagesSquare,
  UserCircle,
  Calendar,
  Settings,
  BarChart3,
  Download,
  Upload,
  Eye,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: 'active' | 'inactive';
}

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  category: string;
}

interface SentMessage {
  id: string;
  recipient: string;
  recipientName: string;
  message: string;
  type: 'sms' | 'email';
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
}

export function CustomerCare() {
  const [activeTab, setActiveTab] = useState<'sms-engine' | 'single-sms' | 'bulk-sms' | 'email'>('sms-engine');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [isCustomSMSOpen, setIsCustomSMSOpen] = useState(false);
  const [isBulkSMSOpen, setIsBulkSMSOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Single SMS Form
  const [singleSMSForm, setSingleSMSForm] = useState({
    patientId: '',
    patientName: '',
    phoneNumber: '',
    message: '',
  });

  // Bulk SMS Form
  const [bulkSMSForm, setBulkSMSForm] = useState({
    message: '',
    filterType: 'all',
  });

  // Email Form
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    recipientName: '',
    subject: '',
    message: '',
    attachments: [] as File[],
  });

  // Sample Patients Data
  const patients: Patient[] = [
    {
      id: '1',
      patientId: 'PT-2026-0001',
      name: 'James Anderson',
      phone: '+234 801 234 5678',
      email: 'james.anderson@email.com',
      lastVisit: '2026-04-20',
      status: 'active',
    },
    {
      id: '2',
      patientId: 'PT-2026-0002',
      name: 'Grace Okonkwo',
      phone: '+234 802 345 6789',
      email: 'grace.okonkwo@email.com',
      lastVisit: '2026-04-22',
      status: 'active',
    },
    {
      id: '3',
      patientId: 'PT-2026-0003',
      name: 'Mohammed Ibrahim',
      phone: '+234 803 456 7890',
      email: 'mohammed.ibrahim@email.com',
      lastVisit: '2026-04-15',
      status: 'active',
    },
    {
      id: '4',
      patientId: 'PT-2026-0004',
      name: 'Sarah Williams',
      phone: '+234 804 567 8901',
      email: 'sarah.williams@email.com',
      lastVisit: '2026-04-18',
      status: 'active',
    },
    {
      id: '5',
      patientId: 'PT-2026-0005',
      name: 'David Okonjo',
      phone: '+234 805 678 9012',
      email: 'david.okonjo@email.com',
      lastVisit: '2026-03-30',
      status: 'inactive',
    },
  ];

  // SMS Templates
  const smsTemplates: SMSTemplate[] = [
    {
      id: '1',
      name: 'Appointment Reminder',
      message: 'Dear [Patient Name], this is to remind you of your appointment on [Date] at [Time]. Please arrive 15 minutes early. AKOBI SPECIALIST HOSPITAL.',
      category: 'Appointment',
    },
    {
      id: '2',
      name: 'Lab Results Ready',
      message: 'Hello [Patient Name], your lab results are ready. Please visit the hospital to collect them or contact us for more information. AKOBI Hospital.',
      category: 'Lab',
    },
    {
      id: '3',
      name: 'Payment Reminder',
      message: 'Dear [Patient Name], you have an outstanding balance of [Amount]. Please visit our billing department at your earliest convenience. AKOBI SPECIALIST HOSPITAL.',
      category: 'Billing',
    },
    {
      id: '4',
      name: 'Prescription Ready',
      message: 'Hello [Patient Name], your prescription is ready for pickup at our pharmacy. Please bring your patient ID. AKOBI Hospital.',
      category: 'Pharmacy',
    },
    {
      id: '5',
      name: 'General Follow-up',
      message: 'Dear [Patient Name], we hope you are feeling better. Please contact us if you need any assistance or have questions about your treatment. AKOBI SPECIALIST HOSPITAL.',
      category: 'Follow-up',
    },
  ];

  // Sent Messages History
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([
    {
      id: '1',
      recipient: '+234 801 234 5678',
      recipientName: 'James Anderson',
      message: 'Appointment reminder for tomorrow at 10:00 AM',
      type: 'sms',
      status: 'sent',
      sentAt: '2026-04-24 09:30',
    },
    {
      id: '2',
      recipient: 'grace.okonkwo@email.com',
      recipientName: 'Grace Okonkwo',
      message: 'Lab results ready for collection',
      type: 'email',
      status: 'sent',
      sentAt: '2026-04-24 08:15',
    },
  ]);

  const stats = [
    { label: 'SMS Sent Today', value: '234', color: 'bg-blue-500', icon: MessageSquare },
    { label: 'Emails Sent Today', value: '45', color: 'bg-green-500', icon: Mail },
    { label: 'Active Patients', value: patients.filter(p => p.status === 'active').length.toString(), color: 'bg-purple-500', icon: Users },
    { label: 'SMS Balance', value: '5,420', color: 'bg-orange-500', icon: Smartphone },
  ];

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  const handlePatientSearch = (patientId: string) => {
    const patient = patients.find(p => p.patientId === patientId || p.id === patientId);
    if (patient) {
      setSingleSMSForm({
        ...singleSMSForm,
        patientId: patient.patientId,
        patientName: patient.name,
        phoneNumber: patient.phone,
      });
      toast.success(`Patient found: ${patient.name}`);
    } else {
      toast.error('Patient not found');
    }
  };

  const handleSendSingleSMS = () => {
    if (!singleSMSForm.phoneNumber || !singleSMSForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newMessage: SentMessage = {
      id: Date.now().toString(),
      recipient: singleSMSForm.phoneNumber,
      recipientName: singleSMSForm.patientName,
      message: singleSMSForm.message,
      type: 'sms',
      status: 'sent',
      sentAt: new Date().toLocaleString(),
    };

    setSentMessages([newMessage, ...sentMessages]);
    toast.success(`SMS sent to ${singleSMSForm.patientName}`);
    setIsCustomSMSOpen(false);
    setSingleSMSForm({ patientId: '', patientName: '', phoneNumber: '', message: '' });
  };

  const handleSendBulkSMS = () => {
    if (!bulkSMSForm.message) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedPatients.length === 0) {
      toast.error('Please select at least one patient');
      return;
    }

    selectedPatients.forEach(patientId => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        const newMessage: SentMessage = {
          id: Date.now().toString() + patient.id,
          recipient: patient.phone,
          recipientName: patient.name,
          message: bulkSMSForm.message,
          type: 'sms',
          status: 'sent',
          sentAt: new Date().toLocaleString(),
        };
        setSentMessages(prev => [newMessage, ...prev]);
      }
    });

    toast.success(`Bulk SMS sent to ${selectedPatients.length} patients`);
    setIsBulkSMSOpen(false);
    setBulkSMSForm({ message: '', filterType: 'all' });
    setSelectedPatients([]);
  };

  const handleSendEmail = () => {
    if (!emailForm.recipient || !emailForm.subject || !emailForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newMessage: SentMessage = {
      id: Date.now().toString(),
      recipient: emailForm.recipient,
      recipientName: emailForm.recipientName,
      message: `${emailForm.subject}: ${emailForm.message}`,
      type: 'email',
      status: 'sent',
      sentAt: new Date().toLocaleString(),
    };

    setSentMessages([newMessage, ...sentMessages]);
    toast.success(`Email sent to ${emailForm.recipientName}`);
    setIsEmailOpen(false);
    setEmailForm({ recipient: '', recipientName: '', subject: '', message: '', attachments: [] });
  };

  const handleSelectPatient = (patientId: string) => {
    if (selectedPatients.includes(patientId)) {
      setSelectedPatients(selectedPatients.filter(id => id !== patientId));
    } else {
      setSelectedPatients([...selectedPatients, patientId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map(p => p.id));
    }
  };

  const handleTemplateSelect = (template: SMSTemplate) => {
    setSingleSMSForm({ ...singleSMSForm, message: template.message });
    toast.success(`Template "${template.name}" loaded`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <Headset className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Customer Care - Communication Center</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Send SMS messages and emails to patients for appointments, reminders, and notifications
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Communication Center */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessagesSquare className="w-5 h-5 text-blue-600" />
              Communication Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCustomSMSOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send SMS
              </Button>
              <Button
                onClick={() => setIsBulkSMSOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Bulk SMS
              </Button>
              <Button
                onClick={() => setIsEmailOpen(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sms-engine">
                <Settings className="w-4 h-4 mr-2" />
                SMS Engine
              </TabsTrigger>
              <TabsTrigger value="single-sms">
                <MessageSquare className="w-4 h-4 mr-2" />
                Single SMS
              </TabsTrigger>
              <TabsTrigger value="bulk-sms">
                <MessagesSquare className="w-4 h-4 mr-2" />
                Bulk SMS
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                Email Center
              </TabsTrigger>
            </TabsList>

            {/* SMS Engine Tab */}
            <TabsContent value="sms-engine" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SMS Templates */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    SMS Templates
                  </h3>
                  <div className="space-y-3">
                    {smsTemplates.map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.message}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTemplateSelect(template)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* SMS Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    SMS Statistics & Settings
                  </h3>
                  <div className="space-y-4">
                    {/* SMS Balance Card */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">SMS Credits Balance</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">5,420</p>
                            <p className="text-xs text-gray-500 mt-1">Credits remaining</p>
                          </div>
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                            <Smartphone className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                          <Upload className="w-4 h-4 mr-2" />
                          Recharge Credits
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Monthly Usage */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">This Month's Usage</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">SMS Sent</span>
                            <span className="font-bold">1,234</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Emails Sent</span>
                            <span className="font-bold">567</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Delivery Rate</span>
                            <Badge className="bg-green-100 text-green-700">98.5%</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Failed Messages</span>
                            <span className="font-bold text-red-600">18</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SMS Provider Settings */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          SMS Gateway Settings
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">SMS Provider</Label>
                            <Input value="Twilio SMS Gateway" readOnly className="mt-1 bg-gray-50" />
                          </div>
                          <div>
                            <Label className="text-xs">Sender ID</Label>
                            <Input value="AKOBI-HMS" readOnly className="mt-1 bg-gray-50" />
                          </div>
                          <Button variant="outline" className="w-full text-xs">
                            <Settings className="w-3 h-3 mr-2" />
                            Configure Settings
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Single SMS Tab */}
            <TabsContent value="single-sms" className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  Send customized SMS to individual patients. Search for the patient first, then compose your message.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Search */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Patient Search</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Patient ID or Hospital Number</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter patient ID..."
                          value={singleSMSForm.patientId}
                          onChange={(e) => setSingleSMSForm({ ...singleSMSForm, patientId: e.target.value })}
                        />
                        <Button
                          onClick={() => handlePatientSearch(singleSMSForm.patientId)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {singleSMSForm.patientName && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Patient Found
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-semibold">{singleSMSForm.patientName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phone:</span>
                              <span className="font-semibold">{singleSMSForm.phoneNumber}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Recent Sent Messages */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {sentMessages.slice(0, 5).map((msg) => (
                      <Card key={msg.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {msg.type === 'sms' ? (
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Mail className="w-4 h-4 text-green-600" />
                              )}
                              <span className="font-semibold text-sm">{msg.recipientName}</span>
                            </div>
                            <Badge
                              className={
                                msg.status === 'sent'
                                  ? 'bg-green-100 text-green-700'
                                  : msg.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {msg.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2">{msg.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{msg.recipient}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {msg.sentAt}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bulk SMS Tab */}
            <TabsContent value="bulk-sms" className="space-y-4 mt-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
                  Send the same SMS to multiple patients at once. Select patients from the list below and compose your message.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Selection */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Select Patients</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs"
                      >
                        {selectedPatients.length === filteredPatients.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Badge className="bg-purple-100 text-purple-700">
                        {selectedPatients.length} selected
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search patients..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto border rounded-lg p-2">
                    {filteredPatients.map((patient) => (
                      <Card
                        key={patient.id}
                        className={`cursor-pointer transition-all ${
                          selectedPatients.includes(patient.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleSelectPatient(patient.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedPatients.includes(patient.id)}
                                onChange={() => handleSelectPatient(patient.id)}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <UserCircle className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-semibold text-sm">{patient.name}</p>
                                <p className="text-xs text-gray-500">{patient.patientId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">{patient.phone}</p>
                              <Badge
                                className={
                                  patient.status === 'active'
                                    ? 'bg-green-100 text-green-700 text-xs'
                                    : 'bg-gray-100 text-gray-700 text-xs'
                                }
                              >
                                {patient.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Bulk SMS Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sending Summary</h3>
                  <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Recipients</p>
                          <p className="text-4xl font-bold text-purple-600 mt-1">
                            {selectedPatients.length}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">patients selected</p>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">SMS Credits Required:</span>
                            <span className="font-bold">{selectedPatients.length}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Current Balance:</span>
                            <span className="font-bold text-green-600">5,420</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">After Sending:</span>
                            <span className="font-bold">{5420 - selectedPatients.length}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs text-gray-500 text-center">
                            Estimated delivery time: Immediate
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  Send emails to patients with attachments. Search for the patient or enter email directly.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Search for Email */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Recipient</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Search Patient</Label>
                      <div className="flex gap-2 mt-2">
                        <Input placeholder="Enter patient ID..." />
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or enter manually</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Email Statistics</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Emails Sent Today</span>
                          <span className="font-bold text-green-600">45</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">This Week</span>
                          <span className="font-bold">234</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Open Rate</span>
                          <Badge className="bg-green-100 text-green-700">87%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Bounce Rate</span>
                          <Badge className="bg-orange-100 text-orange-700">2.3%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Send Single SMS Dialog */}
      <Dialog open={isCustomSMSOpen} onOpenChange={setIsCustomSMSOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Send Custom SMS
            </DialogTitle>
            <DialogDescription>
              Send a personalized SMS message to a patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Search */}
            <div>
              <Label>Search Patient</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter patient ID or hospital number..."
                  value={singleSMSForm.patientId}
                  onChange={(e) => setSingleSMSForm({ ...singleSMSForm, patientId: e.target.value })}
                />
                <Button
                  onClick={() => handlePatientSearch(singleSMSForm.patientId)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {singleSMSForm.patientName && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Patient Name:</span>
                      <p className="font-semibold">{singleSMSForm.patientName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone Number:</span>
                      <p className="font-semibold">{singleSMSForm.phoneNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Or Manual Entry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Or Enter Name Manually</Label>
                <Input
                  placeholder="Patient name..."
                  value={singleSMSForm.patientName}
                  onChange={(e) => setSingleSMSForm({ ...singleSMSForm, patientName: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="+234 800 000 0000"
                  value={singleSMSForm.phoneNumber}
                  onChange={(e) => setSingleSMSForm({ ...singleSMSForm, phoneNumber: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Message Template Selection */}
            <div>
              <Label>Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {smsTemplates.slice(0, 4).map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSingleSMSForm({ ...singleSMSForm, message: template.message })}
                    className="text-xs justify-start"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={singleSMSForm.message}
                onChange={(e) => setSingleSMSForm({ ...singleSMSForm, message: e.target.value })}
                className="mt-2 min-h-[120px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                {singleSMSForm.message.length} / 160 characters
              </p>
            </div>

            <Button
              onClick={handleSendSingleSMS}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Send SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Bulk SMS Dialog */}
      <Dialog open={isBulkSMSOpen} onOpenChange={setIsBulkSMSOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Send Bulk SMS
            </DialogTitle>
            <DialogDescription>
              Send the same message to {selectedPatients.length} selected patients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recipients Selected</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedPatients.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            {/* Message Template Selection */}
            <div>
              <Label>Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {smsTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkSMSForm({ ...bulkSMSForm, message: template.message })}
                    className="text-xs justify-start"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Bulk Message */}
            <div>
              <Label>Message (will be sent to all selected patients)</Label>
              <Textarea
                placeholder="Type your message here..."
                value={bulkSMSForm.message}
                onChange={(e) => setBulkSMSForm({ ...bulkSMSForm, message: e.target.value })}
                className="mt-2 min-h-[150px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                {bulkSMSForm.message.length} / 160 characters • {selectedPatients.length} SMS credits will be used
              </p>
            </div>

            <Button
              onClick={handleSendBulkSMS}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              disabled={selectedPatients.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Bulk SMS to {selectedPatients.length} Patients
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Send Email
            </DialogTitle>
            <DialogDescription>
              Send an email with optional attachments to a patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Search */}
            <div>
              <Label>Search Patient</Label>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Enter patient ID..." />
                <Button className="bg-green-600 hover:bg-green-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or enter manually</span>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recipient Name</Label>
                <Input
                  placeholder="Patient name..."
                  value={emailForm.recipientName}
                  onChange={(e) => setEmailForm({ ...emailForm, recipientName: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="patient@email.com"
                  value={emailForm.recipient}
                  onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label>Subject</Label>
              <Input
                placeholder="Email subject..."
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="mt-2"
              />
            </div>

            {/* Message */}
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Type your email message here..."
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                className="mt-2 min-h-[150px]"
              />
            </div>

            {/* Attachments */}
            <div>
              <Label>Attachments (Optional)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                <input type="file" className="hidden" multiple />
              </div>
            </div>

            <Button
              onClick={handleSendEmail}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}