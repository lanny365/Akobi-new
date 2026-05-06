import { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Equipment {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'maintenance' | 'faulty' | 'out-of-service';
  lastMaintenance: string;
  nextMaintenance: string;
}

interface MaintenanceRequest {
  id: string;
  equipmentName: string;
  location: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed';
  assignedTo?: string;
}

export function Maintenance() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [equipment] = useState<Equipment[]>([
    {
      id: 'EQ-001',
      name: 'X-Ray Machine',
      location: 'Radiology Department',
      status: 'operational',
      lastMaintenance: '2026-03-15',
      nextMaintenance: '2026-06-15'
    },
    {
      id: 'EQ-002',
      name: 'Ventilator #3',
      location: 'ICU',
      status: 'maintenance',
      lastMaintenance: '2026-04-01',
      nextMaintenance: '2026-07-01'
    },
    {
      id: 'EQ-003',
      name: 'CT Scanner',
      location: 'Radiology Department',
      status: 'faulty',
      lastMaintenance: '2026-02-20',
      nextMaintenance: '2026-05-20'
    },
    {
      id: 'EQ-004',
      name: 'Autoclave Sterilizer',
      location: 'Theatre 1',
      status: 'operational',
      lastMaintenance: '2026-04-10',
      nextMaintenance: '2026-07-10'
    },
  ]);

  const [requests] = useState<MaintenanceRequest[]>([
    {
      id: 'MNT-001',
      equipmentName: 'CT Scanner',
      location: 'Radiology',
      issue: 'Scanner not powering on. Display shows error code E-403',
      priority: 'critical',
      reportedBy: 'Dr. Sarah Johnson',
      reportedAt: '2026-04-21 08:30',
      status: 'in-progress',
      assignedTo: 'Technician Mike'
    },
    {
      id: 'MNT-002',
      equipmentName: 'Blood Pressure Monitor',
      location: 'Ward A',
      issue: 'Readings appear inconsistent',
      priority: 'medium',
      reportedBy: 'Nurse Mary',
      reportedAt: '2026-04-21 09:00',
      status: 'assigned',
      assignedTo: 'Technician John'
    },
    {
      id: 'MNT-003',
      equipmentName: 'Oxygen Concentrator',
      location: 'Emergency',
      issue: 'Making unusual noise during operation',
      priority: 'high',
      reportedBy: 'Dr. Michael Chen',
      reportedAt: '2026-04-21 10:15',
      status: 'pending'
    },
  ]);

  const stats = [
    { label: 'Total Equipment', value: '142', icon: Settings, color: 'bg-blue-500' },
    { label: 'Operational', value: '128', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Under Maintenance', value: '8', icon: Clock, color: 'bg-orange-500' },
    { label: 'Faulty/Critical', value: '6', icon: AlertTriangle, color: 'bg-red-500' },
  ];

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-600">High</Badge>;
      case 'medium': return <Badge variant="default">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return null;
    }
  };

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

      {/* Maintenance Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Maintenance Requests</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Equipment Issue</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Equipment Name</Label>
                    <Input placeholder="Enter equipment name" />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input placeholder="Department / Room" />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical - Immediate attention</SelectItem>
                        <SelectItem value="high">High - Within 4 hours</SelectItem>
                        <SelectItem value="medium">Medium - Within 24 hours</SelectItem>
                        <SelectItem value="low">Low - Routine maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Issue Description</Label>
                    <Textarea placeholder="Describe the problem in detail..." rows={4} />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{request.equipmentName}</h4>
                      {getPriorityBadge(request.priority)}
                      <Badge variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'in-progress' ? 'secondary' :
                        'outline'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{request.issue}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
                      {request.assignedTo && (
                        <div>
                          <p className="text-gray-600">Assigned To</p>
                          <p className="font-medium">{request.assignedTo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {request.status === 'pending' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Assign
                      </Button>
                    )}
                    {request.status === 'in-progress' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <thead className="bg-gray-50 border-b">
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
                      <Badge variant={
                        eq.status === 'operational' ? 'default' :
                        eq.status === 'maintenance' ? 'secondary' :
                        eq.status === 'faulty' ? 'destructive' :
                        'outline'
                      }>
                        {eq.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{eq.lastMaintenance}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{eq.nextMaintenance}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View History
                        </Button>
                        <Button size="sm" variant="outline">
                          <Wrench className="w-4 h-4" />
                        </Button>
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
