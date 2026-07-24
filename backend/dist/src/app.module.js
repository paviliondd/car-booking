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
const dashboard_module_1 = require("./dashboard/dashboard.module");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const storage_module_1 = require("./storage/storage.module");
const account_module_1 = require("./account/account.module");
const quick_bookings_module_1 = require("./quick-bookings/quick-bookings.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 120,
                },
            ]),
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
            dashboard_module_1.DashboardModule,
            storage_module_1.StorageModule,
            account_module_1.AccountModule,
            quick_bookings_module_1.QuickBookingsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map