
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createUserDocument } from '@/app/actions';


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

    // Handle Google Redirect Result
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setIsGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await createUserDocument(result.user.uid, result.user.email || '');
          toast({
            title: 'Đăng nhập thành công!',
            description: `Chào mừng bạn, ${result.user.displayName || 'người dùng mới'}!`,
          });
          // Let the other useEffect handle the redirect to home
        }
      } catch (error: any) {
        if(error.code !== 'auth/no-auth-event') { // Ignore error on initial load
            console.error('Google sign in failed after redirect', error);
            toast({
                variant: 'destructive',
                title: 'Đăng nhập Google thất bại',
                description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
            });
        }
      } finally {
        setIsGoogleLoading(false);
      }
    };
    handleRedirect();
  }, [auth, toast]);


  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu và xác nhận mật khẩu không khớp.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if(userCredential.user) {
          await createUserDocument(userCredential.user.uid, userCredential.user.email || '');
          await sendEmailVerification(userCredential.user);
      }
      
      toast({
        title: 'Đăng ký thành công!',
        description: 'Chúng tôi đã gửi một liên kết xác thực đến email của bạn. Vui lòng kiểm tra hộp thư.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error('Sign up failed:', error);
       let description = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Địa chỉ email này đã được sử dụng.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'Địa chỉ email không hợp lệ.';
      } else if (error.code === 'auth/weak-password') {
        description = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu khác an toàn hơn.';
      }
      toast({
        variant: 'destructive',
        title: 'Đăng ký thất bại',
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
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
          <CardTitle className="font-headline text-2xl">Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Tạo tài khoản để lưu lại các căn hộ yêu thích của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
             <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                )}
                Tiếp tục với Google
            </Button>
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Hoặc đăng ký với
                    </span>
                </div>
            </div>
            <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="mail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading || isGoogleLoading}
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
                        disabled={isLoading || isGoogleLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading || isGoogleLoading}
                    />
                </div>
                 <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Đăng ký với Email
                </Button>
            </form>
        </CardContent>
        <CardContent className="pt-0">
            <div className="mt-4 text-center text-sm">
              Đã có tài khoản?{" "}
              <Link href="/login" className="underline hover:text-primary">
                Đăng nhập
              </Link>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
