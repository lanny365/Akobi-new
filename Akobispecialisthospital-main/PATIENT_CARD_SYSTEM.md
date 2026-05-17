# Patient Card Management System

## Overview
The Patient Card Management System is an integrated feature that connects User Management with Hospital Settings to provide complete control over patient card types and their associated fees.

## System Architecture

### Two-Module Integration

**Module 1: User Management → Patient Card Types**
- Define and manage different types of patient cards
- Set card colors for visual identification
- Activate/deactivate card types
- Delete unused card types

**Module 2: Hospital Settings → Patient Card Fees**
- Select from active card types
- Set fee amounts for each card type
- Manage pricing for card issuance
- One fee per card type

## How It Works

### Step 1: Define Card Types (User Management)

1. Navigate to **Administration** → **User Management**
2. Select **"Patient Card Types"** from dropdown
3. Click **"Add New Card Type"**
4. Fill in:
   - **Card Type Name** (e.g., "New Patient Card", "VIP Card")
   - **Card Color** (visual identification)
   - **Description** (optional details)
5. Click **"Add Card Type"**

**Pre-configured Card Types:**
- New Patient Card (Blue)
- Card Replacement (Lost) (Red)
- Card Replacement (Damaged) (Orange)
- VIP Patient Card (Purple)
- Staff Dependent Card (Green)

### Step 2: Set Card Fees (Hospital Settings)

1. Navigate to **Administration** → **Hospital Settings**
2. Select **"Patient Card Fees"** from dropdown
3. Select **Card Type** from dropdown (pulls from active types)
4. Enter **Fee Amount** in Naira (₦)
5. Click **"Add Card Fee"**

**Key Features:**
- ✅ Only active card types appear in dropdown
- ✅ One fee per card type (prevents duplicates)
- ✅ Card color and description inherited from card type
- ✅ Visual display shows card color badge

## Features

### Card Types Management (User Management)

**Add Card Types:**
```
Name: VIP Patient Card
Color: Purple
Description: Premium card for VIP patients
Status: Active
```

**Edit Card Types:**
- Update name, color, or description
- Changes reflect automatically in Hospital Settings

**Activate/Deactivate:**
- Inactive card types won't appear in fee configuration
- Existing fees remain but can't be assigned to new patients

**Delete Card Types:**
- Remove unused card types
- Warning: Deletes associated fees in Hospital Settings

**Visual Identification:**
- Color-coded badges for easy recognition
- 8 color options available

### Card Fees Configuration (Hospital Settings)

**Add Fees:**
```
Card Type: [Dropdown of active types]
Fee Amount: ₦500
```

**Duplicate Prevention:**
- System checks if fee already exists for selected card type
- Prevents multiple fees for same card type

**Visual Display:**
- Card color badge from type definition
- Card description shown below name
- Large fee amount in green
- Active/Inactive status badge

**Edit Fees:**
- Change card type association
- Update fee amount
- System validates no duplicate

## Usage Workflow

### Setting Up New Card Type with Fee

**Example: Corporate Card**

1. **Define Card Type** (User Management)
   ```
   Navigate: Administration → User Management
   Section: Patient Card Types
   Action: Add New Card Type
   
   Card Type Name: Corporate Patient Card
   Color: Indigo
   Description: Card for corporate employees
   → Click "Add Card Type"
   ```

2. **Set Card Fee** (Hospital Settings)
   ```
   Navigate: Administration → Hospital Settings
   Section: Patient Card Fees
   Action: Add New Patient Card Fee
   
   Card Type: Corporate Patient Card [from dropdown]
   Fee Amount: ₦750
   → Click "Add Card Fee"
   ```

3. **Use at Reception**
   ```
   During patient registration:
   - Select "Corporate Patient Card" from card types
   - Fee of ₦750 automatically applied
   - Card color (Indigo) used for visual ID
   ```

## Data Flow

```
User Management (Define)
       ↓
Card Types Context (Shared State)
       ↓
Hospital Settings (Pricing)
       ↓
Reception (Application)
       ↓
Cashier (Collection)
```

## Technical Implementation

### Context Provider
```typescript
CardTypesContext provides:
- cardTypes: Array of all card types
- addCardType()
- updateCardType()
- deleteCardType()
- toggleCardTypeStatus()
```

### Integration Points

**App.tsx:**
```tsx
<CardTypesProvider>
  <Root />
</CardTypesProvider>
```

**User Management:**
```tsx
import { useCardTypes } from '../context/CardTypesContext';
const { cardTypes, addCardType, ... } = useCardTypes();
```

**Hospital Settings:**
```tsx
import { useCardTypes } from '../context/CardTypesContext';
const { cardTypes } = useCardTypes();
const activeCardTypes = cardTypes.filter(ct => ct.status === 'active');
```

## Benefits

### For Administrators
- ✅ Centralized card type management
- ✅ Easy fee configuration
- ✅ Visual organization with colors
- ✅ No duplicate fees possible
- ✅ Clear system-wide consistency

### For Reception Staff
- ✅ Standardized card types across system
- ✅ Automatic fee calculation
- ✅ Color-coded visual identification
- ✅ Consistent patient experience

### For Patients
- ✅ Transparent fee structure
- ✅ Clear card type categories
- ✅ Professional card identification
- ✅ Fair and consistent pricing

## Best Practices

### 1. Card Type Organization
- Keep active types relevant and current
- Use descriptive names (not codes)
- Choose colors that differentiate easily
- Add helpful descriptions

### 2. Fee Management
- Review fees regularly
- Update prices centrally
- Deactivate instead of delete when possible
- Document special pricing rules

### 3. Color Usage
- Blue: Standard patient cards
- Green: Staff/dependent cards
- Purple: VIP/premium cards
- Red: Emergency/replacement cards
- Orange: Temporary cards
- Others: Special categories

### 4. Naming Conventions
```
Good Examples:
- "New Patient Card"
- "Card Replacement (Lost)"
- "VIP Premium Card"
- "Staff Dependent Card"

Avoid:
- "Card Type 1"
- "NEWCARD"
- "Type A"
```

## Troubleshooting

### No Card Types in Dropdown

**Problem:** Card fee dropdown is empty

**Solutions:**
1. Check if card types exist in User Management
2. Verify card types are set to "Active" status
3. Create new card types if none exist

### Duplicate Fee Error

**Problem:** "Fee already exists for this card type"

**Solution:**
1. Check existing fees list
2. Edit existing fee instead of adding new one
3. Each card type can only have one fee

### Card Color Not Showing

**Problem:** Gray box instead of card color

**Solution:**
1. Check card type has valid color assigned
2. Edit card type and select color from dropdown
3. Refresh Hospital Settings page

### Fee Changes Not Reflecting

**Problem:** Old fee still showing after update

**Solution:**
1. Ensure changes were saved in Hospital Settings
2. Check "Active" status of card type
3. Refresh the page

## Security Considerations

### Access Control
- Only administrators can modify card types
- Only authorized staff can set fees
- Audit trail for all changes
- Status toggle instead of delete preserves history

### Data Integrity
- Validation on all inputs
- Duplicate prevention
- Required field enforcement
- Relationship maintenance

## Future Enhancements (Possible)

1. **Card Design Templates**
   - Visual card layout designer
   - Photo upload for card backgrounds
   - Barcode/QR code positioning

2. **Tiered Pricing**
   - Different fees for different patient categories
   - Bulk card discounts
   - Time-based pricing

3. **Card Inventory**
   - Track physical card stock
   - Reorder alerts
   - Card printer integration

4. **Analytics**
   - Card issuance reports
   - Revenue by card type
   - Popular card types

5. **Patient Portal**
   - Digital card display
   - Card status checking
   - Replacement requests

## Summary

The Patient Card Management System provides a complete, integrated solution for managing patient card types and fees across the hospital. By connecting User Management and Hospital Settings through a shared context, the system ensures consistency, prevents errors, and provides a professional experience for both staff and patients.

---

**Last Updated:** April 24, 2026  
**Modules:** User Management, Hospital Settings  
**Integration:** CardTypesContext  
**Status:** ✅ Production Ready
