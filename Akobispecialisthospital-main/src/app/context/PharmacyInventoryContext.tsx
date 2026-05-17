import { createContext, useContext, useState, ReactNode } from 'react';

interface Drug {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  stockLevel: number;
  reorderLevel: number;
  expiryDate: string;
  price: number;
  costPrice: number;
  sellingPrice: number;
  accountToCredit: string;
  accountToDebit: string;
  stockStatus: 'NEW' | 'OLD';
}

interface PharmacyInventoryContextType {
  inventory: Drug[];
  updateInventory: (updatedInventory: Drug[]) => void;
  deductStock: (drugId: string, quantity: number) => boolean;
  addStock: (drugId: string, quantity: number) => void;
}

const PharmacyInventoryContext = createContext<PharmacyInventoryContextType | undefined>(undefined);

export function PharmacyInventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<Drug[]>([
    // Regular pharmacy medicines
    { id: 'DRUG-1', name: 'Paracetamol 500mg', category: 'Analgesic', subCategory: 'Pain Relief', stockLevel: 500, reorderLevel: 100, expiryDate: '2027-12-31', price: 50, costPrice: 40, sellingPrice: 60, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'DRUG-2', name: 'Amoxicillin 500mg', category: 'Antibiotic', subCategory: 'Infection Control', stockLevel: 450, reorderLevel: 50, expiryDate: '2026-08-15', price: 150, costPrice: 120, sellingPrice: 180, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'OLD' },
    { id: 'DRUG-3', name: 'Ibuprofen 400mg', category: 'NSAID', subCategory: 'Pain Relief', stockLevel: 250, reorderLevel: 75, expiryDate: '2027-06-30', price: 75, costPrice: 60, sellingPrice: 90, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'DRUG-4', name: 'Metformin 500mg', category: 'Antidiabetic', subCategory: 'Blood Sugar Control', stockLevel: 180, reorderLevel: 100, expiryDate: '2027-03-20', price: 120, costPrice: 100, sellingPrice: 140, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'OLD' },
    { id: 'DRUG-5', name: 'Morphine 10mg', category: 'Controlled Drugs', subCategory: 'Narcotic Analgesics', stockLevel: 50, reorderLevel: 20, expiryDate: '2027-01-15', price: 500, costPrice: 400, sellingPrice: 600, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'DRUG-6', name: 'Insulin Glargine', category: 'Injectable & Infusions', subCategory: 'Insulin', stockLevel: 80, reorderLevel: 30, expiryDate: '2026-11-30', price: 800, costPrice: 650, sellingPrice: 950, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'OLD' },
    { id: 'DRUG-7', name: 'Adrenaline 1mg/ml', category: 'Emergency & Critical Care', subCategory: 'Resuscitation Drugs', stockLevel: 100, reorderLevel: 50, expiryDate: '2026-09-20', price: 300, costPrice: 250, sellingPrice: 350, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'OLD' },
    { id: 'DRUG-8', name: 'Ceftriaxone 1g', category: 'Prescription Medicines (Rx)', subCategory: 'Antibiotics', stockLevel: 200, reorderLevel: 100, expiryDate: '2027-05-10', price: 200, costPrice: 160, sellingPrice: 240, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },

    // Laboratory consumables - THESE ARE AVAILABLE FOR LAB WALLET PURCHASES
    { id: 'LAB-001', name: 'Blood Collection Tubes (10ml)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Sample Collection', stockLevel: 500, reorderLevel: 100, expiryDate: '2027-12-31', price: 30, costPrice: 25, sellingPrice: 35, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-002', name: 'Disposable Gloves (Box of 100)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'PPE', stockLevel: 50, reorderLevel: 20, expiryDate: '2028-06-30', price: 300, costPrice: 250, sellingPrice: 350, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-003', name: 'Alcohol Swabs (Box of 200)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Supplies', stockLevel: 100, reorderLevel: 30, expiryDate: '2027-09-15', price: 150, costPrice: 120, sellingPrice: 180, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-004', name: 'Syringes 5ml (Pack of 100)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Sample Collection', stockLevel: 30, reorderLevel: 15, expiryDate: '2028-03-20', price: 800, costPrice: 650, sellingPrice: 950, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-005', name: 'Cotton Balls (500g)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Supplies', stockLevel: 25, reorderLevel: 10, expiryDate: '2028-12-31', price: 200, costPrice: 160, sellingPrice: 240, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-006', name: 'Urine Collection Containers', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Sample Collection', stockLevel: 300, reorderLevel: 80, expiryDate: '2028-08-30', price: 25, costPrice: 20, sellingPrice: 30, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-007', name: 'Test Tube Racks', category: 'Medical Devices & Equipment', subCategory: 'Lab Equipment', stockLevel: 20, reorderLevel: 5, expiryDate: '2030-12-31', price: 450, costPrice: 380, sellingPrice: 550, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-008', name: 'Pipette Tips (1000 pieces)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Lab Supplies', stockLevel: 15, reorderLevel: 8, expiryDate: '2028-05-20', price: 1200, costPrice: 1000, sellingPrice: 1400, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-009', name: 'Laboratory Disinfectant (5L)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Cleaning', stockLevel: 40, reorderLevel: 15, expiryDate: '2027-10-10', price: 600, costPrice: 500, sellingPrice: 720, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
    { id: 'LAB-010', name: 'Biohazard Bags (Roll of 100)', category: 'Laboratory & Diagnostic Supplies', subCategory: 'Waste Management', stockLevel: 60, reorderLevel: 20, expiryDate: '2029-12-31', price: 350, costPrice: 300, sellingPrice: 420, accountToCredit: 'Sales', accountToDebit: 'Inventory', stockStatus: 'NEW' },
  ]);

  const updateInventory = (updatedInventory: Drug[]) => {
    setInventory(updatedInventory);
  };

  const deductStock = (drugId: string, quantity: number): boolean => {
    const drug = inventory.find(d => d.id === drugId);
    if (!drug || drug.stockLevel < quantity) {
      return false;
    }

    setInventory(prev => prev.map(d =>
      d.id === drugId
        ? { ...d, stockLevel: d.stockLevel - quantity }
        : d
    ));
    return true;
  };

  const addStock = (drugId: string, quantity: number) => {
    setInventory(prev => prev.map(d =>
      d.id === drugId
        ? { ...d, stockLevel: d.stockLevel + quantity }
        : d
    ));
  };

  return (
    <PharmacyInventoryContext.Provider value={{ inventory, updateInventory, deductStock, addStock }}>
      {children}
    </PharmacyInventoryContext.Provider>
  );
}

export function usePharmacyInventory() {
  const context = useContext(PharmacyInventoryContext);
  if (!context) {
    throw new Error('usePharmacyInventory must be used within PharmacyInventoryProvider');
  }
  return context;
}
