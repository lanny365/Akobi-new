import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  Bell,
  Calculator,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileCheck,
  FileText,
  FlaskConical,
  FolderOpen,
  Headset,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  ScanLine,
  Scissors,
  Search,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  User,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
  Wrench,
  Zap,
  Bed,
} from 'lucide-react';
import { Toaster } from './ui/sonner';
import { Button } from './ui/button';
import { useDischarge } from '../context/DischargeContext';
import { useDoctorAuth } from '../context/DoctorAuthContext';
import { useStaffAuth } from '../context/StaffAuthContext';
import { useTheatreAuth } from '../context/TheatreAuthContext';
import { Dashboard } from './Dashboard';
import { PatientList } from './PatientList';
import { Appointments } from './Appointments';
import { MedicalRecords } from './MedicalRecords';
import { Billing } from './Billing';
import { Administration } from './Administration';
import { UserManagement } from './UserManagement';
import { RolesPermissions } from './RolesPermissions';
import { AuditLogs } from './AuditLogs';
import { HospitalSettings } from './HospitalSettings';
import { Reception } from './Reception';
import { PatientManagement } from './PatientManagement';
import { CustomerCare } from './CustomerCare';
import { DischargePatientReception } from './DischargePatientReception';
import { Utility } from './Utility';
import { Clinical } from './Clinical';
import { Pharmacy } from './Pharmacy';
import { Laboratory } from './Laboratory';
import { Radiology } from './Radiology';
import { Cashier } from './Cashier';
import { Accounts } from './Accounts';
import { Cleaning } from './Cleaning';
import { Maintenance } from './Maintenance';
import { Theatre } from './Theatre';
import { Nursing } from './Nursing';
import { VitalSigns } from './VitalSigns';
import { DoctorPortal } from './DoctorPortal';
import { FamilyCardManagement } from './FamilyCardManagement';
import { StaffRoleLogin } from './StaffRoleLogin';
import {
  roleLabels,
  getRoleDefaultPath,
  isPathAllowedForRole,
  type AppPortalRole,
  type StaffPortalRole,
} from '../utils/roleAccess';
import { navigateTo } from '../utils/navigation';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: any;
  children?: SubNavItem[];
}

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  icon: any;
}

export function Root() {
  const { getPendingDischarges } = useDischarge();
  const { currentDoctor, logout: logoutDoctor, isAuthenticated: isDoctorAuthenticated } = useDoctorAuth();
  const { currentStaff: currentPortalStaff, logout: logoutStaff } = useStaffAuth();
  const { currentStaff: currentTheatreStaff, logout: logoutTheatre, isAuthenticated: isTheatreAuthenticated } = useTheatreAuth();
  const [currentPage, setCurrentPage] = useState(window.location.hash.slice(1) || '/');
  const [openNavMenu, setOpenNavMenu] = useState<string | null>(null);

  const pendingDischargeCount = getPendingDischarges().length;
  const routeBasePath = currentPage.split('?')[0];
  const currentRole: AppPortalRole | null =
    (routeBasePath === '/doctor-login' && isDoctorAuthenticated ? 'doctor' : null) ||
    (routeBasePath === '/theatre' && isTheatreAuthenticated ? currentTheatreStaff?.role || null : null) ||
    currentPortalStaff?.role ||
    (isDoctorAuthenticated ? 'doctor' : null) ||
    (isTheatreAuthenticated ? currentTheatreStaff?.role || null : null);
  const currentUserName =
    currentRole === 'doctor'
      ? currentDoctor?.fullName || 'Guest User'
      : currentRole === 'surgeon' || currentRole === 'anesthetist'
        ? currentTheatreStaff?.fullName || 'Guest User'
        : currentPortalStaff?.fullName || 'Guest User';
  const currentUserRoleLabel = currentRole ? roleLabels[currentRole] : 'Signed Out';
  const currentUserInitials =
    currentUserName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((namePart) => namePart.charAt(0).toUpperCase())
      .join('') || 'GU';

  const handleGlobalLogout = () => {
    logoutStaff();
    logoutDoctor();
    logoutTheatre();
    navigateTo('/');
  };

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-top-nav-menu]')) {
        setOpenNavMenu(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!currentRole) {
      return;
    }

    const basePath = currentPage.split('?')[0];
    if (basePath === '/') {
      navigateTo(getRoleDefaultPath(currentRole));
      return;
    }

    if (!isPathAllowedForRole(currentPage, currentRole)) {
      navigateTo(getRoleDefaultPath(currentRole));
    }
  }, [currentPage, currentRole]);

  useEffect(() => {
    setOpenNavMenu(null);
  }, [currentPage]);

  useEffect(() => {
    const clearStaleModalLocks = () => {
      const activeBlockingSurfaceSelectors = [
        '[data-slot="dialog-content"][data-state="open"]',
        '[data-slot="sheet-content"][data-state="open"]',
        '[data-slot="drawer-content"][data-state="open"]',
        '[role="dialog"][data-state="open"]',
        '[role="alertdialog"][data-state="open"]',
      ];

      const hasOpenBlockingSurface = activeBlockingSurfaceSelectors.some((selector) => document.querySelector(selector));
      if (hasOpenBlockingSurface) {
        return;
      }

      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.documentElement.style.removeProperty('overflow');

      const staleOverlaySelectors = [
        '[data-slot="dialog-overlay"]',
        '[data-slot="sheet-overlay"]',
        '[data-slot="drawer-overlay"]',
      ];

      document.querySelectorAll(staleOverlaySelectors.join(', ')).forEach((overlayNode) => {
        overlayNode.remove();
      });

      const stalePortalSelectors = [
        '[data-slot="dialog-portal"]',
        '[data-slot="sheet-portal"]',
        '[data-slot="drawer-portal"]',
        '[data-slot="dropdown-menu-portal"]',
        '[data-slot="context-menu-portal"]',
        '[data-slot="menubar-portal"]',
        '[data-radix-popper-content-wrapper]',
      ];

      document.querySelectorAll(stalePortalSelectors.join(', ')).forEach((portalNode) => {
        if (!(portalNode instanceof HTMLElement)) {
          return;
        }

        const hasOpenInteractiveChild = portalNode.querySelector(
          '[data-state="open"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
        );

        if (!hasOpenInteractiveChild) {
          portalNode.remove();
        }
      });
    };

    const scheduleCleanup = () => {
      window.requestAnimationFrame(() => {
        clearStaleModalLocks();
      });
    };

    scheduleCleanup();

    const observer = new MutationObserver(() => {
      scheduleCleanup();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'style', 'aria-hidden'],
    });

    window.addEventListener('click', scheduleCleanup, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('click', scheduleCleanup, true);
    };
  }, [currentPage, openNavMenu]);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
    {
      id: 'administration',
      label: 'Administration',
      path: '/administration',
      icon: UserCog,
      children: [
        { id: 'user-management', label: 'User Management', path: '/user-management', icon: Users },
        { id: 'roles-permissions', label: 'Roles & Permissions', path: '/roles-permissions', icon: Shield },
        { id: 'audit-logs', label: 'Audit Logs', path: '/audit-logs', icon: FileCheck },
        { id: 'hospital-settings', label: 'Hospital Settings', path: '/hospital-settings', icon: Settings },
      ],
    },
    {
      id: 'reception',
      label: 'Reception',
      path: '/reception',
      icon: ClipboardList,
      children: [
        { id: 'patient-management', label: 'Patient Management', path: '/patient-management', icon: Users },
        { id: 'card-management', label: 'Card Management', path: '/card-management', icon: CreditCard },
        { id: 'customer-care', label: 'Customer Care', path: '/customer-care', icon: Headset },
        { id: 'discharge-patient', label: 'Discharge Patient', path: '/discharge-patient', icon: UserMinus },
        { id: 'utility', label: 'Utility', path: '/utility', icon: Zap },
      ],
    },
    {
      id: 'clinical',
      label: 'Clinical',
      path: '/clinical',
      icon: Stethoscope,
      children: [
        { id: 'doctor-login', label: 'Doctor Portal', path: '/doctor-login', icon: User },
        { id: 'vital-signs', label: 'Vital Signs & Injection Unit', path: '/vital-signs', icon: Heart },
        { id: 'nursing', label: 'Ward & Nursing', path: '/nursing', icon: Bed },
      ],
    },
    {
      id: 'theatre',
      label: 'Theatre',
      path: '/theatre',
      icon: Scissors,
      children: [
        { id: 'theatre-overview', label: 'Overview', path: '/theatre?tab=overview', icon: Scissors },
        { id: 'theatre-surgeon', label: 'Surgeon', path: '/theatre?tab=surgeon', icon: UserPlus },
        { id: 'theatre-anesthetist', label: 'Anesthetist', path: '/theatre?tab=anesthetist', icon: Stethoscope },
        { id: 'theatre-staff', label: 'Staff Registry', path: '/theatre?tab=staff', icon: UserPlus },
        { id: 'theatre-preop', label: 'Pre-Op Management', path: '/theatre?tab=preop', icon: ClipboardCheck },
        { id: 'theatre-casefile', label: 'Case Files', path: '/theatre?tab=casefile', icon: FolderOpen },
        { id: 'theatre-equipment', label: 'Equipment', path: '/theatre?tab=equipment', icon: Wrench },
      ],
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      path: '/pharmacy',
      icon: Pill,
      children: [
        { id: 'pharmacy-inventory', label: 'Inventory Management', path: '/pharmacy?tab=inventory', icon: Package },
        { id: 'pharmacy-prescription', label: 'Prescription Management', path: '/pharmacy?tab=prescription', icon: FileText },
      ],
    },
    {
      id: 'laboratory',
      label: 'Laboratory',
      path: '/laboratory',
      icon: FlaskConical,
      children: [
        { id: 'lab-technician', label: 'Lab Technician', path: '/laboratory?tab=technician', icon: User },
        { id: 'lab-management', label: 'Lab Management', path: '/laboratory?tab=management', icon: UserCog },
      ],
    },
    { id: 'radiology', label: 'Radiology', path: '/radiology', icon: ScanLine },
    { id: 'cashier', label: 'Cashier', path: '/cashier', icon: CreditCard },
    {
      id: 'account',
      label: 'Account',
      path: '/accounts',
      icon: Landmark,
      children: [
        { id: 'accounts-accounting', label: 'Accounting', path: '/accounts?section=accounting', icon: Landmark },
        { id: 'accounts-asset-management', label: 'Asset Management', path: '/accounts?section=asset-management', icon: Package },
        { id: 'accounts-staff-payroll', label: 'Staff Payroll', path: '/accounts?section=staff-payroll', icon: Calculator },
      ],
    },
    { id: 'cleaning', label: 'Cleaning', path: '/cleaning', icon: Sparkles },
    { id: 'maintenance', label: 'Maintenance', path: '/maintenance', icon: Wrench },
  ];

  const visibleNavItems = !currentRole
    ? navItems
    : navItems
        .map((item) => {
          if (!item.children) {
            return isPathAllowedForRole(item.path, currentRole) ? item : null;
          }

          const visibleChildren = item.children.filter((child) => isPathAllowedForRole(child.path, currentRole));
          if (visibleChildren.length === 0) {
            return null;
          }

          const directPathAllowed = isPathAllowedForRole(item.path, currentRole);
          return {
            ...item,
            path: directPathAllowed ? item.path : visibleChildren[0].path,
            children: visibleChildren,
          };
        })
        .filter(Boolean) as NavItem[];

  const getCurrentTitle = () => {
    const topLevelItem = navItems.find((item) => item.path === currentPage);
    if (topLevelItem) return topLevelItem.label;

    for (const item of navItems) {
      if (item.children) {
        const child = item.children.find((c) => c.path === currentPage);
        if (child) return child.label;
      }
    }

    return 'Dashboard';
  };

  const renderPage = () => {
    const basePath = currentPage.split('?')[0];
    const renderStaffProtectedPage = (role: StaffPortalRole, content: ReactNode) => {
      if (currentPortalStaff?.role === role) {
        return content;
      }

      return <StaffRoleLogin role={role} />;
    };

    switch (basePath) {
      case '/':
        return <Dashboard role={currentRole} />;
      case '/administration':
        return <Administration />;
      case '/user-management':
        return <UserManagement />;
      case '/roles-permissions':
        return <RolesPermissions />;
      case '/audit-logs':
        return <AuditLogs />;
      case '/hospital-settings':
        return <HospitalSettings />;
      case '/reception':
        return renderStaffProtectedPage('reception', <Reception />);
      case '/patient-management':
        return renderStaffProtectedPage('reception', <PatientManagement />);
      case '/card-management':
        return renderStaffProtectedPage('reception', <FamilyCardManagement />);
      case '/customer-care':
        return renderStaffProtectedPage('reception', <CustomerCare />);
      case '/discharge-patient':
        return renderStaffProtectedPage('reception', <DischargePatientReception />);
      case '/utility':
        return renderStaffProtectedPage('reception', <Utility />);
      case '/clinical':
        return <Clinical />;
      case '/doctor-login':
        return <DoctorPortal />;
      case '/nursing':
        return renderStaffProtectedPage('nurse', <Nursing />);
      case '/vital-signs':
        return renderStaffProtectedPage('nurse', <VitalSigns />);
      case '/pharmacy':
        return <Pharmacy />;
      case '/laboratory':
        return <Laboratory />;
      case '/radiology':
        return <Radiology />;
      case '/cashier':
        return renderStaffProtectedPage('cashier', <Cashier />);
      case '/accounts':
        return renderStaffProtectedPage('accountant', <Accounts />);
      case '/cleaning':
        return <Cleaning />;
      case '/maintenance':
        return <Maintenance />;
      case '/theatre':
        return <Theatre />;
      case '/patients':
        return <PatientList />;
      case '/appointments':
        return <Appointments />;
      case '/records':
        return <MedicalRecords />;
      case '/billing':
        return <Billing />;
      default:
        return <Dashboard />;
    }
  };

  const renderNavButton = (item: NavItem) => {
    const isActive = currentPage === item.path;
    const isChildActive = item.children?.some((child) => child.path === currentPage);
    const isAnyActive = isActive || isChildActive;

    if (!item.children) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => navigateTo(item.path)}
          className={`inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition-all ${
            isAnyActive
              ? 'border-white/35 bg-white text-blue-700 shadow-lg shadow-blue-950/20'
              : 'border-white/15 bg-white/10 text-white hover:bg-white/16 hover:border-white/25'
          }`}
        >
          <item.icon className="w-4 h-4" strokeWidth={2.4} />
          <span>{item.label}</span>
        </button>
      );
    }

    return (
      <div key={item.id} className="relative shrink-0" data-top-nav-menu>
        <button
          type="button"
          onClick={() => setOpenNavMenu((current) => (current === item.id ? null : item.id))}
          className={`inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition-all ${
            isAnyActive
              ? 'border-white/35 bg-white text-blue-700 shadow-lg shadow-blue-950/20'
              : 'border-white/15 bg-white/10 text-white hover:bg-white/16 hover:border-white/25'
          }`}
        >
          <item.icon className="w-4 h-4" strokeWidth={2.4} />
          <span>{item.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openNavMenu === item.id ? 'rotate-180' : ''}`} strokeWidth={2.4} />
        </button>

        {openNavMenu === item.id && (
          <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/15">
            <div className="border-b border-blue-100 bg-blue-50/90 px-4 py-2.5">
              <p className="text-sm font-semibold text-blue-900">{item.label}</p>
            </div>
            <div className="p-2">
              {item.children.map((child) => {
                const isChildItemActive = currentPage === child.path;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setOpenNavMenu(null);
                      navigateTo(child.path);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      isChildItemActive
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    <child.icon className="h-4 w-4 shrink-0" strokeWidth={2.3} />
                    <span className="flex-1">{child.label}</span>
                    {child.id === 'discharge-patient' && pendingDischargeCount > 0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {pendingDischargeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100">
      <header className="border-b border-blue-800/35 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 backdrop-blur-xl shadow-xl shadow-blue-900/20">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:gap-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between 2xl:min-w-fit 2xl:gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/25">
                <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-white">AKOBI SPECIALIST HOSPITAL</h1>
                <p className="text-sm font-medium text-blue-100">Integrated Hospital System</p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center xl:min-w-fit">
                <div className="relative min-w-[220px] xl:min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-blue-200" strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full rounded-xl border border-white/20 bg-white/12 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-blue-100 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>

                <button className="relative rounded-xl border border-white/15 bg-blue-700/70 p-2.5 text-white transition-all hover:bg-blue-600/80">
                  <Bell className="w-5 h-5 text-white" strokeWidth={2.5} />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-blue-700" />
                </button>

                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-blue-700/70 px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700">
                    {currentUserInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{currentUserName}</p>
                    <p className="text-xs text-blue-100">{currentUserRoleLabel}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10 hover:text-white">
                    <Settings className="w-4 h-4" strokeWidth={2.4} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-red-500/15 hover:text-white"
                    onClick={handleGlobalLogout}
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2.4} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-w-0 2xl:flex-1">
              <div className="flex flex-wrap items-center gap-2 2xl:flex-nowrap 2xl:overflow-x-auto 2xl:pb-1 2xl:[scrollbar-width:none] 2xl:[-ms-overflow-style:none] 2xl:[&::-webkit-scrollbar]:hidden">
                {visibleNavItems.map(renderNavButton)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-gradient-to-b from-white/10 via-blue-50/40 to-cyan-50/50 p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{getCurrentTitle()}</h2>
            <p className="text-sm font-medium text-slate-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        {renderPage()}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
