"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const notification_module_1 = require("./notification/notification.module");
const payments_module_1 = require("./payments/payments.module");
const auth_module_1 = require("./auth/auth.module");
const vehicles_module_1 = require("./vehicles/vehicles.module");
const bookings_module_1 = require("./bookings/bookings.module");
const analytics_module_1 = require("./analytics/analytics.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
const customers_module_1 = require("./customers/customers.module");
const audit_module_1 = require("./audit/audit.module");
const contracts_module_1 = require("./contracts/contracts.module");
const reviews_module_1 = require("./reviews/reviews.module");
const tickets_module_1 = require("./tickets/tickets.module");
const chat_module_1 = require("./chat/chat.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            notification_module_1.NotificationModule,
            payments_module_1.PaymentsModule,
            auth_module_1.AuthModule,
            vehicles_module_1.VehiclesModule,
            bookings_module_1.BookingsModule,
            analytics_module_1.AnalyticsModule,
            maintenance_module_1.MaintenanceModule,
            customers_module_1.CustomersModule,
            audit_module_1.AuditModule,
            contracts_module_1.ContractsModule,
            reviews_module_1.ReviewsModule,
            tickets_module_1.TicketsModule,
            chat_module_1.ChatModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map