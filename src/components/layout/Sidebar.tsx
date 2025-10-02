import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Home, 
  Receipt, 
  FileBarChart, 
  LogOut, 
  User,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'หน้าหลัก', href: '/dashboard', icon: Home },
  { name: 'จัดการสินค้า', href: '/products', icon: Package },
  { name: 'จัดการบิล', href: '/bills', icon: Receipt },
  { name: 'รายงาน', href: '/reports', icon: FileBarChart },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="print:hidden flex h-full w-64 flex-col bg-surface border-r border-border">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b border-border bg-gradient-primary">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-white" />
          <span className="text-lg font-bold text-white">ระบบจัดการสต็อก</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-surface-variant hover:text-foreground'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">ธีม</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-surface-variant"
        >
          <LogOut className="mr-3 h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
};