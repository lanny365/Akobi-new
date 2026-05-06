import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Shield, Activity, Settings, ArrowRight, FileCheck } from 'lucide-react';

export function Administration() {
  const adminModules = [
    {
      title: 'User Management',
      description: 'Create, edit, and manage user accounts across all departments',
      icon: Users,
      path: '/user-management',
      color: 'bg-blue-500',
      stats: { label: 'Total Users', value: '156' }
    },
    {
      title: 'Roles & Permissions',
      description: 'Define roles and assign module-specific permissions',
      icon: Shield,
      path: '/roles-permissions',
      color: 'bg-purple-500',
      stats: { label: 'Active Roles', value: '6' }
    },
    {
      title: 'Audit Logs',
      description: 'Monitor system activities and track user actions',
      icon: FileCheck,
      path: '/audit-logs',
      color: 'bg-green-500',
      stats: { label: 'Today\'s Activities', value: '245' }
    },
    {
      title: 'Hospital Settings',
      description: 'Configure consultation fees, lab prices, surgery costs, billing, and discount policies',
      icon: Settings,
      path: '/hospital-settings',
      color: 'bg-orange-500',
      stats: { label: 'Settings Modules', value: '6' }
    }
  ];

  const systemStats = [
    { label: 'Total Users', value: '156', color: 'bg-blue-500', icon: Users },
    { label: 'Active Sessions', value: '42', color: 'bg-green-500', icon: Activity },
    { label: 'Roles Defined', value: '6', color: 'bg-purple-500', icon: Shield },
    { label: 'System Uptime', value: '99.8%', color: 'bg-orange-500', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => (
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

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold mb-2">Administration Control Panel</h2>
          <p className="text-blue-100 text-lg">
            Manage users, permissions, system settings, and monitor all hospital activities from one central location.
          </p>
        </CardContent>
      </Card>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module) => (
          <Card key={module.path} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${module.color} p-3 rounded-lg`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{module.description}</p>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">{module.stats.label}</p>
                  <p className="text-xl font-bold text-gray-900">{module.stats.value}</p>
                </div>
              </div>

              <a href={`#${module.path}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Open {module.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>Administration Quick Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">User Management</h4>
              <p className="text-sm text-blue-700">
                Create and manage user accounts, assign roles, and control access to different modules.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-1">Roles & Permissions</h4>
              <p className="text-sm text-purple-700">
                Define custom roles with granular permissions for each hospital module and department.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-1">Audit Logs</h4>
              <p className="text-sm text-green-700">
                Track all system activities, user actions, and changes with comprehensive audit trails.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-1">Hospital Settings</h4>
              <p className="text-sm text-orange-700">
                Configure consultation fees, lab prices, drug rates, ward charges, and discount policies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}