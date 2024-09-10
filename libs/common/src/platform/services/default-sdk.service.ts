import { combineLatest, from, map } from "rxjs";

import { BitwardenClient, Convert, DeviceType as SdkDeviceType } from "@bitwarden/sdk-client";

import { DeviceType } from "../../enums/device-type.enum";
import { EnvironmentService } from "../abstractions/environment.service";
import { PlatformUtilsService } from "../abstractions/platform-utils.service";

export class DefaultSdkService {
  private sdkModule = from(import("@bitwarden/sdk-wasm"));

  client$ = combineLatest([this.sdkModule, this.environmentService.environment$]).pipe(
    map(([module, env]) => {
      const settings_json = Convert.clientSettingsToJson({
        apiUrl: env.getApiUrl(),
        identityUrl: env.getIdentityUrl(),
        deviceType: this.toDevice(this.platformUtilsService.getDevice()),
        userAgent: this.userAgent ?? navigator.userAgent,
      });
      return new BitwardenClient(new module.BitwardenClient(settings_json, 2));
    }),
  );

  constructor(
    private environmentService: EnvironmentService,
    private platformUtilsService: PlatformUtilsService,
    private userAgent: string = null,
  ) {}

  private toDevice(device: DeviceType): SdkDeviceType {
    switch (device) {
      case DeviceType.Android:
        return SdkDeviceType.Android;
      case DeviceType.iOS:
        return SdkDeviceType.IOS;
      case DeviceType.ChromeExtension:
        return SdkDeviceType.ChromeExtension;
      case DeviceType.FirefoxExtension:
        return SdkDeviceType.FirefoxExtension;
      case DeviceType.OperaExtension:
        return SdkDeviceType.OperaExtension;
      case DeviceType.EdgeExtension:
        return SdkDeviceType.EdgeExtension;
      case DeviceType.WindowsDesktop:
        return SdkDeviceType.WindowsDesktop;
      case DeviceType.MacOsDesktop:
        return SdkDeviceType.MACOSDesktop;
      case DeviceType.LinuxDesktop:
        return SdkDeviceType.LinuxDesktop;
      case DeviceType.ChromeBrowser:
        return SdkDeviceType.ChromeBrowser;
      case DeviceType.FirefoxBrowser:
        return SdkDeviceType.FirefoxBrowser;
      case DeviceType.OperaBrowser:
        return SdkDeviceType.OperaBrowser;
      case DeviceType.EdgeBrowser:
        return SdkDeviceType.EdgeBrowser;
      case DeviceType.IEBrowser:
        return SdkDeviceType.IEBrowser;
      case DeviceType.UnknownBrowser:
        return SdkDeviceType.UnknownBrowser;
      case DeviceType.AndroidAmazon:
        return SdkDeviceType.AndroidAmazon;
      case DeviceType.UWP:
        return SdkDeviceType.UWP;
      case DeviceType.SafariBrowser:
        return SdkDeviceType.SafariBrowser;
      case DeviceType.VivaldiBrowser:
        return SdkDeviceType.VivaldiBrowser;
      case DeviceType.VivaldiExtension:
        return SdkDeviceType.VivaldiExtension;
      case DeviceType.SafariExtension:
        return SdkDeviceType.SafariExtension;
      // FIXME: These should be added to the SDK
      case DeviceType.Server:
      case DeviceType.WindowsCLI:
      case DeviceType.MacOsCLI:
      case DeviceType.LinuxCLI:
      default:
        return SdkDeviceType.SDK;
    }
  }
}
