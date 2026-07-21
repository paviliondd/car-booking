# datxe — nền tảng thuê xe tự lái

`datxe` là hệ thống thuê xe tự lái dành cho khách hàng, chủ xe và đội ngũ vận hành. Website production chạy tại [datxe.linuxunity.com](https://datxe.linuxunity.com), sử dụng Next.js cho giao diện, NestJS cho API, PostgreSQL cho dữ liệu và Docker Compose để triển khai lên VPS.

> Giao diện và nội dung sản phẩm dùng tiếng Việt. Domain production cố định là `datxe.linuxunity.com`; TLS được Nginx quản lý.

## Tính năng chính

### Khách hàng

- Đăng ký, đăng nhập bằng email/mật khẩu hoặc Google.
- Tìm xe trống theo ngày giờ và địa điểm.
- Xem thông tin, giá, vị trí và đánh giá xe.
- Chọn bảo hiểm, tỷ lệ đặt cọc và phương thức thanh toán.
- Tạo booking, thanh toán qua PayOS/MoMo hoặc tiền mặt.
- Xem và ký hợp đồng thuê xe.
- Tra cứu đơn, đánh giá và chat với chủ xe.

### Chủ xe

- Gửi yêu cầu nâng cấp tài khoản chủ xe.
- Đăng và quản lý xe thuộc sở hữu của mình.
- Theo dõi yêu cầu đặt xe, trạng thái và doanh thu.
- Trao đổi với khách hàng qua chat.

### Admin và staff

- Dashboard vận hành, booking và tình trạng xe.
- CRM khách hàng, bảo dưỡng, tài chính và báo cáo.
- Duyệt yêu cầu chủ xe.
- Audit log, ticket hỗ trợ và thông báo.

Một số màn dashboard phụ vẫn đang ở mức prototype. Xem [Giới hạn hiện tại](#giới-hạn-hiện-tại) trước khi công bố tính năng.

## Kiến trúc

```mermaid
flowchart LR
    Browser["Trình duyệt"] --> Nginx["Nginx :80/:443<br/>TLS, rate limit, security headers"]
    Nginx --> Frontend["Next.js 16 / React 19<br/>:3000"]
    Nginx --> Backend["NestJS 11 REST /api<br/>Socket.IO :5000"]
    Backend --> PostgreSQL["PostgreSQL 15"]
    Backend --> Redis["Redis 7"]
    Backend --> MinIO["MinIO / S3-compatible"]
    Backend --> Google["Google Identity Services"]
    Backend --> Payment["PayOS / MoMo"]
    Backend --> AWS["AWS SES / SNS"]
```

Production sử dụng:

- `.github/workflows/deploy.yml`: quality gate, build image, push GHCR và SSH deploy.
- `docker-compose.prod.yml`: stack production và mạng nội bộ.
- `nginx.prod.conf`: TLS, reverse proxy, WebSocket và security headers.
- `scripts/deploy-vps.sh`: migration, health check và rollback.
- `.env.production.example`: mẫu biến môi trường không chứa secret thật.

Không dùng `docker-compose.yml`, `nginx.conf` hoặc Kubernetes manifest legacy làm cấu hình production.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 16.2.9, React 19, TypeScript, Tailwind CSS 4 |
| Data fetching | TanStack Query |
| Backend | NestJS 11, REST, Socket.IO |
| ORM | Prisma 7 |
| Database | PostgreSQL 15 |
| Cache/realtime | Redis 7, Socket.IO |
| Object storage | MinIO hoặc S3-compatible storage |
| Authentication | JWT, bcrypt, Google Identity Services |
| Payment | PayOS, MoMo, tiền mặt |
| Production | Docker Compose v2, Nginx, GHCR, GitHub Actions |

## Cấu trúc repository

```text
frontend/
  src/app/                    Next.js App Router pages
  src/components/             component dùng chung
  src/lib/api.ts              API client và type chính
  src/providers/              query, theme, toast
  src/app/globals.css         semantic design tokens emerald/navy

backend/
  src/main.ts                 bootstrap, Helmet, CORS, validation
  src/app.module.ts           composition root
  src/auth/                   JWT, Google và phân quyền
  src/<domain>/               controller/service/module theo domain
  prisma/schema.prisma        data model
  prisma/migrations/          migration production

.github/workflows/deploy.yml  CI/CD production
docker-compose.prod.yml       production stack
nginx.prod.conf               production reverse proxy
scripts/deploy-vps.sh         deploy và rollback
design-system/datxe/          design system của sản phẩm
```

## Yêu cầu phát triển

- Node.js 22.
- npm tương thích với lockfile.
- Docker và Docker Compose v2.
- PostgreSQL 15, Redis 7 và MinIO nếu chạy đầy đủ integration.
- Windows PowerShell, macOS hoặc Linux đều được hỗ trợ cho lệnh npm.

## Chạy local

### 1. Khởi động dịch vụ nền

File `docker-compose.yml` hiện là cấu hình local/legacy, chỉ nên dùng để khởi động dịch vụ phát triển:

```bash
docker compose up -d db redis minio
```

Không dùng file này để deploy production vì còn credential mẫu và URL cũ.

### 2. Cấu hình backend

Tạo `backend/.env` và không commit file này:

```dotenv
DATABASE_URL=postgresql://postgres:supersecurepassword123@localhost:5432/car_rental?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-at-least-32-random-bytes
PORT=5000
CORS_ORIGINS=http://localhost:3000

GOOGLE_CLIENT_ID=

AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadminpassword123
AWS_REGION=ap-southeast-1
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_NAME=car-rental-bucket
AWS_SES_EMAIL_SENDER=noreply@datxe.linuxunity.com

MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:3000/payment
MOMO_IPN_URL=http://localhost:5000/api/payments/momo-webhook

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

ENABLE_DEMO_DATA=false
ENABLE_PAYMENT_MOCKS=false
```

Chạy backend:

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

API mặc định: `http://localhost:5000/api`.

### 3. Cấu hình frontend

Tạo `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Chạy frontend:

```bash
cd frontend
npm ci
npm run dev
```

Mở `http://localhost:3000`.

## Google Sign-In

Hệ thống dùng Google Identity Services theo ID token flow. Cần **OAuth 2.0 Web Client ID**, không phải API key và không cần Client Secret.

Trong Google Cloud Console:

1. Cấu hình OAuth consent screen.
2. Tạo credential loại **OAuth client ID → Web application**.
3. Thêm Authorized JavaScript origins:
   - `https://datxe.linuxunity.com`
   - `http://localhost:3000` nếu cần local.
4. Đặt cùng một Client ID vào:
   - Frontend local: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
   - Backend local/production: `GOOGLE_CLIENT_ID`.
   - GitHub repository variable: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Backend xác minh audience, issuer và email verified bằng `google-auth-library`; không tự decode token.

## Kiểm tra chất lượng

### Backend

```bash
cd backend
npm ci
npx prisma generate
npm run lint:check
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

### Frontend

```bash
cd frontend
npm ci
npm run lint:check
npm run build
```

## Triển khai production bằng GitHub Actions

Workflow được kích hoạt khi push vào `main` hoặc chạy thủ công bằng `workflow_dispatch`.

Luồng deploy:

1. Cài dependency bằng `npm ci`.
2. Generate Prisma Client, lint, test backend và build cả hai ứng dụng.
3. Build hai Docker image và push lên GHCR bằng commit SHA.
4. SSH vào VPS, upload manifest production.
5. Pull image, khởi động PostgreSQL/Redis/MinIO.
6. Chạy `prisma migrate deploy`.
7. Khởi động ứng dụng và kiểm tra `https://datxe.linuxunity.com/api/health/ready`.
8. Ghi lại image thành công hoặc rollback về image trước đó nếu health check thất bại.

### 1. Tạo environment production

Trong GitHub repository:

`Settings → Environments → New environment → production`

Có thể bật required reviewers hoặc giới hạn branch `main` trước khi cho phép deploy. Secret của environment chỉ được cấp cho job khai báo `environment: production`.

### 2. Thêm GitHub environment secrets

Mở `Settings → Environments → production → Environment secrets`:

| Tên | Giá trị |
|---|---|
| `VPS_HOST` | IP public hoặc hostname VPS, không có `http://`/`https://` |
| `VPS_PORT` | Cổng SSH, thường là `22` |
| `VPS_USER` | Linux user có quyền Docker và ghi vào thư mục deploy |
| `VPS_SSH_PRIVATE_KEY` | Toàn bộ private key, gồm dòng `BEGIN` và `END` |
| `VPS_SSH_KNOWN_HOSTS` | Dòng host key đã xác minh của VPS |

Nếu GitHub plan của repository private không hỗ trợ environment secrets, đặt cùng tên tại `Settings → Secrets and variables → Actions → Secrets`.

### 3. Thêm GitHub variables

Repository variable tại `Settings → Secrets and variables → Actions → Variables`:

| Tên | Giá trị | Phạm vi bắt buộc |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth Web Client ID dạng `...apps.googleusercontent.com` | Repository, vì job quality/images không dùng environment `production` |

Environment variable tại `Settings → Environments → production → Environment variables`:

| Tên | Giá trị |
|---|---|
| `VPS_DEPLOY_PATH` | `/opt/datxe` |

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` là thông tin public được bake vào JavaScript frontend nên không đặt như secret. Có thể để trống tạm thời, nhưng nút Google sẽ báo chưa cấu hình.

Không tạo `GITHUB_TOKEN`. GitHub tự cấp token ngắn hạn cho mỗi job; workflow đã khai báo `contents: read` và `packages: write` để làm việc với GHCR.

### 4. Tạo SSH key riêng cho deploy

Tạo một key Ed25519 riêng, không dùng key cá nhân. Workflow hiện không hỗ trợ nhập passphrase nên key deploy phải không có passphrase và chỉ dành cho repository này.

```bash
ssh-keygen -t ed25519 -C "github-actions-datxe" -f datxe_deploy
```

- Thêm nội dung `datxe_deploy.pub` vào `~/.ssh/authorized_keys` của `VPS_USER`.
- Thêm toàn bộ nội dung `datxe_deploy` vào `VPS_SSH_PRIVATE_KEY`.
- Hạn chế user deploy ở mức quyền tối thiểu cần thiết; không dùng root nếu không cần.

Lấy host key bằng đúng host và port mà workflow sẽ dùng:

```bash
ssh-keyscan -p 22 -H <VPS_HOST>
```

Xác minh fingerprint qua một kênh tin cậy trước khi lưu kết quả vào `VPS_SSH_KNOWN_HOSTS`. Không dùng `StrictHostKeyChecking=no`.

### 5. Chuẩn bị VPS

VPS cần:

- Docker Engine và Docker Compose v2.
- `curl`, SSH server và quyền chạy Docker cho `VPS_USER`.
- DNS A/AAAA của `datxe.linuxunity.com` trỏ về VPS.
- Firewall mở 80, 443 và cổng SSH.
- Không có dịch vụ khác chiếm cổng 80/443.

Tạo thư mục deploy một lần:

```bash
sudo install -d -m 0750 -o <VPS_USER> -g <VPS_USER> /opt/datxe
sudo install -d -m 0755 /var/www/certbot
```

Kiểm tra Docker:

```bash
docker version
docker compose version
```

Kiến trúc hiện tại dùng **Nginx container** trong `docker-compose.prod.yml` để sở hữu cổng 80/443. Nếu VPS đang chạy Nginx trực tiếp trên host, dừng/disable dịch vụ đó hoặc thiết kế lại reverse proxy trước khi deploy; hai Nginx không thể cùng bind 80/443.

### 6. Tạo file `/opt/datxe/.env`

Sao chép `.env.production.example` lên VPS thành `/opt/datxe/.env`, điền giá trị thật rồi giới hạn quyền:

```bash
chmod 600 /opt/datxe/.env
```

Các nhóm biến:

| Nhóm | Biến |
|---|---|
| PostgreSQL | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| MinIO | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` |
| Auth | `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ORIGINS` |
| Storage/email | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_ENDPOINT`, `S3_BUCKET_NAME`, `AWS_SES_EMAIL_SENDER` |
| MoMo | `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_API_URL`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL` |
| PayOS | `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` |
| Safety flags | `ENABLE_DEMO_DATA=false`, `ENABLE_PAYMENT_MOCKS=false` |

Sinh secret dạng hex để tránh ký tự cần URL-encode trong `DATABASE_URL`:

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD hoặc MINIO password
openssl rand -hex 32   # JWT_SECRET
```

Không upload `.env` production lên GitHub. Workflow cố ý chỉ upload compose, Nginx config và deploy script.

### 7. Chuẩn bị certificate

Nginx container mount certificate từ host tại:

```text
/etc/letsencrypt/live/datxe.linuxunity.com/fullchain.pem
/etc/letsencrypt/live/datxe.linuxunity.com/privkey.pem
```

Certificate phải tồn tại trước khi container Nginx khởi động lần đầu. ACME webroot mặc định là `/var/www/certbot` và được phục vụ qua `/.well-known/acme-challenge/`.

Nếu đổi hai thư mục này, đặt `LETSENCRYPT_DIR` và `ACME_WEBROOT_DIR` trong `/opt/datxe/.env`.

### 8. Database đã có dữ liệu

Deploy script luôn chạy `prisma migrate deploy`. Với database mới, migration `0001_init` sẽ tạo schema.

Nếu database production đã tồn tại các bảng từ trước, không chạy migration init trực tiếp. Sau khi đối chiếu schema thực tế với `backend/prisma/schema.prisma`, baseline một lần:

```bash
cd /opt/datxe
IMAGE_TAG=<existing-image-tag> GHCR_NAMESPACE=<github-owner> \
  docker compose -f docker-compose.prod.yml run --rm backend \
  npx prisma migrate resolve --applied 0001_init
```

Chỉ đánh dấu applied khi schema cũ thực sự tương thích. Sao lưu database trước thao tác baseline.

### 9. Chạy deploy

- Push commit vào `main`, hoặc
- Mở `Actions → CI and deploy VPS → Run workflow`.

Theo dõi ba job theo thứ tự `quality → images → deploy`. Không deploy thủ công song song vì workflow sử dụng một concurrency group production.

## Vận hành và xử lý sự cố

### Health check

```bash
curl --fail https://datxe.linuxunity.com/api/health/live
curl --fail https://datxe.linuxunity.com/api/health/ready
```

- `live`: tiến trình backend đang chạy.
- `ready`: backend và dependency cần thiết sẵn sàng phục vụ.

### Xem trạng thái và log

```bash
cd /opt/datxe
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 backend
docker compose -f docker-compose.prod.yml logs --tail=200 frontend
docker compose -f docker-compose.prod.yml logs --tail=200 nginx
```

Không đưa JWT, password, credential thanh toán hoặc PII vào issue/log công khai.

### Các lỗi deploy thường gặp

| Hiện tượng | Kiểm tra |
|---|---|
| SSH `Permission denied` | Public key có trong `authorized_keys`, đúng `VPS_USER`, private key không bị thiếu dòng |
| `Host key verification failed` | `VPS_SSH_KNOWN_HOSTS` được tạo bằng đúng host/port và host key chưa thay đổi |
| Không tạo được `/opt/datxe` | `VPS_USER` chưa sở hữu hoặc chưa có quyền ghi thư mục |
| Pull GHCR thất bại | Workflow có `packages: write`, package gắn với repository và tổ chức không chặn GitHub Packages |
| Nginx không bind được 80/443 | Nginx/Apache host hoặc container khác đang chiếm cổng |
| Không tìm thấy certificate | Kiểm tra hai file trong `/etc/letsencrypt/live/datxe.linuxunity.com/` |
| Compose báo thiếu biến | Kiểm tra `/opt/datxe/.env` và tên biến trong `.env.production.example` |
| Migration thất bại | Kiểm tra `DATABASE_URL`, trạng thái PostgreSQL và yêu cầu baseline database cũ |
| Google login không hiện | Client ID phải có ở cả GitHub repository variable và `/opt/datxe/.env`, sau đó build lại frontend |
| Health check thất bại | Xem log backend/frontend/nginx; script sẽ thử rollback về `.last-successful-image` |

### Rollback

`scripts/deploy-vps.sh` lưu commit SHA deploy thành công gần nhất trong `/opt/datxe/.last-successful-image`. Khi health check thất bại, script tự pull và khởi động lại image trước đó.

Rollback image không tự rollback migration database. Migration production phải ưu tiên backward-compatible và có kế hoạch khôi phục dữ liệu riêng.

## Bảo mật và invariant nghiệp vụ

- Đăng ký mới luôn tạo `CUSTOMER`; client không được chọn role.
- OWNER chỉ được thao tác xe và booking thuộc chính mình.
- Chỉ ADMIN/STAFF được duyệt yêu cầu owner.
- JWT phải kiểm tra user/role hiện tại trong database.
- Chỉ customer của booking được ký hợp đồng.
- Socket.IO lấy sender từ JWT handshake và không tin `senderId` client gửi.
- Webhook PayOS/MoMo phải xác minh chữ ký trước khi đổi trạng thái.
- Giá, availability, cọc và state transition được xác thực ở backend.
- Production luôn đặt `ENABLE_DEMO_DATA=false` và `ENABLE_PAYMENT_MOCKS=false`.
- Không commit `.env`, token, private key, `.next`, `dist`, log hoặc dữ liệu local.

## Giới hạn hiện tại

- Tra cứu booking công khai bằng số điện thoại cần bổ sung OTP hoặc booking code để giảm rủi ro enumeration/PII.
- Upload CCCD/GPLX mới preview base64 phía client; chưa có signed upload, kiểm tra MIME/size và protected object access hoàn chỉnh.
- Contract PDF phía client chưa có immutable signed-document storage và audit trail đầy đủ.
- Một số dashboard phụ như notification, violation, feedback, rating, long-term booking, forgot password và logout còn prototype hoặc chưa persistent.
- Test coverage cho auth, payment và business rules cần tiếp tục tăng.
- `docker-compose.yml`, `nginx.conf` và Kubernetes manifest là legacy/dev, không phải source of truth production.

## Quy trình đóng góp

1. Đọc `AGENTS.md` ở root và file gần nhất trong thư mục làm việc.
2. Chạy `git status --short`; không ghi đè thay đổi hiện hữu của người khác.
3. Thay đổi API phải cập nhật DTO/service, frontend type/caller và test cùng lúc.
4. Thay đổi Prisma phải có migration; không dùng `db push` cho production.
5. Chạy lint, build và test liên quan trước khi bàn giao.
6. Không commit/push/deploy khi chưa được người sở hữu repository yêu cầu.

