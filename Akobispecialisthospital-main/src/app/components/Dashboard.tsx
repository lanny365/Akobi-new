import {
  Activity,
  AlertCircle,
  Banknote,
  Calendar,
  ClipboardList,
  CreditCard,
  Heart,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { AppPortalRole } from '../utils/roleAccess';

interface DashboardProps {
  role?: AppPortalRole | null;
}

const formatCurrency = (amount: number) => `\u20A6${amount.toLocaleString()}`;

const roleDashboardConfig: Record<
  Exclude<AppPortalRole, 'surgeon' | 'anesthetist'>,
  {
    title: string;
    subtitle: string;
    stats: Array<{ label: string; value: string; change: string; icon: any; color: string }>;
    focusItems: string[];
    alerts: string[];
  }
> = {
  reception: {
    title: 'Reception Dashboard',
    subtitle: 'Patient registration, routing, and front desk activity.',
    stats: [
      { label: 'Patients Registered Today', value: '38', change: '+6', icon: Users, color: 'bg-blue-500' },
      { label: 'Appointments Booked', value: '21', change: '+4', icon: Calendar, color: 'bg-green-500' },
      { label: 'Pending Discharges', value: '6', change: '+2', icon: ClipboardList, color: 'bg-orange-500' },
      { label: 'Front Desk Cases', value: '14', change: '+3', icon: Activity, color: 'bg-indigo-500' },
    ],
    focusItems: ['Register new patients and issue cards', 'Route arrivals to Vital Signs and Doctor', 'Confirm discharge queue handoff from Nursing'],
    alerts: ['Two discharge files are awaiting reception utility verification', 'Customer care follow-up list has 5 unresolved requests'],
  },
  cashier: {
    title: 'Cashier Dashboard',
    subtitle: 'Billing, collections, and till operations only.',
    stats: [
      { label: 'Pending Bills', value: '4', change: '-2', icon: CreditCard, color: 'bg-blue-500' },
      { label: 'Cash Collected Today', value: formatCurrency(125000), change: '+18%', icon: Banknote, color: 'bg-green-500' },
      { label: 'Till Balance', value: formatCurrency(86000), change: '+3 receipts', icon: Wallet, color: 'bg-amber-500' },
      { label: 'Doctor Routed Bills', value: '7', change: '+2', icon: Activity, color: 'bg-purple-500' },
    ],
    focusItems: ['Clear only patient bills waiting in cashier queue', 'Post cash receipts into till and GL', 'Verify doctor-routed billing before discharge payment confirmation'],
    alerts: ['One patient bill is still awaiting cashier clearance before final discharge', 'Two cash receipts need end-of-shift reconciliation'],
  },
  nurse: {
    title: 'Nursing Dashboard',
    subtitle: 'Ward activity, vital signs, admissions, and bedside flow.',
    stats: [
      { label: 'Ward Patients', value: '26', change: '+1', icon: Heart, color: 'bg-rose-500' },
      { label: 'Vital Signs Queue', value: '9', change: '+3', icon: Activity, color: 'bg-blue-500' },
      { label: 'Doctor Admissions Pending', value: '4', change: '+1', icon: ClipboardList, color: 'bg-amber-500' },
      { label: 'Discharge Summaries', value: '5', change: '+2', icon: ShieldCheck, color: 'bg-green-500' },
    ],
    focusItems: ['Assign ward and bed for doctor-started admissions', 'Take vitals for routed patients promptly', 'Complete nursing discharge summary before reception verification'],
    alerts: ['Three patients are waiting for ward assignment', 'Injection room stock review is due this morning'],
  },
  accountant: {
    title: 'Accounts Dashboard',
    subtitle: 'Finance oversight, general ledger, payroll, and assets.',
    stats: [
      { label: 'Monthly Revenue', value: formatCurrency(2450000), change: '+12.5%', icon: TrendingUp, color: 'bg-blue-500' },
      { label: 'General Ledger Accounts', value: '2', change: '+1 journal', icon: ClipboardList, color: 'bg-green-500' },
      { label: 'Payroll Run', value: formatCurrency(10965000), change: 'Current month', icon: Wallet, color: 'bg-purple-500' },
      { label: 'Asset Register Value', value: formatCurrency(11130000), change: 'Tracked', icon: Activity, color: 'bg-amber-500' },
    ],
    focusItems: ['Review cash GL postings from cashier operations', 'Monitor payroll readiness and net pay totals', 'Track asset register performance and finance summaries'],
    alerts: ['Month-end payroll review is still pending approval', 'Cashier GL and wallet GL should be reconciled before close of business'],
  },
  doctor: {
    title: 'Doctor Dashboard',
    subtitle: 'Clinical consultation and doctor-owned queues only.',
    stats: [
      { label: 'Patients Waiting', value: '12', change: '+3', icon: Users, color: 'bg-blue-500' },
      { label: 'Consultations Today', value: '18', change: '+5', icon: Activity, color: 'bg-green-500' },
      { label: 'Bills Routed', value: '7', change: '+2', icon: CreditCard, color: 'bg-purple-500' },
      { label: 'Discharges Started', value: '3', change: '+1', icon: ClipboardList, color: 'bg-orange-500' },
    ],
    focusItems: ['Consult assigned patients and update records', 'Route billing to cashier when services are confirmed', 'Start discharge only when treatment phase is complete'],
    alerts: ['Two patients are awaiting doctor review after vital signs', 'One discharge request is waiting for nursing continuation'],
  },
};

export function Dashboard({ role }: DashboardProps) {
  if (role && role in roleDashboardConfig) {
    const config = roleDashboardConfig[role as Exclude<AppPortalRole, 'surgeon' | 'anesthetist'>];

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 shadow-[0_18px_50px_-36px_rgba(37,99,235,0.45)]">
          <h3 className="text-2xl font-bold text-slate-900">{config.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{config.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {config.stats.map((stat) => (
            <Card key={stat.label} className="border-white/70 bg-white/92">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`${stat.color} rounded-xl p-3 shadow-sm`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-white/70 bg-white/92">
            <CardHeader className="border-b">
              <CardTitle>Priority Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {config.focusItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-yellow-200/80 bg-yellow-50/95">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-600" />
                <div>
                  <h4 className="mb-2 font-semibold text-yellow-900">Role Alerts</h4>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    {config.alerts.map((alert) => (
                      <li key={alert}>• {alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Patients', value: '2,847', change: '+12%', icon: Users, color: 'bg-blue-500' },
    { label: "Today's Appointments", value: '47', change: '+8%', icon: Calendar, color: 'bg-green-500' },
    { label: 'Revenue (Monthly)', value: formatCurrency(284560), change: '+23%', icon: Banknote, color: 'bg-purple-500' },
    { label: 'Active Staff', value: '156', change: '+5%', icon: Activity, color: 'bg-orange-500' },
  ];

  const recentPatients = [
    { id: 'P-2847', name: 'John Anderson', age: 45, status: 'Critical', time: '10 mins ago' },
    { id: 'P-2846', name: 'Maria Garcia', age: 32, status: 'Stable', time: '25 mins ago' },
    { id: 'P-2845', name: 'Robert Chen', age: 58, status: 'Recovery', time: '1 hour ago' },
    { id: 'P-2844', name: 'Emily Brown', age: 28, status: 'Stable', time: '2 hours ago' },
  ];

  const upcomingAppointments = [
    { time: '09:00 AM', patient: 'Sarah Williams', doctor: 'Dr. Smith', department: 'Cardiology' },
    { time: '10:30 AM', patient: 'James Taylor', doctor: 'Dr. Johnson', department: 'Neurology' },
    { time: '11:15 AM', patient: 'Lisa Anderson', doctor: 'Dr. Davis', department: 'Pediatrics' },
    { time: '02:00 PM', patient: 'Michael Brown', doctor: 'Dr. Wilson', department: 'Orthopedics' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/70 bg-white/92">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className={`${stat.color} rounded-xl p-3 shadow-sm`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/70 bg-white/92">
          <CardHeader className="border-b">
            <CardTitle>Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <span className="font-semibold text-blue-700">
                        {patient.name.split(' ').map((name) => name[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{patient.name}</p>
                      <p className="text-sm text-slate-500">ID: {patient.id} • Age: {patient.age}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        patient.status === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : patient.status === 'Stable'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {patient.status}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">{patient.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/92">
          <CardHeader className="border-b">
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={`${appointment.time}-${appointment.patient}`} className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/90 p-4">
                  <div className="flex-shrink-0 text-center">
                    <p className="font-bold text-blue-900">{appointment.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{appointment.patient}</p>
                    <p className="text-sm text-slate-600">{appointment.doctor} • {appointment.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-yellow-200/80 bg-yellow-50/95">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-600" />
            <div>
              <h4 className="mb-2 font-semibold text-yellow-900">System Alerts</h4>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• ICU Bed #12 requires immediate maintenance</li>
                <li>• Medical supplies inventory low: Surgical gloves (Stock: 45 boxes)</li>
                <li>• Staff meeting scheduled for 3:00 PM in Conference Room A</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
