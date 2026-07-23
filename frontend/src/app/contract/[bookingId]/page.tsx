'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type Booking, type ContractData } from '@/lib/api';
import { FileText, CheckCircle2, ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [bookingData, setBookingData] = useState<(Booking & { vehicle: NonNullable<Booking['vehicle']>; customer: NonNullable<Booking['customer']> }) | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const loadContract = useCallback(async () => {
    try {
      const res = await api.contracts.get(bookingId);
      setContractData(res.contract);
      setBookingData(res.booking);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi nạp thông tin hợp đồng.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    const loadTimer = window.setTimeout(() => void loadContract(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [bookingId, loadContract]);

  // Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = getComputedStyle(canvas).color;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setIsSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  const handleSignAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSigned || !canvasRef.current || !bookingData || !contractData) return;

    setSigning(true);
    setErrorMsg('');

    try {
      // 1. Trích xuất base64 chữ ký từ Canvas
      const signatureBase64 = canvasRef.current.toDataURL('image/png');

      // 2. Gọi API gửi chữ ký số lên backend (Tự động cập nhật Booking -> CONFIRMED & gửi email SES raw)
      await api.contracts.sign(bookingId, signatureBase64);

      // 3. Sử dụng jsPDF sinh và xuất file PDF hợp đồng chứa chữ ký trên Client
      const doc = new jsPDF();

      // Viết nội dung text tiếng Việt không dấu hoặc tiếng Việt unicode thô
      doc.setFont('courier', 'normal');
      doc.setFontSize(14);
      doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 15, 20);
      doc.text('Doc lap - Tu do - Hanh phuc', 15, 28);
      doc.text('----------------------', 15, 34);
      doc.text(`HOP DONG THUE XE DIEN TU: HD-${bookingData.bookingNumber}`, 15, 42);

      doc.setFontSize(11);
      doc.text(`BÊN CHO THUÊ (BÊN A): ${bookingData.vehicle.owner?.name || 'Hệ thống datxe'}`, 15, 54);
      doc.text(`BÊN THUÊ (BÊN B): ${bookingData.customer.fullName}`, 15, 62);
      doc.text(`ĐỊA CHỈ: ${bookingData.pickupLocation}`, 15, 70);

      doc.text('ĐIỀU 1: PHƯƠNG TIỆN CHO THUÊ', 15, 82);
      doc.text(`- Hiệu xe: ${bookingData.vehicle.brand} ${bookingData.vehicle.model}`, 15, 90);
      doc.text(`- Biển kiểm soát: ${bookingData.vehicle.plateNumber}`, 15, 98);

      doc.text('ĐIỀU 2: PHÍ DỊCH VỤ & THANH TOÁN', 15, 110);
      doc.text(`- Tổng chi phí: ${bookingData.totalPrice.toLocaleString()} VND`, 15, 118);
      doc.text(`- Đặt cọc: ${bookingData.depositAmount?.toLocaleString() || '0'} VND`, 15, 126);

      doc.text('BÊN B KÝ XÁC NHẬN CHỮ KÝ SỐ:', 15, 142);

      // Nhúng hình ảnh chữ ký Canvas vào PDF
      doc.addImage(signatureBase64, 'PNG', 15, 150, 60, 30);

      // 4. Download file PDF về máy Client
      doc.save(`HopDong_datxe_${bookingData.bookingNumber}.pdf`);

      router.push(`/track?phone=${bookingData.customer.phone}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi xử lý ký số hợp đồng điện tử.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="dark min-h-screen bg-night-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-night-surface py-12 px-6 md:px-12 max-w-4xl mx-auto flex flex-col gap-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-utility blur-[150px]"></div>

      <div className="flex justify-between items-center border-b border-app-border/30 pb-6 relative z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-content-secondary hover:text-night-content transition bg-app-muted/70 px-4 py-2 rounded-lg border border-app-border/30 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Về trang chủ</span>
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-night-content flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand" />
          <span>Ký Hợp Đồng Điện Tử</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="bg-danger-muted border border-danger/35 text-danger p-4 rounded-xl text-sm z-10">
          <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
          {errorMsg}
        </div>
      )}

      {bookingData && contractData && (
        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {/* Cột trái: Thông tin pháp lý & các điều khoản */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-xl border border-app-border/30 h-[480px] overflow-y-auto flex flex-col gap-4">
              <h3 className="font-extrabold text-night-content text-lg border-b border-app-border/30 pb-3">Nội Dung Hợp Đồng Thuê Xe</h3>
              <pre className="text-xs text-content-secondary leading-relaxed font-mono whitespace-pre-wrap">
                {contractData.terms}
              </pre>
            </div>
          </div>

          {/* Cột phải: Khung vẽ ký tên (Signature Pad Canvas) */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-xl border border-brand/35 flex flex-col gap-4">
              <h3 className="font-bold text-night-content text-base">Khung Ký Số</h3>
              <p className="text-xs text-content-secondary">Vẽ chữ ký của bạn trực tiếp bằng chuột hoặc ngón tay lên khung bên dưới:</p>

              <div className="border border-app-border/50 rounded-lg overflow-hidden bg-app-surface/80">
                <canvas
                  ref={canvasRef}
                  width={220}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="h-[150px] w-full cursor-crosshair touch-none text-night-content"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  className="flex-1 bg-app-muted hover:bg-app-muted text-content-secondary text-xs font-semibold py-2 rounded-lg cursor-pointer transition border border-app-border/30"
                >
                  Xóa vẽ lại
                </button>
              </div>

              <hr className="border-app-border/30" />

              {contractData.renterSignature ? (
                <div className="bg-brand/10 border border-brand/35 text-brand p-4 rounded-xl text-center flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8" />
                  <span className="font-bold text-sm">Hợp đồng này đã được ký kết!</span>
                </div>
              ) : (
                <button
                  onClick={handleSignAndSubmit}
                  disabled={!isSigned || signing}
                  className="w-full gradient-btn text-on-brand font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
                >
                  {signing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Ký hợp đồng & Tải PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
