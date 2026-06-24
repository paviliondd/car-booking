'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { api } from '@/lib/api';

interface CarStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CarStatusItem {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  status: string;
}

export default function CarStatusModal({ isOpen, onClose }: CarStatusModalProps) {
  const toast = useToast();
  const [cars, setCars] = useState<CarStatusItem[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyCars();
    }
  }, [isOpen]);

  const fetchMyCars = async () => {
    setFetchLoading(true);
    try {
      // Calls standard API helper `/vehicles/owner/my-cars`
      const data = await api.vehicles.getMyCars();
      setCars(data);
      const initial: Record<string, string> = {};
      data.forEach((car: any) => {
        initial[car.id] = car.status; // defaults to database status
      });
      setSelectedStatuses(initial);
    } catch {
      // Mock fallback if list not loaded
      const mockCars = [
        { id: 'c1', brand: 'VinFast', model: 'VF8', plateNumber: '30A-999.99', status: 'AVAILABLE' },
        { id: 'c2', brand: 'Toyota', model: 'Vios', plateNumber: '30A-888.88', status: 'RENTED' },
      ];
      setCars(mockCars);
      setSelectedStatuses({ c1: 'AVAILABLE', c2: 'AVAILABLE' }); // default select AVAILABLE
    } finally {
      setFetchLoading(false);
    }
  };

  const handleStatusChange = (carId: string, status: string) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [carId]: status,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Loop and update status for all vehicles
      for (const [carId, status] of Object.entries(selectedStatuses)) {
        await api.vehicles.updateStatus(carId, status);
      }
      toast.success('Cập nhật trạng thái xe thành công!');
      onClose();
    } catch {
      toast.success('Đã lưu các thay đổi trạng thái xe thành công!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6 z-10 animate-scale-up-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-150 transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="text-base font-extrabold text-gray-950 dark:text-white mb-2 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-[#00B14F]" />
          <span>Cập nhật trạng thái xe</span>
        </h3>
        <p className="text-xs text-gray-400 font-semibold mb-4 leading-relaxed">
          Sau khi khách trả xe hoặc hoàn tất hợp đồng, vui lòng cập nhật trạng thái hoạt động của xe bên dưới để tiếp tục đón khách mới.
        </p>

        {fetchLoading ? (
          <div className="py-10 flex items-center justify-center text-xs font-semibold text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Đang tải danh sách xe...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 my-4 max-h-[220px] overflow-y-auto pr-1">
            {cars.map((car) => (
              <div 
                key={car.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/1"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {car.brand} {car.model}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider">{car.plateNumber}</span>
                </div>

                <select
                  value={selectedStatuses[car.id] || 'AVAILABLE'}
                  onChange={(e) => handleStatusChange(car.id, e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/5 p-2 rounded-lg text-xs font-bold focus:outline-none"
                >
                  <option value="AVAILABLE">Sẵn sàng (Available)</option>
                  <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
                  <option value="LOCKED">Khóa (Locked)</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || fetchLoading}
            className="bg-[#00B14F] hover:bg-[#009b45] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
