# AKOBI Integrated Smart Hospital Management System (AISHMS)

A comprehensive hospital management software system built with React, TypeScript, and Tailwind CSS that handles complete hospital operations including patient management, appointment scheduling, medical records tracking, billing systems, and more.

![AISHMS Banner](https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=400&fit=crop)

## 🌟 Features

### 📋 Core Modules (11 Departments)

#### **Reception Module**
- **Patient Management**: Complete patient registration with QR code generation and face recognition
- **Customer Care**: Patient inquiries and support
- **Utility Tools**:
  - Payment verification from cashier records
  - Discharge patient workflow
  - Emergency alert system to doctors
  - Reception reports

#### **Clinical Module**
- **Ward & Nursing Management**:
  - Real-time bed occupancy tracking
  - Patient admission with ward assignment
  - Ward transfer functionality
  - Patient discharge processing
  - Nurse assignment and shift management
  - Vital signs monitoring

#### **Emergency Alert System** 🚨
- Real-time emergency patient registration
- Instant full-screen alerts to all connected doctors
- Doctor selection with specialty filtering
- Severity level tracking (Critical, Severe, Moderate)
- Vital signs capture
- Blinking visual and audio alerts

#### **Finance Module**
- **Cashier**: Payment processing with multiple methods (Cash, Card, Transfer)
- **Accounts**: Financial reporting and reconciliation

#### **Administration Module**
- User management with role-based access
- Role & permissions configuration
- Audit logs and activity monitoring
- Hospital settings (fees, pricing, discounts)

### 🎨 Design Features
- Modern blue gradient design with glass morphism effects
- Professional color schemes and typography
- Responsive layouts for desktop and mobile
- Premium shadows and hover effects
- Toast notifications for user feedback
- Consistent dropdown selector patterns

### 🔧 Technical Features
- **React Router**: Multi-page navigation with data mode routing
- **Context API**: Global state management (Emergency, Cashier)
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling
- **Lucide Icons**: Modern icon library
- **Sonner**: Toast notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/aishms.git

# Navigate to project directory
cd aishms

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev

# Open in browser
# Navigate to http://localhost:5173
```

## 📁 Project Structure

```
aishms/
├── src/
│   ├── app/
│   │   ├── components/          # All module components
│   │   │   ├── PatientManagement.tsx
│   │   │   ├── Utility.tsx
│   │   │   ├── EmergencyAlertUtility.tsx
│   │   │   ├── Nursing.tsx
│   │   │   ├── Cashier.tsx
│   │   │   ├── DoctorDashboardDemo.tsx
│   │   │   ├── EmergencyAlert.tsx
│   │   │   ├── Administration.tsx
│   │   │   └── ... (other modules)
│   │   ├── context/             # Global state management
│   │   │   ├── EmergencyContext.tsx
│   │   │   └── CashierContext.tsx
│   │   ├── ui/                  # Reusable UI components
│   │   ├── App.tsx              # Main app component
│   │   └── routes.tsx           # React Router configuration
│   ├── styles/
│   │   ├── theme.css            # Design tokens
│   │   └── fonts.css            # Font imports
│   └── main.tsx                 # Application entry point
├── package.json
└── README.md
```

## 🔐 User Workflow Examples

### Patient Registration to Emergency Alert
```
Reception → Patient Management
↓
Register new patient (with QR code & face recognition)
↓
Automatic routing to Vital Signs queue
↓
If emergency detected → Reception → Utility → Emergency Alert
↓
Select emergency type, severity, and affected doctors
↓
Send Alert → All selected doctors receive full-screen override alert
↓
Doctor accepts → Begin emergency treatment
```

### Payment Verification to Discharge
```
Patient completes visit → Services rendered
↓
Cashier → Process payment (Cash/Card/Transfer)
↓
Payment recorded in Cashier Context
↓
Reception → Utility → Verify Payment
↓
Select patient from dropdown (cashier records)
↓
Load payment data → Verify all payments complete
↓
Discharge Patient button appears → Discharge successful
```

### Ward Admission Flow
```
Clinical → Ward & Nursing Management
↓
View real-time bed availability by ward
↓
Admit Patient → Select ward & bed
↓
Assign nurse → Enter admission details
↓
Patient admitted → Bed marked as occupied
↓
Transfer/Discharge options available
```

## 🎯 Key Integrations

### Emergency Alert System
- **Global Context**: `EmergencyContext` manages alerts across the app
- **Reception → Doctors**: Real-time communication
- **Full-Screen Override**: Cannot be missed or ignored
- **Doctor Dashboard**: Receives and displays emergency alerts

### Cashier → Reception Integration
- **Shared Context**: `CashierContext` stores all payment records
- **Dropdown Selection**: Reception utility pulls paid patients from cashier
- **Payment Verification**: Validates complete payment before discharge
- **Audit Trail**: Shows cashier name, time, and payment methods

## 🛠️ Technologies Used

- **React 18**: UI framework
- **TypeScript**: Type safety
- **React Router**: Navigation and routing
- **Tailwind CSS v4**: Styling
- **Lucide React**: Icons
- **Sonner**: Toast notifications
- **Vite**: Build tool and dev server

## 📦 Key Dependencies

```json
{
  "react": "^18.x",
  "react-router": "^7.x",
  "lucide-react": "latest",
  "sonner": "latest",
  "tailwindcss": "^4.x"
}
```

## 🎨 Design System

The system uses a consistent design language:
- **Primary Colors**: Blue gradients (#3B82F6, #1E40AF)
- **Accent Colors**: Purple, Green, Orange, Red
- **Typography**: Professional hierarchy with proper font weights
- **Shadows**: Layered shadows for depth
- **Border Radius**: Consistent rounding (8px, 12px)

## 🚧 Module Status

| Module | Status | Description |
|--------|--------|-------------|
| Reception | ✅ Complete | Patient Management, Customer Care, Utility |
| Clinical | ✅ Complete | Ward & Nursing Management |
| Emergency Alert | ✅ Complete | Real-time doctor alerts |
| Cashier | ✅ Complete | Payment processing |
| Administration | ✅ Complete | User management, roles, audit logs |
| Doctor Dashboard | ✅ Complete | Emergency alert reception |
| Pharmacy | 🚧 Basic | Needs expansion |
| Laboratory | 🚧 Basic | Needs expansion |
| Accounts | 🚧 Basic | Needs expansion |
| Radiology | 📝 Planned | Coming soon |
| Theatre | 📝 Planned | Coming soon |

## 🤝 Contributing

This is a proprietary hospital management system. For collaboration inquiries, please contact the project owner.

## 📄 License

© 2026 AKOBI SPECIALIST HOSPITAL. All rights reserved.

## 👨‍💻 Developer Notes

### Adding New Modules
1. Create component in `/src/app/components/`
2. Add route in `/src/app/routes.tsx`
3. Update navigation in `/src/app/components/Root.tsx`
4. Follow existing patterns for consistency

### Global State Management
- Use React Context API for cross-module data sharing
- Place contexts in `/src/app/context/`
- Wrap providers in `App.tsx`

### Styling Guidelines
- Use Tailwind utility classes
- Follow the existing color scheme
- Maintain consistent spacing and padding
- Use gradient backgrounds for section headers

## 📞 Contact & Support

For questions, issues, or feature requests, please contact the development team.

---

**Built with ❤️ for modern healthcare management**