import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    momoWebhook(body: any): Promise<{
        partnerCode: any;
        orderId: any;
        requestId: any;
        resultCode: any;
        message: any;
        responseTime: any;
        extraData: any;
        signature: any;
    }>;
    payosWebhook(body: any): Promise<{
        status: string;
    }>;
    simulateSuccess(bookingId: string, transactionId: string, method: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
