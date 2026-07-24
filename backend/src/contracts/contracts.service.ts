import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private getContractTemplate(
    bookingNumber: string,
    renterName: string,
    ownerName: string,
    vehicleBrand: string,
    vehiclePlate: string,
    totalPrice: number,
  ): string {
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

  private assertCanReadContract(
    booking: {
      customer: { userId: string | null };
      vehicle: { ownerId: string | null };
    },
    actor: { id: string; role: Role },
  ) {
    const privileged = actor.role === Role.ADMIN || actor.role === Role.STAFF;
    const isRenter = booking.customer.userId === actor.id;
    const isOwner = booking.vehicle.ownerId === actor.id;

    if (!privileged && !isRenter && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền truy cập hợp đồng này');
    }
  }

  async getOrCreateContract(
    bookingId: string,
    actor: { id: string; role: Role },
  ) {
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
      throw new NotFoundException(
        `Không tìm thấy đơn đặt xe với ID ${bookingId}`,
      );
    }

    this.assertCanReadContract(booking, actor);

    let contract = await this.prisma.contract.findUnique({
      where: { bookingId },
    });

    if (!contract) {
      const ownerName = booking.vehicle.owner?.name || 'Hệ thống datxe';
      const terms = this.getContractTemplate(
        booking.bookingNumber,
        booking.customer.fullName,
        ownerName,
        `${booking.vehicle.brand} ${booking.vehicle.model}`,
        booking.vehicle.plateNumber,
        booking.totalPrice,
      );

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

  async signContract(
    bookingId: string,
    renterSignature: string,
    actor: { id: string; role: Role },
  ) {
    const { contract, booking } = await this.getOrCreateContract(
      bookingId,
      actor,
    );

    if (booking.customer.userId !== actor.id) {
      throw new ForbiddenException('Chỉ người thuê xe mới có thể ký hợp đồng');
    }

    if (contract.renterSignature) {
      throw new BadRequestException('Hợp đồng này đã được ký trước đó.');
    }

    const updatedContract = await this.prisma.contract.update({
      where: { bookingId },
      data: {
        renterSignature,
        signedAt: new Date(),
      },
    });

    // Cập nhật trạng thái đơn đặt sang CONFIRMED (đã được ký cọc xác nhận)
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    // Gửi email đính kèm tệp PDF hợp đồng
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

    // Một tệp PDF mock base64 đơn giản để gửi đi
    const mockPdfBase64 =
      'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKEhvcCBkb25nIERBVFhFKQovQXV0aG9yIChEQVRYRSkKPj4KZW5kb2JqCnhyZWYKMCAxCjAwMDAwMDAwMDAgNjU1MzUgZiAKdHJhaWxlcgo8PAovU2l6ZSAyCj4+CnN0YXJ0eHJlZgoxMTYKJSVFT0Y=';

    if (user?.email) {
      await this.notificationService.sendEmailWithAttachment(
        user.email,
        `[datxe] Hợp đồng điện tử ${booking.bookingNumber} đã ký kết`,
        emailBody,
        mockPdfBase64,
        `HopDong_datxe_${booking.bookingNumber}.pdf`,
      );
    }

    return updatedContract;
  }

  async ownerSignContract(
    bookingId: string,
    ownerSignature: string,
    actor: { id: string; role: Role },
  ) {
    const { contract, booking } = await this.getOrCreateContract(
      bookingId,
      actor,
    );

    const isOwner = booking.vehicle.ownerId === actor.id;
    const isStaffOrAdmin =
      actor.role === Role.ADMIN || actor.role === Role.STAFF;

    if (!isOwner && !isStaffOrAdmin) {
      throw new ForbiddenException(
        'Chỉ chủ sở hữu xe hoặc quản trị viên mới có thể ký đối ứng hợp đồng này',
      );
    }

    if (contract.ownerSignature) {
      throw new BadRequestException('Hợp đồng này đã được chủ xe ký trước đó.');
    }

    return await this.prisma.contract.update({
      where: { bookingId },
      data: {
        ownerSignature,
      },
    });
  }
}
