import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationService } from '../notification/notification.service';
import { CreateBookingDto } from './dto/booking.dto';
import { Booking, BookingStatus } from '@prisma/client';
export declare class BookingsService {
    private prisma;
    private redisService;
    private vehiclesService;
    private paymentsService;
    private notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService, vehiclesService: VehiclesService, paymentsService: PaymentsService, notificationService: NotificationService);
    createBooking(dto: CreateBookingDto): Promise<any>;
    trackBookings(phone: string): Promise<any[]>;
    findAll(): Promise<Booking[]>;
    findOne(id: string): Promise<Booking>;
    findOwnerBookings(ownerId: string): Promise<any[]>;
    updateStatus(id: string, status: BookingStatus, user: any): Promise<Booking>;
}
