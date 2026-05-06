import { AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';

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

interface PharmacyStockAlertProps {
  drugName: string;
  inventory?: Drug[];
  showInline?: boolean;
}

/**
 * PharmacyStockAlert Component
 * 
 * This component displays stock level alerts for doctors and surgeons when they
 * are selecting medications from the pharmacy inventory.
 * 
 * Usage:
 * - Import this component in Doctor or Surgeon portals
 * - Pass the drug name to check stock levels
 * - Alerts for LOW STOCK and OUT OF STOCK conditions
 * 
 * Example:
 * <PharmacyStockAlert drugName="Paracetamol 500mg" inventory={pharmacyInventory} />
 */
export function PharmacyStockAlert({ drugName, inventory = [], showInline = true }: PharmacyStockAlertProps) {
  // Find the drug in inventory
  const drug = inventory.find(d => d.name.toLowerCase().includes(drugName.toLowerCase()));

  if (!drug) {
    // Drug not found in inventory
    return showInline ? (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <AlertTriangle className="w-3 h-3" />
        <span>Not tracked in pharmacy inventory</span>
      </div>
    ) : null;
  }

  const isEmpty = drug.stockLevel === 0;
  const isLowStock = drug.stockLevel > 0 && drug.stockLevel <= drug.reorderLevel;
  const isAdequate = drug.stockLevel > drug.reorderLevel;

  // OUT OF STOCK - Critical Alert
  if (isEmpty) {
    return (
      <div className="p-3 bg-red-600 text-white rounded-lg border-2 border-red-700 animate-pulse">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold text-sm">⛔ OUT OF STOCK - CANNOT DISPENSE</p>
            <p className="text-xs">This medication is currently unavailable. Contact pharmacy immediately.</p>
          </div>
          <Badge className="bg-red-800">EMPTY</Badge>
        </div>
      </div>
    );
  }

  // LOW STOCK - Warning
  if (isLowStock) {
    return (
      <div className="p-3 bg-orange-500 text-white rounded-lg border-2 border-orange-600">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold text-sm">⚠️ LOW STOCK WARNING</p>
            <p className="text-xs">
              Only {drug.stockLevel} units available (Reorder level: {drug.reorderLevel}). 
              Stock may run out soon.
            </p>
          </div>
          <Badge className="bg-orange-700">LOW</Badge>
        </div>
      </div>
    );
  }

  // ADEQUATE STOCK - Success (optional, can be hidden)
  if (isAdequate && showInline) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-100 rounded text-xs text-green-700">
        <span className="font-semibold">{drug.stockLevel} units available</span>
        <Badge className="bg-green-600 text-white">{drug.stockStatus}</Badge>
      </div>
    );
  }

  return null;
}

/**
 * Helper function to get stock status
 * Can be used to check stock before prescribing
 */
export function getStockStatus(drugName: string, inventory: Drug[]): {
  status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE';
  stockLevel: number;
  canDispense: boolean;
  message: string;
} {
  const drug = inventory.find(d => d.name.toLowerCase().includes(drugName.toLowerCase()));

  if (!drug) {
    return {
      status: 'OUT_OF_STOCK',
      stockLevel: 0,
      canDispense: false,
      message: 'Drug not found in inventory'
    };
  }

  if (drug.stockLevel === 0) {
    return {
      status: 'OUT_OF_STOCK',
      stockLevel: 0,
      canDispense: false,
      message: `${drug.name} is OUT OF STOCK. Cannot dispense.`
    };
  }

  if (drug.stockLevel <= drug.reorderLevel) {
    return {
      status: 'LOW_STOCK',
      stockLevel: drug.stockLevel,
      canDispense: true,
      message: `${drug.name} has LOW STOCK (${drug.stockLevel} units). Reorder level: ${drug.reorderLevel}`
    };
  }

  return {
    status: 'ADEQUATE',
    stockLevel: drug.stockLevel,
    canDispense: true,
    message: `${drug.name} has adequate stock (${drug.stockLevel} units available)`
  };
}

/**
 * Batch check multiple drugs
 * Returns drugs with low or empty stock
 */
export function checkMultipleDrugsStock(drugNames: string[], inventory: Drug[]): {
  outOfStock: string[];
  lowStock: string[];
  adequate: string[];
} {
  const outOfStock: string[] = [];
  const lowStock: string[] = [];
  const adequate: string[] = [];

  drugNames.forEach(drugName => {
    const status = getStockStatus(drugName, inventory);
    
    if (status.status === 'OUT_OF_STOCK') {
      outOfStock.push(drugName);
    } else if (status.status === 'LOW_STOCK') {
      lowStock.push(drugName);
    } else {
      adequate.push(drugName);
    }
  });

  return { outOfStock, lowStock, adequate };
}
