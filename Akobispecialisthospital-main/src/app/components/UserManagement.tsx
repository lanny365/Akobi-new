import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Users, UserPlus, Edit, Trash2, Mail, Phone, Calendar, Shield, Building, Camera, Upload, IdCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { useCardTypes } from '../context/CardTypesContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  joinDate: string;
  employeeId: string;
  passport?: string;
}

type UserManagementSection = 'users' | 'card-types';

export function UserManagement() {
  const [selectedSection, setSelectedSection] = useState<UserManagementSection>('users');
  const [users, setUsers] = useState<User[]>([
    { 
      id: '1', 
      name: 'Dr. Sarah Johnson', 
      email: 'sarah.j@hospital.com', 
      phone: '+234 801 234 5678',
      role: 'Doctor', 
      department: 'Clinical', 
      status: 'active', 
      lastLogin: '2026-04-21 08:30',
      joinDate: '2024-01-15',
      employeeId: 'EMP-001',
      passport: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBkb2N0b3IlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NzY4MzYyNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '2', 
      name: 'John Miller', 
      email: 'john.m@hospital.com', 
      phone: '+234 802 345 6789',
      role: 'Receptionist', 
      department: 'Reception', 
      status: 'active', 
      lastLogin: '2026-04-21 07:45',
      joinDate: '2024-03-20',
      employeeId: 'EMP-002',
      passport: 'https://images.unsplash.com/photo-1762522926262-d96de462ad54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWxlJTIwcmVjZXB0aW9uaXN0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzc2ODM2Mjc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '3', 
      name: 'Emma Davis', 
      email: 'emma.d@hospital.com', 
      phone: '+234 803 456 7890',
      role: 'Pharmacist', 
      department: 'Pharmacy', 
      status: 'active', 
      lastLogin: '2026-04-20 16:20',
      joinDate: '2024-02-10',
      employeeId: 'EMP-003',
      passport: 'https://images.unsplash.com/photo-1765005204058-10418f5123c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBwaGFybWFjaXN0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzc2ODM2Mjc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '4', 
      name: 'Michael Chen', 
      email: 'michael.c@hospital.com', 
      phone: '+234 804 567 8901',
      role: 'Lab Technician', 
      department: 'Laboratory', 
      status: 'active', 
      lastLogin: '2026-04-21 09:00',
      joinDate: '2024-04-05',
      employeeId: 'EMP-004',
      passport: 'https://images.unsplash.com/photo-1657551856874-d492ef8ecba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWxlJTIwbGFib3JhdG9yeSUyMHRlY2huaWNpYW58ZW58MXx8fHwxNzc2ODM2Mjc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '5', 
      name: 'Lisa Anderson', 
      email: 'lisa.a@hospital.com', 
      phone: '+234 805 678 9012',
      role: 'Cashier', 
      department: 'Cashier', 
      status: 'active', 
      lastLogin: '2026-04-21 08:15',
      joinDate: '2024-05-12',
      employeeId: 'EMP-005',
      passport: 'https://images.unsplash.com/photo-1543832570-13375d4e231c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBjYXNoaWVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzc2ODM2Mjc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '6', 
      name: 'Robert Taylor', 
      email: 'robert.t@hospital.com', 
      phone: '+234 806 789 0123',
      role: 'Accountant', 
      department: 'Accounts', 
      status: 'inactive', 
      lastLogin: '2026-04-18 17:30',
      joinDate: '2023-11-08',
      employeeId: 'EMP-006',
      passport: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWxlJTIwYWNjb3VudGFudCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjgzNjI3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '7', 
      name: 'Dr. James Wilson', 
      email: 'james.w@hospital.com', 
      phone: '+234 807 890 1234',
      role: 'Doctor', 
      department: 'Clinical', 
      status: 'active', 
      lastLogin: '2026-04-21 06:30',
      joinDate: '2023-09-15',
      employeeId: 'EMP-007',
      passport: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc2ODM2Mjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: '8', 
      name: 'Mary Brown', 
      email: 'mary.b@hospital.com', 
      phone: '+234 808 901 2345',
      role: 'Nurse', 
      department: 'Clinical', 
      status: 'active', 
      lastLogin: '2026-04-21 07:00',
      joinDate: '2024-01-20',
      employeeId: 'EMP-008',
      passport: 'https://images.unsplash.com/photo-1670191247079-f9713ae06dcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBudXJzZSUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjgzNjI3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
  ]);

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  const roles = [
    { id: '1', name: 'Administrator' },
    { id: '2', name: 'Doctor' },
    { id: '3', name: 'Nurse' },
    { id: '4', name: 'Receptionist' },
    { id: '5', name: 'Pharmacist' },
    { id: '6', name: 'Cashier' },
    { id: '7', name: 'Lab Technician' },
    { id: '8', name: 'Accountant' },
  ];

  const departments = [
    'Clinical',
    'Reception',
    'Pharmacy',
    'Laboratory',
    'Cashier',
    'Accounts',
    'Theatre',
    'Cleaning',
    'Maintenance',
  ];

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    setSelectedUserId('');
    toast.success('User deleted successfully');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : u
    ));
    toast.success('User status updated');
  };

  const handleEditUser = () => {
    if (selectedUser) {
      setEditedUser({ ...selectedUser });
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedUser) {
      setUsers(users.map(u => u.id === editedUser.id ? editedUser : u));
      setIsEditMode(false);
      setEditedUser(null);
      toast.success('User updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedUser(null);
  };

  const stats = [
    { label: 'Total Users', value: users.length.toString(), color: 'bg-blue-500' },
    { label: 'Active Users', value: users.filter(u => u.status === 'active').length.toString(), color: 'bg-green-500' },
    { label: 'Inactive Users', value: users.filter(u => u.status === 'inactive').length.toString(), color: 'bg-gray-500' },
    { label: 'Departments', value: '9', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage users and patient card types
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="section-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select Section
            </Label>
            <select
              id="section-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as UserManagementSection)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="users">Users Management</option>
              <option value="card-types">Patient Card Types</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      {selectedSection === 'users' && (
        <>
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
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Management Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-2xl">Users List</CardTitle>
                </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Add a new user to the hospital management system.
                </DialogDescription>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input placeholder="Enter full name" />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="user@hospital.com" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input placeholder="+234 800 000 0000" />
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    <Input placeholder="EMP-XXX" />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name.toLowerCase()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept.toLowerCase()}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" placeholder="Enter password" />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => toast.success('User created successfully')}
                  >
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            View and manage all hospital staff members
          </p>
        </CardHeader>
        <CardContent>
          {/* User Selector */}
          <div className="mb-6">
            <Label htmlFor="user-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select User
            </Label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setIsEditMode(false);
                setEditedUser(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Choose a user to view details --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.department}
                  {user.status === 'inactive' ? ' • Inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selected User Details */}
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Info Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="relative group">
                  {selectedUser.passport ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <img 
                        src={selectedUser.passport} 
                        alt={selectedUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                      <span className="font-semibold text-xl text-white">
                        {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {!isEditMode && (
                    <button 
                      className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white"
                      onClick={() => toast.info('Upload passport photo feature')}
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{selectedUser.name}</h3>
                    <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedUser.role}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Building className="w-3 h-3 mr-1" />
                      {selectedUser.department}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditMode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditUser}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* User Details */}
              {isEditMode && editedUser ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Edit User Information</h4>
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
                    <div className="md:col-span-2 flex justify-center mb-2">
                      <div className="relative group">
                        {editedUser.passport ? (
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                            <img 
                              src={editedUser.passport} 
                              alt={editedUser.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-100">
                            <span className="font-semibold text-3xl text-white">
                              {editedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <button 
                          className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-3 border-white hover:bg-blue-700 transition-colors"
                          onClick={() => toast.info('Upload passport photo feature')}
                        >
                          <Upload className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={editedUser.name}
                        onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={editedUser.phone}
                        onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Employee ID</Label>
                      <Input
                        value={editedUser.employeeId}
                        onChange={(e) => setEditedUser({ ...editedUser, employeeId: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={editedUser.role.toLowerCase()}
                        onValueChange={(value) => setEditedUser({ ...editedUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name.toLowerCase()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select
                        value={editedUser.department.toLowerCase()}
                        onValueChange={(value) => setEditedUser({ ...editedUser, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept.toLowerCase()}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <Label className="text-sm font-medium">Account Status</Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {editedUser.status === 'active' ? 'User can access the system' : 'User access is disabled'}
                          </p>
                        </div>
                        <Switch
                          checked={editedUser.status === 'active'}
                          onCheckedChange={(checked) => 
                            setEditedUser({ ...editedUser, status: checked ? 'active' : 'inactive' })
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
                    <h4 className="text-sm font-semibold text-gray-700">User Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Email Address</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Phone Number</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedUser.phone}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Role</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedUser.role}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Department</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedUser.department}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Join Date</Label>
                      </div>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedUser.joinDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <Label className="text-xs text-gray-600">Employee ID</Label>
                      </div>
                      <p className="font-medium text-gray-900">{selectedUser.employeeId}</p>
                    </div>
                  </div>

                  {/* Activity Info */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Activity Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <Label className="text-xs text-gray-600">Last Login</Label>
                        <p className="font-medium text-gray-900 mt-1">
                          {new Date(selectedUser.lastLogin).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <Label className="text-xs text-gray-600">Account Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${selectedUser.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <p className="font-medium text-gray-900 capitalize">{selectedUser.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleToggleUserStatus(selectedUser.id)}
                      >
                        {selectedUser.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.info('Password reset link sent to ' + selectedUser.email)}
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No User Selected</h3>
              <p className="text-sm text-gray-500">
                Select a user from the dropdown above to view and manage their details
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {selectedSection === 'card-types' && <CardTypesManagement />}
    </div>
  );
}

// Card Types Management Component
function CardTypesManagement() {
  const { cardTypes, addCardType, updateCardType, deleteCardType, toggleCardTypeStatus } = useCardTypes();
  const [newCardName, setNewCardName] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardColor, setNewCardColor] = useState('blue');
  const [editingId, setEditingId] = useState<string | null>(null);

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  ];

  const handleAddCardType = () => {
    if (!newCardName.trim()) {
      toast.error('Please enter card type name');
      return;
    }

    if (editingId) {
      updateCardType(editingId, {
        name: newCardName,
        description: newCardDescription,
        color: newCardColor,
      });
      toast.success('Card type updated successfully');
      setEditingId(null);
    } else {
      addCardType({
        name: newCardName,
        description: newCardDescription,
        color: newCardColor,
        status: 'active',
      });
      toast.success('Card type added successfully');
    }

    setNewCardName('');
    setNewCardDescription('');
    setNewCardColor('blue');
  };

  const handleEditCardType = (cardType: any) => {
    setEditingId(cardType.id);
    setNewCardName(cardType.name);
    setNewCardDescription(cardType.description);
    setNewCardColor(cardType.color);
    toast.info('Editing card type - Update and click Add/Update button');
  };

  const handleDeleteCardType = (id: string) => {
    deleteCardType(id);
    toast.success('Card type deleted successfully');
  };

  const handleToggleStatus = (id: string) => {
    toggleCardTypeStatus(id);
    toast.success('Card type status updated');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Card Types</p>
                <p className="text-2xl font-bold mt-1">{cardTypes.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <IdCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Types</p>
                <p className="text-2xl font-bold mt-1">
                  {cardTypes.filter(ct => ct.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <IdCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Types</p>
                <p className="text-2xl font-bold mt-1">
                  {cardTypes.filter(ct => ct.status === 'inactive').length}
                </p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg">
                <IdCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Card Type Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-cyan-600" />
            <CardTitle>{editingId ? 'Update Card Type' : 'Add New Card Type'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-semibold">Card Type Name *</Label>
                <Input
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="e.g., New Patient Card, VIP Card"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-900 font-semibold">Card Color</Label>
                <select
                  value={newCardColor}
                  onChange={(e) => setNewCardColor(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {colorOptions.map(color => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-gray-900 font-semibold">Description</Label>
                <Input
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  placeholder="Description of this card type"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAddCardType}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white"
              >
                <IdCard className="w-4 h-4 mr-2" />
                {editingId ? 'Update Card Type' : 'Add Card Type'}
              </Button>
              {editingId && (
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setNewCardName('');
                    setNewCardDescription('');
                    setNewCardColor('blue');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Types List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-blue-600" />
            <CardTitle>Patient Card Types</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cardTypes.map((cardType) => (
              <div
                key={cardType.id}
                className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-cyan-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 ${colorOptions.find(c => c.value === cardType.color)?.class} rounded-lg flex items-center justify-center`}>
                        <IdCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{cardType.name}</h4>
                        {cardType.description && (
                          <p className="text-sm text-gray-600">{cardType.description}</p>
                        )}
                      </div>
                      <Badge variant={cardType.status === 'active' ? 'default' : 'secondary'}>
                        {cardType.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleEditCardType(cardType)}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleToggleStatus(cardType.id)}
                      variant="outline"
                      size="sm"
                      className={cardType.status === 'active' ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}
                    >
                      {cardType.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteCardType(cardType.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">About Patient Card Types</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Card types defined here are available when setting patient card fees in Hospital Settings</li>
          <li>• Only active card types will be available for selection when adding card fees</li>
          <li>• Card colors help differentiate between different card types</li>
          <li>• These card types are used during patient registration at Reception</li>
        </ul>
      </div>
    </div>
  );
}