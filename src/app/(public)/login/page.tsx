
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase/provider';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ADMIN_PATH } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  // Get redirect URL from query params, or default to home
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect them
    if (!isUserLoading && user) {
        // Special redirect for admin user
        if (email === 'admin@example.com') {
             router.push(`/${ADMIN_PATH}`);
        } else {
             router.push(redirectUrl);
        }
    }
  }, [user, isUserLoading, router, redirectUrl, email]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let the useEffect handle the redirect
      toast({
        title: 'Đăng nhập thành công!',
        description: 'Chào mừng bạn quay trở lại.',
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      let description = 'Vui lòng kiểm tra lại thông tin đăng nhập.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Email hoặc mật khẩu không đúng.';
      }
       else if (error.code === 'auth/invalid-email') {
        description = 'Địa chỉ email không hợp lệ.';
      }
      toast({
        variant: 'destructive',
        title: 'Đăng nhập thất bại',
        description: description,
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-secondary/50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="absolute left-4 top-4">
        <Button variant="ghost" asChild>
            <Link href="/">‹ Về trang chủ</Link>
        </Button>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu để truy cập vào tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardContent>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Đăng nhập
            </Button>
             <div className="mt-4 text-center text-sm">
                Chưa có tài khoản?{" "}
                <Link href="/signup" className="underline hover:text-primary">
                    Đăng ký
                </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </main>
  );
}
