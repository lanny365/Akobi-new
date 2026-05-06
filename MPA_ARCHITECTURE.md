# AKOBI Hospital Management System - MPA Architecture

## Overview
This application has been converted from a Single Page Application (SPA) to a Multi-Page Application (MPA) architecture using hash-based routing while maintaining all existing functionality.

## Architecture Changes

### Before (SPA with React Router)
- Used `react-router` for client-side routing
- Navigation via `<Link>` components and `useNavigate` hooks
- Routes defined in `routes.tsx`
- URL pattern: `/dashboard`, `/patient-management`, etc.

### After (Hash-based MPA)
- **No external routing library** - pure React with hash navigation
- Navigation via standard `<a href="#/path">` links
- Routes handled by conditional rendering in `Root.tsx`
- URL pattern: `#/`, `#/dashboard`, `#/patient-management`, etc.

## Key Benefits

1. **True Multi-Page Feel**: Each page is accessible via unique hash URL
2. **Browser Navigation**: Back/forward buttons work natively
3. **Bookmarkable URLs**: Users can bookmark specific pages
4. **No External Dependencies**: Removed `react-router` dependency
5. **Simpler Architecture**: Direct conditional rendering instead of router configuration
6. **Maintained Functionality**: All features work exactly as before

## Navigation Methods

### Declarative Navigation (Links)
```tsx
<a href="#/patient-management">Go to Patient Management</a>
```

### Programmatic Navigation
```tsx
import { navigateTo } from '../utils/navigation';

// Navigate to a page
navigateTo('/dashboard');
```

### Available Utility Functions
- `navigateTo(path)` - Navigate to a specific page
- `getCurrentPage()` - Get current page path
- `goBack()` - Navigate backward in history
- `goForward()` - Navigate forward in history

## Application Structure

```
src/app/
├── App.tsx                 # Main app with context providers
├── components/
│   ├── Root.tsx           # Layout with sidebar + page renderer
│   ├── Dashboard.tsx      # Individual page components
│   ├── PatientManagement.tsx
│   └── ...
└── utils/
    └── navigation.ts      # Navigation helper utilities
```

## Page Rendering Flow

1. User clicks navigation link → Hash changes
2. `hashchange` event fires → State updates
3. `renderPage()` function evaluates current hash
4. Corresponding component renders in `<main>` area

## Pages Available

### Core Modules
- `/` - Dashboard
- `/administration` - Administration Overview
- `/user-management` - User Management
- `/roles-permissions` - Roles & Permissions
- `/audit-logs` - Audit Logs
- `/hospital-settings` - Hospital Settings

### Reception
- `/reception` - Reception Overview
- `/patient-management` - Patient Management
- `/customer-care` - Customer Care
- `/utility` - Utility (Emergency Alerts, etc.)

### Clinical Services
- `/clinical` - Clinical Overview
- `/vital-signs` - Vital Signs & Injection
- `/nursing` - Ward & Nursing Management
- `/theatre` - Theatre/Surgery
- `/pharmacy` - Pharmacy
- `/laboratory` - Laboratory

### Financial
- `/cashier` - Cashier Module
- `/accounts` - Accounts

### Support Services
- `/cleaning` - Cleaning
- `/maintenance` - Maintenance

### Legacy Routes (if needed)
- `/patients` - Patient List
- `/appointments` - Appointments
- `/records` - Medical Records
- `/billing` - Billing

## Implementation Details

### Root Component (`Root.tsx`)
```tsx
// State for current page
const [currentPage, setCurrentPage] = useState(window.location.hash.slice(1) || '/');

// Hash change listener
useEffect(() => {
  const handleHashChange = () => {
    setCurrentPage(window.location.hash.slice(1) || '/');
  };
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);

// Conditional rendering
const renderPage = () => {
  switch (currentPage) {
    case '/':
      return <Dashboard />;
    case '/patient-management':
      return <PatientManagement />;
    // ... other cases
    default:
      return <Dashboard />;
  }
};
```

## Migration Notes

### What Changed
1. ✅ Removed `react-router` dependency
2. ✅ Deleted `routes.tsx` file
3. ✅ Replaced `<Link>` with `<a href="#">`
4. ✅ Replaced `useLocation()` with hash-based state
5. ✅ Updated all navigation references

### What Stayed the Same
1. ✅ All component functionality
2. ✅ Emergency alert system
3. ✅ Cashier context integration
4. ✅ Patient routing queue system
5. ✅ Toast notifications
6. ✅ Form submissions
7. ✅ Data management
8. ✅ UI/UX design

## Testing Checklist

- [x] Navigation between all pages works
- [x] Browser back/forward buttons work
- [x] Page bookmarking works
- [x] Sidebar navigation highlights active page
- [x] Dropdown menus (Administration, Reception, Clinical) function correctly
- [x] Emergency alert system functions
- [x] Patient registration and routing queue system works
- [x] All modals and forms submit correctly
- [x] Toast notifications appear
- [x] Context providers (Emergency, Cashier) work across pages

## Performance Considerations

- All pages load instantly (no route splitting)
- No router overhead
- Direct component rendering
- Maintained React component lifecycle

## Future Enhancements

If needed, you can:
1. Add route-based code splitting with `React.lazy()`
2. Implement route guards/authentication checks
3. Add query parameter support via `URLSearchParams`
4. Create nested routing for complex modules
5. Add route transition animations

## Deployment Notes

- Works with any static file server
- No special server-side routing configuration needed
- All navigation is client-side via hash changes
- Compatible with GitHub Pages, Netlify, Vercel, etc.
