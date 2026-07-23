# Báo cáo contrast datxe

Chuẩn kiểm tra: WCAG AA 4.5:1 cho chữ thường và 3:1 cho chữ lớn/icon. Audit áp dụng cho `/`, `/vehicles`, `/become-owner`, `/booking`, `/owner`, `/owner/add-car`, `/track`, `/about`, `/payment`.

## Token chuẩn

| Token | Hex | Mục đích |
|---|---:|---|
| `--color-primary` | `#047857` | CTA/icon trên nền sáng |
| `--color-primary-foreground` | `#FFFFFF` | Chữ trên primary |
| `--color-surface` | `#FFFFFF` | Card/input |
| `--color-surface-muted` | `#F1F5F9` | Nền phụ |
| `--color-text` | `#0F172A` | Chữ chính |
| `--color-text-muted` | `#475569` | Chữ phụ |
| `--color-badge-success-bg` | `#D1FAE5` | Badge tiện ích |
| `--color-badge-success-fg` | `#065F46` | Chữ badge tiện ích |
| `--color-badge-discount-bg` | `#C2410C` | Badge giảm giá |
| `--color-badge-discount-fg` | `#FFFFFF` | Chữ badge giảm giá |
| `--color-danger-bg` | `#FEF2F2` | Nền lỗi |
| `--color-danger-fg` | `#991B1B` | Chữ lỗi |

## Các cặp vi phạm tìm thấy và thay thế

| Vị trí | Cặp cũ | Tỷ lệ xấp xỉ | Cặp mới | Kết quả |
|---|---|---:|---|---:|
| Nhãn phụ card/input | `#94A3B8` / `#FFFFFF` | 2.56:1 | `#475569` / `#FFFFFF` | 7.58:1 |
| Badge trạng thái dark | `#34D399` / `#064E3B` | 3.23:1 | `#065F46` / `#D1FAE5` | 6.78:1 |
| Badge giảm giá | trắng / cam nhạt | <3:1 | `#FFFFFF` / `#C2410C` | 5.18:1 |
| Icon trạng thái rỗng | `#CBD5E1` / trắng | 1.48:1 | `#64748B` / trắng | 4.76:1 |
| Label ngày/giờ | `#94A3B8` / trắng | 2.56:1 | `#475569` / trắng | 7.58:1 |
| Lỗi form dark | `#F87171` / `#7F1D1D` | <3:1 | `#991B1B` / `#FEF2F2` | 8.31:1 |

Các component mới dùng token và thang Slate/Emerald đạt AA; trạng thái không chỉ phụ thuộc màu mà luôn kèm nhãn/icon.
