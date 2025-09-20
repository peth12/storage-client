export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  expirationDate?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}


export interface Bill {
  id: string;
  _id: string;
  billNumber: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// For API bill creation
export interface BillCreate {
  items: { productId: string; quantity: number }[];
  status: 'draft' | 'completed' | 'cancelled';
  createdBy: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  billId?: string;
  createdAt: string;
  createdBy: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}