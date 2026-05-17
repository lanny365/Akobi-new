import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Shield, Plus, User, Settings, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    dashboard: boolean;
    patients: boolean;
    appointments: boolean;
    medicalRecords: boolean;
    pharmacy: boolean;
    laboratory: boolean;
    billing: boolean;
    reports: boolean;
    settings: boolean;
  };
  userCount: number;
}

interface UserPermission {
  id: string;
  name: string;
  email: string;
  roleId: string;
  customPermissions?: {
    dashboard?: boolean;
    patients?: boolean;
    appointments?: boolean;
    medicalRecords?: boolean;
    pharmacy?: boolean;
    laboratory?: boolean;
    billing?: boolean;
    reports?: boolean;
    settings?: boolean;
  };
}

export function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: {
        dashboard: true,
        patients: true,
        appointments: true,
        medicalRecords: true,
        pharmacy: true,
        laboratory: true,
        billing: true,
        reports: true,
        settings: true,
      },
      userCount: 3,
    },
    {
      id: '2',
      name: 'Doctor',
      description: 'Clinical staff with patient care permissions',
      permissions: {
        dashboard: true,
        patients: true,
        appointments: true,
        medicalRecords: true,
        pharmacy: true,
        laboratory: true,
        billing: false,
        reports: true,
        settings: false,
      },
      userCount: 24,
    },
    {
      id: '3',
      name: 'Nurse',
      description: 'Nursing staff with limited clinical access',
      permissions: {
        dashboard: true,
        patients: true,
        appointments: true,
        medicalRecords: true,
        pharmacy: false,
        laboratory: false,
        billing: false,
        reports: false,
        settings: false,
      },
      userCount: 45,
    },
    {
      id: '4',
      name: 'Receptionist',
      description: 'Front desk staff for patient registration',
      permissions: {
        dashboard: true,
        patients: true,
        appointments: true,
        medicalRecords: false,
        pharmacy: false,
        laboratory: false,
        billing: false,
        reports: false,
        settings: false,
      },
      userCount: 12,
    },
    {
      id: '5',
      name: 'Pharmacist',
      description: 'Pharmacy staff with medication management',
      permissions: {
        dashboard: true,
        patients: true,
        appointments: false,
        medicalRecords: false,
        pharmacy: true,
        laboratory: false,
        billing: false,
        reports: true,
        settings: false,
      },
      userCount: 8,
    },
    {
      id: '6',
      name: 'Cashier',
      description: 'Financial staff for payment processing',
      permissions: {
        dashboard: true,
        patients: true,
        appointments: false,
        medicalRecords: false,
        pharmacy: false,
        laboratory: false,
        billing: true,
        reports: true,
        settings: false,
      },
      userCount: 6,
    },
  ]);

  const [users, setUsers] = useState<UserPermission[]>([
    { id: '1', name: 'John Admin', email: 'john@hospital.com', roleId: '1' },
    { 
      id: '2', 
      name: 'Sarah Connor', 
      email: 'sarah@hospital.com', 
      roleId: '1',
      customPermissions: {
        settings: false, // Restricted from system settings
        billing: false,  // Restricted from billing
      }
    },
    { 
      id: '3', 
      name: 'Mike Stevens', 
      email: 'mike@hospital.com', 
      roleId: '1',
      customPermissions: {
        pharmacy: false,    // Restricted from pharmacy
        laboratory: false,  // Restricted from laboratory
      }
    },
    { id: '4', name: 'Dr. Emily Brown', email: 'emily.brown@hospital.com', roleId: '2' },
    { id: '5', name: 'Dr. James Wilson', email: 'james.wilson@hospital.com', roleId: '2' },
    { 
      id: '6', 
      name: 'Dr. Lisa Martinez', 
      email: 'lisa.martinez@hospital.com', 
      roleId: '2',
      customPermissions: {
        billing: true, // Given extra access to billing
      }
    },
  ]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('1');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleUpdatePermissions = (roleId: string, permission: string, value: boolean) => {
    setRoles(roles.map(role =>
      role.id === roleId
        ? { ...role, permissions: { ...role.permissions, [permission]: value } }
        : role
    ));
    toast.success('Role permissions updated successfully');
  };

  const handleUpdateUserPermission = (userId: string, permission: string, value: boolean) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newCustomPermissions = { ...(user.customPermissions || {}) };
        newCustomPermissions[permission as keyof typeof newCustomPermissions] = value;
        return { ...user, customPermissions: newCustomPermissions };
      }
      return user;
    }));
    toast.success('User permissions updated successfully');
  };

  const getUserPermissions = (user: UserPermission) => {
    const role = roles.find(r => r.id === user.roleId);
    if (!role) return {};
    
    return {
      ...role.permissions,
      ...(user.customPermissions || {})
    };
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Unknown';
  };

  const hasCustomPermissions = (user: UserPermission) => {
    return user.customPermissions && Object.keys(user.customPermissions).length > 0;
  };

  const getUsersByRole = (roleId: string) => {
    return users.filter(user => user.roleId === roleId);
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const stats = [
    { label: 'Total Roles', value: roles.length.toString(), color: 'bg-purple-500' },
    { label: 'Active Users', value: '98', color: 'bg-green-500' },
    { label: 'Modules', value: '9', color: 'bg-blue-500' },
    { label: 'Permissions', value: '54', color: 'bg-orange-500' },
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
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roles & Permissions Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-2xl">Roles & Permissions</CardTitle>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Add a new role with specific permissions to manage user access.
                </DialogDescription>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Role Name</Label>
                    <Input placeholder="e.g., Intern, Supervisor" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Describe the role responsibilities" />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => toast.success('Role created successfully')}
                  >
                    Create Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manage default permissions for each role in the system
          </p>
        </CardHeader>
        <CardContent>
          {/* Role Selector */}
          <div className="mb-6">
            <Label htmlFor="role-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              Select Role
            </Label>
            <select
              id="role-select"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.userCount} users)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Role Details */}
          {selectedRole && (
            <div className="space-y-6">
              {/* Role Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{selectedRole.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {selectedRole.userCount} users
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{selectedRole.description}</p>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">Module Permissions</h4>
                  <p className="text-xs text-gray-500">
                    Configure default access for this role
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(selectedRole.permissions).map(([key, value]) => (
                    <div 
                      key={key} 
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        value 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <Label 
                          htmlFor={`role-${selectedRole.id}-${key}`} 
                          className={`text-sm capitalize cursor-pointer ${
                            value ? 'text-green-900 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <span className={`text-[10px] px-2 py-0.5 rounded w-fit ${
                          value 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <Switch
                        id={`role-${selectedRole.id}-${key}`}
                        checked={value}
                        onCheckedChange={(checked) => handleUpdatePermissions(selectedRole.id, key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Users with this role */}
              {getUsersByRole(selectedRole.id).length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Users with {selectedRole.name} Role
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getUsersByRole(selectedRole.id).map(user => (
                      <div 
                        key={user.id} 
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-semibold text-xs text-white">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {hasCustomPermissions(user) && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] flex-shrink-0">
                            Modified
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual User Permissions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-2xl">Individual User Permissions</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Override default role permissions for specific users
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
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Choose a user to manage permissions --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {getRoleName(user.roleId)}
                  {hasCustomPermissions(user) ? ' • Modified' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selected User Permissions */}
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                  <span className="font-semibold text-lg text-white">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{selectedUser.name}</h3>
                    {hasCustomPermissions(selectedUser) && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Settings className="w-3 h-3 mr-1" />
                        Custom Permissions
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getRoleName(selectedUser.roleId)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">Module Permissions</h4>
                  <p className="text-xs text-gray-500">
                    Toggle permissions to override role defaults
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(getUserPermissions(selectedUser)).map(([key, value]) => {
                    const role = roles.find(r => r.id === selectedUser.roleId);
                    const isCustom = selectedUser.customPermissions && key in selectedUser.customPermissions;
                    const roleDefault = role?.permissions[key as keyof typeof role.permissions];
                    const isDifferent = isCustom && value !== roleDefault;

                    return (
                      <div 
                        key={key} 
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isDifferent 
                            ? 'bg-amber-50 border-amber-300 shadow-sm' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <Label 
                            htmlFor={`user-${selectedUser.id}-${key}`} 
                            className={`text-sm capitalize cursor-pointer ${
                              isDifferent ? 'text-amber-900 font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          {isDifferent && (
                            <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded w-fit">
                              Override Active
                            </span>
                          )}
                          {!isDifferent && roleDefault !== undefined && (
                            <span className="text-[10px] text-gray-500">
                              Role Default
                            </span>
                          )}
                        </div>
                        <Switch
                          id={`user-${selectedUser.id}-${key}`}
                          checked={value as boolean}
                          onCheckedChange={(checked) => handleUpdateUserPermission(selectedUser.id, key, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No User Selected</h3>
              <p className="text-sm text-gray-500">
                Select a user from the dropdown above to manage their individual permissions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
