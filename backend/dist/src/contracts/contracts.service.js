"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let ContractsService = class ContractsService {
    prisma;
    notificationService;
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    getContractTemplate(bookingNumber, renterName, ownerName, vehicleBrand, vehiclePlate, totalPrice) {
        return `
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------
HỢP ĐỒNG THUÊ XE TỰ LÁI
Mã hợp đồng: HD-${bookingNumber}

BÊN CHO THUÊ (BÊN A):
- Đại diện: ${ownerName}
- Vai trò: Chủ sở hữu phương tiện / Đại diện hệ thống datxe

BÊN THUÊ (BÊN B):
- Họ và tên: ${renterName}

ĐIỀU 1: ĐỐI TƯỢNG VÀ NỘI DUNG HỢP ĐỒNG
Bên A đồng ý cho Bên B thuê xe tự lái với các thông tin sau:
- Hiệu xe: ${vehicleBrand}
- Biển số kiểm soát: ${vehiclePlate}

ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN
- Tổng số tiền thuê xe: ${totalPrice.toLocaleString()} VND.
- Đặt cọc tối thiểu để giữ xe theo quy định hệ thống.

ĐIỀU 3: ĐIỀU KHOẢN VÀ CAM KẾT
- Bên B cam kết sử dụng xe đúng mục đích, tuân thủ Luật giao thông đường bộ.
- Không sử dụng xe vào mục đích vi phạm pháp luật.
- Trả xe đúng thời hạn quy định trong đơn đặt lịch.
    `.trim();
    }
    assertCanReadContract(booking, actor) {
        const privileged = actor.role === client_1.Role.ADMIN || actor.role === client_1.Role.STAFF;
        const isRenter = booking.customer.userId === actor.id;
        const isOwner = booking.vehicle.ownerId === actor.id;
        if (!privileged && !isRenter && !isOwner) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập hợp đồng này');
        }
    }
    async getOrCreateContract(bookingId, actor) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                customer: true,
                vehicle: {
                    include: {
                        owner: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Không tìm thấy đơn đặt xe với ID ${bookingId}`);
        }
        this.assertCanReadContract(booking, actor);
        let contract = await this.prisma.contract.findUnique({
            where: { bookingId },
        });
        if (!contract) {
            const ownerName = booking.vehicle.owner?.name || 'Hệ thống datxe';
            const terms = this.getContractTemplate(booking.bookingNumber, booking.customer.fullName, ownerName, `${booking.vehicle.brand} ${booking.vehicle.model}`, booking.vehicle.plateNumber, booking.totalPrice);
            contract = await this.prisma.contract.create({
                data: {
                    bookingId,
                    terms,
                },
            });
        }
        return {
            contract,
            booking,
        };
    }
    async signContract(bookingId, renterSignature, actor) {
        const { contract, booking } = await this.getOrCreateContract(bookingId, actor);
        if (booking.customer.userId !== actor.id) {
            throw new common_1.ForbiddenException('Chỉ người thuê xe mới có thể ký hợp đồng');
        }
        if (contract.renterSignature) {
            throw new common_1.BadRequestException('Hợp đồng này đã được ký trước đó.');
        }
        const updatedContract = await this.prisma.contract.update({
            where: { bookingId },
            data: {
                renterSignature,
                signedAt: new Date(),
            },
        });
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' },
        });
        const user = await this.prisma.user.findFirst({
            where: { customer: { id: booking.customerId } },
        });
        const emailBody = `
      <h3>Hợp đồng thuê xe điện tử số ${booking.bookingNumber}</h3>
      <p>Chào bạn ${booking.customer.fullName},</p>
      <p>Cảm ơn bạn đã tin dùng dịch vụ thuê xe tự lái tại datxe.</p>
      <p>Hợp đồng thuê xe điện tử của bạn đã được ký kết thành công. Bản sao hợp đồng PDF được đính kèm trong email này để lưu trữ.</p>
      <br/>
      <p>Trân trọng,<br/>Đội ngũ datxe</p>
    `;
        const mockPdfBase64 = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKEhvcCBkb25nIERBVFhFKQovQXV0aG9yIChEQVRYRSkKPj4KZW5kb2JqCnhyZWYKMCAxCjAwMDAwMDAwMDAgNjU1MzUgZiAKdHJhaWxlcgo8PAovU2l6ZSAyCj4+CnN0YXJ0eHJlZgoxMTYKJSVFT0Y=';
        if (user?.email) {
            await this.notificationService.sendEmailWithAttachment(user.email, `[datxe] Hợp đồng điện tử ${booking.bookingNumber} đã ký kết`, emailBody, mockPdfBase64, `HopDong_datxe_${booking.bookingNumber}.pdf`);
        }
        return updatedContract;
    }
    async ownerSignContract(bookingId, ownerSignature, actor) {
        const { contract, booking } = await this.getOrCreateContract(bookingId, actor);
        const isOwner = booking.vehicle.ownerId === actor.id;
        const isStaffOrAdmin = actor.role === client_1.Role.ADMIN || actor.role === client_1.Role.STAFF;
        if (!isOwner && !isStaffOrAdmin) {
            throw new common_1.ForbiddenException('Chỉ chủ sở hữu xe hoặc quản trị viên mới có thể ký đối ứng hợp đồng này');
        }
        if (contract.ownerSignature) {
            throw new common_1.BadRequestException('Hợp đồng này đã được chủ xe ký trước đó.');
        }
        return await this.prisma.contract.update({
            where: { bookingId },
            data: {
                ownerSignature,
            },
        });
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map