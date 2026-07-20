import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): {
        name: string;
        status: string;
        version: string;
    };
    getLiveness(): {
        status: string;
        service: string;
    };
    getReadiness(): Promise<{
        status: string;
        database: string;
    }>;
}
