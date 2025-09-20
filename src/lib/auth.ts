import { User } from '@/types';

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@stock.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'staff',
    email: 'staff@stock.com',
    role: 'staff',
    createdAt: new Date().toISOString()
  }
];

export const mockLogin = async (username: string, password: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple mock authentication
  if ((username === 'admin' && password === 'admin123') || 
      (username === 'staff' && password === 'staff123')) {
    const user = MOCK_USERS.find(u => u.username === username);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
  }
  
  return null;
};

export const mockLogout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};