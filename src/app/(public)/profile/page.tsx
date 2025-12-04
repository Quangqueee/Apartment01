
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { Loader2, ChevronRight, User as UserIcon, Heart, LogOut } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/'); // Redirect to homepage after logout
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <>
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
          <div className="mb-8 flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ''} />
              <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-headline text-2xl font-bold">{user.displayName || 'Người dùng'}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
             <Link href="/profile/edit" className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Thông tin cá nhân</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
             <Link href="/favorites" className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Căn hộ yêu thích</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
             <button onClick={handleLogout} className="w-full flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                    <LogOut className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-destructive">Đăng xuất</span>
                </div>
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
