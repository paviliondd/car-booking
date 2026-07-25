'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { api, type Booking } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import AdminPageHeader from '@/components/dashboard/AdminPageHeader';
import { AdminError, AdminLoading } from '@/components/dashboard/AdminState';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [item, setItem] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItem(await api.bookings.findOne(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải đơn.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleDelete = async () => {
    if (!item) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng ${item.bookingNumber}? Thao tác này không thể hoàn tác.`
      )
    )
      return;

    setBusy(true);
    try {
      await api.bookings.delete(item.id);
      toast.success(`Đã xóa đơn hàng ${item.bookingNumber}.`);
      router.push('/dashboard/bookings');
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Không thể xóa đơn hàng.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AdminLoading />;
  if (error || !item)
    return (
      <AdminError
        message={error || 'Không tìm thấy đơn.'}
        onRetry={() => void load()}
      />
    );

  const rows = [
    ['Trạng thái', item.status],
    ['Khách hàng', item.customer?.fullName],
    ['Số điện thoại', item.customer?.phone],
    ['Xe', item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : '—'],
    ['Biển số', item.vehicle?.plateNumber],
    ['Điểm nhận', item.pickupLocation],
    ['Tổng tiền', `${item.totalPrice.toLocaleString('vi-VN')} đ`],
    ['Thanh toán', item.payment?.status || 'Chưa có'],
  ];

  return (
    <div>
      <AdminPageHeader
        title={`Đơn ${item.bookingNumber}`}
        description="Chi tiết booking, thanh toán, hợp đồng và lịch sử xử lý."
        parent={{ href: '/dashboard/bookings', label: 'Đơn thuê' }}
      />
      <section className="rounded-2xl border border-app-border/40 bg-app-surface p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-app-muted p-4">
              <dt className="text-xs font-bold uppercase text-content-secondary">
                {label}
              </dt>
              <dd className="mt-1 font-semibold">{value || 'Chưa cập nhật'}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/contract/${item.id}`}
              className="inline-flex min-h-11 items-center rounded-xl border border-brand px-4 text-sm font-bold text-brand hover:bg-utility"
            >
              Xem hợp đồng
            </Link>
            {item.vehicle && (
              <Link
                href={`/dashboard/vehicles/${item.vehicle.id}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-app-border px-4 text-sm font-bold hover:bg-app-muted"
              >
                Xem xe
              </Link>
            )}
          </div>
          {item.status !== 'RENTING' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDelete()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger/40 px-4 text-sm font-bold text-danger hover:bg-danger-muted disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Xóa đơn hàng
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
