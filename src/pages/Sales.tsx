import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Minus, Plus, Receipt, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  total: number;
  stock: number;
}

const TAX_RATE = 0.07;

const getProductId = (product: Product) => product._id || product.id;
const getProductCode = (product: Product) => product.appId || product._id || product.id || '-';

const isExpired = (expirationDate?: string) => {
  if (!expirationDate) return false;
  const today = new Date();
  const exp = new Date(expirationDate);
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  return exp.getTime() < today.getTime();
};

const formatCurrency = (value: number) => `฿${value.toLocaleString('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

export const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_HOST = import.meta.env.VITE_API_HOST;
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_HOST}/api/products`, { params: { limit: 9999 } });
        setProducts(Array.isArray(response.data.items) ? response.data.items : []);
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดสินค้าได้' });
      }
    };

    fetchProducts();
  }, [API_HOST, toast]);

  const availableProducts = useMemo(() => {
    return products.filter(product => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch = !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.type.toLowerCase().includes(keyword) ||
        getProductCode(product).toLowerCase().includes(keyword);

      return matchesSearch &&
        product.status !== 'inactive' &&
        product.quantity > 0 &&
        !isExpired(product.expirationDate);
    });
  }, [products, searchTerm]);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const addToCart = (product: Product) => {
    const productId = getProductId(product);
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      updateQuantity(productId, existingItem.quantity + 1);
      return;
    }

    setCart(items => [
      ...items,
      {
        productId,
        productName: product.name,
        productCode: getProductCode(product),
        quantity: 1,
        price: product.price,
        total: product.price,
        stock: product.quantity,
      },
    ]);
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    const currentItem = cart.find(item => item.productId === productId);
    if (!currentItem) return;

    if (nextQuantity <= 0) {
      setCart(items => items.filter(item => item.productId !== productId));
      return;
    }

    if (nextQuantity > currentItem.stock) {
      toast({
        title: 'สินค้าไม่พอ',
        description: `${currentItem.productName} เหลือ ${currentItem.stock} หน่วย`,
      });
      return;
    }

    setCart(items => items.map(item =>
      item.productId === productId
        ? { ...item, quantity: nextQuantity, total: nextQuantity * item.price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(items => items.filter(item => item.productId !== productId));
  };

  const completeSale = async () => {
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${API_HOST}/api/bills`, {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        status: 'completed',
        createdBy: user?.id || user?.username || 'staff',
      });

      const soldQuantities = new Map(cart.map(item => [item.productId, item.quantity]));
      setProducts(currentProducts => currentProducts.map(product => {
        const soldQuantity = soldQuantities.get(getProductId(product)) || 0;
        return soldQuantity > 0
          ? { ...product, quantity: Math.max(0, product.quantity - soldQuantity) }
          : product;
      }));
      setCart([]);
      toast({
        title: 'ขายสำเร็จ',
        description: `บิล ${response.data.billNumber} ถูกสร้างแล้ว`,
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'ไม่สามารถทำรายการขายได้'
        : 'ไม่สามารถทำรายการขายได้';
      toast({ title: 'เกิดข้อผิดพลาด', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ขายสินค้า</h1>
          <p className="text-sm text-muted-foreground">เลือกสินค้าเข้าตะกร้าเพื่อคิดเงินและสร้างบิลขาย</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/bills')}>
          <Receipt className="mr-2 h-4 w-4" />
          ดูบิลทั้งหมด
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-lg">เลือกสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ค้นหาชื่อสินค้า ประเภท หรือรหัสสินค้า..."
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {availableProducts.map(product => (
              <Card key={getProductId(product)} className="bg-surface border-border hover:bg-surface-variant transition-colors">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.type}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">รหัส: {getProductCode(product)}</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">พร้อมขาย</Badge>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">คงเหลือ</div>
                      <div className="font-semibold text-foreground">{product.quantity} หน่วย</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ราคาขาย</div>
                      <div className="font-semibold text-foreground">{formatCurrency(product.price)}</div>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => addToCart(product)}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มเข้าตะกร้า
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {availableProducts.length === 0 && (
            <Card className="bg-surface border-border">
              <CardContent className="py-10 text-center text-muted-foreground">
                ไม่พบสินค้าพร้อมขายที่ตรงกับคำค้นหา
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-surface border-border xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              ตะกร้าขาย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="rounded-md border border-dashed border-border py-12 text-center text-muted-foreground">
                ยังไม่มีสินค้าในตะกร้า
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productId} className="rounded-md bg-surface-variant p-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{item.productName}</div>
                        <div className="font-mono text-xs text-muted-foreground">รหัส: {item.productCode}</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(item.price)} ต่อหน่วย</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.productId, parseInt(event.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="font-semibold text-foreground">{formatCurrency(item.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>ยอดรวม</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>ภาษี 7%</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-xl font-bold text-foreground">
                <span>รวมทั้งสิ้น</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              disabled={cart.length === 0 || isSubmitting}
              onClick={completeSale}
              className="h-12 w-full bg-primary text-base hover:bg-primary/90"
            >
              {isSubmitting ? 'กำลังขาย...' : 'ขายและสร้างบิล'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
