'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, MapPin, User, Phone, Car } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { storeInfo } from '@/lib/store';

interface RegisterCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterCarModal({ isOpen, onClose }: RegisterCarModalProps) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [carName, setCarName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOwnerName('');
      setPhone('');
      setCarName('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!ownerName.trim()) {
      tempErrors.ownerName = 'Tên chủ xe không được để trống';
    }
    if (!phone.trim()) {
      tempErrors.phone = 'Số di động không được để trống';
    } else if (!/^\d{10,11}$/.test(phone.trim())) {
      tempErrors.phone = 'Số di động phải có 10-11 số';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const lead = {
      region: storeInfo.serviceArea,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      carName: carName.trim(),
      createdAt: new Date().toISOString(),
    };
    const storedLeads = JSON.parse(localStorage.getItem('ownerLeads') || '[]');
    localStorage.setItem('ownerLeads', JSON.stringify([lead, ...storedLeads]));
    setLoading(false);

    toast.success('Đăng ký xe cho thuê thành công! datxe sẽ liên hệ với bạn sớm.');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white text-gray-900 w-full max-w-[480px] rounded-2xl shadow-2xl p-8 z-10 animate-scale-up-center overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-[#008F5A] mb-1">
          Đăng ký xe cho thuê
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6 max-w-sm mx-auto leading-relaxed">
          Bạn vui lòng điền đầy đủ thông tin, datxe sẽ liên hệ với bạn trong vòng một ngày làm việc.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Fixed service area */}
          <div>
            <p className="text-xs font-semibold text-gray-700 block mb-1">Khu vực cho thuê</p>
            <div className="flex min-h-11 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900"><MapPin className="h-4.5 w-4.5" />{storeInfo.serviceArea}</div>
          </div>

          {/* Owner Name Field */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Tên chủ xe *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <input 
                type="text" 
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Tên của bạn"
                disabled={loading}
                className={`w-full bg-gray-50 border ${errors.ownerName ? 'border-red-500' : 'border-gray-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-[#008F5A]`} 
              />
            </div>
            {errors.ownerName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.ownerName}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Số di động *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Số của bạn"
                disabled={loading}
                className={`w-full bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-[#008F5A]`} 
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
          </div>

          {/* Car Name Field */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1 font-medium">Xe cho thuê</label>
            <div className="relative">
              <Car className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <input 
                type="text" 
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="Loại xe của bạn"
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-[#008F5A]" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#008F5A] hover:bg-[#007A4D] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 mt-4 shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>Gửi thông tin đến datxe</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
