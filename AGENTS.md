# AGENTS.md — datxe car rental system

## Bắt đầu tại đây

File này áp dụng cho toàn repository và là tài liệu bàn giao bắt buộc cho mọi AI agent. Trước khi sửa code:

1. Đọc hết file này và `AGENTS.md` gần nhất trong thư mục đang làm (`frontend/AGENTS.md` có quy tắc Next.js riêng).
2. Chạy `git status --short`; worktree có thể đang dirty và thay đổi hiện hữu thuộc người dùng.
3. Không reset, checkout, xóa, commit, push hoặc deploy nếu người dùng chưa yêu cầu rõ.
4. Nếu thay đổi kiến trúc, env, API, workflow hoặc baseline test, cập nhật file này trong cùng thay đổi.

UI và nội dung sản phẩm dùng tiếng Việt, file lưu UTF-8. Domain production cố định là `datxe.linuxunity.com`; TLS do Nginx/Let's Encrypt quản lý.

## Sản phẩm và kiến trúc

`datxe` là nền tảng thuê xe tự lái gồm:

- Khách hàng: đăng ký bằng số điện thoại + OTP, đăng nhập số điện thoại + mật khẩu hoặc Google, tìm xe, đặt xe, cọc/thanh toán, ký hợp đồng, tra cứu đơn, đánh giá, chat chủ xe.
- Chủ xe: gửi yêu cầu nâng cấp, đăng xe, quản lý trạng thái xe, duyệt booking, doanh thu và chat.
- Admin/staff: dashboard, booking, CRM khách hàng, bảo dưỡng, tài chính, audit và hỗ trợ.

```text
Browser
  -> Nginx :80/:443 (SSL, rate limit, security headers)
       -> Next.js 16 / React 19 / Tailwind 4 :3000
       -> NestJS 11 REST /api + Socket.IO :5000
            -> Prisma 7 + PostgreSQL 15
            -> Redis 7
            -> Local VPS filesystem (`UPLOAD_HOST_DIR` bind mount)
            -> Google Identity Services, PayOS, MoMo, SES/SNS
```

Production dùng `docker-compose.prod.yml`, `nginx.prod.conf`, image GHCR và `.github/workflows/deploy.yml`. Push vào `main` chạy quality gate, build/push hai image rồi SSH deploy có health check và rollback. Không dùng `docker-compose.yml`/`nginx.conf` legacy làm cấu hình production.

## Bản đồ source

```text
frontend/
  src/app/                    Next.js App Router pages
    auth/                     email + Google Sign-In thật
    booking/                  tìm xe, báo giá backend, hồ sơ, quy định, cọc, chat
    vehicles/[id]/            chi tiết xe public, cửa hàng, biểu phí và quy định
    payment/                  chuyển tiếp sang cổng thanh toán thật
    contract/[bookingId]/     hợp đồng và chữ ký
    owner/, owner/add-car/    portal chủ xe
    (dashboard)/dashboard/    khu quản trị ADMIN/STAFF: đơn, xe, CRM, bảo dưỡng, tài chính, ticket, audit
  src/components/             layout, auth, search, owner, dashboard
  src/lib/api.ts              API client/type chính
  src/lib/api/dashboard.ts    dashboard client (cần hợp nhất dần)
  src/providers/              query, theme, toast
  src/app/globals.css         semantic design tokens emerald/navy

backend/
  src/main.ts                 Helmet, CORS, validation, /api prefix
  src/app.module.ts           composition root + global throttling
  src/auth/                   JWT, Google token verification, roles
  src/<domain>/               controller/service/module theo domain
  prisma/schema.prisma        source of truth data model
  prisma/migrations/0001_init initial production migration

.github/workflows/deploy.yml  CI/CD vào VPS
docker-compose.prod.yml       production stack, network nội bộ
nginx.prod.conf               TLS/reverse proxy/websocket
scripts/deploy-vps.sh         migration, deploy, health, rollback
scripts/bootstrap-admin-vps.sh khôi phục admin bằng đúng image backend đang chạy
.env.production.example      danh sách biến production, không có secret thật
design-system/datxe/MASTER.md design-system do ui-ux-pro-max sinh
```

Backend domains: `auth`, `vehicles`, `bookings`, `payments`, `contracts`, `reviews`, `chat`, `tickets`, `customers`, `maintenance`, `analytics`, `dashboard`, `audit`, `notification`, `redis`, `prisma`, `payouts`, `inspections`.

`account` cung cấp hồ sơ cá nhân, cập nhật thông tin, đổi mật khẩu, lịch sử booking/hợp đồng theo JWT và luôn giới hạn qua `Customer.userId`. CCCD/GPLX được lưu ở private storage, storage key được ghi ngay vào `Customer` và chỉ chủ tài khoản hoặc ADMIN/STAFF được đọc. Notification hỗ trợ SMTP (`SMTP_*`) với SES fallback và AWS SNS cho SMS; mọi lần gửi được ghi vào `NotificationLog`. Bảng `Notification` hỗ trợ thông báo in-app persistent cho người dùng với trạng thái `isRead`. Hồ sơ chủ xe yêu cầu đăng nhập và số điện thoại đã xác minh, liên kết trực tiếp `OwnerLead.userId`; khi ADMIN/STAFF duyệt `OwnerLead`, hệ thống tự động khởi tạo 1 bản ghi `Vehicle` dạng draft (`LOCKED`) cho chủ xe. OTP chỉ dùng cho kích hoạt đăng ký, đặt lại mật khẩu và liên kết/xác minh số điện thoại cho tài khoản Google/Facebook. Khi liên kết số điện thoại mới cho tài khoản Social, nếu đã tồn tại bản ghi `Customer` chưa gán `userId`, hệ thống tự động hợp nhất tài khoản.

## Domain và các invariant bắt buộc

Roles: `ADMIN`, `STAFF`, `CUSTOMER`, `OWNER`.

- Client không bao giờ được chọn role khi đăng ký; đăng ký mới luôn là `CUSTOMER`.
- Tài khoản đăng ký bằng số điện thoại phải xác minh OTP trước khi được tạo/kích hoạt; đăng nhập hằng ngày dùng số điện thoại + mật khẩu. OTP lưu hash theo mục đích trong Redis, hết hạn, giới hạn thử/gửi lại và phải fail rõ ràng nếu Redis/SNS chưa cấu hình; không log hoặc mock OTP production.
- Hồ sơ chủ xe không tự cấp quyền OWNER. Chỉ tài khoản CUSTOMER có số điện thoại đã xác minh được gửi hồ sơ; chỉ ADMIN/STAFF được duyệt, đổi role và ghi audit trong transaction. Khi duyệt `OwnerLead` thành công, tự động khởi tạo `Vehicle` trạng thái `LOCKED` thuộc sở hữu của chủ xe mới.
- Tra cứu đơn công khai (`trackBookings`) bắt buộc phải có đồng thời Số điện thoại VÀ Mã đặt xe (`bookingCode`) để phòng chống lộ dữ liệu PII.
- Các đơn đặt xe `PENDING` quá 15 phút chưa thanh toán cọc sẽ bị hệ thống tự động hủy (`CANCELLED`) để giải phóng xe.
- Tìm xe là public; tạo booking và upload/xem CCCD/GPLX của chính mình yêu cầu JWT `CUSTOMER` hoặc `OWNER`, đồng thời liên kết hồ sơ Customer với user hiện tại. `OWNER` vẫn có thể thuê xe như khách; `ADMIN`/`STAFF` không tạo đơn từ luồng khách.
- Đánh giá xe (`ReviewsService`) bắt buộc khách hàng phải có ít nhất 1 đơn thuê xe ở trạng thái `COMPLETED` cho chiếc xe đó; cấm spam đánh giá từ tài khoản chưa từng thuê.
- Biên bản kiểm tra xe (`VehicleInspection`): Hỗ trợ lập biên bản giao xe (`CHECK_OUT`) và nhận lại xe (`CHECK_IN`). Nhận lại xe tự động tính số km quá định mức (`overLimitFee`) và số giờ quá hạn (`penaltyRate`).
- Rút tiền (`PayoutRequest`): Cho phép Chủ xe và CTV gửi yêu cầu rút tiền từ số dư khả dụng (`balance`), chỉ ADMIN/STAFF được duyệt và chuyển khoản qua VietQR/Bank.
- OWNER chỉ truy cập vehicle, booking, dashboard thuộc xe có `ownerId` của chính họ.
- Duyệt yêu cầu owner chỉ dành cho ADMIN/STAFF.
- JWT phải kiểm tra user/role hiện tại trong DB và fail closed khi DB lỗi.
- Hợp đồng điện tử cho phép người thuê ký (`signContract`) và Chủ xe / ADMIN / STAFF ký đối ứng (`ownerSignContract`).
- Chat Socket.IO lấy sender từ JWT handshake, dùng room riêng theo user; không tin `senderId` từ payload và không broadcast toàn cục.
- Webhook PayOS/MoMo phải xác minh chữ ký trước khi đổi payment/booking. Ghi nhận doanh thu phải idempotent.
- Mock/demo chỉ được chạy khi flag explicit là `true`; production luôn đặt `ENABLE_DEMO_DATA=false` và `ENABLE_PAYMENT_MOCKS=false`.
- Availability, giá, cọc và state transition phải được xác thực ở backend; không tin giá/status client gửi.
- `POST /api/bookings/quote` là báo giá public, read-only trước khi đặt; lúc tạo booking backend vẫn phải kiểm tra lại availability và tự tính lại toàn bộ giá (bao gồm kiểm tra trùng lịch bảo dưỡng `Maintenance`).
- Hệ thống chỉ phục vụ tại `Số 87A Nguyễn Công Trứ, Phường La Gi, Tỉnh Lâm Đồng` (khu vực La Gi/Bình Thuận), 24/7. Điểm nhận/trả và tọa độ do backend gán cố định; client không được gửi hoặc sửa theo từng booking/xe.

Trạng thái chính:

- Vehicle: `AVAILABLE`, `RENTED`, `MAINTENANCE`, `LOCKED`.
- Booking: `PENDING`, `CONFIRMED`, `RENTING`, `COMPLETED`, `CANCELLED`.
- Payment: `UNPAID`, `DEPOSITED`, `PAID`, `REFUNDED`.
- Payment method: `MOMO`, `BANK_TRANSFER`, `CASH`.
- Inspection type: `CHECK_OUT`, `CHECK_IN`.
- Payout status: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`.
- Quick booking request: `NEW`, `CONTACTING`, `CONTACTED`, `CLOSED`, `CANCELLED`. Đây là yêu cầu liên hệ, không giữ xe và không thay thế `Booking`.

## Auth và social OAuth

Mật khẩu dùng bcrypt (12 rounds) và JWT. Đăng nhập chính dùng số điện thoại Việt Nam đã chuẩn hóa + mật khẩu; email chỉ là thông tin liên hệ tùy chọn. Frontend hiện lưu `token`/`user` trong `localStorage`; nếu chuyển sang HttpOnly cookie phải đổi toàn bộ API client, guards, Socket.IO handshake và hydration trong một thay đổi có migration rõ ràng.

Google dùng Google Identity Services ID token flow:

- Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Backend: `GOOGLE_CLIENT_ID` phải cùng OAuth 2.0 Web Client ID.
- Backend dùng `google-auth-library` để verify audience, issuer và email verified; tuyệt đối không decode token thủ công.
- Flow này cần **OAuth 2.0 Web Client ID**, không phải API key và không cần Client Secret.
- Khi cấu hình Google Console, thêm origin `https://datxe.linuxunity.com` và origin local cần dùng.

Facebook dùng Meta JavaScript SDK ở frontend và xác minh access token ở backend:

- Frontend: `NEXT_PUBLIC_FACEBOOK_APP_ID`.
- Backend: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`; App Secret không bao giờ được đưa vào frontend, log hoặc Git.
- Backend gọi Meta `debug_token`, bắt buộc token hợp lệ, đúng App ID và Facebook user ID phải khớp profile trước khi cấp JWT.
- Tài khoản liên kết bằng `User.facebookId`; không phụ thuộc email Facebook và tài khoản mới vẫn phải xác minh số điện thoại trước khi gửi hồ sơ chủ xe.

## Env và production deploy

Tạo `/opt/datxe/.env` từ `.env.production.example`, permission hạn chế. Tối thiểu cần:

- Core: `POSTGRES_*`, `DATABASE_URL` (Compose tự dựng), `JWT_SECRET` dài/ngẫu nhiên, `CORS_ORIGINS`.
- Social login: `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`; GitHub Actions variables `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_FACEBOOK_APP_ID` để bake public ID vào frontend image.
- Storage: `UPLOAD_HOST_DIR`, `UPLOAD_DIR`, `FILE_PUBLIC_BASE_URL`. Ảnh xe public qua API; CCCD/GPLX private và cần JWT. AWS credentials chỉ dành cho SES/SNS notification hiện tại.
- PayOS: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
- MoMo: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_API_URL`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`.
- Email: `PUBLIC_APP_URL`, `ADMIN_NOTIFICATION_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`; bỏ trống SMTP để integration fail-soft và ghi log thất bại.
- SMS: `SMS_PROVIDER=AWS_SNS`, `SMS_ENABLED`, `SMS_SENDER_ID` tùy chọn và AWS credentials/region. Origination identity được quản lý trong AWS, không truyền bằng env riêng trong SNS Publish.
- Bootstrap admin: chạy thủ công với `ADMIN_PHONE`, `ADMIN_PASSWORD` và tùy chọn `ADMIN_EMAIL`/`ADMIN_NAME`; không lưu `ADMIN_PASSWORD` lâu dài trong `.env`.

GitHub repository/environment cần:

- Secrets: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_KNOWN_HOSTS`.
- Variables: `VPS_DEPLOY_PATH` (khuyến nghị `/opt/datxe`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_FACEBOOK_APP_ID`.
- Production environment protection/rules tùy chính sách vận hành.
- VPS phải có Docker Compose v2, quyền pull GHCR, `.env`, và certificate ở `/etc/letsencrypt/live/datxe.linuxunity.com/`.

Mỗi deploy chạy `prisma migrate deploy` trước khi thay container app. Nếu production DB đã tồn tại trước migration `0001_init`, phải baseline một lần theo Prisma trước deploy đầu tiên; không chạy migration init trực tiếp lên schema đã có bảng.

Script giữ `.last-successful-image` và rollback image tag khi health check `https://datxe.linuxunity.com/api/health/ready` thất bại. Không deploy thủ công song song với workflow.

## Quy tắc frontend/UI

- Đây là Next.js 16.2.9; đọc tài liệu tương ứng trong `frontend/node_modules/next/dist/docs/` theo `frontend/AGENTS.md` trước khi dùng API framework có thể đã đổi.
- Không thêm `any`, raw `<img>`, fake success, fake social login hoặc route/menu không tồn tại.
- Dùng API types trong `src/lib/api.ts`; hợp nhất dần dashboard client, không tạo request helper thứ ba.
- Dùng `next/image`, Lucide, semantic token trong `globals.css`, touch target tối thiểu 44px, visible focus, reduced motion và contrast WCAG AA.
- Palette hiện là emerald/navy, light-first; không quay lại violet hoặc thêm palette mới. Dashboard dark được phép nhưng phải dùng cùng semantic colors.
- Kiểm tra 375px, 768px, 1024px và desktop; không horizontal overflow; cung cấp loading/empty/error/disabled states.
- UI không được giả lập dữ liệu production. Khi integration thiếu config, hiển thị trạng thái cấu hình/không khả dụng.

Mọi task UI/UX phải dùng Codex skill `ui-ux-pro-max` tại `C:/Users/pavil/.codex/skills/ui-ux-pro-max/SKILL.md`. Bắt đầu bằng design-system query và tôn trọng `design-system/datxe/MASTER.md`; kết quả skill là đầu vào, không phải lý do phá brand hoặc thêm dependency thừa.

## Quy tắc backend/API

- REST dưới `/api`; controller mỏng, business logic trong service, DB qua `PrismaService`.
- Body/query mới phải có DTO `class-validator`; global pipe bật whitelist, transform và forbid non-whitelisted.
- Private endpoint dùng `JwtAuthGuard`; role endpoint thêm `RolesGuard` + `@Roles`; luôn kiểm tra ownership ngoài role.
- Không trả/log password, JWT, credential thanh toán, CCCD/GPLX hoặc PII không cần thiết.
- Integration ngoài phải có timeout, fail closed, chữ ký, idempotency và lỗi rõ ràng; không âm thầm trả demo khi production.
- Khi đổi response/endpoint, cập nhật backend DTO/service, frontend types/callers và test trong cùng thay đổi.
- Cập nhật hồ sơ khách và xe phải dùng DTO riêng, kiểm tra unique/ownership trong service và ghi audit log; không dựa vào `Partial<T>` TypeScript làm validation runtime.
- Tiền hiện dùng number/Float legacy. Tính năng kế toán mới nên dùng integer VND hoặc Prisma Decimal qua migration có chủ đích.

Khi đổi Prisma schema:

1. Sửa `backend/prisma/schema.prisma`.
2. Tạo/commit migration, không dùng `db push` cho production.
3. Chạy `npx prisma generate`.
4. Cập nhật DTO/service/frontend types/seed/test.
5. Ghi rõ forward/rollback và tương thích dữ liệu cũ.

## Lệnh chạy và Definition of Done

```powershell
# backend
cd backend
npm ci
npx prisma generate
npm run lint:check
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand

# frontend
cd frontend
npm ci
npm run lint:check
npm run build

# local full stack
docker compose up --build
```

Baseline xác nhận ngày 2026-07-24:

- Backend lint check: 0 lỗi; build pass.
- Backend unit: 6 suites, 28 tests pass.
- Backend e2e: 1 suite, 2 tests pass, không cần DB thật vì health/root test override Prisma.
- Frontend lint: 0 lỗi, 0 warning; production build pass 25 trang tĩnh cùng các route động.

Migration `0002_single_rental_location` đổi default và cập nhật toàn bộ xe hiện có sang điểm La Gi cố định. Booking lịch sử không bị sửa. Rollback vận hành chỉ nên đổi default/tọa độ xe sang địa điểm mới được doanh nghiệp phê duyệt; không khôi phục các địa chỉ xe cũ không còn đáng tin.

Migration `0005_phone_password_account_profile` bổ sung ngày sinh/giới tính cho `User` và cho phép `Customer.phone`/`Customer.idCardNo` null để tài khoản Google không cần dữ liệu placeholder. Forward deploy chạy `prisma migrate deploy`; rollback chỉ an toàn khi không còn bản ghi Google thiếu phone/CCCD và phải backfill trước khi đặt lại NOT NULL.

Migration `0006_quick_booking_requests` tạo yêu cầu đặt xe nhanh độc lập với `Booking` và gỡ khóa ngoại sai từ `AuditLog.targetId` sang `Booking` để audit tiếp tục là polymorphic. Forward deploy chạy `prisma migrate deploy`; rollback phải lưu/xuất toàn bộ yêu cầu nhanh trước khi xóa bảng/enum và chỉ nên khôi phục khóa ngoại audit sau khi chắc chắn không có audit cho target khác Booking.

Migration `0007_facebook_login` thêm `User.facebookId` nullable/unique để đăng nhập Facebook không phụ thuộc email. Forward deploy chạy `prisma migrate deploy`; rollback chỉ được xóa unique index/cột sau khi đã xuất mapping Facebook và chấp nhận các tài khoản Facebook không thể đăng nhập lại.

Migration `0008_quick_booking_conversion` liên kết `QuickBookingRequest.bookingId` tới `Booking` để admin/staff tạo đơn thật từ yêu cầu đặt nhanh, tự đóng yêu cầu và giữ audit/payment đồng bộ. Forward deploy chạy `prisma migrate deploy`; rollback phải xuất hoặc hủy liên kết các yêu cầu đã chuyển thành booking trước khi xóa khóa ngoại, unique index và cột `bookingId`.

Task chỉ hoàn tất khi authorization/ownership/validation đúng, API/UI typed, không thêm mock ẩn, lint/build/test liên quan pass và giới hạn còn lại được báo rõ.

## Nợ kỹ thuật còn lại (không che giấu)

- Tra cứu booking công khai bằng số điện thoại vẫn có rủi ro PII/enumeration; cần OTP hoặc booking code + phone và rate limit riêng.
- Upload local đã giới hạn MIME/size và protected object access, nhưng chưa có malware scanning, retention job hoặc quota theo user.
- Contract PDF được tạo phía client, font tiếng Việt chưa hoàn chỉnh và chưa có immutable signed-document storage/audit trail.
- Dashboard quản trị đã bỏ các modal feedback/rating/phạt nguội và dữ liệu giả. Thông báo hiện lấy từ audit log; chưa có inbox thông báo persistent riêng hoặc trạng thái đã đọc.
- Dashboard client còn tách khỏi API client chính; test coverage business/payment/auth còn thấp.
- `docker-compose.yml`, `nginx.conf` và Kubernetes manifest là legacy/dev, còn credential mẫu/hard-code; không dùng cho production trước khi harden.
- `backend/dist/` và `backend/backend-dev.out.log` đang bị Git track từ lịch sử. Đây là artifacts, không phải source of truth; không chỉnh tay hoặc dựa vào chúng. Cần một cleanup riêng được người dùng duyệt để untrack.
- Cần chạy smoke test production thật với PostgreSQL/Redis, bind mount upload trên VPS và sandbox credentials PayOS/MoMo/Google trước go-live.

## Git và vệ sinh workspace

- Không commit `.env`, token, key, credential, `.next`, `dist`, log hoặc dữ liệu local mới.
- Không sửa `backend/backend-dev.out.log`; file có thể tự đổi do process cũ.
- Xem `git diff --check`, nhưng bỏ qua whitespace trong tracked runtime log nếu đó là thay đổi có sẵn của người dùng.
- Chỉ stage/commit/push/deploy khi được yêu cầu rõ, và luôn báo chính xác những kiểm tra đã chạy.
