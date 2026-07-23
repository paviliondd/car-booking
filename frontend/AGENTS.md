# Frontend agent supplement

Đọc `../AGENTS.md` trước; file này chỉ bổ sung quy tắc cho `frontend/`.

- Stack: Next.js 16.2.9 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, React Query, Recharts và Lucide.
- UI/product copy mặc định bằng tiếng Việt, lưu UTF-8.
- API base URL lấy từ `NEXT_PUBLIC_API_URL`, fallback `http://localhost:5000/api`.
- Auth hiện dùng `localStorage` keys `token` và `user`; đừng đổi contract này một phần hoặc tạo cơ chế auth thứ hai.
- Google Sign-In dùng Google Identity Services qua `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; gửi credential tới `/api/auth/google`. Không thêm social-login mock hoặc decode token phía client.
- Dùng `src/lib/api.ts` hoặc helper typed dùng chung; không nhân bản request/auth/error logic mới.
- Không thêm `any`, effect chỉ để mirror state, raw `<img>` hoặc hard-coded color mới nếu có thể dùng type, derived state, `next/image` và semantic token.
- Với mọi thay đổi UI/UX, dùng global Codex skill `ui-ux-pro-max` theo workflow ghi trong root `AGENTS.md`; giữ Lucide làm icon family của repo.
- Trước khi bàn giao chạy `npm run lint:check` và `npm run build`. Baseline 2026-07-24 là lint 0 lỗi/0 warning và build pass 24 trang tĩnh cùng các route động; không làm baseline thoái lui hoặc tắt rule hàng loạt.

## Semantic color system

- Palette chuẩn là “Forest Premium” trong `src/app/globals.css`; mọi màu component phải đi qua semantic utility (`brand`, `on-brand`, `app-surface`, `app-muted`, `content`, `content-secondary`, `discount`, `on-discount`, `utility`, `utility-foreground`, `rental-price`, `app-border`, các token trạng thái và nhóm `night-*`).
- Không dùng trực tiếp màu Tailwind theo tên màu, mã hex/rgb hoặc gradient trong component. Màu tích hợp có nhận diện riêng (ví dụ MoMo) cũng phải có token tập trung.
- Cặp màu chữ/nền mới phải đạt WCAG AA: 4.5:1 cho chữ thường và 3:1 cho chữ lớn hoặc icon.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
