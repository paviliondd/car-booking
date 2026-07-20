import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    momoWebhook(body: Record<string, unknown>): Promise<{
        partnerCode: unknown;
        orderId: string;
        requestId: unknown;
        resultCode: number;
        message: unknown;
    }>;
    private asString;
    payosWebhook(body: Record<string, unknown>): Promise<{
        status: string;
    }>;
}
