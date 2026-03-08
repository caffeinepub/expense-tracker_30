import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Expense {
    id: bigint;
    subCategory?: string;
    date: string;
    note?: string;
    repayName?: string;
    category: Category;
    amount: bigint;
}
export interface UserProfile {
    name: string;
}
export type Category = {
    __kind__: "tea";
    tea: null;
} | {
    __kind__: "cashTransfer";
    cashTransfer: CashTransferCategory;
} | {
    __kind__: "coolDrink";
    coolDrink: null;
} | {
    __kind__: "petrol";
    petrol: null;
} | {
    __kind__: "food";
    food: null;
} | {
    __kind__: "trip";
    trip: null;
} | {
    __kind__: "others";
    others: null;
} | {
    __kind__: "recharge";
    recharge: null;
} | {
    __kind__: "bikeRepair";
    bikeRepair: null;
} | {
    __kind__: "fruits";
    fruits: null;
} | {
    __kind__: "shopping";
    shopping: null;
} | {
    __kind__: "medical";
    medical: MedicalCategory;
};
export enum CashTransferCategory {
    needToPay = "needToPay",
    repay = "repay",
    family = "family"
}
export enum MedicalCategory {
    hospital = "hospital",
    medicine = "medicine"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExpense(date: string, category: Category, subCategory: string | null, amount: bigint, note: string | null, repayName: string | null): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpenses(): Promise<Array<Expense>>;
    getExpensesByDate(date: string): Promise<Array<Expense>>;
    getExpensesByDateRange(startDate: string, endDate: string): Promise<Array<Expense>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
