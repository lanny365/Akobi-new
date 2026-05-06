import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  UserPlus,
  Users,
  Calendar,
  Clock,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useCardTypes } from '../context/CardTypesContext';
import { toast } from 'sonner';

interface Patient {
  id: string;
  cardNumber: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  nextOfKin: string;
  kinPhone: string;
  registrationDate: string;
  status: 'waiting' | 'in-consultation' | 'completed';
  appointmentTime?: string;
}

export function Reception() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients] = useState<Patient[]>([
    {
      id: '1',
      cardNumber: 'PT-2026-0001',
      name: 'James Anderson',
      age: 45,
      gender: 'Male',
      phone: '+234 802 345 6789',
      email: 'james.a@email.com',
      address: '123 Main Street, Lagos',
      nextOfKin: 'Mary Anderson',
      kinPhone: '+234 803 456 7890',
      registrationDate: '2026-04-21',
      status: 'waiting',
      appointmentTime: '09:00 AM'
    },
    {
      id: '2',
      cardNumber: 'PT-2026-0002',
      name: 'Grace Okonkwo',
      age: 32,
      gender: 'Female',
      phone: '+234 805 678 9012',
      email: 'grace.o@email.com',
      address: '45 Victoria Island, Lagos',
      nextOfKin: 'Peter Okonkwo',
      kinPhone: '+234 806 789 0123',
      registrationDate: '2026-04-21',
      status: 'in-consultation',
      appointmentTime: '09:30 AM'
    },
    {
      id: '3',
      cardNumber: 'PT-2025-1234',
      name: 'Mohammed Ibrahim',
      age: 58,
      gender: 'Male',
      phone: '+234 807 890 1234',
      email: 'mohammed.i@email.com',
      address: '78 Ikeja Road, Lagos',
      nextOfKin: 'Fatima Ibrahim',
      kinPhone: '+234 808 901 2345',
      registrationDate: '2025-12-15',
      status: 'waiting',
      appointmentTime: '10:00 AM'
    },
  ]);

  const stats = [
    { label: 'Today\'s Patients', value: '32', icon: Users, color: 'bg-blue-500' },
    { label: 'In Queue', value: '8', icon: Clock, color: 'bg-orange-500' },
    { label: 'New Registrations', value: '5', icon: UserPlus, color: 'bg-green-500' },
    { label: 'Appointments', value: '12', icon: Calendar, color: 'bg-purple-500' },
  ];

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  );

  const { cardTypes } = useCardTypes();

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

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Patient Management</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Patient Registration</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="personal" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Personal Details</TabsTrigger>
                    <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="personal" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input placeholder="Enter full name" />
                      </div>
                      <div>
                        <Label>Card Number</Label>
                        <Input placeholder="Auto-generated" disabled />
                      </div>
                    </div>

                    <div>
                      <Label>Card Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select card type" />
                        </SelectTrigger>
                        <SelectContent>
                          {cardTypes.filter(ct => ct.status === 'active').map((cardType) => (
                            <SelectItem key={cardType.id} value={cardType.id}>
                              {cardType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Age *</Label>
                        <Input type="number" placeholder="Age" />
                      </div>
                      <div>
                        <Label>Gender *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Blood Group</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a+">A+</SelectItem>
                            <SelectItem value="a-">A-</SelectItem>
                            <SelectItem value="b+">B+</SelectItem>
                            <SelectItem value="b-">B-</SelectItem>
                            <SelectItem value="ab+">AB+</SelectItem>
                            <SelectItem value="ab-">AB-</SelectItem>
                            <SelectItem value="o+">O+</SelectItem>
                            <SelectItem value="o-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone Number *</Label>
                        <Input placeholder="+234 XXX XXX XXXX" />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input type="email" placeholder="patient@email.com" />
                      </div>
                    </div>

                    <div>
                      <Label>Residential Address *</Label>
                      <Textarea placeholder="Enter full address" rows={2} />
                    </div>
                  </TabsContent>

                  <TabsContent value="emergency" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Next of Kin Name *</Label>
                        <Input placeholder="Full name" />
                      </div>
                      <div>
                        <Label>Relationship *</Label>
                        <Input placeholder="e.g., Spouse, Parent" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Number *</Label>
                        <Input placeholder="+234 XXX XXX XXXX" />
                      </div>
                      <div>
                        <Label>Alternative Number</Label>
                        <Input placeholder="+234 XXX XXX XXXX" />
                      </div>
                    </div>

                    <div>
                      <Label>Address</Label>
                      <Textarea placeholder="Next of kin address" rows={2} />
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                      Register Patient
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, card number, or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Patient Queue */}
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <Badge variant={
                          patient.status === 'waiting' ? 'secondary' :
                          patient.status === 'in-consultation' ? 'default' :
                          'outline'
                        }>
                          {patient.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">Card: {patient.cardNumber}</p>
                      <p className="text-sm text-gray-600">
                        {patient.age} years • {patient.gender}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{patient.phone}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{patient.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{patient.address}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">Emergency Contact:</p>
                      <p className="text-sm text-gray-600">{patient.nextOfKin}</p>
                      <p className="text-sm text-gray-600">{patient.kinPhone}</p>
                      {patient.appointmentTime && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                          <Clock className="w-4 h-4" />
                          <span>Appointment: {patient.appointmentTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}