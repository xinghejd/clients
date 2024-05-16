import { mock, MockProxy } from "jest-mock-extended";
import { of } from "rxjs";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService as MessageSender } from "@bitwarden/common/platform/abstractions/messaging.service";
import { BiometricStateService } from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { MessageListener } from "@bitwarden/common/platform/messaging";
import { UserId } from "@bitwarden/common/types/guid";

import { WindowMain } from "../../../main/window.main";

import BiometricDarwinMain from "./biometric.darwin.main";
import BiometricWindowsMain from "./biometric.windows.main";
import { BiometricsService } from "./biometrics.service";
import { OsBiometricService } from "./biometrics.service.abstraction";

jest.mock("@bitwarden/desktop-native", () => {
  return {
    biometrics: jest.fn(),
    passwords: jest.fn(),
  };
});

describe("biometrics tests", function () {
  const i18nService = mock<I18nService>();
  const windowMain = mock<WindowMain>();
  const logService = mock<LogService>();
  const messageSender = mock<MessageSender>();
  const messageListener = mock<MessageListener>();
  const biometricStateService = mock<BiometricStateService>();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should call the platformspecific methods", async () => {
    const userId = "userId-1" as UserId;
    const sut = new BiometricsService(
      i18nService,
      windowMain,
      logService,
      messageSender,
      messageListener,
      process.platform,
      biometricStateService,
    );

    const mockService = mock<OsBiometricService>();
    (sut as any).platformSpecificService = mockService;
    await sut.setEncryptionKeyHalf({ service: "test", key: "test", value: "test" });

    await sut.canAuthBiometric({ service: "test", key: "test", userId });
    expect(mockService.osSupportsBiometric).toBeCalled();
    messageListener.messages$.mockReturnValue(of({ cancelled: false }));

    await sut.authenticateBiometric();
    expect(mockService.authenticateBiometric).toBeCalled();
  });

  it("restarts process reload if it was cancelled and auth fails", async () => {
    const userId = "userId-1" as UserId;
    const sut = new BiometricsService(
      i18nService,
      windowMain,
      logService,
      messageSender,
      messageListener,
      process.platform,
      biometricStateService,
    );

    const mockService = mock<OsBiometricService>();
    (sut as any).platformSpecificService = mockService;
    await sut.setEncryptionKeyHalf({ service: "test", key: "test", value: "test" });

    await sut.canAuthBiometric({ service: "test", key: "test", userId });
    expect(mockService.osSupportsBiometric).toBeCalled();
    messageListener.messages$.mockReturnValue(of({ cancelled: true }));
    mockService.authenticateBiometric.mockResolvedValue(false);

    await sut.authenticateBiometric();
    expect(messageSender.send).toHaveBeenCalledWith("startProcessReload");
  });

  it("will not restart process reload if it wasn't cancelled", async () => {
    const userId = "userId-1" as UserId;
    const sut = new BiometricsService(
      i18nService,
      windowMain,
      logService,
      messageSender,
      messageListener,
      process.platform,
      biometricStateService,
    );

    const mockService = mock<OsBiometricService>();
    (sut as any).platformSpecificService = mockService;
    await sut.setEncryptionKeyHalf({ service: "test", key: "test", value: "test" });

    await sut.canAuthBiometric({ service: "test", key: "test", userId });
    expect(mockService.osSupportsBiometric).toBeCalled();
    messageListener.messages$.mockReturnValue(of({ cancelled: false }));
    mockService.authenticateBiometric.mockResolvedValue(false);

    await sut.authenticateBiometric();
    expect(messageSender.send).not.toHaveBeenCalledWith("startProcessReload");
  });

  describe("Should create a platform specific service", function () {
    it("Should create a biometrics service specific for Windows", () => {
      const sut = new BiometricsService(
        i18nService,
        windowMain,
        logService,
        messageSender,
        messageListener,
        "win32",
        biometricStateService,
      );

      const internalService = (sut as any).platformSpecificService;
      expect(internalService).not.toBeNull();
      expect(internalService).toBeInstanceOf(BiometricWindowsMain);
    });

    it("Should create a biometrics service specific for MacOs", () => {
      const sut = new BiometricsService(
        i18nService,
        windowMain,
        logService,
        messageSender,
        messageListener,
        "darwin",
        biometricStateService,
      );
      const internalService = (sut as any).platformSpecificService;
      expect(internalService).not.toBeNull();
      expect(internalService).toBeInstanceOf(BiometricDarwinMain);
    });
  });

  describe("can auth biometric", () => {
    let sut: BiometricsService;
    let innerService: MockProxy<OsBiometricService>;
    const userId = "userId-1" as UserId;

    beforeEach(() => {
      sut = new BiometricsService(
        i18nService,
        windowMain,
        logService,
        messageSender,
        messageListener,
        process.platform,
        biometricStateService,
      );

      innerService = mock();
      (sut as any).platformSpecificService = innerService;
    });

    it("should return false if client key half is required and not provided", async () => {
      biometricStateService.getRequirePasswordOnStart.mockResolvedValue(true);

      const result = await sut.canAuthBiometric({ service: "test", key: "test", userId });

      expect(result).toBe(false);
    });

    it("should call osSupportsBiometric if client key half is provided", async () => {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sut.setEncryptionKeyHalf({ service: "test", key: "test", value: "test" });

      await sut.canAuthBiometric({ service: "test", key: "test", userId });
      expect(innerService.osSupportsBiometric).toBeCalled();
    });

    it("should call osSupportBiometric if client key half is not required", async () => {
      biometricStateService.getRequirePasswordOnStart.mockResolvedValue(false);
      innerService.osSupportsBiometric.mockResolvedValue(true);

      const result = await sut.canAuthBiometric({ service: "test", key: "test", userId });

      expect(result).toBe(true);
      expect(innerService.osSupportsBiometric).toHaveBeenCalled();
    });
  });
});
