'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, Loader2, CreditCard, ChevronRight, Home } from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get('bookingId') || '';
  const initialPaymentUrl = searchParams.get('paymentUrl') || '';
  const amountStr = searchParams.get('amount') || '0';
  const method = searchParams.get('method') || 'BANK_TRANSFER';

  const [paymentUrl, setPaymentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (initialPaymentUrl) {
      setPaymentUrl(decodeURIComponent(initialPaymentUrl));
    }
  }, [initialPaymentUrl]);

  const handleSimulatePayment = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const transactionId = `TX-${Date.now()}`;
      await api.payments.simulateSuccess(bookingId, transactionId, method);
      setSuccess(true);
      setStatusMsg('Thanh toán đặt cọc thành công! Đã tự động kích hoạt trạng thái Đã xác nhận đơn hàng.');
    } catch (err: any) {
      setStatusMsg(err.message || 'Lỗi giả lập thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentName = () => {
    if (method === 'MOMO') return 'Ví MoMo';
    if (method === 'BANK_TRANSFER') return 'Chuyển khoản VietQR';
    return 'Tiền mặt tại showroom';
  };

  return (
    <div className="max-w-md w-full glass-panel border border-white/5 rounded-2xl p-8 flex flex-col gap-6 text-center shadow-xl">
      {success ? (
        <>
          <div className="h-16 w-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-white">Thanh Toán Thành Công!</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            {statusMsg || 'Cảm ơn bạn! Đơn đặt xe của bạn đã được thanh toán đặt cọc và xác nhận thành công trên hệ thống.'}
          </p>
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => router.push('/track')}
              className="w-full gradient-btn text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <span>Kiểm tra lịch trình đơn</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-900 hover:bg-gray-800 text-gray-300 py-3 rounded-lg font-semibold border border-white/5 flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Quay về Trang chủ</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-emerald-400 uppercase tracking-widest font-bold">Cổng Thanh Toán Hợp Lệ</span>
            <h1 className="text-xl font-bold text-white">Thanh Toán Tiền Cọc</h1>
            <p className="text-xs text-gray-400">Đơn hàng: {bookingId.slice(0, 8)}... | Hình thức: {getPaymentName()}</p>
          </div>

          <div className="bg-gray-950 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
            <span className="text-xs text-gray-500">Số tiền đặt cọc</span>
            <span className="text-2xl font-black text-emerald-400">
              {parseInt(amountStr, 10).toLocaleString()} VND
            </span>
          </div>

          {method === 'BANK_TRANSFER' && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-xl inline-block">
                <img
                  src={paymentUrl || `https://img.vietqr.io/image/970415-101234567890-compact2.png?amount=${amountStr}&addInfo=datxe_${bookingId.slice(0, 8)}`}
                  alt="VietQR Payment Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                Vui lòng dùng ứng dụng Ngân hàng (Mobile Banking) quét mã VietQR ở trên để chuyển khoản tự động điền thông tin.
              </p>
            </div>
          )}

          {method === 'MOMO' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="h-16 w-16 rounded-xl bg-pink-600 flex items-center justify-center text-white font-extrabold text-3xl">M</div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                Cổng kết nối tự động với ví điện tử MoMo. Ấn nút bên dưới để thanh toán.
              </p>
              {paymentUrl && (
                <a href={paymentUrl} target="_blank" rel="noreferrer"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded-lg text-sm transition">
                  Mở Ví MoMo thanh toán
                </a>
              )}
            </div>
          )}

          {method === 'CASH' && (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-amber-400">Vui lòng thanh toán trực tiếp tại Showroom khi đến nhận xe.</p>
              <p className="text-xs text-gray-400">Địa chỉ: Số 12 Khuất Duy Tiến, Thanh Xuân, Hà Nội.</p>
            </div>
          )}

          <hr className="border-white/5" />

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gray-500 block">DÀNH CHO KIỂM THỬ (SIMULATION Webhook)</span>
            <button
              onClick={handleSimulatePayment}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Giả lập Thanh Toán Thành Công</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#080b11] py-16 px-6 flex items-center justify-center">
      <Suspense fallback={
        <div className="glass-panel border border-white/5 rounded-2xl p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}
