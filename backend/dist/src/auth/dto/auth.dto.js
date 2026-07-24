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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewOwnerApplicationDto = exports.VerifyOwnerDto = exports.OwnerApplicationDto = exports.FacebookLoginDto = exports.GoogleLoginDto = exports.VerifyPhoneCodeDto = exports.ResetPasswordDto = exports.LoginDto = exports.RegisterDto = exports.RequestPhoneCodeDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const phone_1 = require("../../common/phone");
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
class RequestPhoneCodeDto {
    phone;
}
exports.RequestPhoneCodeDto = RequestPhoneCodeDto;
__decorate([
    (0, class_validator_1.Matches)(phone_1.VIETNAM_PHONE_PATTERN, {
        message: 'Số điện thoại Việt Nam không hợp lệ',
    }),
    __metadata("design:type", String)
], RequestPhoneCodeDto.prototype, "phone", void 0);
class RegisterDto extends RequestPhoneCodeDto {
    code;
    name;
    password;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], RegisterDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 72),
    (0, class_validator_1.Matches)(PASSWORD_PATTERN, {
        message: 'Mật khẩu phải có ít nhất một chữ cái và một chữ số',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
class LoginDto extends RequestPhoneCodeDto {
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class ResetPasswordDto extends RequestPhoneCodeDto {
    code;
    password;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 72),
    (0, class_validator_1.Matches)(PASSWORD_PATTERN, {
        message: 'Mật khẩu phải có ít nhất một chữ cái và một chữ số',
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
    code;
}
exports.VerifyPhoneCodeDto = VerifyPhoneCodeDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], VerifyPhoneCodeDto.prototype, "code", void 0);
class GoogleLoginDto {
    credential;
}
exports.GoogleLoginDto = GoogleLoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "credential", void 0);
class FacebookLoginDto {
    accessToken;
}
exports.FacebookLoginDto = FacebookLoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(20, 4096),
    __metadata("design:type", String)
], FacebookLoginDto.prototype, "accessToken", void 0);
class OwnerApplicationDto {
    carName;
    plateNumber;
    vehicleYear;
    applicantNotes;
}
exports.OwnerApplicationDto = OwnerApplicationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], OwnerApplicationDto.prototype, "carName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(4, 20),
    __metadata("design:type", String)
], OwnerApplicationDto.prototype, "plateNumber", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1980),
    (0, class_validator_1.Max)(2100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OwnerApplicationDto.prototype, "vehicleYear", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], OwnerApplicationDto.prototype, "applicantNotes", void 0);
class VerifyOwnerDto {
    approve;
}
exports.VerifyOwnerDto = VerifyOwnerDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VerifyOwnerDto.prototype, "approve", void 0);
class ReviewOwnerApplicationDto {
    status;
    adminNotes;
    rejectionReason;
}
exports.ReviewOwnerApplicationDto = ReviewOwnerApplicationDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.OwnerApplicationStatus),
    __metadata("design:type", String)
], ReviewOwnerApplicationDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReviewOwnerApplicationDto.prototype, "adminNotes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReviewOwnerApplicationDto.prototype, "rejectionReason", void 0);
//# sourceMappingURL=auth.dto.js.map