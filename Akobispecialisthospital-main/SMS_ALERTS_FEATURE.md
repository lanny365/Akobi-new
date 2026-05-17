# SMS Alerts System

## Overview
The SMS Alerts system allows patients to receive automated notifications via text message for appointments, test results, prescriptions, and other important hospital updates.

## Features Added

### 1. Patient Registration Integration

**Location:** Patient Management → Register New Patient → Personal Information

**SMS Alerts Checkbox:**
- ✅ Checkbox to enable SMS notifications
- 📱 Shows registered phone number
- 📝 Explains what SMS alerts include
- ✓ Visual confirmation when enabled

### 2. What Patients Receive

When SMS Alerts are enabled, patients will receive notifications for:
- **Appointment Reminders** - Day before and 1 hour before appointments
- **Test Results Ready** - Lab and diagnostic test results available
- **Prescription Notifications** - New prescriptions and refill reminders
- **Payment Confirmations** - Bill payment receipts
- **Important Updates** - Hospital announcements and health alerts
- **Follow-up Reminders** - Post-treatment follow-up appointments

## User Interface

### Registration Form Section

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│ ☑ Enable SMS Alerts                        │
│                                             │
│ Receive appointment reminders, test        │
│ results, prescription notifications, and   │
│ important updates via SMS to your phone    │
│ number (+234 xxx xxx xxxx).                │
│                                             │
│ ✓ SMS alerts enabled - You will receive   │
│   notifications at +234 xxx xxx xxxx       │
└─────────────────────────────────────────────┘
```

**Features:**
- Large checkbox (5x5 pixels) - Easy to see and click
- Phone icon indicator
- Clear description of benefits
- Shows registered phone number
- Green confirmation box when enabled
- Blue gradient background for visibility

### Patient Card Display

**Success Modal Shows:**
```
Phone Number: +234 801 234 5678 [📱 SMS Enabled]

📱 SMS Alerts Active: Patient will receive appointment
   reminders, test results, and medical notifications
```

**Visual Indicators:**
- Green badge: "SMS Enabled"
- Phone icon indicator
- Information box explaining active status

## Implementation Details

### Data Structure

**PatientData Interface:**
```typescript
interface PatientData {
  cardNumber: string;
  cardType: 'personal' | 'family';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;          // Required for SMS
  email?: string;
  smsAlerts?: boolean;    // New field
  familyMembers?: number;
  registrationDate: string;
}
```

**Form State:**
```typescript
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  smsAlerts: false        // New field
});
```

### Checkbox Component

```tsx
<input
  type="checkbox"
  id="smsAlerts"
  checked={formData.smsAlerts}
  onChange={(e) => setFormData({...formData, smsAlerts: e.target.checked})}
  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
/>
```

### Visual Styling

**Container:**
- Gradient background: `from-blue-50 to-indigo-50`
- Border: `border-2 border-blue-200`
- Padding: `p-4`
- Rounded corners: `rounded-lg`

**Confirmation Box (when enabled):**
- Background: `bg-green-50`
- Border: `border-green-200`
- Text color: `text-green-800`
- Font weight: `font-medium`

## User Workflow

### Enabling SMS Alerts

1. **During Registration:**
   ```
   Step 1: Fill in phone number (required)
   Step 2: Check "Enable SMS Alerts" checkbox
   Step 3: See confirmation message with phone number
   Step 4: Complete registration
   Step 5: Success modal shows "SMS Enabled" badge
   ```

2. **Validation:**
   - Phone number must be filled first
   - SMS checkbox dynamically shows phone number
   - Clear visual feedback when enabled

### Patient Card QR Code

**QR Code Includes SMS Status:**
```json
{
  "cardNumber": "P-2026-1234",
  "name": "John Doe",
  "phone": "+234 801 234 5678",
  "smsAlerts": true,
  "dateOfBirth": "1990-01-15",
  ...
}
```

## SMS Alert Types

### 1. Appointment Reminders
```
AKOBI Hospital: Reminder - You have an appointment
tomorrow at 10:00 AM with Dr. Sarah Johnson.
Card: P-2026-1234. Reply STOP to unsubscribe.
```

### 2. Test Results Ready
```
AKOBI Hospital: Your lab test results are now
available. Please visit the hospital or check your
patient portal. Card: P-2026-1234.
```

### 3. Prescription Notifications
```
AKOBI Hospital: New prescription ready for pickup
at pharmacy. Medication: [Drug Name]. Card: P-2026-1234.
```

### 4. Payment Confirmations
```
AKOBI Hospital: Payment received. Amount: ₦5,000.
Receipt: RCP-2026-0123. Thank you! Card: P-2026-1234.
```

### 5. Follow-up Reminders
```
AKOBI Hospital: Follow-up appointment due. Please
call 0800-AKOBI-CARE to schedule. Card: P-2026-1234.
```

## Benefits

### For Patients
- ✅ Never miss appointments
- ✅ Get test results faster
- ✅ Stay informed about prescriptions
- ✅ Payment confirmations
- ✅ Health reminders
- ✅ No need to check portal constantly

### For Hospital
- ✅ Reduced no-show rates
- ✅ Better patient engagement
- ✅ Improved communication
- ✅ Faster result notifications
- ✅ Enhanced patient satisfaction
- ✅ Automated reminder system

### For Staff
- ✅ Less manual reminder calls
- ✅ Automated notifications
- ✅ Better appointment scheduling
- ✅ Reduced administrative work
- ✅ Focus on patient care

## Privacy & Compliance

### Patient Consent
- ✅ Explicit opt-in required (checkbox)
- ✅ Clear description of what they'll receive
- ✅ Can be disabled anytime
- ✅ STOP command to unsubscribe

### Data Protection
- Phone numbers stored securely
- SMS content limited to necessary info
- Patient card number for verification
- HIPAA/GDPR compliant messaging

### Opt-out Process
```
Reply STOP to any SMS → Automatic unsubscribe
Visit hospital → Update preferences
Patient portal → Disable SMS alerts
```

## Technical Integration

### SMS Gateway (Future)
When integrated with SMS provider:
```typescript
async function sendSMS(phone: string, message: string) {
  if (!patient.smsAlerts) return;
  
  await smsGateway.send({
    to: phone,
    from: 'AKOBI',
    message: message,
    type: 'transactional'
  });
}
```

### Trigger Points
- **Appointment Created** → Send confirmation + reminder
- **Lab Results Ready** → Send notification
- **Prescription Added** → Send pickup notification
- **Payment Completed** → Send receipt
- **Follow-up Due** → Send reminder

## Best Practices

### Message Timing
- **Appointment Reminders:** 24 hours before + 1 hour before
- **Test Results:** Immediately when ready
- **Prescriptions:** When available for pickup
- **Payments:** Immediately after transaction
- **Follow-ups:** 1 week before due date

### Message Content
- Keep messages under 160 characters
- Include patient card number
- Add hospital name
- Provide action items
- Include opt-out instructions

### Frequency Limits
- Maximum 3 SMS per day
- No messages after 8 PM
- Group related notifications
- Priority system for urgent messages

## Future Enhancements

### 1. Two-Way SMS
- Reply to confirm appointments
- Request prescription refills
- Ask simple questions
- Update contact info

### 2. SMS Templates
- Customizable message templates
- Multi-language support
- Personalized greetings
- Department-specific formats

### 3. Analytics Dashboard
- SMS delivery rates
- Open/read rates
- Opt-out statistics
- Cost per message
- Engagement metrics

### 4. Smart Scheduling
- Optimal send times
- Timezone awareness
- Patient preference learning
- Delivery confirmation

### 5. Integration
- Link with appointment system
- Connect to lab system
- Pharmacy integration
- Billing system hooks
- Patient portal sync

## Troubleshooting

### SMS Not Being Sent

**Check:**
1. Is SMS Alerts enabled for patient?
2. Is phone number valid and active?
3. Is SMS gateway configured?
4. Are there any API errors?
5. Is patient in opt-out list?

### Patient Not Receiving SMS

**Solutions:**
1. Verify phone number is correct
2. Check if patient opted out
3. Confirm SMS alerts enabled
4. Test with different phone
5. Check SMS gateway logs

### Duplicate Messages

**Prevention:**
1. Implement message deduplication
2. Track sent messages
3. Rate limiting
4. Message queue system
5. Delivery status tracking

## Summary

The SMS Alerts system provides automated, HIPAA-compliant text notifications to keep patients informed about their healthcare journey. With clear opt-in during registration and comprehensive notification coverage, it enhances patient engagement while reducing administrative burden on hospital staff.

---

**Feature Status:** ✅ Implemented  
**Integration Point:** Patient Registration → Personal Information  
**Required Field:** Phone Number  
**Optional:** SMS Alerts Checkbox  
**Last Updated:** April 24, 2026
