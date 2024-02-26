import { VerifyOTPRequest } from "../../models/request/verify-otp.request";

export abstract class UserVerificationApiServiceAbstraction {
  abstract postAccountVerifyOTP(request: VerifyOTPRequest): Promise<void>;
  abstract postAccountRequestOTP(): Promise<void>;
}
