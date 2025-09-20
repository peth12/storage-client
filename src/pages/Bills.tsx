import { useState, useMemo, useEffect } from 'react';
import { Bill, Product } from '@/types';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, FileText } from 'lucide-react';
import { BillForm } from '@/components/bills/BillForm';
import { BillDetails } from '@/components/bills/BillDetails';
import { useToast } from '@/hooks/use-toast';

export const Bills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const API_HOST = import.meta.env.VITE_API_HOST;


  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Fetch bills from API with pagination and filters
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        const response = await axios.get(`${API_HOST}/api/bills`, { params });
        setBills(Array.isArray(response.data.items) ? response.data.items : []);
        setTotalPages(Math.ceil((response.data.total || 1) / itemsPerPage));
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลบิลได้' });
      }
    };
    fetchBills();
  }, [API_HOST, currentPage, itemsPerPage, searchTerm, statusFilter]);

  // Fetch products for bill form (if needed)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_HOST}/api/products`);
        setProducts(Array.isArray(response.data.items) ? response.data.items : []);
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchProducts();
  }, [API_HOST]);

  // No need to filter client-side, bills are already filtered from API
  const filteredBills = bills;


  const handleSaveBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const payload = {
        items: billData.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        status: billData.status,
        createdBy: billData.createdBy
      };
      const response = await axios.post(`${API_HOST}/api/bills`, payload);
      const newBill: Bill = {
        ...response.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setBills([...bills, newBill]);
      setShowForm(false);
      toast({
        title: 'สร้างบิลสำเร็จ',
        description: `บิลเลขที่ ${newBill.billNumber} ได้รับการสร้างแล้ว`
      });
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้างบิลได้' });
    }
  };

  const handleViewDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setShowDetails(true);
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showForm) {
    return (
      <BillForm
        products={products}
        onSave={handleSaveBill}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (showDetails && selectedBill) {
    return (
      <BillDetails
        bill={selectedBill}
        onBack={() => {
          setShowDetails(false);
          setSelectedBill(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">จัดการบิล</h1>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          สร้างบิลใหม่
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-lg">ค้นหาและกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเลขที่บิล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="draft">ฉบับร่าง</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
            <div></div>
            <div className="text-sm text-muted-foreground flex items-center">
              พบ {filteredBills.length} รายการ
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <Card key={bill._id} className="bg-surface border-border hover:bg-surface-variant transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{bill.billNumber}</h3>
                    {getStatusBadge(bill.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    สร้างเมื่อ: {formatDate(bill.createdAt)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    จำนวนรายการ: {bill.items.length} รายการ
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-foreground">
                    ฿{bill.total.toLocaleString()}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(bill)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      ดูรายละเอียด
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ก่อนหน้า
          </Button>
          <span className="mx-2 text-sm">
            หน้า {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ถัดไป
          </Button>
        </div>
      )}

      {filteredBills.length === 0 && (
        <Card className="bg-surface border-border">
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">ไม่พบบิลที่ตรงกับเงื่อนไขการค้นหา</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};