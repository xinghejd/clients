import { mock } from "jest-mock-extended";
import { firstValueFrom } from "rxjs";

import { PolicyService } from "@bitwarden/common/admin-console/services/policy/policy.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { EnvironmentService } from "@bitwarden/common/platform/services/environment.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import { createChromeTabMock } from "../jest/autofill-mocks";
import { flushPromises, sendExtensionRuntimeMessage } from "../jest/testing-utils";
import AutofillService from "../services/autofill.service";

import {
  AddLoginQueueMessage,
  LockedVaultPendingNotificationsData,
  NotificationBackgroundExtensionMessage,
} from "./abstractions/notification.background";
import NotificationBackground from "./notification.background";

jest.mock("rxjs", () => {
  const rxjs = jest.requireActual("rxjs");
  const { firstValueFrom } = rxjs;
  return {
    ...rxjs,
    firstValueFrom: jest.fn(firstValueFrom),
  };
});

describe("NotificationBackground", () => {
  let notificationBackground: NotificationBackground;
  const autofillService = mock<AutofillService>();
  const cipherService = mock<CipherService>();
  const authService = mock<AuthService>();
  const policyService = mock<PolicyService>();
  const folderService = mock<FolderService>();
  const stateService = mock<BrowserStateService>();
  const environmentService = mock<EnvironmentService>();

  beforeEach(() => {
    notificationBackground = new NotificationBackground(
      autofillService,
      cipherService,
      authService,
      policyService,
      folderService,
      stateService,
      environmentService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("unlockVault", () => {
    it("returns early if the message indicates that the notification should be skipped", async () => {
      const tabMock = createChromeTabMock();
      const message: NotificationBackgroundExtensionMessage = {
        command: "bgUnlockPopoutOpened",
        data: { skipNotification: true },
      };
      jest.spyOn(notificationBackground["authService"], "getAuthStatus");
      jest.spyOn(notificationBackground as any, "pushUnlockVaultToQueue");

      await notificationBackground["unlockVault"](message, tabMock);

      expect(notificationBackground["authService"].getAuthStatus).not.toHaveBeenCalled();
      expect(notificationBackground["pushUnlockVaultToQueue"]).not.toHaveBeenCalled();
    });
  });

  describe("convertAddLoginQueueMessageToCipherView", () => {
    it("returns a cipher view when passed an `AddLoginQueueMessage`", () => {
      const message: AddLoginQueueMessage = {
        type: "add",
        username: "test",
        password: "password",
        uri: "https://example.com",
        domain: "",
        tab: createChromeTabMock(),
        expires: new Date(),
        wasVaultLocked: false,
      };
      const cipherView = notificationBackground["convertAddLoginQueueMessageToCipherView"](message);

      expect(cipherView.name).toEqual("example.com");
      expect(cipherView.login).toEqual({
        autofillOnPageLoad: null,
        fido2Credentials: null,
        password: message.password,
        passwordRevisionDate: null,
        totp: null,
        uris: [
          {
            _canLaunch: null,
            _domain: null,
            _host: null,
            _hostname: null,
            _uri: message.uri,
            match: null,
          },
        ],
        username: message.username,
      });
    });

    it("returns a cipher view assigned to an existing folder id", () => {
      const folderId = "folder-id";
      const message: AddLoginQueueMessage = {
        type: "add",
        username: "test",
        password: "password",
        uri: "https://example.com",
        domain: "example.com",
        tab: createChromeTabMock(),
        expires: new Date(),
        wasVaultLocked: false,
      };
      const cipherView = notificationBackground["convertAddLoginQueueMessageToCipherView"](
        message,
        folderId,
      );

      expect(cipherView.folderId).toEqual(folderId);
    });
  });

  describe("notification bar extension message handlers", () => {
    beforeEach(async () => {
      await notificationBackground.init();
    });

    describe("unlockCompleted message handler", () => {
      it("sends a `closeNotificationBar` message if the retryCommand is for `autofill_login", async () => {
        const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
        const message: NotificationBackgroundExtensionMessage = {
          command: "unlockCompleted",
          data: {
            commandToRetry: { message: { command: "autofill_login" } },
          } as LockedVaultPendingNotificationsData,
        };
        jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
          sender.tab,
          "closeNotificationBar",
        );
      });

      it("triggers a retryHandler if the message target is `notification.background` and a handler exists", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "unlockCompleted",
          data: {
            commandToRetry: { message: { command: "bgSaveCipher" } },
            target: "notification.background",
          } as LockedVaultPendingNotificationsData,
        };
        jest.spyOn(notificationBackground as any, "handleSaveCipherMessage").mockImplementation();

        sendExtensionRuntimeMessage(message);
        await flushPromises();

        expect(notificationBackground["handleSaveCipherMessage"]).toHaveBeenCalledWith(
          message.data.commandToRetry.message,
          message.data.commandToRetry.sender,
        );
      });
    });

    describe("bgGetFolderData message handler", () => {
      it("returns a list of folders", async () => {
        const folderView = mock<FolderView>({ id: "folder-id" });
        const folderViews = [folderView];
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgGetFolderData",
        };
        jest.spyOn(notificationBackground as any, "getFolderData");
        (firstValueFrom as jest.Mock).mockResolvedValueOnce(folderViews);

        sendExtensionRuntimeMessage(message);
        await flushPromises();

        expect(notificationBackground["getFolderData"]).toHaveBeenCalled();
        expect(firstValueFrom).toHaveBeenCalled();
      });
    });

    describe("bgCloseNotificationBar message handler", () => {
      it("sends a `closeNotificationBar` message to the sender tab", async () => {
        const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgCloseNotificationBar",
        };
        jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
          sender.tab,
          "closeNotificationBar",
        );
      });
    });

    describe("bgAdjustNotificationBar message handler", () => {
      it("sends a `adjustNotificationBar` message to the sender tab", async () => {
        const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAdjustNotificationBar",
          data: { height: 100 },
        };
        jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
          sender.tab,
          "adjustNotificationBar",
          message.data,
        );
      });
    });

    describe("bgAddLogin message handler", () => {
      let tab: chrome.tabs.Tab;
      let sender: chrome.runtime.MessageSender;
      let getAuthStatusSpy: jest.SpyInstance;
      let getDisableAddLoginNotificationSpy: jest.SpyInstance;
      let getDisableChangedPasswordNotificationSpy: jest.SpyInstance;
      let pushAddLoginToQueueSpy: jest.SpyInstance;
      let pushChangePasswordToQueueSpy: jest.SpyInstance;
      let getAllDecryptedForUrlSpy: jest.SpyInstance;

      beforeEach(() => {
        tab = createChromeTabMock();
        sender = mock<chrome.runtime.MessageSender>({ tab });
        getAuthStatusSpy = jest.spyOn(authService, "getAuthStatus");
        getDisableAddLoginNotificationSpy = jest.spyOn(
          stateService,
          "getDisableAddLoginNotification",
        );
        getDisableChangedPasswordNotificationSpy = jest.spyOn(
          stateService,
          "getDisableChangedPasswordNotification",
        );
        pushAddLoginToQueueSpy = jest.spyOn(notificationBackground as any, "pushAddLoginToQueue");
        pushChangePasswordToQueueSpy = jest.spyOn(
          notificationBackground as any,
          "pushChangePasswordToQueue",
        );
        getAllDecryptedForUrlSpy = jest.spyOn(cipherService, "getAllDecryptedForUrl");
      });

      it("skips attempting to add the login if the user is logged out", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAddLogin",
          login: { username: "test", password: "password", url: "https://example.com" },
        };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.LoggedOut);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(getDisableAddLoginNotificationSpy).not.toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).not.toHaveBeenCalled();
      });

      it("skips attempting to add the login if the login data does not contain a valid url", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAddLogin",
          login: { username: "test", password: "password", url: "" },
        };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Locked);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(getDisableAddLoginNotificationSpy).not.toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).not.toHaveBeenCalled();
      });

      it("skips attempting to add the login if the user with a locked vault has disabled the login notification", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAddLogin",
          login: { username: "test", password: "password", url: "https://example.com" },
        };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Locked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(true);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(getDisableAddLoginNotificationSpy).toHaveBeenCalled();
        expect(getAllDecryptedForUrlSpy).not.toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).not.toHaveBeenCalled();
        expect(pushChangePasswordToQueueSpy).not.toHaveBeenCalled();
      });

      it("skips attempting to add the login if the user with an unlocked vault has disabled the login notification", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAddLogin",
          login: { username: "test", password: "password", url: "https://example.com" },
        };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Unlocked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(true);
        getAllDecryptedForUrlSpy.mockResolvedValueOnce([]);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(getDisableAddLoginNotificationSpy).toHaveBeenCalled();
        expect(getAllDecryptedForUrlSpy).toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).not.toHaveBeenCalled();
        expect(pushChangePasswordToQueueSpy).not.toHaveBeenCalled();
      });

      it("skips attempting to change the password for an existing login if the user has disabled changing the password notification", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAddLogin",
          login: { username: "test", password: "password", url: "https://example.com" },
        };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Unlocked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(false);
        getDisableChangedPasswordNotificationSpy.mockReturnValueOnce(true);
        getAllDecryptedForUrlSpy.mockResolvedValueOnce([
          mock<CipherView>({ login: { username: "test", password: "oldPassword" } }),
        ]);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(getDisableAddLoginNotificationSpy).toHaveBeenCalled();
        expect(getAllDecryptedForUrlSpy).toHaveBeenCalled();
        expect(getDisableChangedPasswordNotificationSpy).toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).not.toHaveBeenCalled();
        expect(pushChangePasswordToQueueSpy).not.toHaveBeenCalled();
      });

      it("skips attempting to change the password for an existing login if the password has not changed", async () => {
        const message: NotificationBackgroundExtensionMessage = {
          command: "bgAddLogin",
          login: { username: "test", password: "password", url: "https://example.com" },
        };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Unlocked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(false);
        getAllDecryptedForUrlSpy.mockResolvedValueOnce([
          mock<CipherView>({ login: { username: "test", password: "password" } }),
        ]);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(getDisableAddLoginNotificationSpy).toHaveBeenCalled();
        expect(getAllDecryptedForUrlSpy).toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).not.toHaveBeenCalled();
        expect(pushChangePasswordToQueueSpy).not.toHaveBeenCalled();
      });

      it("adds the login to the queue if the user has a locked account", async () => {
        const login = { username: "test", password: "password", url: "https://example.com" };
        const message: NotificationBackgroundExtensionMessage = { command: "bgAddLogin", login };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Locked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(false);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).toHaveBeenCalledWith("example.com", login, sender.tab, true);
      });

      it("adds the login to the queue if the user has an unlocked account and the login is new", async () => {
        const login = {
          username: undefined,
          password: "password",
          url: "https://example.com",
        } as any;
        const message: NotificationBackgroundExtensionMessage = { command: "bgAddLogin", login };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Unlocked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(false);
        getAllDecryptedForUrlSpy.mockResolvedValueOnce([
          mock<CipherView>({ login: { username: "anotherTestUsername", password: "password" } }),
        ]);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(getAuthStatusSpy).toHaveBeenCalled();
        expect(pushAddLoginToQueueSpy).toHaveBeenCalledWith("example.com", login, sender.tab);
      });

      it("adds a change password message to the queue if the user has changed an existing cipher's password", async () => {
        const login = { username: "tEsT", password: "password", url: "https://example.com" };
        const message: NotificationBackgroundExtensionMessage = { command: "bgAddLogin", login };
        getAuthStatusSpy.mockResolvedValueOnce(AuthenticationStatus.Unlocked);
        getDisableAddLoginNotificationSpy.mockReturnValueOnce(false);
        getAllDecryptedForUrlSpy.mockResolvedValueOnce([
          mock<CipherView>({
            id: "cipher-id",
            login: { username: "test", password: "oldPassword" },
          }),
        ]);

        sendExtensionRuntimeMessage(message, sender);
        await flushPromises();

        expect(pushChangePasswordToQueueSpy).toHaveBeenCalledWith(
          "cipher-id",
          "example.com",
          login.password,
          sender.tab,
        );
      });
    });
  });
});
