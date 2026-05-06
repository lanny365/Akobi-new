# Pharmacy Stock Alerts - Integration Guide for Doctors & Surgeons

## Overview
The Pharmacy Inventory Management system now includes a comprehensive stock alert system that notifies doctors and surgeons when medications are low or out of stock during prescription/selection.

## Features Implemented

### 1. **Stock Status Tracking**
- **NEW Stock**: Recently procured items
- **OLD Stock (B/F)**: Brought forward/older inventory
- Real-time stock level monitoring
- Automatic low stock detection
- Empty stock detection

### 2. **Stock Tab Enhancements**
Located in: `/src/app/components/Pharmacy.tsx` - Stock Tab

#### Filter Buttons:
- **All Stock**: View all inventory items
- **New Products**: View only NEW stock with totals
- **Old Stock - B/F**: View only OLD (brought forward) stock with totals

#### Financial Summary Cards:
Each filter shows:
- **Total Cost Price**: Sum of all cost prices × stock levels
- **Total Selling Price**: Sum of all selling prices × stock levels
- **Potential Profit**: Selling price - Cost price

#### Alert System:
Three levels of stock alerts:

1. **OUT OF STOCK** (Empty - 0 units)
   - Red pulsing badge
   - Critical alert message
   - "Cannot Dispense" warning
   - Blocks prescription

2. **LOW STOCK** (At or below reorder level)
   - Orange warning badge
   - Warning alert message
   - Shows current stock and reorder level
   - Allows prescription with warning

3. **ADEQUATE STOCK** (Above reorder level)
   - Green status
   - Shows available units
   - Normal operation

---

## Integration Component: `PharmacyStockAlert`

### Location
`/src/app/components/PharmacyStockAlert.tsx`

### Component Usage

#### Basic Implementation
```tsx
import { PharmacyStockAlert } from './PharmacyStockAlert';

// In your doctor/surgeon component
<PharmacyStockAlert 
  drugName="Paracetamol 500mg" 
  inventory={pharmacyInventory} 
/>
```

#### Example in Doctor Consultation
```tsx
// In DoctorConsultation.tsx
import { PharmacyStockAlert, getStockStatus } from './PharmacyStockAlert';
import { useState } from 'react';

export function DoctorConsultation() {
  const [selectedMedications, setSelectedMedications] = useState([]);
  
  // Get pharmacy inventory (shared context or API)
  const pharmacyInventory = usePharmacyInventory(); // You'll need to create this context
  
  const handleAddMedication = (med) => {
    // Check stock before adding
    const stockStatus = getStockStatus(med.name, pharmacyInventory);
    
    if (!stockStatus.canDispense) {
      toast.error(stockStatus.message);
      return;
    }
    
    if (stockStatus.status === 'LOW_STOCK') {
      toast.warning(stockStatus.message);
    }
    
    // Add medication
    setSelectedMedications([...selectedMedications, med]);
  };
  
  return (
    <div>
      {/* Medication selector */}
      {selectedMedications.map(med => (
        <div key={med.id}>
          <p>{med.name}</p>
          <PharmacyStockAlert 
            drugName={med.name} 
            inventory={pharmacyInventory}
            showInline={true}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Utility Functions

### 1. `getStockStatus(drugName, inventory)`
Returns detailed stock status for a single drug.

**Returns:**
```typescript
{
  status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE',
  stockLevel: number,
  canDispense: boolean,
  message: string
}
```

**Example:**
```tsx
const status = getStockStatus('Morphine 10mg', inventory);

if (status.status === 'OUT_OF_STOCK') {
  alert('Cannot prescribe - out of stock!');
}
```

### 2. `checkMultipleDrugsStock(drugNames, inventory)`
Batch check multiple medications at once.

**Returns:**
```typescript
{
  outOfStock: string[],
  lowStock: string[],
  adequate: string[]
}
```

**Example:**
```tsx
const medications = ['Paracetamol 500mg', 'Morphine 10mg', 'Insulin Glargine'];
const stockCheck = checkMultipleDrugsStock(medications, inventory);

if (stockCheck.outOfStock.length > 0) {
  toast.error(`Out of stock: ${stockCheck.outOfStock.join(', ')}`);
}

if (stockCheck.lowStock.length > 0) {
  toast.warning(`Low stock: ${stockCheck.lowStock.join(', ')}`);
}
```

---

## Integration Steps for Doctor Portal

### Step 1: Create Pharmacy Inventory Context
Create `/src/app/context/PharmacyInventoryContext.tsx`:

```tsx
import { createContext, useContext, useState } from 'react';

interface Drug {
  id: string;
  name: string;
  stockLevel: number;
  reorderLevel: number;
  stockStatus: 'NEW' | 'OLD';
  // ... other fields
}

const PharmacyInventoryContext = createContext<{
  inventory: Drug[];
}>({
  inventory: []
});

export function PharmacyInventoryProvider({ children }) {
  // In production, this would fetch from API or shared state
  const [inventory, setInventory] = useState<Drug[]>([
    // ... inventory items
  ]);
  
  return (
    <PharmacyInventoryContext.Provider value={{ inventory }}>
      {children}
    </PharmacyInventoryContext.Provider>
  );
}

export const usePharmacyInventory = () => useContext(PharmacyInventoryContext);
```

### Step 2: Wrap Your App
In `/src/app/App.tsx`:
```tsx
import { PharmacyInventoryProvider } from './context/PharmacyInventoryContext';

<PharmacyInventoryProvider>
  {/* Your app */}
</PharmacyInventoryProvider>
```

### Step 3: Use in Doctor Component
In `/src/app/components/DoctorConsultation.tsx`:
```tsx
import { usePharmacyInventory } from '../context/PharmacyInventoryContext';
import { PharmacyStockAlert, getStockStatus } from './PharmacyStockAlert';

export function DoctorConsultation() {
  const { inventory } = usePharmacyInventory();
  
  // Use PharmacyStockAlert component wherever medications are shown
  // Use getStockStatus() function before prescribing
}
```

---

## Integration Steps for Surgeon/Theatre Portal

### In Theatre Management
When selecting medications for surgery:

```tsx
import { PharmacyStockAlert } from './PharmacyStockAlert';
import { usePharmacyInventory } from '../context/PharmacyInventoryContext';

export function TheatreMedicationSelector() {
  const { inventory } = usePharmacyInventory();
  
  return (
    <div>
      {surgeryMedications.map(med => (
        <div key={med.id}>
          <h4>{med.name}</h4>
          <PharmacyStockAlert 
            drugName={med.name}
            inventory={inventory}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Alert Behavior

### Visual Indicators

#### OUT OF STOCK
```
┌─────────────────────────────────────────────────────┐
│ ⛔ OUT OF STOCK - CANNOT DISPENSE                   │
│ This medication is currently unavailable.           │
│ Contact pharmacy immediately.              [EMPTY]  │
└─────────────────────────────────────────────────────┘
- Background: Red (pulsing animation)
- Border: Red
- Badge: Red "EMPTY"
```

#### LOW STOCK
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ LOW STOCK WARNING                                │
│ Only 15 units available (Reorder level: 30)         │
│ Stock may run out soon.                    [LOW]    │
└─────────────────────────────────────────────────────┘
- Background: Orange
- Border: Orange
- Badge: Orange "LOW"
```

#### ADEQUATE STOCK
```
┌─────────────────────────────────────────────────────┐
│ 500 units available                        [NEW]    │
└─────────────────────────────────────────────────────┘
- Background: Light green
- Badge: Green "NEW" or Orange "OLD"
```

---

## Current Inventory Demo Data

The system includes 8 demo products with various stock levels:

### OUT OF STOCK Items (0 units):
1. **Morphine 10mg** - Controlled Drugs
2. **Adrenaline 1mg/ml** - Emergency & Critical Care

### LOW STOCK Items (below reorder level):
1. **Insulin Glargine** - 15 units (Reorder: 30)
2. **Ceftriaxone 1g** - 45 units (Reorder: 100)

### ADEQUATE STOCK Items:
1. **Paracetamol 500mg** - 500 units
2. **Amoxicillin 500mg** - 450 units
3. **Ibuprofen 400mg** - 250 units
4. **Metformin 500mg** - 180 units

---

## Best Practices

### 1. Always Check Before Prescribing
```tsx
const handlePrescribe = (medication) => {
  const status = getStockStatus(medication.name, inventory);
  
  if (!status.canDispense) {
    toast.error(`Cannot prescribe ${medication.name} - ${status.message}`);
    return;
  }
  
  // Proceed with prescription
};
```

### 2. Show Stock Alerts in Medication Lists
```tsx
{medications.map(med => (
  <div key={med.id}>
    <MedicationCard medication={med} />
    <PharmacyStockAlert 
      drugName={med.name}
      inventory={inventory}
      showInline={true}
    />
  </div>
))}
```

### 3. Batch Check for Pre-validation
```tsx
const validatePrescription = (medications) => {
  const drugNames = medications.map(m => m.name);
  const stockCheck = checkMultipleDrugsStock(drugNames, inventory);
  
  if (stockCheck.outOfStock.length > 0) {
    return {
      valid: false,
      message: `Cannot dispense: ${stockCheck.outOfStock.join(', ')}`
    };
  }
  
  return { valid: true };
};
```

---

## Future Enhancements

### Planned Features:
1. **Real-time Sync**: Live inventory updates across all portals
2. **Alternative Suggestions**: Suggest similar drugs when primary is out of stock
3. **Auto-reorder**: Automatic purchase orders when stock is low
4. **Expiry Alerts**: Warn about near-expiry medications
5. **Stock Reservation**: Reserve stock when doctor prescribes
6. **Usage Analytics**: Track which medications are prescribed most

---

## Support & Troubleshooting

### Common Issues

**Q: Stock alerts not showing?**
A: Ensure pharmacy inventory context is properly wrapped around your component tree.

**Q: Drug not found in inventory?**
A: The alert shows "Not tracked in pharmacy inventory" - ensure drug name matches exactly.

**Q: How to handle partial dispensing?**
A: Check `stockLevel` in the status object and adjust quantity accordingly.

---

## Example: Complete Doctor Integration

```tsx
// DoctorConsultation.tsx
import { useState } from 'react';
import { usePharmacyInventory } from '../context/PharmacyInventoryContext';
import { PharmacyStockAlert, getStockStatus, checkMultipleDrugsStock } from './PharmacyStockAlert';
import { toast } from 'sonner';

export function DoctorConsultation() {
  const { inventory } = usePharmacyInventory();
  const [selectedMedications, setSelectedMedications] = useState([]);
  
  const handleAddMedication = (medication) => {
    // Check stock status
    const stockStatus = getStockStatus(medication.name, inventory);
    
    // Block if out of stock
    if (stockStatus.status === 'OUT_OF_STOCK') {
      toast.error(`❌ ${medication.name} is OUT OF STOCK and cannot be prescribed.`);
      return;
    }
    
    // Warn if low stock
    if (stockStatus.status === 'LOW_STOCK') {
      toast.warning(`⚠️ ${medication.name} has LOW STOCK (${stockStatus.stockLevel} units available).`);
    }
    
    // Add medication
    setSelectedMedications([...selectedMedications, medication]);
    toast.success(`✅ ${medication.name} added to prescription`);
  };
  
  const handleSendToPharmacy = () => {
    // Validate all medications
    const drugNames = selectedMedications.map(m => m.name);
    const stockCheck = checkMultipleDrugsStock(drugNames, inventory);
    
    if (stockCheck.outOfStock.length > 0) {
      toast.error(`Cannot send prescription: ${stockCheck.outOfStock.join(', ')} out of stock.`);
      return;
    }
    
    if (stockCheck.lowStock.length > 0) {
      toast.warning(`Note: Low stock on ${stockCheck.lowStock.join(', ')}`);
    }
    
    // Send to pharmacy
    toast.success('Prescription sent to pharmacy');
  };
  
  return (
    <div>
      <h2>Prescription</h2>
      
      {/* Selected Medications */}
      {selectedMedications.map(med => (
        <div key={med.id} className="medication-item">
          <h4>{med.name}</h4>
          <PharmacyStockAlert 
            drugName={med.name}
            inventory={inventory}
            showInline={true}
          />
        </div>
      ))}
      
      <button onClick={handleSendToPharmacy}>
        Send to Pharmacy
      </button>
    </div>
  );
}
```

---

## Summary

The Pharmacy Stock Alert system provides:
- ✅ Real-time stock visibility for doctors and surgeons
- ✅ Automatic alerts for low/empty stock
- ✅ Visual indicators with color-coded badges
- ✅ Helper functions for stock validation
- ✅ Batch checking for multiple medications
- ✅ Integration-ready components
- ✅ NEW/OLD stock tracking with financial summaries
- ✅ Filter buttons for stock categorization

**Integration is simple**: Import the component, pass the drug name and inventory, and get instant stock alerts!
