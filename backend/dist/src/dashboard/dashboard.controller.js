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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardAuthController = exports.DashboardBookingController = exports.RatingController = exports.FeedbackController = exports.CarsController = exports.NotificationsController = exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getOverview(req, period) {
        return this.dashboardService.getOverview(period || 'today', req.user);
    }
    async getCarStatusSummary(req) {
        return this.dashboardService.getCarStatusSummary(req.user);
    }
    async getRevenueChart(req, month) {
        return this.dashboardService.getRevenueChart(month || new Date().toISOString().slice(0, 7), req.user);
    }
    async getTopServices(req) {
        return this.dashboardService.getTopServices(req.user);
    }
    async getTopCars(req, limit) {
        const lim = limit ? parseInt(limit, 10) : 10;
        return this.dashboardService.getTopCars(lim, req.user);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('car-status-summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getCarStatusSummary", null);
__decorate([
    (0, common_1.Get)('revenue-chart'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRevenueChart", null);
__decorate([
    (0, common_1.Get)('top-services'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTopServices", null);
__decorate([
    (0, common_1.Get)('top-cars'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTopCars", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.OWNER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
let NotificationsController = class NotificationsController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getNotifications(limit) {
        const lim = limit ? parseInt(limit, 10) : 5;
        return this.dashboardService.getNotifications(lim);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getNotifications", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.OWNER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], NotificationsController);
let CarsController = class CarsController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getNotifyList() {
        return await this.dashboardService.getCarNotifyList();
    }
    getViolateList() {
        return this.dashboardService.getCarViolateList();
    }
    getAvailable(location, startDate, months) {
        void startDate;
        void months;
        return [
            {
                id: 'c-long-1',
                brand: 'Kia',
                model: 'Carnival',
                plateNumber: '30A-111.11',
                dailyPrice: 1800000,
                monthlyPrice: 40000000,
                images: [
                    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
                ],
                location,
            },
            {
                id: 'c-long-2',
                brand: 'VinFast',
                model: 'VF8',
                plateNumber: '30A-999.99',
                dailyPrice: 1200000,
                monthlyPrice: 28000000,
                images: [
                    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
                ],
                location,
            },
        ];
    }
};
exports.CarsController = CarsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.OWNER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Get)('notify-list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CarsController.prototype, "getNotifyList", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.OWNER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Get)('violate-list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CarsController.prototype, "getViolateList", null);
__decorate([
    (0, common_1.Get)('available'),
    __param(0, (0, common_1.Query)('location')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CarsController.prototype, "getAvailable", null);
exports.CarsController = CarsController = __decorate([
    (0, common_1.Controller)('cars'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], CarsController);
let FeedbackController = class FeedbackController {
    createFeedback(body) {
        return {
            success: true,
            message: 'Góp ý của bạn đã được tiếp nhận. Cảm ơn ý kiến đóng góp!',
            data: body,
        };
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "createFeedback", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)('feedback')
], FeedbackController);
let RatingController = class RatingController {
    createRating(body) {
        return {
            success: true,
            message: 'Cảm ơn bạn đã đánh giá chất lượng dịch vụ!',
            data: body,
        };
    }
};
exports.RatingController = RatingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RatingController.prototype, "createRating", null);
exports.RatingController = RatingController = __decorate([
    (0, common_1.Controller)('rating')
], RatingController);
let DashboardBookingController = class DashboardBookingController {
    createLongTermBooking(body) {
        return {
            success: true,
            message: 'Đăng ký thuê xe dài hạn thành công! Nhân viên sẽ liên hệ tư vấn hợp đồng trong vòng 1 ngày làm việc.',
            bookingNumber: `BK-LT-${Math.floor(100000 + Math.random() * 900000)}`,
            data: body,
        };
    }
};
exports.DashboardBookingController = DashboardBookingController;
__decorate([
    (0, common_1.Post)('long-term'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardBookingController.prototype, "createLongTermBooking", null);
exports.DashboardBookingController = DashboardBookingController = __decorate([
    (0, common_1.Controller)('booking')
], DashboardBookingController);
let DashboardAuthController = class DashboardAuthController {
    logout() {
        return { success: true, message: 'Đăng xuất thành công!' };
    }
    forgotPassword(phone) {
        void phone;
        return {
            success: true,
            message: 'Mã OTP đặt lại mật khẩu đã được gửi đến số điện thoại đăng ký.',
        };
    }
};
exports.DashboardAuthController = DashboardAuthController;
__decorate([
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardAuthController.prototype, "forgotPassword", null);
exports.DashboardAuthController = DashboardAuthController = __decorate([
    (0, common_1.Controller)('auth')
], DashboardAuthController);
//# sourceMappingURL=dashboard.controller.js.map