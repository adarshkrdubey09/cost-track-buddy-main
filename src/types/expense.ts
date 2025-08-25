export interface Expense {
  id: string;
  state: string;
  embossingCenterName: string;
  month: string;
  year: number;
  category: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  state: string;
  embossingCenterName: string;
  month: string;
  year: number;
  category: string;
  price: number;
}

export const EXPENSE_CATEGORIES = [
  "Travel",
  "Food & Dining",
  "Office Supplies",
  "Equipment",
  "Marketing",
  "Training",
  "Maintenance",
  "Utilities",
  "Other"
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry"
] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;