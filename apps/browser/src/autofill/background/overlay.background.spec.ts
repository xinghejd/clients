import { mock, MockProxy, mockReset } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AutofillOverlayVisibility } from "@bitwarden/common/autofill/constants";
import { AutofillSettingsService } from "@bitwarden/common/autofill/services/autofill-settings.service";
import {
  DefaultDomainSettingsService,
  DomainSettingsService,
} from "@bitwarden/common/autofill/services/domain-settings.service";
import {
  EnvironmentService,
  Region,
} from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ThemeType } from "@bitwarden/common/platform/enums";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CloudEnvironment } from "@bitwarden/common/platform/services/default-environment.service";
import { ThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import {
  FakeAccountService,
  FakeStateProvider,
  mockAccountServiceWith,
} from "@bitwarden/common/spec";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";

import { DefaultBrowserStateService } from "../../platform/services/default-browser-state.service";
import { BrowserPlatformUtilsService } from "../../platform/services/platform-utils/browser-platform-utils.service";
import { AutofillService } from "../services/abstractions/autofill.service";
import { createChromeTabMock, createAutofillPageDetailsMock } from "../spec/autofill-mocks";
import { sendMockExtensionMessage } from "../spec/testing-utils";

import { OverlayBackground } from "./overlay.background";

describe("OverlayBackground", () => {
  const mockUserId = Utils.newGuid() as UserId;
  let accountService: FakeAccountService;
  let fakeStateProvider: FakeStateProvider;
  let domainSettingsService: DomainSettingsService;
  let logService: MockProxy<LogService>;
  let cipherService: MockProxy<CipherService>;
  let autofillService: MockProxy<AutofillService>;
  let authService: MockProxy<AuthService>;
  let environmentService: MockProxy<EnvironmentService>;
  let stateService: MockProxy<DefaultBrowserStateService>;
  let autofillSettingsService: MockProxy<AutofillSettingsService>;
  let i18nService: MockProxy<I18nService>;
  let platformUtilsService: MockProxy<BrowserPlatformUtilsService>;
  let themeStateService: MockProxy<ThemeStateService>;
  let overlayBackground: OverlayBackground;

  beforeEach(() => {
    accountService = mockAccountServiceWith(mockUserId);
    fakeStateProvider = new FakeStateProvider(accountService);
    domainSettingsService = new DefaultDomainSettingsService(fakeStateProvider);
    domainSettingsService.showFavicons$ = of(true);
    logService = mock<LogService>();
    cipherService = mock<CipherService>();
    autofillService = mock<AutofillService>();
    authService = mock<AuthService>({
      activeAccountStatus$: new BehaviorSubject(AuthenticationStatus.Unlocked),
    });
    environmentService = mock<EnvironmentService>({
      environment$: new BehaviorSubject(
        new CloudEnvironment({
          key: Region.US,
          domain: "bitwarden.com",
          urls: { icons: "https://icons.bitwarden.com/" },
        }),
      ),
    });
    stateService = mock<DefaultBrowserStateService>();
    autofillSettingsService = mock<AutofillSettingsService>({
      inlineMenuVisibility$: of(AutofillOverlayVisibility.OnFieldFocus),
    });
    i18nService = mock<I18nService>();
    platformUtilsService = mock<BrowserPlatformUtilsService>();
    themeStateService = mock<ThemeStateService>({
      selectedTheme$: of(ThemeType.Light),
    });
    overlayBackground = new OverlayBackground(
      logService,
      cipherService,
      autofillService,
      authService,
      environmentService,
      domainSettingsService,
      stateService,
      autofillSettingsService,
      i18nService,
      platformUtilsService,
      themeStateService,
    );

    void overlayBackground.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockReset(cipherService);
  });

  // TODO: describe init

  describe("removePageDetails", () => {
    it("removes the page details for a specific tab from the pageDetailsForTab object", () => {
      const tabId = 1;
      const frameId = 2;

      sendMockExtensionMessage(
        { command: "collectPageDetailsResponse", details: createAutofillPageDetailsMock() },
        mock<chrome.runtime.MessageSender>({ tab: createChromeTabMock({ id: tabId }), frameId }),
      );

      overlayBackground.removePageDetails(tabId);

      expect(overlayBackground["pageDetailsForTab"][tabId]).toBeUndefined();
    });
  });
});
