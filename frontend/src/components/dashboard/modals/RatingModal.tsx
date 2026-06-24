'use client';

import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { dashboardApi } from '@/lib/api/dashboard';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RatingModal({ isOpen, onClose }: RatingModalProps) {
  const toast = useToast();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dashboardApi.submitRating(stars, comment);
      toast.success('Gửi đánh giá thành công! Cảm ơn bạn.');
      setComment('');
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full max-w-[440px] rounded-2xl shadow-2xl p-6 z-10 animate-scale-up-center">
        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-150 transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="text-base font-extrabold text-gray-950 dark:text-white mb-4">
          Đánh giá mức độ hài lòng
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Star selector */}
          <div className="flex flex-col gap-1.5 items-center py-4 border-b border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-500 font-bold">Dịch vụ quản trị G-Car đạt mức độ:</span>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  className="p-1 hover:scale-110 transition cursor-pointer"
                >
                  <Star 
                    className={`h-8 w-8 ${
                      star <= stars ? 'text-amber-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-amber-500 font-extrabold mt-1">
              {stars === 5 ? 'Rất hài lòng' : stars === 4 ? 'Hài lòng' : stars === 3 ? 'Bình thường' : stars === 2 ? 'Không hài lòng' : 'Tệ'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1.5">
              Góp ý chi tiết (không bắt buộc)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập ý kiến đóng góp của bạn để chúng tôi nâng cấp dịch vụ..."
              rows={4}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-[#00B14F] resize-none font-semibold"
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
              className="bg-[#00B14F] hover:bg-[#009b45] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Gửi đánh giá</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
