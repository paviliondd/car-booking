"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 5000;
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const configuredOrigins = configService
        .get('CORS_ORIGINS', 'http://localhost:3000,https://datxe.linuxunity.com')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || configuredOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Origin không được CORS cho phép'), false);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}/api`);
}
void bootstrap();
//# sourceMappingURL=main.js.map