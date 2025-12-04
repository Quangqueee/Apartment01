
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/provider';

const navItems = [
  { href: '/', label: 'Khám phá', icon: Search },
  { href: '/favorites', label: 'Yêu thích', icon: Heart },
  { href: '/login', label: 'Tài khoản', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Hide nav on admin and login/signup pages on mobile
  if (pathname.startsWith('/admin') || (pathname.startsWith('/login') && !user) || (pathname.startsWith('/signup') && !user)) {
      return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-around px-0">
        {navItems.map((item) => {
          const href = (item.label === 'Tài khoản' && user) ? '/favorites' : item.href;
          const label = (item.label === 'Tài khoản' && !user && !isUserLoading) ? 'Đăng nhập' : item.label;
          const isActive = pathname === href;

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
