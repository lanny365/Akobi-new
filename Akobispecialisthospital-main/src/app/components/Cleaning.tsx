import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CleaningTask {
  id: string;
  area: string;
  type: 'routine' | 'deep-clean' | 'emergency';
  assignedTo: string;
  scheduledTime: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  completedAt?: string;
}

export function Cleaning() {
  const [tasks] = useState<CleaningTask[]>([
    {
      id: 'CLN-001',
      area: 'Theatre 1',
      type: 'deep-clean',
      assignedTo: 'Cleaning Team A',
      scheduledTime: '2026-04-21 08:00',
      status: 'completed',
      priority: 'high',
      completedAt: '2026-04-21 09:30'
    },
    {
      id: 'CLN-002',
      area: 'Ward A - General',
      type: 'routine',
      assignedTo: 'Cleaning Team B',
      scheduledTime: '2026-04-21 10:00',
      status: 'in-progress',
      priority: 'medium'
    },
    {
      id: 'CLN-003',
      area: 'Emergency Department',
      type: 'emergency',
      assignedTo: 'Cleaning Team C',
      scheduledTime: '2026-04-21 11:30',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'CLN-004',
      area: 'Pharmacy',
      type: 'routine',
      assignedTo: 'Cleaning Team A',
      scheduledTime: '2026-04-21 14:00',
      status: 'pending',
      priority: 'low'
    },
    {
      id: 'CLN-005',
      area: 'Laboratory',
      type: 'routine',
      assignedTo: 'Cleaning Team B',
      scheduledTime: '2026-04-21 09:00',
      status: 'overdue',
      priority: 'medium'
    },
  ]);

  const stats = [
    { label: 'Scheduled Today', value: '24', icon: Calendar, color: 'bg-blue-500' },
    { label: 'In Progress', value: '3', icon: Clock, color: 'bg-orange-500' },
    { label: 'Completed', value: '18', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Overdue', value: '2', icon: AlertCircle, color: 'bg-red-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all-teams">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-teams">All Teams</SelectItem>
                <SelectItem value="team-a">Cleaning Team A</SelectItem>
                <SelectItem value="team-b">Cleaning Team B</SelectItem>
                <SelectItem value="team-c">Cleaning Team C</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all-types">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="deep-clean">Deep Clean</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cleaning Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaning Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 ${getStatusColor(task.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{task.area}</h4>
                      {getPriorityBadge(task.priority)}
                      <Badge variant="outline" className="text-xs">
                        {task.type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Assigned To</p>
                        <p className="font-medium">{task.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Scheduled Time</p>
                        <p className="font-medium">{task.scheduledTime}</p>
                      </div>
                      {task.completedAt && (
                        <div>
                          <p className="text-gray-600">Completed At</p>
                          <p className="font-medium">{task.completedAt}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-2">
                    <Badge variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'in-progress' ? 'secondary' :
                      task.status === 'overdue' ? 'destructive' :
                      'outline'
                    }>
                      {task.status}
                    </Badge>
                    
                    {task.status === 'pending' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in-progress' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Done</span>
                      </div>
                    )}
                    {task.status === 'overdue' && (
                      <Button size="sm" variant="destructive">
                        Urgent
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hygiene Reporting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Cleaning Team A', 'Cleaning Team B', 'Cleaning Team C'].map((team, idx) => {
                const completed = [8, 6, 4][idx];
                const total = [10, 8, 6][idx];
                const percentage = Math.round((completed / total) * 100);
                
                return (
                  <div key={team}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{team}</span>
                      <span className="text-sm text-gray-600">{completed}/{total} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Area Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { area: 'Theatres', status: 'cleaned', lastCleaned: '2h ago' },
                { area: 'Wards', status: 'in-progress', lastCleaned: 'Now' },
                { area: 'Emergency', status: 'pending', lastCleaned: '5h ago' },
                { area: 'Laboratory', status: 'overdue', lastCleaned: '8h ago' },
                { area: 'Pharmacy', status: 'cleaned', lastCleaned: '3h ago' },
              ].map((area, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{area.area}</p>
                      <p className="text-xs text-gray-500">Last cleaned: {area.lastCleaned}</p>
                    </div>
                  </div>
                  <Badge variant={
                    area.status === 'cleaned' ? 'default' :
                    area.status === 'in-progress' ? 'secondary' :
                    area.status === 'overdue' ? 'destructive' :
                    'outline'
                  }>
                    {area.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
