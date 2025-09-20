import { useState, useMemo } from 'react';
import { Product, Bill, StockTransaction } from '@/types';
import { LocalStorage } from '@/lib/storage';
import { exportToExcel } from '@/lib/excel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, Filter, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Reports = () => {
  const [products] = useState<Product[]>(LocalStorage.getProducts());
  const [bills] = useState<Bill[]>(LocalStorage.getBills());
  const [transactions] = useState<StockTransaction[]>(LocalStorage.getTransactions());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesType = typeFilter === 'all' || product.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [products, statusFilter, typeFilter]);

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const matchesDate = (!start || billDate >= start) && (!end || billDate <= end);
      return matchesDate;
    });
  }, [bills, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const matchesDate = (!start || transactionDate >= start) && (!end || transactionDate <= end);
      return matchesDate;
    });
  }, [transactions, startDate, endDate]);

  const productTypes = useMemo(() => {
    return Array.from(new Set(products.map(p => p.type)));
  }, [products]);

  const summary = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const outOfStock = products.filter(p => p.status === 'out_of_stock').length;
    const totalValue = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
    const totalSalesValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalProfit = totalSalesValue - totalValue;
    
    const completedBills = filteredBills.filter(b => b.status === 'completed');
    const totalSales = completedBills.reduce((sum, b) => sum + b.total, 0);
    const avgBillValue = completedBills.length > 0 ? totalSales / completedBills.length : 0;
    
    return {
      totalProducts,
      activeProducts,
      outOfStock,
      totalValue,
      totalSalesValue,
      totalProfit,
      totalSales,
      avgBillValue,
      totalBills: filteredBills.length,
      completedBills: completedBills.length
    };
  }, [products, filteredBills]);

  const exportProducts = () => {
    const data = filteredProducts.map(product => ({
      'รหัสสินค้า': product.id,
      'ชื่อสินค้า': product.name,
      'ประเภท': product.type,
      'จำนวนคงเหลือ': product.quantity,
      'ราคาต้นทุน': product.cost,
      'ราคาขาย': product.price,
      'กำไร': product.profit,
      'สถานะ': product.status === 'active' ? 'พร้อมขาย' : 
              product.status === 'inactive' ? 'ไม่พร้อมขาย' : 'สินค้าหมด',
      'วันหมดอายุ': product.expirationDate || '',
      'วันที่สร้าง': new Date(product.createdAt).toLocaleDateString('th-TH'),
      'อัปเดตล่าสุด': new Date(product.updatedAt).toLocaleDateString('th-TH')
    }));

    exportToExcel(data, 'รายงานสินค้า');
    toast({ title: 'ส่งออกสำเร็จ', description: 'ไฟล์รายงานสินค้าได้รับการส่งออกแล้ว' });
  };

  const exportBills = () => {
    const data = filteredBills.map(bill => ({
      'เลขที่บิล': bill.billNumber,
      'สถานะ': bill.status === 'draft' ? 'ฉบับร่าง' : 
              bill.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก',
      'จำนวนรายการ': bill.items.length,
      'ยอดรวม': bill.subtotal,
      'ภาษี': bill.tax,
      'รวมทั้งสิ้น': bill.total,
      'ผู้สร้าง': bill.createdBy,
      'วันที่สร้าง': new Date(bill.createdAt).toLocaleDateString('th-TH'),
      'อัปเดตล่าสุด': new Date(bill.updatedAt).toLocaleDateString('th-TH')
    }));

    exportToExcel(data, 'รายงานบิล');
    toast({ title: 'ส่งออกสำเร็จ', description: 'ไฟล์รายงานบิลได้รับการส่งออกแล้ว' });
  };

  const exportTransactions = () => {
    const data = filteredTransactions.map(transaction => ({
      'รหัสธุรกรรม': transaction.id,
      'สินค้า': transaction.productName,
      'ประเภท': transaction.type === 'in' ? 'เข้า' : 
               transaction.type === 'out' ? 'ออก' : 'ปรับปรุง',
      'จำนวน': transaction.quantity,
      'เหตุผล': transaction.reason,
      'เลขที่บิล': transaction.billId || '',
      'ผู้บันทึก': transaction.createdBy,
      'วันที่': new Date(transaction.createdAt).toLocaleDateString('th-TH')
    }));

    exportToExcel(data, 'รายงานการเคลื่อนไหวสต็อก');
    toast({ title: 'ส่งออกสำเร็จ', description: 'ไฟล์รายงานการเคลื่อนไหวสต็อกได้รับการส่งออกแล้ว' });
  };

  const exportSummary = () => {
    const data = [
      { 'หัวข้อ': 'จำนวนสินค้าทั้งหมด', 'ค่า': summary.totalProducts },
      { 'หัวข้อ': 'สินค้าพร้อมขาย', 'ค่า': summary.activeProducts },
      { 'หัวข้อ': 'สินค้าหมด', 'ค่า': summary.outOfStock },
      { 'หัวข้อ': 'มูลค่าสต็อกรวม (บาท)', 'ค่า': summary.totalValue },
      { 'หัวข้อ': 'มูลค่าขายรวม (บาท)', 'ค่า': summary.totalSalesValue },
      { 'หัวข้อ': 'กำไรคาดการณ์ (บาท)', 'ค่า': summary.totalProfit },
      { 'หัวข้อ': 'ยอดขายรวม (บาท)', 'ค่า': summary.totalSales },
      { 'หัวข้อ': 'ค่าเฉลี่ยต่อบิล (บาท)', 'ค่า': summary.avgBillValue },
      { 'หัวข้อ': 'จำนวนบิลทั้งหมด', 'ค่า': summary.totalBills },
      { 'หัวข้อ': 'บิลที่เสร็จสิ้น', 'ค่า': summary.completedBills }
    ];

    exportToExcel(data, 'สรุปรายงาน');
    toast({ title: 'ส่งออกสำเร็จ', description: 'ไฟล์สรุปรายงานได้รับการส่งออกแล้ว' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">รายงานและส่งออกข้อมูล</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.totalProducts}</div>
              <div className="text-sm text-muted-foreground">สินค้าทั้งหมด</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">฿{summary.totalSales.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">ยอดขายรวม</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{summary.completedBills}</div>
              <div className="text-sm text-muted-foreground">บิลที่เสร็จสิ้น</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">฿{summary.totalProfit.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">กำไรคาดการณ์</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            ตัวกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">วันที่เริ่มต้น</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">วันที่สิ้นสุด</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">สถานะสินค้า</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">พร้อมขาย</option>
                <option value="inactive">ไม่พร้อมขาย</option>
                <option value="out_of_stock">สินค้าหมด</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">ประเภทสินค้า</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">รายงานสินค้า</TabsTrigger>
          <TabsTrigger value="bills">รายงานบิล</TabsTrigger>
          <TabsTrigger value="transactions">การเคลื่อนไหวสต็อก</TabsTrigger>
          <TabsTrigger value="summary">สรุปรายงาน</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>รายงานสินค้า ({filteredProducts.length} รายการ)</CardTitle>
              <Button onClick={exportProducts} className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                ส่งออก Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground">สินค้า</th>
                      <th className="text-right py-2 text-muted-foreground">คงเหลือ</th>
                      <th className="text-right py-2 text-muted-foreground">ต้นทุน</th>
                      <th className="text-right py-2 text-muted-foreground">ราคาขาย</th>
                      <th className="text-right py-2 text-muted-foreground">กำไร</th>
                      <th className="text-center py-2 text-muted-foreground">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice(0, 10).map((product) => (
                      <tr key={product.id} className="border-b border-border/50">
                        <td className="py-2">
                          <div>
                            <div className="font-medium text-foreground">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.type}</div>
                          </div>
                        </td>
                        <td className="py-2 text-right text-foreground">{product.quantity}</td>
                        <td className="py-2 text-right text-foreground">฿{product.cost.toLocaleString()}</td>
                        <td className="py-2 text-right text-foreground">฿{product.price.toLocaleString()}</td>
                        <td className="py-2 text-right text-accent">฿{product.profit.toLocaleString()}</td>
                        <td className="py-2 text-center">
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'พร้อมขาย' : 
                             product.status === 'inactive' ? 'ไม่พร้อมขาย' : 'สินค้าหมด'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length > 10 && (
                  <div className="text-center py-4 text-muted-foreground">
                    และอีก {filteredProducts.length - 10} รายการ (ส่งออกเพื่อดูทั้งหมด)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>รายงานบิล ({filteredBills.length} รายการ)</CardTitle>
              <Button onClick={exportBills} className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                ส่งออก Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground">เลขที่บิล</th>
                      <th className="text-center py-2 text-muted-foreground">สถานะ</th>
                      <th className="text-right py-2 text-muted-foreground">รายการ</th>
                      <th className="text-right py-2 text-muted-foreground">ยอดรวม</th>
                      <th className="text-left py-2 text-muted-foreground">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.slice(0, 10).map((bill) => (
                      <tr key={bill.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{bill.billNumber}</td>
                        <td className="py-2 text-center">
                          <Badge variant={bill.status === 'completed' ? 'default' : 'secondary'}>
                            {bill.status === 'draft' ? 'ฉบับร่าง' : 
                             bill.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-foreground">{bill.items.length}</td>
                        <td className="py-2 text-right text-foreground">฿{bill.total.toLocaleString()}</td>
                        <td className="py-2 text-foreground">
                          {new Date(bill.createdAt).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBills.length > 10 && (
                  <div className="text-center py-4 text-muted-foreground">
                    และอีก {filteredBills.length - 10} รายการ (ส่งออกเพื่อดูทั้งหมด)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>การเคลื่อนไหวสต็อก ({filteredTransactions.length} รายการ)</CardTitle>
              <Button onClick={exportTransactions} className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                ส่งออก Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground">สินค้า</th>
                      <th className="text-center py-2 text-muted-foreground">ประเภท</th>
                      <th className="text-right py-2 text-muted-foreground">จำนวน</th>
                      <th className="text-left py-2 text-muted-foreground">เหตุผล</th>
                      <th className="text-left py-2 text-muted-foreground">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{transaction.productName}</td>
                        <td className="py-2 text-center">
                          <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                            {transaction.type === 'in' ? 'เข้า' : 
                             transaction.type === 'out' ? 'ออก' : 'ปรับปรุง'}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-foreground">{transaction.quantity}</td>
                        <td className="py-2 text-foreground">{transaction.reason}</td>
                        <td className="py-2 text-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length > 10 && (
                  <div className="text-center py-4 text-muted-foreground">
                    และอีก {filteredTransactions.length - 10} รายการ (ส่งออกเพื่อดูทั้งหมด)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>สรุปรายงานระบบ</CardTitle>
              <Button onClick={exportSummary} className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                ส่งออก Excel
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">สรุปสินค้า</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">จำนวนสินค้าทั้งหมด:</span>
                      <span className="text-foreground">{summary.totalProducts} รายการ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">สินค้าพร้อมขาย:</span>
                      <span className="text-foreground">{summary.activeProducts} รายการ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">สินค้าหมด:</span>
                      <span className="text-destructive">{summary.outOfStock} รายการ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">มูลค่าสต็อกรวม:</span>
                      <span className="text-foreground">฿{summary.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">กำไรคาดการณ์:</span>
                      <span className="text-accent">฿{summary.totalProfit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-3">สรุปการขาย</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">จำนวนบิลทั้งหมด:</span>
                      <span className="text-foreground">{summary.totalBills} บิล</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">บิลที่เสร็จสิ้น:</span>
                      <span className="text-foreground">{summary.completedBills} บิล</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ยอดขายรวม:</span>
                      <span className="text-accent">฿{summary.totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ค่าเฉลี่ยต่อบิล:</span>
                      <span className="text-foreground">฿{summary.avgBillValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};