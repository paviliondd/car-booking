const shell = (title: string, body: string) =>
  `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="background:#064e3b;color:white;padding:18px 24px;border-radius:14px 14px 0 0;font-size:22px;font-weight:700">datxe</div><div style="background:white;border:1px solid #e2e8f0;padding:24px;border-radius:0 0 14px 14px"><h1 style="font-size:22px">${title}</h1>${body}<p style="margin-top:24px;color:#475569">Đội ngũ datxe · Phục vụ 24/7 tại La Gi</p></div></div></body></html>`;
const date = (value: Date | string) => new Date(value).toLocaleString('vi-VN');

export const bookingCustomerEmail = (d: {
  name: string;
  code: string;
  vehicle: string;
  plate: string;
  start: Date;
  end: Date;
}) =>
  shell(
    'Đã nhận yêu cầu đặt xe',
    `<p>Xin chào <strong>${d.name}</strong>,</p><p>Mã đơn: <strong>${d.code}</strong></p><p>Xe: ${d.vehicle} · ${d.plate}</p><p>Nhận: ${date(d.start)}<br>Trả: ${date(d.end)}</p><p><strong>Trạng thái: Chờ xác nhận cọc.</strong></p>`,
  );
export const bookingOwnerEmail = (d: {
  code: string;
  customer: string;
  phone: string;
  vehicle: string;
  start: Date;
  end: Date;
  dashboardUrl: string;
}) =>
  shell(
    'Có yêu cầu thuê xe mới',
    `<p>Mã đơn: <strong>${d.code}</strong></p><p>Khách: ${d.customer} · ${d.phone}</p><p>Xe: ${d.vehicle}</p><p>${date(d.start)} → ${date(d.end)}</p><p><a href="${d.dashboardUrl}">Mở dashboard để duyệt</a></p>`,
  );
export const ownerApplicantEmail = (d: { name: string }) =>
  shell(
    'Đã nhận hồ sơ chủ xe',
    `<p>Xin chào <strong>${d.name}</strong>,</p><ol><li>datxe kiểm tra thông tin liên hệ và xe.</li><li>Nhân viên gọi xác minh hồ sơ.</li><li>Hai bên thống nhất quy trình bàn giao.</li></ol><p>Thời gian phản hồi dự kiến: <strong>1 ngày làm việc</strong>.</p>`,
  );
export const ownerAdminEmail = (d: {
  name: string;
  phone: string;
  carName: string;
  applicationNumber: string;
  dashboardUrl: string;
}) =>
  shell(
    'Hồ sơ chủ xe mới',
    `<p>Mã hồ sơ: <strong>${d.applicationNumber}</strong></p><p>${d.name} · ${d.phone}</p><p>Xe dự kiến: <strong>${d.carName || 'Chưa xác định'}</strong></p><p><a href="${d.dashboardUrl}">Mở dashboard chủ xe</a></p>`,
  );
