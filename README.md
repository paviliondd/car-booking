# datxe — nền tảng thuê xe tự lái

`datxe` là website thuê xe tự lái cho khách hàng, chủ xe và đội vận hành. Production chạy tại `https://datxe.linuxunity.com` với Next.js, NestJS, PostgreSQL, Redis và lưu file trực tiếp trên ổ đĩa VPS. MinIO không còn thuộc kiến trúc hiện tại; adapter storage được tách riêng để có thể chuyển sang AWS S3 khi quy mô yêu cầu.

## Luồng nghiệp vụ

### Khách hàng

1. Mở `/`, chọn địa điểm và thời gian rồi nhấn **Tìm xe**.
2. Xem xe tại `/booking`. Tìm kiếm xe là public, nhưng đặt xe và upload giấy tờ yêu cầu đăng nhập tài khoản `CUSTOMER` tại `/auth`.
3. Chọn xe, bảo hiểm, phương thức thanh toán và tải CCCD/GPLX. Backend tự kiểm tra lịch trống và tính lại giá; không tin giá từ trình duyệt.
4. Hệ thống tạo `Customer`, `Booking` và `Payment` trong PostgreSQL rồi chuyển đến `/payment`.
5. Sau khi webhook cổng thanh toán được xác minh, trạng thái payment/booking và bản ghi doanh thu được cập nhật idempotent.
6. Hợp đồng được xem/ký tại `/contract/[bookingId]`. Tra cứu đơn hiện ở `/track`.

### Chủ xe

1. Đăng ký khách hàng và gửi yêu cầu tại `/become-owner` hoặc `/tro-thanh-chu-xe`.
2. ADMIN/STAFF duyệt yêu cầu; tài khoản chuyển thành `OWNER`.
3. Chủ xe mở `/owner`, đăng xe tại `/owner/add-car`, upload ảnh lên VPS và quản lý yêu cầu thuê xe thuộc xe của mình.
4. `/dashboard` chỉ tổng hợp booking, chi phí và doanh thu của chính owner.

### Admin và staff

1. Đăng nhập tại `/auth`.
2. Sau đăng nhập, frontend chuyển ADMIN/STAFF tới `/dashboard`.
3. Dashboard hiển thị tổng hợp hợp đồng, trạng thái xe, doanh thu theo tháng và xe có doanh thu cao.
4. `/owner` dùng để kiểm tra xe và đơn thuê; `/track` tra cứu đơn. Một số drawer/thẻ phụ về thông báo, phạt nguội và rating vẫn là prototype, chưa phải phân hệ persistent hoàn chỉnh.

| Trang | URL | Quyền/chức năng |
|---|---|---|
| Trang chủ | `/` | Public, tìm xe tự lái |
| Đăng nhập/đăng ký | `/auth` | Public |
| Tìm và đặt xe | `/booking` | Tìm public; đặt xe cần CUSTOMER |
| Thanh toán | `/payment` | Theo booking |
| Hợp đồng | `/contract/[bookingId]` | Customer của booking; privileged role chỉ xem theo policy |
| Tra cứu | `/track` | Public hiện tại; xem lưu ý bảo mật bên dưới |
| Portal chủ xe | `/owner` | OWNER |
| Đăng xe | `/owner/add-car` | OWNER đã xác minh |
| Dashboard | `/dashboard` | OWNER, ADMIN, STAFF |

## Kiểm tra doanh thu

Đăng nhập ADMIN/STAFF tại `/auth`, mở `/dashboard`, rồi chọn tháng trong biểu đồ **Doanh thu tháng này**. OWNER dùng cùng trang nhưng chỉ thấy dữ liệu xe thuộc `ownerId` của mình.

Nguồn dữ liệu:

- `Booking.totalPrice`: giá trị hợp đồng do backend tính.
- `Payment`: tiền phải thu/trạng thái thanh toán.
- `Revenue`: doanh thu thực tế, mỗi booking tối đa một bản ghi nhờ unique constraint `bookingId`.
- `Expense`: chi phí xe dùng để tính số liệu vận hành.

Không bật `ENABLE_DEMO_DATA` trên production. Nếu chưa có webhook thanh toán hợp lệ hoặc chưa có booking đã thanh toán, biểu đồ doanh thu đúng sẽ bằng 0.

## Kiến trúc production

```text
Browser
  -> Nginx :80/:443
       -> Next.js :3000
       -> NestJS /api + Socket.IO :5000
            -> PostgreSQL 15 (dữ liệu nghiệp vụ)
            -> Redis 7 (lock/cache)
            -> /app/uploads (bind mount từ ổ đĩa VPS)
            -> Google Identity, PayOS/MoMo, AWS SES/SNS tùy cấu hình
```

Ảnh xe nằm trong vùng public và được trả qua API. CCCD/GPLX nằm trong vùng private, chỉ tải qua endpoint có JWT và kiểm tra quyền. PostgreSQL lưu storage key/URL, không lưu file base64. Khi chuyển sang S3, thay storage adapter và migrate key; không cần thay mô hình booking.

## Chạy local

Yêu cầu Node.js 22, Docker Compose v2 và Git.

Tạo `.env` ở root (không commit):

```dotenv
POSTGRES_USER=datxe
POSTGRES_PASSWORD=generate-a-long-random-value
POSTGRES_DB=datxe
JWT_SECRET=generate-at-least-32-random-bytes
CORS_ORIGINS=http://localhost:3000
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
ENABLE_DEMO_DATA=false
ENABLE_PAYMENT_MOCKS=false
```

Chạy full stack:

```powershell
docker compose up --build
```

Hoặc chỉ chạy dịch vụ nền rồi chạy ứng dụng bằng npm:

```powershell
docker compose up -d db redis
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

```powershell
cd frontend
npm ci
$env:NEXT_PUBLIC_API_URL='http://localhost:5000/api'
$env:NEXT_PUBLIC_WS_URL='http://localhost:5000'
$env:NEXT_PUBLIC_GOOGLE_CLIENT_ID=''
$env:NEXT_PUBLIC_FACEBOOK_APP_ID=''
npm run dev
```

## Cấu hình `/opt/datxe/.env`

Sao chép `.env.production.example` thành `/opt/datxe/.env`, thay toàn bộ placeholder và giới hạn quyền:

```bash
sudo install -d -m 750 /opt/datxe /opt/datxe/data/uploads
sudo chown -R 1001:1001 /opt/datxe/data/uploads
sudo cp .env.production.example /opt/datxe/.env
sudo chmod 600 /opt/datxe/.env
openssl rand -hex 32
```

Nhóm biến bắt buộc:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: database production.
- `JWT_SECRET`: chuỗi ngẫu nhiên tối thiểu 32 byte, không dùng chung với mật khẩu DB.
- `CORS_ORIGINS=https://datxe.linuxunity.com`.
- `UPLOAD_HOST_DIR=/opt/datxe/data/uploads`: đường dẫn thật trên VPS.
- `UPLOAD_DIR=/app/uploads`: đường dẫn trong container, thường giữ nguyên.
- `FILE_PUBLIC_BASE_URL=https://datxe.linuxunity.com`.
- `ENABLE_DEMO_DATA=false`, `ENABLE_PAYMENT_MOCKS=false`.

Nhóm integration:

- Google: `GOOGLE_CLIENT_ID` phải là OAuth 2.0 Web Client ID; GitHub variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` phải cùng giá trị.
- Facebook: lấy App ID/App Secret tại `https://developers.facebook.com/apps/`. Đặt `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` trên VPS và
  GitHub variable `NEXT_PUBLIC_FACEBOOK_APP_ID`; App Secret chỉ tồn tại ở backend.
- PayOS: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
- MoMo: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, URL redirect/IPN.
- Email/SMS AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_SES_EMAIL_SENDER`. SMS dùng
  `SMS_PROVIDER=AWS_SNS`, chỉ bật `SMS_ENABLED=true` sau khi SNS đã cấu hình; `SMS_SENDER_ID` là tùy chọn 1-11 ký tự
  chữ/số. Origination identity được cấu hình trong AWS. Để trống credential nếu chưa sử dụng; không điền giá trị giả.

`NEXT_PUBLIC_*` được bake lúc build frontend và phải cấu hình bằng GitHub Actions variables, không chỉ trong `.env` trên VPS.

## Tạo admin production lần đầu

Không chạy seed demo trên production. Sau migration, chạy bootstrap một lần trong backend container:

```bash
cd /opt/datxe
export ADMIN_PHONE='0901234567'
read -rsp 'Mật khẩu admin mới (tối thiểu 12 ký tự): ' ADMIN_PASSWORD
echo
export ADMIN_PASSWORD
docker compose -f docker-compose.prod.yml run --rm \
  -e ADMIN_PHONE \
  -e ADMIN_PASSWORD \
  -e ADMIN_EMAIL= \
  -e ADMIN_NAME='Quản trị datxe' \
  backend npm run admin:bootstrap
unset ADMIN_PHONE ADMIN_PASSWORD
```

Lệnh này có thể chạy lại để khôi phục admin: tài khoản cùng số điện thoại sẽ được xác minh, đặt lại mật khẩu và gán
role `ADMIN`. `ADMIN_PHONE` là bắt buộc và phải là số điện thoại Việt Nam thật; `ADMIN_EMAIL` là tùy chọn. Không dùng
placeholder như `09xxxxxxxx`. Không lưu `ADMIN_PASSWORD` trong file env hoặc command history. Đăng nhập bằng số điện
thoại + mật khẩu tại `https://datxe.linuxunity.com/auth`, rồi mở `/dashboard`. Người dùng đăng ký bình thường luôn là
`CUSTOMER` và không thể tự chọn role.

Seed phát triển chỉ chạy khi đặt rõ `ENABLE_DEMO_DATA=true`; tài khoản demo admin là `0900000001` / `adminpassword123`. Không dùng tài khoản demo trên production.

## GitHub Actions và deploy VPS

Push `main` chạy theo thứ tự:

1. Backend/frontend lint và build; backend chạy unit test.
2. Hai image được build song song, dùng GitHub Actions cache và push lên GHCR.
3. Workflow SSH lên VPS, upload manifest, pull image theo commit SHA.
4. PostgreSQL/Redis được health-check, `prisma migrate deploy` chạy trước app.
5. Health check `https://datxe.linuxunity.com/api/health/ready`; lỗi sẽ rollback image trước.

GitHub environment `production` cần secrets `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`,
`VPS_SSH_KNOWN_HOSTS`; variables `VPS_DEPLOY_PATH=/opt/datxe`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` và
`NEXT_PUBLIC_FACEBOOK_APP_ID`.

Production dùng `docker-compose.prod.yml` và `nginx.prod.conf`. Không deploy thủ công song song với workflow.

## Backup và khôi phục

Cần backup cả PostgreSQL lẫn upload; chỉ backup một trong hai sẽ tạo record/file mồ côi.

```bash
cd /opt/datxe
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > datxe-db.dump
tar -C /opt/datxe/data -czf datxe-uploads.tar.gz uploads
```

Lưu bản backup mã hóa ở máy khác hoặc object storage. Kiểm thử restore định kỳ trên database riêng. Khi restore production, dừng ghi dữ liệu, khôi phục DB và thư mục upload từ cùng một mốc thời gian.

## Kiểm tra chất lượng

```powershell
cd backend
npx prisma generate
npm run lint:check
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand

cd ../frontend
npm run lint:check
npm run build

cd ..
docker compose -f docker-compose.prod.yml config
```

## Giới hạn cần biết trước khi kinh doanh

- Tra cứu public bằng số điện thoại còn rủi ro enumeration/PII; nên bổ sung OTP hoặc booking code + phone trước chiến dịch lớn.
- Hợp đồng PDF client-side chưa có immutable signed-document storage/audit trail hoàn chỉnh.
- Notification, phạt nguội, rating và một số drawer dashboard còn prototype.
- Cần smoke test thật với PostgreSQL/Redis, ổ đĩa VPS và sandbox credentials Google/PayOS/MoMo trước go-live.
- Theo dõi dung lượng/inode của `UPLOAD_HOST_DIR`, thiết lập retention và backup. Khi một VPS không còn đủ dung lượng hoặc cần đa máy, chuyển adapter sang AWS S3.

Không commit `.env`, token, key, file upload, `.next`, `dist` hoặc log runtime.
