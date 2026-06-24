'use client';

import React, { useState } from 'react';
import { X, MessageSquarePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { dashboardApi } from '@/lib/api/dashboard';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const toast = useToast();
  const [category, setCategory] = useState('Góp ý');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung góp ý');
      return;
    }

    setLoading(true);
    try {
      await dashboardApi.submitFeedback(category, message);
      toast.success('Gửi góp ý đề xuất thành công! Cảm ơn ý kiến của bạn.');
      setMessage('');
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full max-w-[460px] rounded-2xl shadow-2xl p-6 z-10 animate-scale-up-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-150 transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="text-base font-extrabold text-gray-950 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-[#008F5A]" />
          <span>Gửi Góp Ý & Đề Xuất</span>
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1.5">
              Danh mục đề xuất
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-[#008F5A] font-bold"
            >
              <option value="Góp ý">Góp ý dịch vụ</option>
              <option value="Đề xuất tính năng">Đề xuất tính năng mới</option>
              <option value="Báo cáo lỗi">Báo cáo lỗi hệ thống</option>
            </select>
          </div>

          {/* Text Message */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1.5">
              Nội dung góp ý chi tiết *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bạn mong muốn datxe cải thiện gì, hoặc thêm tính năng hỗ trợ nào khác? Vui lòng điền chi tiết tại đây..."
              rows={5}
              required
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-[#008F5A] resize-none font-semibold leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#008F5A] hover:bg-[#007A4D] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Gửi đề xuất</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
