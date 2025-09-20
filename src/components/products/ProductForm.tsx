import { useState, useRef } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    type: product?.type || '',
    quantity: product?.quantity || 0,
    price: product?.price || 0,
    cost: product?.cost || 0,
    status: product?.status || 'active' as Product['status'],
    expirationDate: product?.expirationDate || '',
    image: product?.image || ''
  });

  const profit = formData.price - formData.cost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      profit
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          image: imageDataUrl
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
        </h1>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>ข้อมูลสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-foreground">ชื่อสินค้า *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-foreground">ประเภทสินค้า *</Label>
                <Input
                  id="type"
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-foreground">จำนวนคงเหลือ *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cost" className="text-foreground">ราคาต้นทุน (บาท) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-foreground">ราคาขาย (บาท) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-foreground">สถานะสินค้า</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as Product['status'])}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">พร้อมขาย</option>
                  <option value="inactive">ไม่พร้อมขาย</option>
                  <option value="out_of_stock">สินค้าหมด</option>
                </select>
              </div>
              <div>
                <Label htmlFor="expirationDate" className="text-foreground">วันที่หมดอายุ</Label>
                {/* <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  className="mt-1"
                /> */}

                <input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-600 
             bg-gray-800 text-white px-3 py-2 text-sm
             focus:border-primary focus:ring-2 focus:ring-primary"
                />



              </div>
            </div>

            {/* Profit Display */}
            <div className="bg-surface-variant rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">กำไรต่อหน่วย:</span>
                <span className={`font-medium ${profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  ฿{profit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">เปอร์เซ็นต์กำไร:</span>
                <span className={`font-medium ${profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formData.cost > 0 ? ((profit / formData.cost) * 100).toFixed(2) : 0}%
                </span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                {product ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};