import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Activity, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function AuditLogs() {
  const [auditLogs] = useState([
    { id: '1', user: 'Dr. Sarah Johnson', action: 'Created patient record', module: 'Clinical', timestamp: '2026-04-21 09:45', status: 'success', ip: '192.168.1.45' },
    { id: '2', user: 'Lisa Anderson', action: 'Processed payment #12345', module: 'Cashier', timestamp: '2026-04-21 09:30', status: 'success', ip: '192.168.1.67' },
    { id: '3', user: 'Emma Davis', action: 'Dispensed medication', module: 'Pharmacy', timestamp: '2026-04-21 09:15', status: 'success', ip: '192.168.1.89' },
    { id: '4', user: 'John Miller', action: 'Failed login attempt', module: 'System', timestamp: '2026-04-21 09:00', status: 'warning', ip: '192.168.1.23' },
    { id: '5', user: 'Michael Chen', action: 'Updated lab results', module: 'Laboratory', timestamp: '2026-04-21 08:45', status: 'success', ip: '192.168.1.56' },
    { id: '6', user: 'Administrator', action: 'Modified system settings', module: 'Administration', timestamp: '2026-04-21 08:30', status: 'success', ip: '192.168.1.10' },
    { id: '7', user: 'Dr. Sarah Johnson', action: 'Prescribed medication', module: 'Clinical', timestamp: '2026-04-21 08:15', status: 'success', ip: '192.168.1.45' },
    { id: '8', user: 'Robert Taylor', action: 'Generated financial report', module: 'Accounts', timestamp: '2026-04-21 08:00', status: 'success', ip: '192.168.1.78' },
    { id: '9', user: 'Emma Davis', action: 'Updated inventory', module: 'Pharmacy', timestamp: '2026-04-21 07:45', status: 'success', ip: '192.168.1.89' },
    { id: '10', user: 'John Miller', action: 'Registered new patient', module: 'Reception', timestamp: '2026-04-21 07:30', status: 'success', ip: '192.168.1.23' },
  ]);

  const stats = [
    { label: 'Total Activities', value: auditLogs.length.toString(), color: 'bg-blue-500' },
    { label: 'Successful', value: auditLogs.filter(l => l.status === 'success').length.toString(), color: 'bg-green-500' },
    { label: 'Warnings', value: auditLogs.filter(l => l.status === 'warning').length.toString(), color: 'bg-orange-500' },
    { label: 'Active Users', value: '42', color: 'bg-purple-500' },
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
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">System Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search activity logs..."
              className="max-w-md"
              type="search"
            />
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Timestamp</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Module</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP Address</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{log.user}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.action}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{log.module}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.ip}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-orange-500" />
                          )}
                          <span className="text-sm capitalize">{log.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
