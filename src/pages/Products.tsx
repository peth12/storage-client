import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types';
import { LocalStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductDetails } from '@/components/products/ProductDetails';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9; 
  const { toast } = useToast();
  const API_HOST = import.meta.env.VITE_API_HOST;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        const response = await axios.get(`${API_HOST}/api/products`, { params });
        setProducts(Array.isArray(response.data.items) ? response.data.items : []);
        setTotalPages(Math.ceil((response.data.total || 1) / itemsPerPage));
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลสินค้าได้' });
      }
    };
    fetchProducts();
  }, [API_HOST, currentPage, itemsPerPage, searchTerm, statusFilter, typeFilter]);



  // No need to filter client-side, products are already filtered from API
  const filteredProducts = products;

  const productTypes = useMemo(() => {

    if (!products) return [];
    return Array.from(new Set(products.map(p => p.type)));
  }, [products]);

  function getStatusProduct(expirationDate: string) {
  if (!expirationDate) return null;

  const today = new Date();
  const exp = new Date(expirationDate);

  // Normalize เวลา
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays < 0) {
    return <Badge className="bg-destructive text-destructive-foreground">หมดอายุ</Badge>;
  } else if (diffDays <= 7) {
    return <Badge className="bg-yellow-500 text-black">ใกล้หมดอายุ</Badge>;
  } else {
    return <Badge className="bg-green-600 text-white">ปกติ</Badge>;
  }
}

  // ...existing code...
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
  // ...existing code...

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

const handleDeleteProduct = async (product: Product) => {
  if (!product) return;
  try {
    await axios.delete(`${API_HOST}/api/products/${product._id || product.id}`);
    const updatedProducts = products.filter(p => (p._id || p.id) !== (product._id || product.id));
    setProducts(updatedProducts);
    toast({ title: 'ลบสินค้าสำเร็จ', description: 'สินค้าได้รับการลบออกจากระบบแล้ว' });
  } catch (error) {
    toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบสินค้าได้' });
  }
};

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

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

  if (showDetails && selectedProduct) {
    return (
      <ProductDetails
        product={selectedProduct}
        onBack={() => {
          setShowDetails(false);
          setSelectedProduct(null);
        }}
        onEdit={() => {
          setShowDetails(false);
          handleEditProduct(selectedProduct);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">จัดการสินค้า</h1>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มสินค้าใหม่
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
                placeholder="ค้นหาสินค้า..."
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
              <option value="active">พร้อมขาย</option>
              <option value="inactive">ไม่พร้อมขาย</option>
              <option value="out_of_stock">สินค้าหมด</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">ประเภททั้งหมด</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="text-sm text-muted-foreground flex items-center">
              พบ {filteredProducts.length} รายการ
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product._id} className="bg-surface border-border hover:bg-surface-variant transition-colors">
            {product.image && (
              <div className="aspect-video">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-foreground">{product.name}</CardTitle>
                {getStatusBadge(product.status)}
                {getStatusProduct(product.expirationDate)}
              </div>
              <p className="text-sm text-muted-foreground">{product.type}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">คงเหลือ:</span>
                  <span className="ml-2 font-medium text-foreground">{product.quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ราคาขาย:</span>
                  <span className="ml-2 font-medium text-foreground">฿{product.price.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ต้นทุน:</span>
                  <span className="ml-2 font-medium text-foreground">฿{product.cost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">กำไร:</span>
                  <span className="ml-2 font-medium text-accent">฿{product.profit.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(product)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  ดู
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  แก้ไข
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProduct(product)}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  ลบ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Pagination Controls */}
      {/* {totalPages > 1 && ( */}
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
      {/* )} */}

      {filteredProducts.length === 0 && (
        <Card className="bg-surface border-border">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};