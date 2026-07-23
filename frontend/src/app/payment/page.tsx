'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId') || '';
  const paymentUrl = searchParams.get('paymentUrl') || '';
  const amount = Number(searchParams.get('amount') || 0);
  const method = searchParams.get('method') || 'BANK_TRANSFER';

  if (!bookingId) {
    return (
      <section className="w-full max-w-lg rounded-3xl border border-danger/30 bg-app-surface p-8 text-center shadow-xl" role="alert">
        <h1 className="text-2xl font-bold text-content">Không tìm thấy đơn thanh toán</h1>
        <p className="mt-3 text-content-secondary">Liên kết không hợp lệ hoặc đã thiếu mã đặt xe.</p>
        <button type="button" onClick={() => router.replace('/booking')} className="mt-6 min-h-11 rounded-xl bg-brand px-5 font-semibold text-on-brand hover:bg-brand-hover">Quay lại đặt xe</button>
      </section>
    );
  }

  const paymentName = method === 'MOMO' ? 'Ví MoMo' : method === 'CASH' ? 'Tiền mặt khi nhận xe' : 'Chuyển khoản PayOS/VietQR';
  const needsOnlinePayment = method !== 'CASH';

  return (
    <section className="w-full max-w-xl rounded-3xl border border-app-border/35 bg-app-surface p-6 text-content shadow-xl sm:p-9">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-utility text-brand">
          {method === 'CASH' ? <Banknote className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-brand">Đơn {bookingId.slice(0, 8).toUpperCase()}</p>
          <h1 className="mt-1 text-2xl font-bold text-content">Hoàn tất thanh toán</h1>
          <p className="mt-2 text-sm leading-6 text-content-secondary">{paymentName}</p>
        </div>
      </div>

      <div className="my-7 rounded-2xl border border-app-border/35 bg-app-muted p-5">
        <p className="text-sm text-content-secondary">Số tiền cần thanh toán</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-content">{amount.toLocaleString('vi-VN')} ₫</p>
      </div>

      {needsOnlinePayment ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-content-secondary">Giao dịch chỉ được xác nhận sau khi cổng thanh toán gửi webhook hợp lệ về datxe. Không cần gửi ảnh chuyển khoản.</p>
          {paymentUrl ? (
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 font-semibold text-on-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25">
              Mở cổng thanh toán an toàn <ArrowUpRight className="h-5 w-5" />
            </a>
          ) : (
            <p className="rounded-xl border border-warning/30 bg-warning-muted p-4 text-sm text-warning" role="alert">Cổng thanh toán chưa trả về liên kết. Vui lòng chọn phương thức khác hoặc liên hệ hỗ trợ.</p>
          )}
        </div>
      ) : (
        <div className="flex gap-3 rounded-2xl border border-brand/30 bg-utility p-4 text-brand">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-6">Đơn đã được ghi nhận. Bạn thanh toán và đối chiếu giấy tờ tại điểm nhận xe.</p>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 border-t border-app-border/35 pt-6 sm:flex-row">
        <button type="button" onClick={() => router.push('/track')} className="min-h-11 flex-1 rounded-xl border border-app-border px-4 font-semibold text-content-secondary hover:bg-app-muted">Theo dõi đơn</button>
        <button type="button" onClick={() => router.push('/')} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-app-border px-4 font-semibold text-content-secondary hover:bg-app-muted"><Home className="h-4 w-4" /> Trang chủ</button>
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-content-secondary"><ShieldCheck className="h-4 w-4" />Datxe không bao giờ yêu cầu mật khẩu ngân hàng hoặc mã OTP.</p>
    </section>
  );
}

export default function PaymentPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-app-muted px-4 py-12 sm:px-6">
      <Suspense fallback={<div className="flex min-h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Đang tải" /></div>}>
        <PaymentContent />
      </Suspense>
    </main>
  );
}
