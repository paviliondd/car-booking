const fuelLabels: Record<string, string> = {
  GASOLINE: "Xăng",
  DIESEL: "Dầu",
  ELECTRIC: "Xe điện",
  HYBRID: "Xăng và điện",
};

const transmissionLabels: Record<string, string> = {
  AUTO: "Số tự động",
  MANUAL: "Số sàn",
};

export function vehicleFuelLabel(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  return fuelLabels[value.toUpperCase()] || "Loại khác";
}

export function vehicleTransmissionLabel(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  return transmissionLabels[value.toUpperCase()] || "Loại khác";
}
