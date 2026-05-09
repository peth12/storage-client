import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductDetails } from '@/components/products/ProductDetails';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const getExpirationState = (expirationDate?: string) => {
  if (!expirationDate) return 'normal';

  const today = new Date();
  const exp = new Date(expirationDate);

  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring_soon';
  return 'normal';
};

const getEffectiveProductStatus = (product: Product): Product['status'] => {
  if (product.quantity === 0) return 'out_of_stock';
  if (getExpirationState(product.expirationDate) === 'expired') return 'inactive';
  if (product.status === 'out_of_stock') return 'active';
  return product.status;
};

const getProductCode = (product: Product) => product.appId || product._id || product.id || '-';

interface DuplicateProductConflict {
  appId: string;
  product: Product;
}

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [duplicateConflict, setDuplicateConflict] = useState<DuplicateProductConflict | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const API_HOST = import.meta.env.VITE_API_HOST;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {
          limit: 9999,
        };
        const response = await axios.get(`${API_HOST}/api/products`, { params });
        setProducts(Array.isArray(response.data.items) ? response.data.items : []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลสินค้าได้' });
      }
    };
    fetchProducts();
  }, [API_HOST, toast]);

  useEffect(() => {
    const fetchProductFromRoute = async () => {
      if (!productId) return;

      try {
        const response = await axios.get(`${API_HOST}/api/products/${productId}`);
        const product = response.data;
        if (searchParams.get('mode') === 'edit') {
          setEditingProduct(product);
          setShowForm(true);
          setShowDetails(false);
          setSelectedProduct(null);
        } else {
          setSelectedProduct(product);
          setShowDetails(true);
          setShowForm(false);
          setEditingProduct(null);
        }
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่พบสินค้าที่ต้องการ' });
        navigate('/products', { replace: true });
      }
    };

    fetchProductFromRoute();
  }, [API_HOST, navigate, productId, searchParams, toast]);



  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        getProductCode(p).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || getEffectiveProductStatus(p) === statusFilter;
      const matchesType = typeFilter === "all" || p.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [products, searchTerm, statusFilter, typeFilter]);


  const productTypes = useMemo(() => {

    if (!products) return [];
    return Array.from(new Set(products.map(p => p.type)));
  }, [products]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [currentPage, filteredProducts, itemsPerPage]);

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage)));
  }, [filteredProducts.length, itemsPerPage]);

  const getProductId = (product: Product) => product._id || product.id;

  const openDuplicateConflict = (error: unknown, fallbackCode?: string) => {
    if (!axios.isAxiosError(error)) return false;
    if (error.response?.status !== 409) return false;

    const details = error.response.data?.details;
    if (details?.code !== 'DUPLICATE_PRODUCT_CODE' || !details.conflictProduct) return false;

    setDuplicateConflict({
      appId: details.conflictProduct.appId || fallbackCode || '',
      product: details.conflictProduct,
    });
    return true;
  };

  const goToDuplicateProduct = async () => {
    if (!duplicateConflict?.product) return;

    const duplicateProductId = getProductId(duplicateConflict.product);
    setDuplicateConflict(null);
    navigate(`/products/${duplicateProductId}?mode=edit`);

    try {
      const response = await axios.get(`${API_HOST}/api/products/${duplicateProductId}`);
      setEditingProduct(response.data);
      setShowForm(true);
      setShowDetails(false);
      setSelectedProduct(null);
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเปิดสินค้าที่มีรหัสซ้ำได้' });
    }
  };

  const duplicateConflictDialog = (
    <AlertDialog open={Boolean(duplicateConflict)} onOpenChange={(open) => !open && setDuplicateConflict(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>รหัสสินค้านี้มีอยู่แล้ว</AlertDialogTitle>
          <AlertDialogDescription>
            รหัสสินค้า <span className="font-mono text-foreground">{duplicateConflict?.appId || '-'}</span> ถูกใช้กับสินค้า
            <span className="font-medium text-foreground"> {duplicateConflict?.product?.name || '-'}</span>
            {duplicateConflict?.product?.type ? ` (${duplicateConflict.product.type})` : ''} แล้ว
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md border border-border bg-surface-variant p-3 text-sm">
          <div className="text-muted-foreground">สินค้าที่ใช้รหัสนี้</div>
          <div className="mt-1 font-medium text-foreground">{duplicateConflict?.product?.name || '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">รหัส: {duplicateConflict?.product ? getProductCode(duplicateConflict.product) : '-'}</div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>ปิด</AlertDialogCancel>
          <AlertDialogAction onClick={goToDuplicateProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
            ไปแก้ไขสินค้านี้
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

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
        setShowForm(false);
        setEditingProduct(null);
        navigate('/products');
      } catch (error) {
        if (openDuplicateConflict(error, productData.appId)) return;
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
        setShowForm(false);
        setEditingProduct(null);
      } catch (error) {
        if (openDuplicateConflict(error, productData.appId)) return;
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเพิ่มสินค้าได้' });
      }
    }
  };
  // ...existing code...

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
    navigate(`/products/${getProductId(product)}?mode=edit`);
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
    navigate(`/products/${getProductId(product)}`);
  };

  const getAvailabilityBadge = (product: Product) => {
    const effectiveStatus = getEffectiveProductStatus(product);

    if (effectiveStatus === 'out_of_stock') {
      return <Badge className="bg-destructive text-destructive-foreground">สินค้าหมด</Badge>;
    }

    if (effectiveStatus === 'inactive') {
      return <Badge variant="secondary">ไม่พร้อมขาย</Badge>;
    }

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
      <Badge variant={variants[effectiveStatus]}>
        {labels[effectiveStatus]}
      </Badge>
    );
  };

  const getExpirationBadge = (product: Product) => {
    if (getEffectiveProductStatus(product) === 'out_of_stock') return null;

    const expirationState = getExpirationState(product.expirationDate);
    if (expirationState === 'expired') {
      return <Badge className="bg-destructive text-destructive-foreground">หมดอายุ</Badge>;
    }
    if (expirationState === 'expiring_soon') {
      return <Badge className="bg-yellow-500 text-black">ใกล้หมดอายุ</Badge>;
    }
    return null;
  };

  if (showForm) {
    return (
      <>
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
            navigate('/products');
          }}
        />
        {duplicateConflictDialog}
      </>
    );
  }

  if (showDetails && selectedProduct) {
    return (
      <ProductDetails
        product={selectedProduct}
        onBack={() => {
          setShowDetails(false);
          setSelectedProduct(null);
          navigate('/products');
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 border-border bg-background/80 text-foreground shadow-inner focus:ring-1 focus:ring-primary focus:ring-offset-0">
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover text-popover-foreground">
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="active">พร้อมขาย</SelectItem>
                <SelectItem value="inactive">ไม่พร้อมขาย</SelectItem>
                <SelectItem value="out_of_stock">สินค้าหมด</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 border-border bg-background/80 text-foreground shadow-inner focus:ring-1 focus:ring-primary focus:ring-offset-0">
                <SelectValue placeholder="ประเภททั้งหมด" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover text-popover-foreground">
                <SelectItem value="all">ประเภททั้งหมด</SelectItem>
                {productTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-md border border-transparent px-1 text-sm text-muted-foreground">
              พบ {filteredProducts.length} รายการ
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => (
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
                {getAvailabilityBadge(product)}
                {getExpirationBadge(product)}
              </div>
              <p className="text-sm text-muted-foreground">{product.type}</p>
              <p className="text-xs font-mono text-muted-foreground">รหัส: {getProductCode(product)}</p>
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
      {duplicateConflictDialog}
    </div>
  );
};
