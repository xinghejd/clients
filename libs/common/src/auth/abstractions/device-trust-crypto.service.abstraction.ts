import { EncString } from "../../platform/models/domain/enc-string";
import { DeviceKey, UserKey } from "../../types/key";
import { DeviceResponse } from "../abstractions/devices/responses/device.response";

export abstract class DeviceTrustCryptoServiceAbstraction {
  /**
   * @description Retrieves the users choice to trust the device which can only happen after decryption
   * Note: this value should only be used once and then reset
   */
  abstract getShouldTrustDevice(): Promise<boolean | null>;
  abstract setShouldTrustDevice(value: boolean): Promise<void>;

  abstract trustDeviceIfRequired(): Promise<void>;

  abstract trustDevice(): Promise<DeviceResponse>;
  abstract getDeviceKey(): Promise<DeviceKey>;
  abstract decryptUserKeyWithDeviceKey(
    encryptedDevicePrivateKey: EncString,
    encryptedUserKey: EncString,
    deviceKey?: DeviceKey,
  ): Promise<UserKey | null>;
  abstract rotateDevicesTrust(newUserKey: UserKey, masterPasswordHash: string): Promise<void>;

  abstract supportsDeviceTrust(): Promise<boolean>;
}
