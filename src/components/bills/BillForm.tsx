import { useState } from 'react';
import { Bill, BillCreate, BillItem, Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';

interface BillFormProps {
  products: Product[];
  onSave: (bill: BillCreate) => void;
  onCancel: () => void;
}

export const BillForm = ({ products, onSave, onCancel }: BillFormProps) => {
  const { user } = useAuth();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const availableProducts = products.filter(p => 
    p.status === 'active' && 
    p.quantity > 0 &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BIL${year}${month}${day}${random}`;
  };

  const addProductToBill = () => {
    console.log('Adding product to bill:', selectedProduct, quantity);
    if (!selectedProduct) return;

    const existingItem = billItems.find(item => item.productId === selectedProduct._id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > selectedProduct.quantity) {
        alert(`สินค้าในสต็อกเหลือเพียง ${selectedProduct.quantity} หน่วย`);
        return;
      }

      console.log('Updating existing item:', existingItem, newQuantity);
      
      setBillItems(items => items.map(item =>
        item.productId === selectedProduct._id
          ? { ...item, quantity: newQuantity, total: newQuantity * selectedProduct.price }
          : item
      ));
    } else {
      if (quantity > selectedProduct.quantity) {
        alert(`สินค้าในสต็อกเหลือเพียง ${selectedProduct.quantity} หน่วย`);
        return;
      }

      const newItem: BillItem = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        quantity,
        price: selectedProduct.price,
        total: quantity * selectedProduct.price
      };
      setBillItems([...billItems, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
  };

  const removeFromBill = (productId: string) => {
    setBillItems(items => items.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.quantity) {
      alert(`สินค้าในสต็อกเหลือเพียง ${product.quantity} หน่วย`);
      return;
    }

    if (newQuantity <= 0) {
      removeFromBill(productId);
      return;
    }

    setBillItems(items => items.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.07; // 7% VAT
  const total = subtotal + tax;

  const handleSubmit = (status: Bill['status']) => {
    if (billItems.length === 0) {
      alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    console.log('Bill data:', billItems);

    // Prepare items for API: only productId and quantity
    const items = billItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    // Only send required fields to API
    const billData = {
      items,
      status,
      createdBy: user?.id || ''
    };

    console.log('Submitting bill:', billData);

    onSave(billData);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold text-foreground">สร้างบิลใหม่</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Products */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>เพิ่มสินค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">ค้นหาสินค้า</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ค้นหาชื่อสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {searchTerm && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-surface-variant hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          คงเหลือ: {product.quantity} หน่วย
                        </div>
                      </div>
                      <div className="text-foreground font-medium">
                        ฿{product.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-4 p-4 bg-surface-variant rounded-lg">
                <div>
                  <div className="font-medium text-foreground">{selectedProduct.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ราคา: ฿{selectedProduct.price.toLocaleString()} | 
                    คงเหลือ: {selectedProduct.quantity} หน่วย
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="quantity">จำนวน</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addProductToBill}>
                      <Plus className="h-4 w-4 mr-1" />
                      เพิ่ม
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>รายการสินค้าในบิล</CardTitle>
          </CardHeader>
          <CardContent>
            {billItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีรายการสินค้า
              </div>
            ) : (
              <div className="space-y-4">
                {billItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center p-3 bg-surface-variant rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        ฿{item.price.toLocaleString()} x {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                      />
                      <div className="w-20 text-right font-medium text-foreground">
                        ฿{item.total.toLocaleString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromBill(item.productId)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {billItems.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>ยอดรวม:</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>ภาษี (7%):</span>
                  <span>฿{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-foreground border-t border-border pt-2">
                  <span>รวมทั้งสิ้น:</span>
                  <span>฿{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={billItems.length === 0}
                className="flex-1"
              >
                บันทึกฉบับร่าง
              </Button>
              <Button
                onClick={() => handleSubmit('completed')}
                disabled={billItems.length === 0}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                ขายและตัดสต็อก
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};