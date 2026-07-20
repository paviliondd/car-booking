export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    phone?: string;
    idCardNo?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class GoogleLoginDto {
    credential: string;
}
export declare class UpgradeOwnerDto {
    phone: string;
    idCardNo: string;
    address: string;
}
export declare class VerifyOwnerDto {
    approve: boolean;
}
