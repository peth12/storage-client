import { Product, Bill, StockTransaction } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'stock_products',
  BILLS: 'stock_bills',
  TRANSACTIONS: 'stock_transactions'
};

// Mock initial data
const INITIAL_PRODUCTS: Product[] = [];

export class LocalStorage {
  static getProducts(): Product[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!stored) {
      this.setProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  }

  static setProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static getBills(): Bill[] {
    const stored = localStorage.getItem(STORAGE_KEYS.BILLS);
    return stored ? JSON.parse(stored) : [];
  }

  static setBills(bills: Bill[]): void {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }

  static getTransactions(): StockTransaction[] {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  }

  static setTransactions(transactions: StockTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}