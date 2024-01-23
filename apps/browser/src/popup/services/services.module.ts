import { APP_INITIALIZER, LOCALE_ID, NgModule } from "@angular/core";

import { UnauthGuard as BaseUnauthGuardService } from "@bitwarden/angular/auth/guards";
import { ThemingService } from "@bitwarden/angular/platform/services/theming/theming.service";
import { AbstractThemingService } from "@bitwarden/angular/platform/services/theming/theming.service.abstraction";
import {
  MEMORY_STORAGE,
  SECURE_STORAGE,
  OBSERVABLE_DISK_STORAGE,
  OBSERVABLE_MEMORY_STORAGE,
  LOCAL_STORAGE,
} from "@bitwarden/angular/services/injection-tokens";
import { JslibServicesModule } from "@bitwarden/angular/services/jslib-services.module";
import { PinCryptoService, PinCryptoServiceAbstraction } from "@bitwarden/auth/common";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { EventUploadService } from "@bitwarden/common/abstractions/event/event-upload.service";
import { NotificationsService } from "@bitwarden/common/abstractions/notifications.service";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/abstractions/search.service";
import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { VaultTimeoutService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout.service";
import { InternalOrganizationServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import {
  InternalPolicyService,
  PolicyService,
} from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ProviderService } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { PolicyApiService } from "@bitwarden/common/admin-console/services/policy/policy-api.service";
import { ProviderService as ProviderServiceImplementation } from "@bitwarden/common/admin-console/services/provider.service";
import { AccountService as AccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthRequestCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth-request-crypto.service.abstraction";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { LoginService as LoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/login.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { UserVerificationApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification-api.service.abstraction";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AccountServiceImplementation } from "@bitwarden/common/auth/services/account.service";
import { AuthRequestCryptoServiceImplementation } from "@bitwarden/common/auth/services/auth-request-crypto.service.implementation";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { DeviceTrustCryptoService } from "@bitwarden/common/auth/services/device-trust-crypto.service.implementation";
import { DevicesServiceImplementation } from "@bitwarden/common/auth/services/devices/devices.service.implementation";
import { DevicesApiServiceImplementation } from "@bitwarden/common/auth/services/devices-api.service.implementation";
import { KeyConnectorService as KeyConnectorServiceImplementation } from "@bitwarden/common/auth/services/key-connector.service";
import { LoginService } from "@bitwarden/common/auth/services/login.service";
import { TokenService as TokenServiceImplementation } from "@bitwarden/common/auth/services/token.service";
import { TwoFactorService as TwoFactorServiceImplementation } from "@bitwarden/common/auth/services/two-factor.service";
import { UserVerificationApiService } from "@bitwarden/common/auth/services/user-verification/user-verification-api.service";
import { UserVerificationService as UserVerificationServiceImplementation } from "@bitwarden/common/auth/services/user-verification/user-verification.service";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { ConfigApiServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config-api.service.abstraction";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { FileUploadService } from "@bitwarden/common/platform/abstractions/file-upload/file-upload.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService as BaseStateServiceAbstraction } from "@bitwarden/common/platform/abstractions/state.service";
import { AbstractStorageService } from "@bitwarden/common/platform/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/platform/abstractions/system.service";
import { StateFactory } from "@bitwarden/common/platform/factories/state-factory";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { AppIdService as AppIdServiceImplementation } from "@bitwarden/common/platform/services/app-id.service";
import { ConfigService } from "@bitwarden/common/platform/services/config/config.service";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { ContainerService } from "@bitwarden/common/platform/services/container.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { MultithreadEncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/multithread-encrypt.service.implementation";
import { FileUploadService as FileUploadServiceImplementation } from "@bitwarden/common/platform/services/file-upload/file-upload.service";
import { SystemService } from "@bitwarden/common/platform/services/system.service";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";
import {
  ActiveUserStateProvider,
  DerivedStateProvider,
  GlobalStateProvider,
  SingleUserStateProvider,
  StateProvider,
} from "@bitwarden/common/platform/state";
/* eslint-disable import/no-restricted-paths */
import { DefaultActiveUserStateProvider } from "@bitwarden/common/platform/state/implementations/default-active-user-state.provider";
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";
import { DefaultSingleUserStateProvider } from "@bitwarden/common/platform/state/implementations/default-single-user-state.provider";
import { DefaultStateProvider } from "@bitwarden/common/platform/state/implementations/default-state.provider";
/* eslint-enable import/no-restricted-paths */
import { ApiService as ApiServiceImplementation } from "@bitwarden/common/services/api.service";
import { AuditService as AuditServiceImplementation } from "@bitwarden/common/services/audit.service";
import { EventCollectionService as EventCollectionServiceImplementation } from "@bitwarden/common/services/event/event-collection.service";
import { EventUploadService as EventUploadServiceImplementation } from "@bitwarden/common/services/event/event-upload.service";
import { NotificationsService as NotificationsServiceImplementation } from "@bitwarden/common/services/notifications.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceImplementation } from "@bitwarden/common/services/vault-timeout/vault-timeout-settings.service";
import {
  PasswordGenerationService,
  PasswordGenerationServiceAbstraction,
} from "@bitwarden/common/tools/generator/password";
import {
  UsernameGenerationService,
  UsernameGenerationServiceAbstraction,
} from "@bitwarden/common/tools/generator/username";
import {
  PasswordStrengthService,
  PasswordStrengthServiceAbstraction,
} from "@bitwarden/common/tools/password-strength";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service";
import { SendApiService as SendApiServiceAbstraction } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import {
  InternalSendService as InternalSendServiceAbstraction,
  SendService,
} from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherFileUploadService } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import {
  FolderService,
  InternalFolderService,
} from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { TotpService } from "@bitwarden/common/vault/abstractions/totp.service";
import { CipherService as CipherServiceImplementation } from "@bitwarden/common/vault/services/cipher.service";
import { CollectionService as CollectionServiceImplementation } from "@bitwarden/common/vault/services/collection.service";
import { CipherFileUploadService as CipherFileUploadServiceImplementation } from "@bitwarden/common/vault/services/file-upload/cipher-file-upload.service";
import { FolderApiService } from "@bitwarden/common/vault/services/folder/folder-api.service";
import { SyncService as SyncServiceImplementation } from "@bitwarden/common/vault/services/sync/sync.service";
import { TotpService as TotpServiceImplementation } from "@bitwarden/common/vault/services/totp.service";
import { DialogService } from "@bitwarden/components";
import {
  VaultExportService,
  VaultExportServiceAbstraction,
} from "@bitwarden/exporter/vault-export";
import {
  ImportApiService,
  ImportApiServiceAbstraction,
  ImportService,
  ImportServiceAbstraction,
} from "@bitwarden/importer/core";

import { BrowserOrganizationService } from "../../admin-console/services/browser-organization.service";
import { BrowserPolicyService } from "../../admin-console/services/browser-policy.service";
import { UnauthGuardService } from "../../auth/popup/services";
import { AutofillService } from "../../autofill/services/abstractions/autofill.service";
import AutofillServiceImplementation from "../../autofill/services/autofill.service";
// import MainBackground from "../../background/main.background";
import { Account } from "../../models/account";
import { BrowserApi } from "../../platform/browser/browser-api";
import { flagEnabled } from "../../platform/flags";
// import BrowserPopupUtils from "../../platform/popup/browser-popup-utils";
import { BrowserStateService as StateServiceAbstraction } from "../../platform/services/abstractions/browser-state.service";
import { BrowserConfigService } from "../../platform/services/browser-config.service";
import { BrowserCryptoService } from "../../platform/services/browser-crypto.service";
import { BrowserEnvironmentService } from "../../platform/services/browser-environment.service";
import { BrowserFileDownloadService } from "../../platform/services/browser-file-download.service";
import { BrowserI18nService } from "../../platform/services/browser-i18n.service";
import BrowserLocalStorageService from "../../platform/services/browser-local-storage.service";
import BrowserMessagingService from "../../platform/services/browser-messaging.service";
import BrowserPlatformUtilsService from "../../platform/services/browser-platform-utils.service";
import BrowserSecureLocalStorageService from "../../platform/services/browser-secure-local-storage.service";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import { KeyGenerationService } from "../../platform/services/key-generation.service";
import { LocalBackedSessionStorageService } from "../../platform/services/local-backed-session-storage.service";
import { ForegroundDerivedStateProvider } from "../../platform/state/foreground-derived-state.provider";
import { BackgroundMemoryStorageService } from "../../platform/storage/background-memory-storage.service";
import { ForegroundMemoryStorageService } from "../../platform/storage/foreground-memory-storage.service";
import { BrowserSendService } from "../../services/browser-send.service";
import { BrowserSettingsService } from "../../services/browser-settings.service";
import VaultTimeoutServiceImplementation from "../../services/vault-timeout/vault-timeout.service";
import { FilePopoutUtilsService } from "../../tools/popup/services/file-popout-utils.service";
import { VaultFilterServiceAbstraction as VaultFilterService } from "../../vault/services/abstractions/vault-filter.service";
import { BrowserFolderService } from "../../vault/services/browser-folder.service";
import { VaultFilterService as VaultFilterServiceImplementation } from "../../vault/services/vault-filter.service";

import { DebounceNavigationService } from "./debounce-navigation.service";
import { InitService } from "./init.service";
import { PopupCloseWarningService } from "./popup-close-warning.service";
import { PopupSearchService } from "./popup-search.service";

// const isPrivateMode = BrowserPopupUtils.inPrivateMode();
// const mainBackground: MainBackground = BrowserPopupUtils.backgroundInitializationRequired()
//   ? createLocalBgService()
//   : BrowserApi.getBackgroundPage().bitwardenMain;

// function createLocalBgService() {
//   const localBgService = new MainBackground(isPrivateMode);
//   localBgService.bootstrap();
//   return localBgService;
// }

// function getBgService<T>(service: keyof MainBackground) {
//   return (): T => {
//     return mainBackground ? (mainBackground[service] as any as T) : null;
//   };
// }

@NgModule({
  imports: [JslibServicesModule],
  declarations: [],
  providers: [
    InitService,
    DebounceNavigationService,
    DialogService,
    PopupCloseWarningService,
    // {
    //   provide: LOCALE_ID,
    //   useFactory: () => getBgService<I18nServiceAbstraction>("i18nService")().translationLocale,
    //   deps: [],
    // },
    {
      provide: LOCALE_ID,
      useFactory: (i18nService: I18nServiceAbstraction) => i18nService.translationLocale,
      deps: [I18nServiceAbstraction],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (initService: InitService) => initService.init(),
      deps: [InitService],
      multi: true,
    },
    { provide: BaseUnauthGuardService, useClass: UnauthGuardService },
    // {
    //   provide: MessagingService,
    //   useFactory: () => {
    //     return BrowserPopupUtils.backgroundInitializationRequired()
    //       ? new BrowserMessagingPrivateModePopupService()
    //       : new BrowserMessagingService();
    //   },
    // },
    BrowserMessagingService,
    {
      provide: MessagingService,
      useExisting: BrowserMessagingService,
    },
    // {
    //   provide: TwoFactorService,
    //   useFactory: getBgService<TwoFactorService>("twoFactorService"),
    //   deps: [],
    // },
    {
      provide: TwoFactorServiceImplementation,
      deps: [I18nServiceAbstraction, PlatformUtilsService],
    },
    {
      provide: TwoFactorService,
      useExisting: TwoFactorServiceImplementation,
    },
    // {
    //   provide: AuthServiceAbstraction,
    //   useFactory: getBgService<AuthService>("authService"),
    //   deps: [],
    // },
    {
      provide: AuthService,
      deps: [
        CryptoService,
        ApiService,
        TokenService,
        AppIdService,
        PlatformUtilsService,
        MessagingService,
        LogServiceAbstraction,
        KeyConnectorService,
        EnvironmentService,
        StateServiceAbstraction,
        TwoFactorService,
        I18nServiceAbstraction,
        EncryptService,
        PasswordStrengthServiceAbstraction,
        PolicyService,
        DeviceTrustCryptoServiceAbstraction,
        AuthRequestCryptoServiceAbstraction,
      ],
    },
    {
      provide: AuthServiceAbstraction,
      useExisting: AuthService,
    },
    // {
    //   provide: SearchServiceAbstraction,
    //   useFactory: (logService: ConsoleLogService, i18nService: I18nServiceAbstraction) => {
    //     return new PopupSearchService(
    //       getBgService<SearchService>("searchService")(),
    //       logService,
    //       i18nService,
    //     );
    //   },
    //   deps: [LogServiceAbstraction, I18nServiceAbstraction],
    // },
    {
      provide: PopupSearchService,
      deps: [LogServiceAbstraction, I18nServiceAbstraction],
    },
    {
      provide: SearchServiceAbstraction,
      useExisting: PopupSearchService,
    },
    // { provide: AuditService, useFactory: getBgService<AuditService>("auditService"), deps: [] },
    {
      provide: AuditServiceImplementation,
      deps: [CryptoFunctionService, ApiService],
    },
    {
      provide: AuditService,
      useExisting: AuditServiceImplementation,
    },
    // {
    //   provide: CipherFileUploadService,
    //   useFactory: getBgService<CipherFileUploadService>("cipherFileUploadService"),
    //   deps: [],
    // },
    {
      provide: CipherFileUploadServiceImplementation,
      deps: [ApiService, FileUploadService],
    },
    {
      provide: CipherFileUploadService,
      useExisting: CipherFileUploadServiceImplementation,
    },
    // { provide: CipherService, useFactory: getBgService<CipherService>("cipherService"), deps: [] },
    {
      provide: CipherServiceImplementation,
      deps: [
        CryptoService,
        SettingsService,
        ApiService,
        I18nServiceAbstraction,
        SearchServiceAbstraction,
        StateServiceAbstraction,
        EncryptService,
        CipherFileUploadService,
        ConfigService,
      ],
    },
    { provide: CipherService, useExisting: CipherServiceImplementation },
    // {
    //   provide: CryptoFunctionService,
    //   useFactory: getBgService<CryptoFunctionService>("cryptoFunctionService"),
    //   deps: [],
    // },
    { provide: WebCryptoFunctionService, deps: [] },
    { provide: CryptoFunctionService, useExisting: WebCryptoFunctionService },
    // {
    //   provide: FileUploadService,
    //   useFactory: getBgService<FileUploadService>("fileUploadService"),
    // },
    { provide: FileUploadServiceImplementation, deps: [LogServiceAbstraction] },
    { provide: FileUploadService, useExisting: FileUploadServiceImplementation },
    {
      provide: BrowserFolderService,
      deps: [CryptoService, I18nServiceAbstraction, CipherService, StateServiceAbstraction],
    },
    {
      provide: FolderService,
      useExisting: BrowserFolderService,
    },
    { provide: InternalFolderService, useExisting: FolderService },
    {
      provide: FolderApiService,
      deps: [InternalFolderService, ApiService],
    },
    {
      provide: FolderApiServiceAbstraction,
      useExisting: FolderApiService,
    },
    // {
    //   provide: CollectionService,
    //   useFactory: getBgService<CollectionService>("collectionService"),
    //   deps: [],
    // },
    //CollectionServiceImplementation
    {
      provide: CollectionServiceImplementation,
      deps: [CryptoService, I18nServiceAbstraction, StateServiceAbstraction],
    },
    { provide: CollectionService, useExisting: CollectionServiceImplementation },
    // {
    //   provide: LogServiceAbstraction,
    //   useFactory: getBgService<ConsoleLogService>("logService"),
    //   deps: [],
    // },
    { provide: ConsoleLogService, useFactory: () => new ConsoleLogService(false) },
    { provide: LogServiceAbstraction, useExisting: ConsoleLogService },
    // {
    //   provide: BrowserEnvironmentService,
    //   useExisting: EnvironmentService,
    // },
    // {
    //   provide: EnvironmentService,
    //   useFactory: getBgService<EnvironmentService>("environmentService"),
    //   deps: [],
    // },
    {
      provide: BrowserEnvironmentService,
      deps: [StateServiceAbstraction, LoginServiceAbstraction],
    },
    { provide: EnvironmentService, useExisting: BrowserEnvironmentService },
    // { provide: TotpService, useFactory: getBgService<TotpService>("totpService"), deps: [] },
    { provide: TotpServiceImplementation, deps: [CryptoFunctionService, LoginServiceAbstraction] },
    { provide: TotpService, useExisting: TotpServiceImplementation },
    // { provide: TokenService, useFactory: getBgService<TokenService>("tokenService"), deps: [] },
    // TokenServiceImplementation
    { provide: TokenServiceImplementation, deps: [StateServiceAbstraction] },
    { provide: TokenService, useExisting: TokenServiceImplementation },
    {
      provide: BrowserI18nService,
      useFactory: (stateService: BrowserStateService) => {
        return new BrowserI18nService(BrowserApi.getUILanguage(), stateService);
      },
      deps: [StateServiceAbstraction],
    },
    {
      provide: I18nServiceAbstraction,
      useExisting: BrowserI18nService,
    },
    // {
    //   provide: CryptoService,
    //   useFactory: (encryptService: EncryptService) => {
    //     const cryptoService = getBgService<CryptoService>("cryptoService")();
    //     new ContainerService(cryptoService, encryptService).attachToGlobal(self);
    //     return cryptoService;
    //   },
    //   deps: [EncryptService],
    // },
    {
      provide: EncryptServiceImplementation,
      useFactory: (
        cryptoFunctionService: CryptoFunctionService,
        logService: LogServiceAbstraction,
      ) => {
        return flagEnabled("multithreadDecryption")
          ? new MultithreadEncryptServiceImplementation(cryptoFunctionService, logService, true)
          : new EncryptServiceImplementation(cryptoFunctionService, logService, true);
      },
      deps: [CryptoFunctionService, LogServiceAbstraction],
    },
    {
      provide: EncryptService,
      useExisting: EncryptServiceImplementation,
    },
    {
      provide: DefaultActiveUserStateProvider,
      deps: [AccountServiceAbstraction, MEMORY_STORAGE, LOCAL_STORAGE],
    },
    {
      provide: ActiveUserStateProvider,
      useExisting: DefaultActiveUserStateProvider,
    },
    {
      provide: DefaultSingleUserStateProvider,
      deps: [MEMORY_STORAGE, LOCAL_STORAGE],
    },
    {
      provide: SingleUserStateProvider,
      useExisting: DefaultSingleUserStateProvider,
    },
    {
      provide: DefaultGlobalStateProvider,
      deps: [MEMORY_STORAGE, LOCAL_STORAGE],
    },
    {
      provide: GlobalStateProvider,
      useExisting: DefaultGlobalStateProvider,
    },
    {
      provide: DefaultStateProvider,
      deps: [
        ActiveUserStateProvider,
        SingleUserStateProvider,
        GlobalStateProvider,
        DerivedStateProvider,
      ],
    },
    {
      provide: StateProvider,
      useExisting: DefaultStateProvider,
    },
    {
      provide: AccountServiceImplementation,
      deps: [MessagingService, LogServiceAbstraction, GlobalStateProvider],
    },
    {
      provide: AccountServiceAbstraction,
      useExisting: AccountServiceImplementation,
    },
    {
      provide: BrowserCryptoService,
      useFactory: (
        cryptoFunctionService: CryptoFunctionService,
        encryptService: EncryptService,
        platformUtilsService: PlatformUtilsService,
        LogService: LogServiceAbstraction,
        stateService: StateServiceAbstraction,
        accountService: AccountServiceAbstraction,
        stateProvider: StateProvider,
      ) => {
        const cryptoService = new BrowserCryptoService(
          cryptoFunctionService,
          encryptService,
          platformUtilsService,
          LogService,
          stateService,
          accountService,
          stateProvider,
        );
        new ContainerService(cryptoService, encryptService).attachToGlobal(self);
        return cryptoService;
      },
      deps: [
        CryptoFunctionService,
        EncryptService,
        PlatformUtilsService,
        LogServiceAbstraction,
        StateServiceAbstraction,
        AccountServiceAbstraction,
        StateProvider,
      ],
    },
    {
      provide: CryptoService,
      useExisting: BrowserCryptoService,
    },
    // {
    //   provide: AuthRequestCryptoServiceAbstraction,
    //   useFactory: getBgService<AuthRequestCryptoServiceAbstraction>("authRequestCryptoService"),
    //   deps: [],
    // },
    { provide: AuthRequestCryptoServiceImplementation, deps: [CryptoFunctionService] },
    {
      provide: AuthRequestCryptoServiceAbstraction,
      useExisting: AuthRequestCryptoServiceImplementation,
    },
    // {
    //   provide: DeviceTrustCryptoServiceAbstraction,
    //   useFactory: getBgService<DeviceTrustCryptoServiceAbstraction>("deviceTrustCryptoService"),
    //   deps: [],
    // },
    {
      provide: DeviceTrustCryptoService,
      deps: [
        CryptoFunctionService,
        CryptoService,
        EncryptService,
        StateServiceAbstraction,
        AppIdService,
        DevicesApiServiceAbstraction,
        I18nServiceAbstraction,
        PlatformUtilsService,
      ],
    },
    {
      provide: DeviceTrustCryptoServiceAbstraction,
      useExisting: DeviceTrustCryptoService,
    },
    // {
    //   provide: DevicesServiceAbstraction,
    //   useFactory: getBgService<DevicesServiceAbstraction>("devicesService"),
    //   deps: [],
    // },
    {
      provide: DevicesApiServiceImplementation,
      deps: [ApiService],
    },
    {
      provide: DevicesApiServiceAbstraction,
      useExisting: DevicesApiServiceImplementation,
    },
    { provide: DevicesServiceImplementation, deps: [DevicesApiServiceAbstraction] },
    { provide: DevicesServiceAbstraction, useExisting: DevicesServiceImplementation },
    // {
    //   provide: EventUploadService,
    //   useFactory: getBgService<EventUploadService>("eventUploadService"),
    //   deps: [],
    // },
    {
      provide: EventUploadServiceImplementation,
      deps: [ApiService, StateServiceAbstraction, LoginServiceAbstraction],
    },
    {
      provide: EventUploadService,
      useExisting: EventUploadServiceImplementation,
    },
    // {
    //   provide: EventCollectionService,
    //   useFactory: getBgService<EventCollectionService>("eventCollectionService"),
    //   deps: [],
    // },
    {
      provide: EventCollectionServiceImplementation,
      deps: [
        CipherService,
        StateServiceAbstraction,
        InternalOrganizationServiceAbstraction,
        EventUploadService,
      ],
    },
    {
      provide: EventCollectionService,
      useExisting: EventCollectionServiceImplementation,
    },
    {
      provide: BrowserPolicyService,
      deps: [StateServiceAbstraction, InternalOrganizationServiceAbstraction],
    },
    {
      provide: PolicyService,
      useExisting: BrowserPolicyService,
    },
    {
      provide: InternalPolicyService,
      useExisting: BrowserPolicyService,
    },
    {
      provide: PolicyApiService,
      deps: [InternalPolicyService, ApiService, StateServiceAbstraction],
    },
    {
      provide: PolicyApiServiceAbstraction,
      useExisting: PolicyApiService,
    },
    // {
    //   provide: PlatformUtilsService,
    //   useFactory: getBgService<PlatformUtilsService>("platformUtilsService"),
    //   deps: [],
    // },
    {
      provide: SystemService,
      useFactory: (
        messagingService: MessagingService,
        platformUtilsService: PlatformUtilsService,
        stateService: StateServiceAbstraction,
        vaultTimeoutSettingsService: VaultTimeoutSettingsService,
      ) => {
        const reloadCallback = async () => {
          const forceWindowReload =
            platformUtilsService.isSafari() ||
            platformUtilsService.isFirefox() ||
            platformUtilsService.isOpera();
          BrowserApi.reloadExtension(forceWindowReload ? window : null);
          return Promise.resolve();
        };

        return new SystemService(
          messagingService,
          platformUtilsService,
          reloadCallback,
          stateService,
          vaultTimeoutSettingsService,
        );
      },
      deps: [
        MessagingService,
        PlatformUtilsService,
        StateServiceAbstraction,
        VaultTimeoutSettingsService,
      ],
    },
    {
      provide: SystemServiceAbstraction,
      useExisting: SystemService,
    },
    {
      provide: BrowserPlatformUtilsService,
      useFactory: (messagingService: MessagingService) => {
        // TODO CG - Implementing this here presents as a circular dependency, with the ClipboardService depending on the PlatformUtilsService, and the PlatformUtilsService depending on the ClipboardService. We need to find a way to break this circular dependency. Maybe we just implement the clipboard clearing directly? Does this need to be here?
        const clipboardWriteCallback = (clipboardValue: string, clearMs: number) => {};

        // TODO CG - Consider whether this is appropriate or not. The NativeMessagingBackground class doesn't seem to apply to the popup directly... or at least it shouldn't. It's a "Background" service.
        const biometricCallback = async () => false;
        return new BrowserPlatformUtilsService(
          messagingService,
          clipboardWriteCallback,
          biometricCallback,
          window,
        );
      },
      deps: [MessagingService],
    },
    {
      provide: PlatformUtilsService,
      useExisting: BrowserPlatformUtilsService,
    },
    // {
    //   provide: PasswordStrengthServiceAbstraction,
    //   useFactory: getBgService<PasswordStrengthServiceAbstraction>("passwordStrengthService"),
    //   deps: [],
    // },
    PasswordStrengthService,
    {
      provide: PasswordStrengthServiceAbstraction,
      useExisting: PasswordStrengthService,
    },
    // {
    //   provide: PasswordGenerationServiceAbstraction,
    //   useFactory: getBgService<PasswordGenerationServiceAbstraction>("passwordGenerationService"),
    //   deps: [],
    // },
    {
      provide: PasswordGenerationService,
      deps: [CryptoService, PolicyService, StateServiceAbstraction],
    },
    {
      provide: PasswordGenerationServiceAbstraction,
      useExisting: PasswordGenerationService,
    },
    // ApiServiceImplementation
    // { provide: ApiService, useFactory: getBgService<ApiService>("apiService"), deps: [] },
    {
      provide: ApiServiceImplementation,
      deps: [TokenService, PlatformUtilsService, EnvironmentService, AppIdService],
    },
    { provide: ApiService, useExisting: ApiServiceImplementation },
    {
      provide: BrowserSendService,
      deps: [CryptoService, I18nServiceAbstraction, CryptoFunctionService, StateServiceAbstraction],
    },
    {
      provide: SendService,
      useExisting: BrowserSendService,
    },
    {
      provide: InternalSendServiceAbstraction,
      useExisting: SendService,
    },
    {
      provide: SendApiService,
      deps: [ApiService, FileUploadService, InternalSendServiceAbstraction],
    },
    {
      provide: SendApiServiceAbstraction,
      useExisting: SendApiService,
    },
    // { provide: SyncService, useFactory: getBgService<SyncService>("syncService"), deps: [] },
    {
      provide: SyncServiceImplementation,
      useFactory: (
        apiService: ApiService,
        settingsService: SettingsService,
        folderService: InternalFolderService,
        cipherService: CipherService,
        cryptoService: CryptoService,
        collectionService: CollectionService,
        messagingService: MessagingService,
        policyService: InternalPolicyService,
        sendService: InternalSendServiceAbstraction,
        logService: LogServiceAbstraction,
        keyConnectorService: KeyConnectorService,
        stateService: StateServiceAbstraction,
        providerService: ProviderService,
        folderApiService: FolderApiServiceAbstraction,
        organizationService: InternalOrganizationServiceAbstraction,
        sendApiService: SendApiServiceAbstraction,
      ) => {
        // TODO CG - Should this callback be doing anything?
        const logoutCallback = async (expired: boolean) => {};

        return new SyncServiceImplementation(
          apiService,
          settingsService,
          folderService,
          cipherService,
          cryptoService,
          collectionService,
          messagingService,
          policyService,
          sendService,
          logService,
          keyConnectorService,
          stateService,
          providerService,
          folderApiService,
          organizationService,
          sendApiService,
          logoutCallback,
        );
      },
      deps: [
        ApiService,
        SettingsService,
        InternalFolderService,
        CipherService,
        CryptoService,
        CollectionService,
        MessagingService,
        InternalPolicyService,
        InternalSendServiceAbstraction,
        LogServiceAbstraction,
        KeyConnectorService,
        StateServiceAbstraction,
        ProviderService,
        FolderApiServiceAbstraction,
        InternalOrganizationServiceAbstraction,
        SendApiServiceAbstraction,
      ],
    },
    { provide: SyncService, useExisting: SyncServiceImplementation },
    {
      provide: BrowserSettingsService,
      deps: [StateServiceAbstraction],
    },
    {
      provide: SettingsService,
      useExisting: BrowserSettingsService,
    },

    // { provide: AppIdService, useFactory: getBgService<AppIdService>("appIdService"), deps: [] },
    { provide: AppIdServiceImplementation, deps: [LOCAL_STORAGE] }, // TODO CG - We need to create a singleton provider for each storage service.
    { provide: AppIdService, useExisting: AppIdServiceImplementation },
    // {
    //   provide: AutofillService,
    //   useFactory: getBgService<AutofillService>("autofillService"),
    //   deps: [],
    // },
    {
      provide: AutofillServiceImplementation,
      deps: [
        CipherService,
        StateServiceAbstraction,
        TotpService,
        EventCollectionService,
        LoginServiceAbstraction,
        SettingsService,
        UserVerificationService,
        ConfigService,
      ],
    },
    {
      provide: AutofillService,
      useExisting: AutofillServiceImplementation,
      deps: [],
    },
    // {
    //   provide: ImportServiceAbstraction,
    //   useFactory: getBgService<ImportServiceAbstraction>("importService"),
    //   deps: [],
    // },
    {
      provide: ImportApiService,
      deps: [ApiService],
    },
    {
      provide: ImportApiServiceAbstraction,
      useExisting: ImportApiService,
    },
    {
      provide: ImportService,
      deps: [
        CipherService,
        InternalFolderService,
        ImportApiServiceAbstraction,
        I18nServiceAbstraction,
        CollectionService,
        CryptoService,
      ],
    },
    {
      provide: ImportServiceAbstraction,
      useExisting: ImportService,
      deps: [],
    },
    // {
    //   provide: VaultExportServiceAbstraction,
    //   useFactory: getBgService<VaultExportServiceAbstraction>("exportService"),
    //   deps: [],
    // },
    {
      provide: VaultExportService,
      deps: [
        InternalFolderService,
        CipherService,
        ApiService,
        CryptoService,
        CryptoFunctionService,
        StateServiceAbstraction,
      ],
    },
    {
      provide: VaultExportServiceAbstraction,
      useExisting: VaultExportService,
      deps: [],
    },
    // {
    //   provide: KeyConnectorService,
    //   useFactory: getBgService<KeyConnectorService>("keyConnectorService"),
    //   deps: [],
    // },
    {
      provide: KeyConnectorServiceImplementation,
      useFactory: (
        stateService: StateServiceAbstraction,
        cryptoService: CryptoService,
        apiService: ApiService,
        tokenService: TokenService,
        logService: LogServiceAbstraction,
        organizationService: InternalOrganizationServiceAbstraction,
        cryptoFunctionService: CryptoFunctionService,
      ) => {
        const logoutCallback = async (expired: boolean) => {};
        return new KeyConnectorServiceImplementation(
          stateService,
          cryptoService,
          apiService,
          tokenService,
          logService,
          organizationService,
          cryptoFunctionService,
          logoutCallback,
        );
      },
      deps: [
        StateServiceAbstraction,
        CryptoService,
        ApiService,
        TokenService,
        LogServiceAbstraction,
        InternalOrganizationServiceAbstraction,
        CryptoFunctionService,
      ],
    },
    {
      provide: KeyConnectorService,
      useExisting: KeyConnectorServiceImplementation,
    },
    // {
    //   provide: UserVerificationService,
    //   useFactory: getBgService<UserVerificationService>("userVerificationService"),
    //   deps: [],
    // },
    {
      provide: UserVerificationApiService,
      deps: [ApiService],
    },
    {
      provide: UserVerificationApiServiceAbstraction,
      useExisting: UserVerificationApiService,
    },
    {
      provide: PinCryptoService,
      deps: [
        StateServiceAbstraction,
        CryptoService,
        VaultTimeoutSettingsService,
        LogServiceAbstraction,
      ],
    },
    {
      provide: PinCryptoServiceAbstraction,
      useExisting: PinCryptoService,
    },
    {
      provide: UserVerificationServiceImplementation,
      deps: [
        StateServiceAbstraction,
        CryptoService,
        I18nServiceAbstraction,
        UserVerificationApiServiceAbstraction,
        PinCryptoServiceAbstraction,
        LogServiceAbstraction,
      ],
    },
    {
      provide: UserVerificationService,
      useExisting: UserVerificationServiceImplementation,
    },
    // {
    //   provide: VaultTimeoutSettingsService,
    //   useFactory: getBgService<VaultTimeoutSettingsService>("vaultTimeoutSettingsService"),
    //   deps: [],
    // },
    {
      provide: VaultTimeoutSettingsServiceImplementation,
      deps: [CryptoService, TokenService, PolicyService, StateServiceAbstraction],
    },
    {
      provide: VaultTimeoutSettingsService,
      useExisting: VaultTimeoutSettingsServiceImplementation,
    },
    // {
    //   provide: VaultTimeoutService,
    //   useFactory: getBgService<VaultTimeoutService>("vaultTimeoutService"),
    //   deps: [],
    // },
    {
      provide: VaultTimeoutServiceImplementation,
      useFactory: (
        cipherService: CipherService,
        folderService: InternalFolderService,
        collectionService: CollectionService,
        cryptoService: CryptoService,
        platformUtilsService: PlatformUtilsService,
        messagingService: MessagingService,
        searchService: SearchServiceAbstraction,
        stateService: StateServiceAbstraction,
        authService: AuthService,
        vaultTimeoutSettingsService: VaultTimeoutSettingsService,
      ) => {
        const lockedCallback = async () => {};
        const logoutCallback = async (expired: boolean) => {};
        return new VaultTimeoutServiceImplementation(
          cipherService,
          folderService,
          collectionService,
          cryptoService,
          platformUtilsService,
          messagingService,
          searchService,
          stateService,
          authService,
          vaultTimeoutSettingsService,
          lockedCallback,
          logoutCallback,
        );
      },
      deps: [
        CipherService,
        InternalFolderService,
        CollectionService,
        CryptoService,
        PlatformUtilsService,
        MessagingService,
        SearchServiceAbstraction,
        StateServiceAbstraction,
        AuthServiceAbstraction,
        VaultTimeoutSettingsService,
      ],
    },
    {
      provide: VaultTimeoutService,
      useExisting: VaultTimeoutServiceImplementation,
    },
    // {
    //   provide: NotificationsService,
    //   useFactory: getBgService<NotificationsService>("notificationsService"),
    //   deps: [],
    // },
    {
      provide: NotificationsServiceImplementation,
      useFactory: (
        logService: LogServiceAbstraction,
        syncService: SyncService,
        appIdService: AppIdService,
        apiService: ApiService,
        environmentService: EnvironmentService,
        stateService: StateServiceAbstraction,
        authService: AuthServiceAbstraction,
        messagingService: MessagingService,
      ) => {
        const logoutCallback = async (expired: boolean) => {};
        return new NotificationsServiceImplementation(
          logService,
          syncService,
          appIdService,
          apiService,
          environmentService,
          logoutCallback,
          stateService,
          authService,
          messagingService,
        );
      },
      deps: [
        LogServiceAbstraction,
        SyncService,
        AppIdService,
        ApiService,
        EnvironmentService,
        StateServiceAbstraction,
        AuthServiceAbstraction,
        MessagingService,
      ],
    },
    {
      provide: NotificationsService,
      useExisting: NotificationsServiceImplementation,
    },
    // TODO CG - This seems to be a duplicate provider instance
    // {
    //   provide: LogServiceAbstraction,
    //   useFactory: getBgService<ConsoleLogService>("logService"),
    //   deps: [],
    // },
    {
      provide: BrowserOrganizationService,
      deps: [StateServiceAbstraction],
    },
    {
      provide: InternalOrganizationServiceAbstraction,
      useExisting: BrowserOrganizationService,
    },
    {
      provide: VaultFilterServiceImplementation,
      useFactory: (
        stateService: StateServiceAbstraction,
        organizationService: InternalOrganizationServiceAbstraction,
        folderService: InternalFolderService,
        cipherService: CipherService,
        collectionService: CollectionService,
        policyService: InternalPolicyService,
        accountService: AccountServiceAbstraction,
      ) => {
        return new VaultFilterServiceImplementation(
          stateService,
          organizationService,
          folderService,
          cipherService,
          collectionService,
          policyService,
          accountService,
        );
      },
      deps: [
        StateServiceAbstraction,
        InternalOrganizationServiceAbstraction,
        InternalFolderService,
        CipherService,
        CollectionService,
        InternalPolicyService,
        AccountServiceAbstraction,
      ],
    },
    {
      provide: VaultFilterService,
      useExisting: VaultFilterServiceImplementation,
    },
    // {
    //   provide: ProviderService,
    //   useFactory: getBgService<ProviderService>("providerService"),
    //   deps: [],
    // },
    {
      provide: ProviderServiceImplementation,
      deps: [StateServiceAbstraction],
    },
    {
      provide: ProviderService,
      useExisting: ProviderServiceImplementation,
    },
    BrowserLocalStorageService,
    {
      provide: LOCAL_STORAGE,
      useExisting: BrowserLocalStorageService,
    },
    // {
    //   provide: SECURE_STORAGE,
    //   useFactory: getBgService<AbstractStorageService>("secureStorageService"),
    // },
    BrowserSecureLocalStorageService,
    {
      provide: SECURE_STORAGE,
      useExisting: BrowserSecureLocalStorageService,
    },
    // {
    //   provide: MEMORY_STORAGE,
    //   useFactory: getBgService<AbstractStorageService>("memoryStorageService"),
    // },
    {
      provide: BackgroundMemoryStorageService,
      useFactory: (
        cryptoFunctionService: CryptoFunctionService,
        logServiceAbstraction: LogServiceAbstraction,
      ) => {
        return BrowserApi.manifestVersion === 3
          ? new LocalBackedSessionStorageService(
              new EncryptServiceImplementation(cryptoFunctionService, logServiceAbstraction, false),
              new KeyGenerationService(cryptoFunctionService),
            )
          : new BackgroundMemoryStorageService();
      },
      deps: [CryptoFunctionService, LogServiceAbstraction],
    },
    {
      provide: MEMORY_STORAGE,
      useExisting: BackgroundMemoryStorageService,
    },
    ForegroundMemoryStorageService,
    {
      provide: OBSERVABLE_MEMORY_STORAGE,
      useExisting: ForegroundMemoryStorageService,
    },
    {
      provide: AbstractStorageService,
      useClass: BrowserLocalStorageService,
      deps: [],
    },
    {
      provide: OBSERVABLE_DISK_STORAGE,
      useExisting: AbstractStorageService,
    },
    {
      provide: BrowserStateService,
      useFactory: (
        storageService: BrowserLocalStorageService,
        secureStorageService: BrowserSecureLocalStorageService,
        memoryStorageService: LocalBackedSessionStorageService,
        logService: LogServiceAbstraction,
        accountService: AccountServiceAbstraction,
      ) => {
        return new BrowserStateService(
          storageService,
          secureStorageService,
          memoryStorageService,
          logService,
          new StateFactory(GlobalState, Account),
          accountService,
        );
      },
      deps: [
        LOCAL_STORAGE,
        SECURE_STORAGE,
        MEMORY_STORAGE,
        LogServiceAbstraction,
        AccountServiceAbstraction,
      ],
    },
    {
      provide: StateServiceAbstraction,
      useExisting: BrowserStateService,
    },
    // {
    //   provide: UsernameGenerationServiceAbstraction,
    //   useFactory: getBgService<UsernameGenerationServiceAbstraction>("usernameGenerationService"),
    //   deps: [],
    // },
    {
      provide: UsernameGenerationService,
      deps: [CryptoService, StateServiceAbstraction, ApiService],
    },
    {
      provide: UsernameGenerationServiceAbstraction,
      useExisting: UsernameGenerationService,
    },
    {
      provide: BaseStateServiceAbstraction,
      useExisting: StateServiceAbstraction,
    },
    BrowserFileDownloadService,
    {
      provide: FileDownloadService,
      useExisting: BrowserFileDownloadService,
    },
    {
      provide: LoginService,
      deps: [StateServiceAbstraction],
    },
    {
      provide: LoginServiceAbstraction,
      useExisting: LoginService,
    },
    {
      provide: AbstractThemingService,
      useFactory: (stateService: StateServiceAbstraction) => {
        return new ThemingService(
          stateService,
          // Safari doesn't properly handle the (prefers-color-scheme) media query in the popup window, it always returns light.
          // In Safari we have to use the background page instead, which comes with limitations like not dynamically changing the extension theme when the system theme is changed.

          // platformUtilsService.isSafari() ? getBgService<Window>("backgroundWindow")() : window,
          window, // TODO CG - Re-test and address the issue we are seeing with Safari's popout window. This is a temporary fix to get mv3 to work.
          document,
        );
      },
      deps: [StateServiceAbstraction, PlatformUtilsService],
    },
    {
      provide: BrowserConfigService,
      deps: [
        StateServiceAbstraction,
        ConfigApiServiceAbstraction,
        AuthServiceAbstraction,
        EnvironmentService,
        LogServiceAbstraction,
      ],
    },
    {
      provide: ConfigService,
      useExisting: BrowserConfigService,
    },
    {
      provide: FilePopoutUtilsService,
      useFactory: (platformUtilsService: PlatformUtilsService) => {
        return new FilePopoutUtilsService(platformUtilsService);
      },
      deps: [PlatformUtilsService],
    },
    {
      provide: ForegroundDerivedStateProvider,
      deps: [OBSERVABLE_MEMORY_STORAGE],
    },
    {
      provide: DerivedStateProvider,
      useExisting: ForegroundDerivedStateProvider,
    },
  ],
})
export class ServicesModule {}
