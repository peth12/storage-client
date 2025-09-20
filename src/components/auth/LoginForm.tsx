import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Lock, User } from 'lucide-react';

export const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const success = await login(username, password);
    
    if (success) {
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับเข้าสู่ระบบจัดการสต็อก"
      });
    } else {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-primary rounded-2xl shadow-elevated">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">ระบบจัดการสต็อก</h1>
          <p className="text-muted-foreground mt-2">เข้าสู่ระบบเพื่อจัดการสินค้าและบิล</p>
        </div>

        <Card className="border-border bg-surface shadow-elevated">
          <CardHeader>
            <CardTitle className="text-center">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-center">
              กรอกข้อมูลเพื่อเข้าสู่ระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">ชื่อผู้ใช้</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="กรอกชื่อผู้ใช้"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-input border-border"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-input border-border"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {/* <p>ข้อมูลสำหรับทดสอบ:</p> */}
              <div className="mt-2 space-y-1 ">
                {/* <p className=''>Admin: admin / admin123</p>
                <p>Staff: staff / staff123</p> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};