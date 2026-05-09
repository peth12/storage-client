import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product, Bill, StockTransaction } from '@/types';
import {
  Package,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Activity,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ProductForm } from '@/components/products/ProductForm';
import { useToast } from '@/hooks/use-toast';
import { getPeriodLabel, getPeriodRange, isWithinDateRange, periodOptions, ReportPeriod } from '@/lib/period';

interface DashboardInformation {
  totalBills: number;
  totalProducts: number;
  totalSoldProducts: number;
  totalIncome: number;
}

const initialRange = getPeriodRange('day');
const formatCurrency = (value = 0) => `฿${value.toLocaleString()}`;

export const Dashboard = () => {
  const [lowProducts, setLowProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [information, setInformation] = useState<DashboardInformation | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [startDate, setStartDate] = useState(initialRange.startInput);
  const [endDate, setEndDate] = useState(initialRange.endInput);
  const API_HOST = import.meta.env.VITE_API_HOST;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      const [
        response,
        responseProducts,
        responseExpired,
        responseInformation,
        responseBills,
        responseTransactions
      ] = await Promise.all([
        axios.get(`${API_HOST}/api/products/low-stock`),
        axios.get(`${API_HOST}/api/products`, { params: { limit: 9999 } }),
        axios.get(`${API_HOST}/api/products/expired`),
        axios.get(`${API_HOST}/api/dashboard`),
        axios.get(`${API_HOST}/api/bills`, { params: { limit: 9999 } }),
        axios.get(`${API_HOST}/api/transactions`, { params: { limit: 9999 } }),
      ]);
      setProducts(Array.isArray(responseProducts.data.items) ? responseProducts.data.items : []);
      setLowProducts(Array.isArray(response.data) ? response.data : []);
      setInformation(responseInformation.data);
      setExpiredProducts(Array.isArray(responseExpired.data) ? responseExpired.data : []);
      setBills(Array.isArray(responseBills.data.items) ? responseBills.data.items : []);
      setTransactions(Array.isArray(responseTransactions.data.items) ? responseTransactions.data.items : []);
    };
    fetchLowStockProducts();
  }, [API_HOST]);

  const handlePeriodChange = (nextPeriod: Exclude<ReportPeriod, 'custom'>) => {
    const range = getPeriodRange(nextPeriod);
    setPeriod(nextPeriod);
    setStartDate(range.startInput);
    setEndDate(range.endInput);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      try {
        // Call API to update product
        const response = await axios.put(
          `${API_HOST}/api/products/${editingProduct._id || editingProduct.id}`,
          productData
        );
        const updatedProduct = {
          ...editingProduct,
          ...response.data,
          updatedAt: new Date().toISOString()
        };
        const updatedProducts = products.map(p =>
          (p._id || p.id) === (editingProduct._id || editingProduct.id) ? updatedProduct : p
        );
        setProducts(updatedProducts);
        toast({ title: 'แก้ไขสินค้าสำเร็จ', description: 'ข้อมูลสินค้าได้รับการอัปเดตแล้ว' });
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถอัปเดตสินค้าได้' });
      }
    } else {
      try {
        // Call API to create product
        const response = await axios.post(`${API_HOST}/api/products`, productData);
        const newProduct: Product = {
          ...response.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProducts([...products, newProduct]);
        toast({ title: 'เพิ่มสินค้าสำเร็จ', description: 'สินค้าใหม่ได้รับการเพิ่มแล้ว' });
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเพิ่มสินค้าได้' });
      }
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const lowStockProducts = lowProducts;

  const periodLabel = getPeriodLabel(period, startDate, endDate);

  const periodSummary = useMemo(() => {
    const periodBills = bills.filter(bill => isWithinDateRange(bill.createdAt, startDate, endDate));
    const completedBills = periodBills.filter(bill => bill.status === 'completed');
    const periodTransactions = transactions.filter(transaction => isWithinDateRange(transaction.createdAt, startDate, endDate));
    const soldItems = periodTransactions
      .filter(transaction => transaction.type === 'out')
      .reduce((sum, transaction) => sum + transaction.quantity, 0);
    const totalRevenue = completedBills.reduce((sum, bill) => sum + bill.total, 0);

    return {
      totalBills: periodBills.length,
      completedBills: completedBills.length,
      totalRevenue,
      soldItems,
      transactions: periodTransactions.length,
    };
  }, [bills, transactions, startDate, endDate]);

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={handleSaveProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-muted-foreground">ภาพรวมระบบจัดการสต็อกสินค้า ({periodLabel})</p>
        </div>
        <div className="flex rounded-md border border-border bg-surface p-1">
          {periodOptions.map(option => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={period === option.value ? 'default' : 'ghost'}
              onClick={() => handlePeriodChange(option.value)}
              className={period === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              สินค้าทั้งหมด
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{information?.totalProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              สินค้าทั้งระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              สินค้าหมด
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{information?.totalSoldProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              ต้องเติมสต็อก
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              บิลเสร็จสิ้น
            </CardTitle>
            <Receipt className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{periodSummary.completedBills}</div>
            <p className="text-xs text-muted-foreground">
              จาก {periodSummary.totalBills} บิลในช่วงนี้
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยอดขายรวม
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(periodSummary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodLabel}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              จำนวนสินค้าที่ขายออก
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{periodSummary.soldItems}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายการเคลื่อนไหวสต็อก
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{periodSummary.transactions}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Low Stock Alert */}
        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">สินค้าใกล้หมด</CardTitle>
              <CardDescription>สินค้าที่เหลือน้อยกว่า 5 ชิ้น</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/products')}
              className="border-border"
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                ไม่มีสินค้าที่ใกล้หมด
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-surface-variant rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-warning">
                        เหลือ {product.quantity} ชิ้น
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ฿{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* expired products */}
        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">สินค้าที่หมดอายุ</CardTitle>
              <CardDescription>สินค้าที่หมดอายุแล้ว</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/products')}
              className="border-border"
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {expiredProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                ไม่มีสินค้าที่หมดอายุ
              </p>
            ) : (
              <div className="space-y-3">
                {expiredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-surface-variant rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-red-600">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        เหลือ {product.quantity} ชิ้น
                      </p>
                      <p className="text-sm text-red-600">
                        ฿{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="bg-surface border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">บิลล่าสุด</CardTitle>
              <CardDescription>ธุรกรรมที่เพิ่งทำไป</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bills')}
              className="border-border"
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                ยังไม่มีบิล
              </p>
            ) : (
              <div className="space-y-3">
                {recentBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-surface-variant rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{bill.billNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(bill.createdAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ฿{bill.total.toLocaleString()}
                      </p>
                      <p className={`text-sm capitalize ${bill.status === 'completed' ? 'text-success' :
                        bill.status === 'draft' ? 'text-warning' :
                          'text-destructive'
                        }`}>
                        {bill.status === 'completed' ? 'เสร็จสมบูรณ์' :
                          bill.status === 'draft' ? 'ร่าง' : 'ยกเลิก'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-surface border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-foreground">การดำเนินการด่วน</CardTitle>
          <CardDescription>เข้าถึงฟีเจอร์หลักได้อย่างรวดเร็ว</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setShowForm(true)}
              className="h-20 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2" />
                <span>เพิ่มสินค้าใหม่</span>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/sales')}
              className="h-20 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <div className="text-center">
                <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                <span>ขายสินค้า</span>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/reports')}
              className="h-20 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <span>ดูรายงาน</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
