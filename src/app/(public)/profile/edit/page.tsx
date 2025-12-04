
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { getUserProfile } from '@/lib/data-client';
import { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions';
import Link from 'next/link';

const profileFormSchema = z.object({
  displayName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileForm({ userProfile, userId }: { userProfile: UserProfile; userId: string }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userProfile.displayName || '',
      phoneNumber: userProfile.phoneNumber || '',
      address: userProfile.address || '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    const result = await updateUserProfileAction(userId, values);
    if (result.success) {
      toast({
        title: 'Thành công',
        description: 'Thông tin cá nhân của bạn đã được cập nhật.',
      });
      router.push('/profile'); // Redirect back to profile hub
    } else {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉnh sửa thông tin</CardTitle>
        <CardDescription>
          Cập nhật thông tin của bạn. Email không thể thay đổi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <Input value={userProfile.email} disabled className="bg-muted/50" />
            </div>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập họ và tên của bạn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập số điện thoại của bạn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập địa chỉ của bạn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
               <Button variant="ghost" asChild>
                <Link href="/profile">Hủy</Link>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function EditProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/profile/edit');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        setIsLoadingProfile(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user]);

  if (isUserLoading || isLoadingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
            <Button variant="ghost" asChild className="mb-4">
                 <Link href="/profile">‹ Quay lại</Link>
            </Button>
          {userProfile ? (
            <ProfileForm userProfile={userProfile} userId={user.uid} />
          ) : (
             <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <h2 className="font-headline text-2xl">Không thể tải thông tin</h2>
                <p className="mt-2 text-muted-foreground">
                    Đã có lỗi xảy ra khi tải thông tin cá nhân của bạn.
                </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
