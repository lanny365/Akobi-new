import { useState } from 'react';
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
  Send
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  
  const [labRequests] = useState<LabRequest[]>([
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

  const stats = [
    { label: 'Pending Tests', value: '8', icon: Clock, color: 'bg-orange-500' },
    { label: 'In Progress', value: '5', icon: FlaskConical, color: 'bg-blue-500' },
    { label: 'Completed Today', value: '24', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Total Revenue', value: '₦245,000', icon: FileText, color: 'bg-purple-500' },
  ];

  const filteredRequests = labRequests.filter(req =>
    req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Requests Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Lab Requests</CardTitle>
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

            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedRequest?.id === request.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{request.patientName}</h4>
                      <p className="text-sm text-gray-600">{request.id}</p>
                    </div>
                    <Badge variant={
                      request.status === 'pending' ? 'secondary' :
                      request.status === 'in-progress' ? 'default' :
                      'outline'
                    } className="text-xs">
                      {request.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {request.tests.map((test, idx) => (
                      <p key={idx} className="text-sm text-gray-700">• {test}</p>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">⏰ {request.requestedAt}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Results Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedRequest ? `Test Results - ${selectedRequest.patientName}` : 'Select a Request'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequest ? (
              <div className="space-y-6">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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
                    <div>
                      <Label>Test Results</Label>
                      <Textarea
                        placeholder="Enter detailed test results and findings..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Lab Technician Notes</Label>
                      <Textarea
                        placeholder="Additional observations or comments..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Upload Report (Optional)</Label>
                      <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Save as Draft
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Send className="w-4 h-4 mr-2" />
                        Complete & Send to Doctor
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
                <p>Select a lab request to enter test results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
