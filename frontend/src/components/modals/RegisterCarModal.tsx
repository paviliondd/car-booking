"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, MapPin, User, Phone, Car, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import { storeInfo } from "@/lib/store";

interface RegisterCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterCarModal({
  isOpen,
  onClose,
}: RegisterCarModalProps) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [carName, setCarName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOwnerName("");
      setPhone("");
      setEmail("");
      setCarName("");
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!ownerName.trim()) {
      tempErrors.ownerName = "Tên chủ xe không được để trống";
    }
    if (!phone.trim()) {
      tempErrors.phone = "Số di động không được để trống";
    } else if (!/^\d{10,11}$/.test(phone.trim())) {
      tempErrors.phone = "Số di động phải có 10-11 số";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      tempErrors.email = "Email không hợp lệ";
    if (!carName.trim()) tempErrors.carName = "Vui lòng nhập dòng xe";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.auth.createOwnerLead({
        name: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        carName: carName.trim(),
      });
      toast.success("Đã nhận hồ sơ. datxe sẽ phản hồi trong 1 ngày làm việc.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi hồ sơ.",
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-night-surface/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-app-surface text-content w-full max-w-[480px] rounded-2xl shadow-2xl p-8 z-10 animate-scale-up-center overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-content-secondary hover:text-content-secondary rounded-full hover:bg-app-muted transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-brand mb-1">
          Đăng ký xe cho thuê
        </h2>
        <p className="text-xs text-content-secondary text-center mb-6 max-w-sm mx-auto leading-relaxed">
          Bạn vui lòng điền đầy đủ thông tin, datxe sẽ liên hệ với bạn trong
          vòng một ngày làm việc.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Fixed service area */}
          <div>
            <p className="text-xs font-semibold text-content-secondary block mb-1">
              Khu vực cho thuê
            </p>
            <div className="flex min-h-11 items-center gap-3 rounded-lg border border-brand/30 bg-utility px-3 text-sm font-semibold text-brand">
              <MapPin className="h-4.5 w-4.5" />
              {storeInfo.serviceArea}
            </div>
          </div>

          {/* Owner Name Field */}
          <div>
            <label className="text-xs font-semibold text-content-secondary block mb-1">
              Tên chủ xe *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-content-secondary" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Tên của bạn"
                disabled={loading}
                className={`w-full bg-app-muted border ${errors.ownerName ? "border-danger" : "border-app-border/35"} rounded-lg py-2.5 pl-10 pr-4 text-sm text-content focus:outline-none focus:border-brand`}
              />
            </div>
            {errors.ownerName && (
              <p className="text-danger text-xs mt-1 font-medium">
                {errors.ownerName}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="text-xs font-semibold text-content-secondary block mb-1">
              Số di động *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-content-secondary" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Số của bạn"
                disabled={loading}
                className={`w-full bg-app-muted border ${errors.phone ? "border-danger" : "border-app-border/35"} rounded-lg py-2.5 pl-10 pr-4 text-sm text-content focus:outline-none focus:border-brand`}
              />
            </div>
            {errors.phone && (
              <p className="text-danger text-xs mt-1 font-medium">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-content-secondary block mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-content-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border bg-app-muted py-2.5 pl-10 pr-4 text-sm ${errors.email ? "border-danger" : "border-app-border"}`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-danger">
                {errors.email}
              </p>
            )}
          </div>

          {/* Car Name Field */}
          <div>
            <label className="text-xs font-semibold text-content-secondary block mb-1 font-medium">
              Xe cho thuê *
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-3 h-4.5 w-4.5 text-content-secondary" />
              <input
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="Loại xe của bạn"
                disabled={loading}
                className="w-full bg-app-muted border border-app-border/35 rounded-lg py-2.5 pl-10 pr-4 text-sm text-content focus:outline-none focus:border-brand"
              />
            </div>
            {errors.carName && (
              <p className="mt-1 text-xs font-medium text-danger">
                {errors.carName}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover text-on-brand font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 mt-4 shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>Gửi thông tin đến datxe</span>
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
