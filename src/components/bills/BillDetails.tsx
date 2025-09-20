import { Bill } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BillDetailsProps {
  bill: Bill;
  onBack: () => void;
}

export const BillDetails = ({ bill, onBack }: BillDetailsProps) => {
  const navigate = useNavigate();
  const getStatusBadge = (status: Bill['status']) => {
    const variants = {
      draft: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    } as const;
    
    const labels = {
      draft: 'ฉบับร่าง',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก'
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

  const handlePrint = () => {
    navigate(`/bills/export/${bill._id}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-muted-foreground hover:text-foreground print:hidden"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
        <div className="flex justify-between items-center print:block">
          <h1 className="text-2xl font-bold text-foreground">รายละเอียดบิล</h1>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 print:hidden">
            <ExternalLink className="mr-2 h-4 w-4" />
            ดูบิลมาตรฐาน
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Bill Header */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-foreground">{bill.billNumber}</CardTitle>
                <p className="text-muted-foreground mt-1">เลขที่บิล</p>
              </div>
              {getStatusBadge(bill.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">วันที่สร้าง</div>
                  <div className="text-foreground">{formatDate(bill.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">ผู้สร้าง</div>
                  <div className="text-foreground">{bill.createdBy}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">จำนวนรายการ</div>
                  <div className="text-foreground">{bill.items.length} รายการ</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill Items */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>รายการสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-muted-foreground">สินค้า</th>
                    <th className="text-right py-3 text-muted-foreground">ราคาต่อหน่วย</th>
                    <th className="text-right py-3 text-muted-foreground">จำนวน</th>
                    <th className="text-right py-3 text-muted-foreground">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 text-foreground">{item.productName}</td>
                      <td className="py-3 text-right text-foreground">
                        ฿{item.price.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-foreground">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-foreground font-medium">
                        ฿{item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>สรุปยอดรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ยอดรวม:</span>
                <span className="text-foreground">฿{bill.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ภาษี (7%):</span>
                <span className="text-foreground">฿{bill.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-foreground border-t border-border pt-3">
                <span>รวมทั้งสิ้น:</span>
                <span>฿{bill.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">รหัสบิล</div>
                <div className="font-mono text-xs bg-surface-variant p-2 rounded mt-1">
                  {bill.id}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">อัปเดตล่าสุด</div>
                <div className="text-foreground">{formatDate(bill.updatedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};