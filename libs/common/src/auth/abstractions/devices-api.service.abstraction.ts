import { ListResponse } from "../../models/response/list.response";
import { DeviceResponse } from "../abstractions/devices/responses/device.response";
import { SecretVerificationRequest } from "../models/request/secret-verification.request";
import { UpdateDevicesTrustRequest } from "../models/request/update-devices-trust.request";
import { ProtectedDeviceResponse } from "../models/response/protected-device.response";

export abstract class DevicesApiServiceAbstraction {
  abstract getKnownDevice(email: string, deviceIdentifier: string): Promise<boolean>;

  abstract getDeviceByIdentifier(deviceIdentifier: string): Promise<DeviceResponse>;

  abstract getDevices(): Promise<ListResponse<DeviceResponse>>;

  abstract updateTrustedDeviceKeys(
    deviceIdentifier: string,
    devicePublicKeyEncryptedUserKey: string,
    userKeyEncryptedDevicePublicKey: string,
    deviceKeyEncryptedDevicePrivateKey: string,
  ): Promise<DeviceResponse>;

  abstract updateTrust(
    updateDevicesTrustRequestModel: UpdateDevicesTrustRequest,
    deviceIdentifier: string,
  ): Promise<void>;

  abstract getDeviceKeys(
    deviceIdentifier: string,
    secretVerificationRequest: SecretVerificationRequest,
  ): Promise<ProtectedDeviceResponse>;
}
