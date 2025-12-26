import { Injectable } from "@nestjs/common";
import { OtpModel } from "./otp_model";

@Injectable()
export class OtpService {

    sign_in_otps: Map<string, OtpModel> = new Map<string, OtpModel>();
    reg_in_otps: Map<string, OtpModel> = new Map<string, OtpModel>();


    generateSignOtpForEmail(email: string): string {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        const otpModel = new OtpModel();
        otpModel.otp = otp;
        otpModel.timestamp = Date.now();
        this.sign_in_otps.set(email, otpModel);
        return otp;
    }

    validateSignOtpForEmail(email: string, otp: string): boolean {
        console.log(`Validating OTP for ${email}: ${otp}`);
        console.log(this.sign_in_otps.get(email));
        const otpModel = this.sign_in_otps.get(email);
        if (!otpModel) {
            return false; // No OTP found for this email
        }
        const currentTime = Date.now();
        const otpValidityDuration = 1000 * 60 * 5; // OTP valid for 5 minutes
        if (otpModel.otp === otp && (currentTime - otpModel.timestamp) <= otpValidityDuration) {
            this.sign_in_otps.delete(email); // Invalidate OTP after successful validation
            return true;
        }
      
      
        return false;
    }

    generateRegOtpForEmail(email: string): string {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        const otpModel = new OtpModel();
        otpModel.otp = otp;
        otpModel.timestamp = Date.now();
        this.reg_in_otps.set(email, otpModel);
        return otp;
    }

    validateRegOtpForEmail(email: string, otp: string): boolean {
        console.log(`Validating OTP for ${email}: ${otp}`);
        console.log(this.sign_in_otps.get(email));
        const otpModel = this.reg_in_otps.get(email);
        if (!otpModel) {
            return false; // No OTP found for this email
        }
        const currentTime = Date.now();
        const otpValidityDuration = 1000 * 60 * 5; // OTP valid for 5 minutes
        if (otpModel.otp === otp && (currentTime - otpModel.timestamp) <= otpValidityDuration) {
            this.reg_in_otps.delete(email); // Invalidate OTP after successful validation
            return true;
        }
        return false;
    }
}