'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Save, UserRoundCheck, X } from 'lucide-react';
import { api, type CustomerRecord, type CustomerUpdateInput, type OwnerRequest } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import AdminPageHeader from '@/components/dashboard/AdminPageHeader';
import { AdminEmpty, AdminError, AdminLoading } from '@/components/dashboard/AdminState';

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100';

export default function CustomersPage() {
  const toast = useToast();
  const [items, setItems] = useState<CustomerRecord[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<OwnerRequest[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [form, setForm] = useState<CustomerUpdateInput | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [customers, requests] = await Promise.all([
        api.customers.findAll(),
        api.auth.getOwnerRequests(),
      ]);
      setItems(customers);
      setOwnerRequests(requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(
    () => items.filter((item) => `${item.fullName} ${item.phone} ${item.idCardNo}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const openEdit = (item: CustomerRecord) => {
    setEditing(item);
    setForm({
      fullName: item.fullName,
      phone: item.phone,
      idCardNo: item.idCardNo,
      segment: item.segment,
      notes: item.notes || '',
    });
  };

  const reviewOwner = async (request: OwnerRequest, approve: boolean) => {
    setBusy(true);
    try {
      await api.auth.verifyOwner(request.id, approve);
      setOwnerRequests((list) => list.filter((item) => item.id !== request.id));
      toast.success(approve ? `Đã duyệt ${request.name} trở thành chủ xe.` : `Đã từ chối yêu cầu của ${request.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu chủ xe.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !form) return;
    setBusy(true);
    try {
      const saved = await api.customers.update(editing.id, form);
      setItems((list) => list.map((entry) => entry.id === saved.id ? { ...entry, ...saved } : entry));
      setEditing(null);
      setForm(null);
      toast.success('Đã cập nhật hồ sơ khách hàng.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật khách hàng.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="CRM khách hàng" description="Tra cứu và chỉnh sửa hồ sơ, phân khúc và ghi chú chăm sóc." />
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="owner-requests-title">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><UserRoundCheck className="h-5 w-5" /></span>
          <div>
            <h2 id="owner-requests-title" className="text-lg font-bold">Yêu cầu trở thành chủ xe</h2>
            <p className="mt-1 text-sm text-slate-600">Kiểm tra thông tin liên hệ, CCCD và địa chỉ trước khi cấp quyền quản lý xe.</p>
          </div>
        </div>
        {loading ? (
          <p className="mt-5 text-sm text-slate-500">Đang tải yêu cầu…</p>
        ) : ownerRequests.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Hiện không có yêu cầu nào đang chờ duyệt.</p>
        ) : (
          <div className="mt-5 grid gap-4">
            {ownerRequests.map((request) => (
              <article key={request.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="grid flex-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs font-bold uppercase text-slate-500">Người đăng ký</p><p className="mt-1 font-bold text-slate-900">{request.name}</p><p className="text-xs text-slate-500">{request.email}</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-500">Liên hệ</p><p className="mt-1 font-semibold">{request.phone || 'Chưa cung cấp'}</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-500">CCCD</p><p className="mt-1 font-semibold">{request.idCardNo || 'Chưa cung cấp'}</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-500">Gửi lúc</p><p className="mt-1 font-semibold">{new Date(request.ownerRequestAt).toLocaleString('vi-VN')}</p></div>
                    <div className="sm:col-span-2 lg:col-span-4"><p className="text-xs font-bold uppercase text-slate-500">Địa chỉ cư trú</p><p className="mt-1 text-slate-700">{request.address || 'Chưa cung cấp'}</p></div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" disabled={busy} onClick={() => void reviewOwner(request, false)} className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50">Từ chối</button>
                    <button type="button" disabled={busy} onClick={() => void reviewOwner(request, true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"><Check className="h-4 w-4" />Duyệt chủ xe</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <input aria-label="Tìm khách hàng" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, số điện thoại hoặc CCCD" className="mb-4 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100" />

      {loading ? <AdminLoading /> : error ? <AdminError message={error} onRetry={() => void load()} /> : filtered.length === 0 ? <AdminEmpty message="Không có khách hàng phù hợp." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Khách hàng</th><th className="p-4">Liên hệ</th><th className="p-4">CCCD</th><th className="p-4">Phân khúc</th><th className="p-4 text-right">Thao tác</th></tr></thead>
            <tbody>{filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4"><p className="font-bold">{item.fullName}</p><p className="text-xs text-slate-500">{item.user?.email || 'Chưa liên kết tài khoản'}</p></td>
                <td className="p-4">{item.phone}</td>
                <td className="p-4">{item.idCardNo}</td>
                <td className="p-4">{item.segment === 'VIP' ? 'VIP' : item.segment === 'BLACKLIST' ? 'Danh sách hạn chế' : 'Thông thường'}</td>
                <td className="p-4 text-right"><button onClick={() => openEdit(item)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-bold text-emerald-700 hover:bg-emerald-50"><Pencil className="h-4 w-4" /> Chỉnh sửa</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="customer-edit-title">
          <form onSubmit={save} className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><h2 id="customer-edit-title" className="text-2xl font-bold">Chỉnh sửa khách hàng</h2><p className="mt-1 text-sm text-slate-600">Email và vai trò tài khoản không được thay đổi tại đây.</p></div><button type="button" onClick={() => setEditing(null)} aria-label="Đóng" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">Họ và tên<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className={`${inputClass} mt-2`} /></label>
              <label className="text-sm font-semibold">Số điện thoại<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={`${inputClass} mt-2`} /></label>
              <label className="text-sm font-semibold">Số CCCD<input required inputMode="numeric" value={form.idCardNo} onChange={(event) => setForm({ ...form, idCardNo: event.target.value })} className={`${inputClass} mt-2`} /></label>
              <label className="text-sm font-semibold">Phân khúc<select value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value as CustomerUpdateInput['segment'] })} className={`${inputClass} mt-2`}><option value="REGULAR">Thông thường</option><option value="VIP">VIP</option><option value="BLACKLIST">Danh sách hạn chế</option></select></label>
            </div>
            <label className="mt-5 block text-sm font-semibold">Ghi chú CRM<textarea rows={4} value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`${inputClass} mt-2 min-h-28 py-3`} /></label>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl border border-slate-300 px-5 font-semibold">Hủy</button><button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
