import { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CreditCard,
  Heart,
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStaffAuth } from '../context/StaffAuthContext';
import type { StaffPortalRole } from '../utils/roleAccess';
import { getRoleDefaultPath, roleLabels } from '../utils/roleAccess';
import { navigateTo } from '../utils/navigation';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface StaffRoleLoginProps {
  role: StaffPortalRole;
}

interface StaffRoleConfig {
  icon: typeof Briefcase;
  accent: string;
  surface: string;
  border: string;
  badge: string;
  button: string;
  demoEmail: string;
  demoPassword: string;
  subtitle: string;
  eyebrow: string;
  highlights: string[];
}

const roleStyles: Record<StaffPortalRole, StaffRoleConfig> = {
  reception: {
    icon: Briefcase,
    accent: 'from-sky-600 via-blue-600 to-indigo-700',
    surface: 'from-sky-50 via-white to-indigo-50',
    border: 'border-sky-100',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    button: 'from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800',
    demoEmail: 'reception@akobi.com',
    demoPassword: 'reception123',
    subtitle: 'Sign in to manage patient registration, routing, and front desk operations.',
    eyebrow: 'Front Desk Portal',
    highlights: ['Patient registration and card search', 'Queue routing and appointment handling', 'Discharge coordination and utility checks'],
  },
  cashier: {
    icon: CreditCard,
    accent: 'from-blue-700 via-blue-600 to-cyan-700',
    surface: 'from-blue-50 via-white to-cyan-50',
    border: 'border-blue-100',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    button: 'from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800',
    demoEmail: 'cashier@akobi.com',
    demoPassword: 'cashier123',
    subtitle: 'Sign in to post payments, manage patient billing, and monitor teller balance.',
    eyebrow: 'Cash Office Portal',
    highlights: ['Patient billing and cashier clearance', 'MedLedger debit and payment tracking', 'Cash till balance and teller receipts'],
  },
  nurse: {
    icon: Heart,
    accent: 'from-rose-600 via-pink-600 to-fuchsia-700',
    surface: 'from-rose-50 via-white to-pink-50',
    border: 'border-rose-100',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    button: 'from-rose-600 to-fuchsia-700 hover:from-rose-700 hover:to-fuchsia-800',
    demoEmail: 'nurse@akobi.com',
    demoPassword: 'nurse123',
    subtitle: 'Sign in to manage admissions, vital signs, and ward activities.',
    eyebrow: 'Nursing Portal',
    highlights: ['Vital signs and injection workflows', 'Ward admission and bed assignment', 'Discharge summary preparation'],
  },
  accountant: {
    icon: UserRound,
    accent: 'from-amber-600 via-orange-600 to-red-700',
    surface: 'from-amber-50 via-white to-orange-50',
    border: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    button: 'from-amber-600 to-red-700 hover:from-amber-700 hover:to-red-800',
    demoEmail: 'accountant@akobi.com',
    demoPassword: 'accounts123',
    subtitle: 'Sign in to review account summaries, collections, and finance oversight.',
    eyebrow: 'Accounts Portal',
    highlights: ['Revenue and summary monitoring', 'Financial oversight and review', 'Cross-check of payment performance'],
  },
};

export function StaffRoleLogin({ role }: StaffRoleLoginProps) {
  const { login } = useStaffAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const config = roleStyles[role];
  const Icon = config.icon;

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      const success = login(email, password, role);

      if (success) {
        toast.success(`${roleLabels[role]} login successful`);
        navigateTo(getRoleDefaultPath(role));
      } else {
        toast.error(`Invalid ${roleLabels[role].toLowerCase()} login credentials`);
      }

      setIsLoading(false);
    }, 500);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.surface} p-4 md:p-8`}>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-stretch overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-2xl shadow-slate-200/70 backdrop-blur xl:min-h-[720px]">
        <section className={`hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br ${config.accent} p-10 text-white`}>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <ShieldCheck className="h-4 w-4" />
              Secure Hospital Access
            </div>

            <div className="space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/15 shadow-lg shadow-black/10">
                <Icon className="h-10 w-10" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">{config.eyebrow}</p>
                <h1 className="mt-3 text-4xl font-bold leading-tight">AKOBI SPECIALIST HOSPITAL</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/85">{config.subtitle}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[24px] border border-white/15 bg-black/10 p-6">
              {config.highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-white" />
                  <p className="text-sm text-white/90">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/15 bg-white/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Operational Note</p>
            <p className="mt-3 text-sm leading-6 text-white/90">
              Sign in with your assigned portal account to keep billing, ledger activity, and role access aligned with your workstation.
            </p>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center p-6 md:p-10">
          <Card className={`w-full max-w-xl border ${config.border} bg-white shadow-none`}>
            <CardContent className="p-6 md:p-10">
              <div className="mb-8 space-y-5">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${config.badge}`}>
                  <Icon className="h-4 w-4" />
                  {config.eyebrow}
                </div>

                <div className="space-y-3">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${config.accent} shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{roleLabels[role]} Sign In</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{config.subtitle}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor={`${role}-email`} className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id={`${role}-email`}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={config.demoEmail}
                      className="h-12 rounded-xl border-slate-200 pl-11 text-sm shadow-sm focus-visible:ring-2"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${role}-password`} className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id={`${role}-password`}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="h-12 rounded-xl border-slate-200 pl-11 text-sm shadow-sm focus-visible:ring-2"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`h-12 w-full rounded-xl bg-gradient-to-r ${config.button} text-sm font-semibold text-white shadow-lg`}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? 'Signing in...' : `Enter ${roleLabels[role]} Portal`}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Demo Credentials</p>
                    <p className="text-xs text-slate-500">Use these account details for this portal.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>Email: {config.demoEmail}</p>
                  <p>Password: {config.demoPassword}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
