import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Calendar, Package } from 'lucide-react';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onEdit: () => void;
}

export const ProductDetails = ({ product, onBack, onEdit }: ProductDetailsProps) => {
  const getStatusBadge = (status: Product['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      out_of_stock: 'destructive'
    } as const;
    
    const labels = {
      active: 'พร้อมขาย',
      inactive: 'ไม่พร้อมขาย',
      out_of_stock: 'สินค้าหมด'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">รายละเอียดสินค้า</h1>
          <Button onClick={onEdit} className="bg-primary hover:bg-primary/90">
            <Edit className="mr-2 h-4 w-4" />
            แก้ไข
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image */}
          {product.image && (
            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle>รูปภาพสินค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full max-w-md h-64 object-cover rounded-lg border border-border mx-auto"
                />
              </CardContent>
            </Card>
          )}

          <Card className="bg-surface border-border">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-foreground">{product.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{product.type}</p>
                </div>
                {getStatusBadge(product.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-muted-foreground">
                    <Package className="mr-2 h-4 w-4" />
                    จำนวนคงเหลือ
                  </div>
                  <p className="text-2xl font-bold text-foreground">{product.quantity} หน่วย</p>
                </div>
                <div className="space-y-2">
                  <div className="text-muted-foreground">ราคาขาย</div>
                  <p className="text-2xl font-bold text-foreground">฿{product.price.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle>ข้อมูลทางการเงิน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-surface-variant rounded-lg">
                  <div className="text-sm text-muted-foreground">ราคาต้นทุน</div>
                  <div className="text-xl font-bold text-foreground">฿{product.cost.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-surface-variant rounded-lg">
                  <div className="text-sm text-muted-foreground">ราคาขาย</div>
                  <div className="text-xl font-bold text-foreground">฿{product.price.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <div className="text-sm text-muted-foreground">กำไรต่อหน่วย</div>
                  <div className="text-xl font-bold text-accent">฿{product.profit.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-surface-variant rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">เปอร์เซ็นต์กำไร:</span>
                  <span className="font-medium text-accent">
                    {product.cost > 0 ? ((product.profit / product.cost) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">มูลค่าคงเหลือ:</span>
                  <span className="font-medium text-foreground">
                    ฿{(product.cost * product.quantity).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">มูลค่าขาย:</span>
                  <span className="font-medium text-foreground">
                    ฿{(product.price * product.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Information */}
        <div className="space-y-6">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                ข้อมูลวันที่
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">วันที่เพิ่ม</div>
                <div className="text-sm text-foreground">{formatDate(product.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">อัปเดตล่าสุด</div>
                <div className="text-sm text-foreground">{formatDate(product.updatedAt)}</div>
              </div>
              {product.expirationDate && (
                <div>
                  <div className="text-sm text-muted-foreground">วันหมดอายุ</div>
                  <div className="text-sm text-foreground">
                    {new Date(product.expirationDate).toLocaleDateString('th-TH')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle>สถานะสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สถานะปัจจุบัน:</span>
                  {getStatusBadge(product.status)}
                </div>
                
                {product.quantity === 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <div className="text-sm text-destructive font-medium">⚠️ สินค้าหมด</div>
                    <div className="text-xs text-destructive/80 mt-1">
                      ต้องเติมสต็อกก่อนขาย
                    </div>
                  </div>
                )}
                
                {product.quantity > 0 && product.quantity <= 5 && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <div className="text-sm text-yellow-600 font-medium">⚠️ สต็อกเหลือน้อย</div>
                    <div className="text-xs text-yellow-600/80 mt-1">
                      ควรเติมสต็อกเร็วๆ นี้
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle>รหัสสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Product ID</div>
              <div className="font-mono text-xs bg-surface-variant p-2 rounded mt-1">
                {product.id}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};