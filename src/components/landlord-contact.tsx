'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { accessApi } from '@/lib/access-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function LandlordContact({ id, collection = 'apartments', editable = false }: {
  id?: string; collection?: 'apartments' | 'short_term_apartments'; editable?: boolean;
}) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setValue(''); setDraft(''); setError(''); setLoading(true);
    if (!id || !user || userData?.role !== 'director') return;
    let cancelled = false;
    const load = async () => {
      try {
        const result = await accessApi('phone-read', { id, collection });
        if (cancelled) return;
        setValue(result.phone); setDraft(result.phone);
      } catch {
        if (cancelled) return;
        setValue(''); setDraft(''); setError('Không thể đọc số chủ nhà thật.');
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [id, collection, user?.uid, userData?.role]);
  if (userData?.role !== 'director') return null;
  if (!id) return <p className="text-sm">Số chủ nhà thật: lưu căn hộ trước để nhập.</p>;
  const save = async () => {
    setSaving(true);
    try { await accessApi('phone-write', { id, collection, phone: draft }); setValue(draft); toast({ title: 'Đã lưu số chủ nhà thật' }); }
    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Không thể lưu' }); }
    finally { setSaving(false); }
  };
  return <section className="space-y-2 rounded-lg border p-4 overflow-x-hidden">
    <p className="font-medium">Số chủ nhà thật · Chỉ Giám đốc</p>
    <p role="status">{loading ? 'Đang tải…' : error || value || 'Chưa cập nhật'}</p>
    {editable && !loading && !error && <div className="flex flex-wrap gap-2">
      <Input type="tel" aria-label="Số chủ nhà thật" value={draft} onChange={e => setDraft(e.target.value)} className="text-base max-w-sm" maxLength={20} />
      <Button type="button" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu số thật'}</Button>
    </div>}
  </section>;
}
