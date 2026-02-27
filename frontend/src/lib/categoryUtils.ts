import { Category, MedicalCategory, CashTransferCategory } from '../backend';

// Since Category is now a discriminated union, we use string keys for lookups
export type CategoryKind =
  | 'food' | 'tea' | 'coolDrink' | 'petrol' | 'fruits'
  | 'recharge' | 'shopping' | 'trip' | 'bikeRepair'
  | 'medical' | 'cashTransfer' | 'others';

export const CATEGORY_LABELS: Record<CategoryKind, string> = {
  food: 'Food',
  tea: 'Tea',
  coolDrink: 'Cool Drink',
  petrol: 'Petrol',
  fruits: 'Fruits',
  recharge: 'Recharge',
  shopping: 'Shopping',
  trip: 'Trip',
  bikeRepair: 'Bike Repair',
  medical: 'Medical',
  cashTransfer: 'Cash Transfer',
  others: 'Others',
};

export const CATEGORY_ICONS: Record<CategoryKind, string> = {
  food: '🍽️',
  tea: '☕',
  coolDrink: '🥤',
  petrol: '⛽',
  fruits: '🍎',
  recharge: '📱',
  shopping: '🛍️',
  trip: '✈️',
  bikeRepair: '🔧',
  medical: '🏥',
  cashTransfer: '💸',
  others: '📦',
};

export const CATEGORY_BADGE_CLASS: Record<CategoryKind, string> = {
  food: 'badge-food',
  tea: 'badge-tea',
  coolDrink: 'badge-cooldrink',
  petrol: 'badge-petrol',
  fruits: 'badge-fruits',
  recharge: 'badge-recharge',
  shopping: 'badge-shopping',
  trip: 'badge-trip',
  bikeRepair: 'badge-bikerepair',
  medical: 'badge-medical',
  cashTransfer: 'badge-cashtransfer',
  others: 'badge-others',
};

export const FOOD_SUB_CATEGORIES = ['Biryani', 'Junk Food'];
export const SHOPPING_SUB_CATEGORIES = ['Clothes', 'Accessories', 'Watches', 'Skincare', 'Gadgets'];
export const MEDICAL_SUB_CATEGORIES = ['Medicine', 'Hospital'];
export const CASH_TRANSFER_SUB_CATEGORIES = ['Family', 'NeedToPay', 'Repay'];

export function getCategoryKind(category: Category): CategoryKind {
  return category.__kind__ as CategoryKind;
}

export function getSubCategoriesByKind(kind: CategoryKind): string[] {
  if (kind === 'food') return FOOD_SUB_CATEGORIES;
  if (kind === 'shopping') return SHOPPING_SUB_CATEGORIES;
  if (kind === 'medical') return MEDICAL_SUB_CATEGORIES;
  if (kind === 'cashTransfer') return CASH_TRANSFER_SUB_CATEGORIES;
  return [];
}

export function hasSubCategoriesByKind(kind: CategoryKind): boolean {
  return ['food', 'shopping', 'medical', 'cashTransfer'].includes(kind);
}

export function buildCategory(kind: CategoryKind, subCategory?: string): Category {
  switch (kind) {
    case 'food':
      return { __kind__: 'food', food: null };
    case 'tea':
      return { __kind__: 'tea', tea: null };
    case 'coolDrink':
      return { __kind__: 'coolDrink', coolDrink: null };
    case 'petrol':
      return { __kind__: 'petrol', petrol: null };
    case 'fruits':
      return { __kind__: 'fruits', fruits: null };
    case 'recharge':
      return { __kind__: 'recharge', recharge: null };
    case 'shopping':
      return { __kind__: 'shopping', shopping: null };
    case 'trip':
      return { __kind__: 'trip', trip: null };
    case 'bikeRepair':
      return { __kind__: 'bikeRepair', bikeRepair: null };
    case 'others':
      return { __kind__: 'others', others: null };
    case 'medical': {
      const medSub = subCategory?.toLowerCase() === 'hospital'
        ? MedicalCategory.hospital
        : MedicalCategory.medicine;
      return { __kind__: 'medical', medical: medSub };
    }
    case 'cashTransfer': {
      let ctSub: CashTransferCategory = CashTransferCategory.family;
      if (subCategory?.toLowerCase() === 'needtopay') ctSub = CashTransferCategory.needToPay;
      else if (subCategory?.toLowerCase() === 'repay') ctSub = CashTransferCategory.repay;
      return { __kind__: 'cashTransfer', cashTransfer: ctSub };
    }
    default:
      return { __kind__: 'food', food: null };
  }
}

export const ALL_CATEGORY_KINDS: CategoryKind[] = [
  'food',
  'tea',
  'coolDrink',
  'petrol',
  'fruits',
  'recharge',
  'shopping',
  'trip',
  'bikeRepair',
  'medical',
  'cashTransfer',
  'others',
];

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
