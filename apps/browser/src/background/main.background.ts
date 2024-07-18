import { Container } from "inversify";
import { Subject, filter, firstValueFrom, map, merge, timeout } from "rxjs";

import {
  PinServiceAbstraction,
  PinService,
  InternalUserDecryptionOptionsServiceAbstraction,
  UserDecryptionOptionsService,
  AuthRequestServiceAbstraction,
  AuthRequestService,
  LoginEmailServiceAbstraction,
  LogoutReason,
} from "@bitwarden/auth/common";
import { ApiService as ApiServiceAbstraction } from "@bitwarden/common/abstractions/api.service";
import { AuditService as AuditServiceAbstraction } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService as EventCollectionServiceAbstraction } from "@bitwarden/common/abstractions/event/event-collection.service";
import { EventUploadService as EventUploadServiceAbstraction } from "@bitwarden/common/abstractions/event/event-upload.service";
import { NotificationsService as NotificationsServiceAbstraction } from "@bitwarden/common/abstractions/notifications.service";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/abstractions/search.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { InternalOrganizationServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { InternalPolicyService as InternalPolicyServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ProviderService as ProviderServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { OrganizationService } from "@bitwarden/common/admin-console/services/organization/organization.service";
import { PolicyApiService } from "@bitwarden/common/admin-console/services/policy/policy-api.service";
import { PolicyService } from "@bitwarden/common/admin-console/services/policy/policy.service";
import { ProviderService } from "@bitwarden/common/admin-console/services/provider.service";
import { AccountService as AccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { AvatarService as AvatarServiceAbstraction } from "@bitwarden/common/auth/abstractions/avatar.service";
import { DeviceTrustServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust.service.abstraction";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { KdfConfigService as kdfConfigServiceAbstraction } from "@bitwarden/common/auth/abstractions/kdf-config.service";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/auth/abstractions/master-password.service.abstraction";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { TokenService as TokenServiceAbstraction } from "@bitwarden/common/auth/abstractions/token.service";
import { UserVerificationApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification-api.service.abstraction";
import { UserVerificationService as UserVerificationServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { ForceSetPasswordReason } from "@bitwarden/common/auth/models/domain/force-set-password-reason";
import { AccountServiceImplementation } from "@bitwarden/common/auth/services/account.service";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { AvatarService } from "@bitwarden/common/auth/services/avatar.service";
import { DeviceTrustService } from "@bitwarden/common/auth/services/device-trust.service.implementation";
import { DevicesServiceImplementation } from "@bitwarden/common/auth/services/devices/devices.service.implementation";
import { DevicesApiServiceImplementation } from "@bitwarden/common/auth/services/devices-api.service.implementation";
import { KdfConfigService } from "@bitwarden/common/auth/services/kdf-config.service";
import { KeyConnectorService } from "@bitwarden/common/auth/services/key-connector.service";
import { MasterPasswordService } from "@bitwarden/common/auth/services/master-password/master-password.service";
import { SsoLoginService } from "@bitwarden/common/auth/services/sso-login.service";
import { TokenService } from "@bitwarden/common/auth/services/token.service";
import { UserVerificationApiService } from "@bitwarden/common/auth/services/user-verification/user-verification-api.service";
import { UserVerificationService } from "@bitwarden/common/auth/services/user-verification/user-verification.service";
import {
  AutofillSettingsServiceAbstraction,
  AutofillSettingsService,
} from "@bitwarden/common/autofill/services/autofill-settings.service";
import {
  BadgeSettingsServiceAbstraction,
  BadgeSettingsService,
} from "@bitwarden/common/autofill/services/badge-settings.service";
import {
  DomainSettingsService,
  DefaultDomainSettingsService,
} from "@bitwarden/common/autofill/services/domain-settings.service";
import {
  UserNotificationSettingsService,
  UserNotificationSettingsServiceAbstraction,
} from "@bitwarden/common/autofill/services/user-notification-settings.service";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { DefaultBillingAccountProfileStateService } from "@bitwarden/common/billing/services/account/billing-account-profile-state.service";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { addCorePlatformServices } from "@bitwarden/common/platform";
import { AppIdService as AppIdServiceAbstraction } from "@bitwarden/common/platform/abstractions/app-id.service";
import { ConfigApiServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config-api.service.abstraction";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService as CryptoServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-authenticator.service.abstraction";
import { Fido2ClientService as Fido2ClientServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-user-interface.service.abstraction";
import { FileUploadService as FileUploadServiceAbstraction } from "@bitwarden/common/platform/abstractions/file-upload/file-upload.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { KeyGenerationService as KeyGenerationServiceAbstraction } from "@bitwarden/common/platform/abstractions/key-generation.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService as StateServiceAbstraction } from "@bitwarden/common/platform/abstractions/state.service";
import {
  AbstractStorageService,
  ObservableStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/platform/abstractions/system.service";
import {
  BiometricStateService,
  DefaultBiometricStateService,
} from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { StateFactory } from "@bitwarden/common/platform/factories/state-factory";
import { Message, MessageListener, MessageSender } from "@bitwarden/common/platform/messaging";
import { Lazy } from "@bitwarden/common/platform/misc/lazy";
import { clearCaches } from "@bitwarden/common/platform/misc/sequentialize";
import { Account } from "@bitwarden/common/platform/models/domain/account";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { ScheduledTaskNames } from "@bitwarden/common/platform/scheduling";
import { AppIdService } from "@bitwarden/common/platform/services/app-id.service";
import { ConfigApiService } from "@bitwarden/common/platform/services/config/config-api.service";
import { DefaultConfigService } from "@bitwarden/common/platform/services/config/default-config.service";
import { ContainerService } from "@bitwarden/common/platform/services/container.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { Fido2AuthenticatorService } from "@bitwarden/common/platform/services/fido2/fido2-authenticator.service";
import { Fido2ClientService } from "@bitwarden/common/platform/services/fido2/fido2-client.service";
import { FileUploadService } from "@bitwarden/common/platform/services/file-upload/file-upload.service";
import { KeyGenerationService } from "@bitwarden/common/platform/services/key-generation.service";
import { MigrationBuilderService } from "@bitwarden/common/platform/services/migration-builder.service";
import { MigrationRunner } from "@bitwarden/common/platform/services/migration-runner";
import { StateService } from "@bitwarden/common/platform/services/state.service";
import { SystemService } from "@bitwarden/common/platform/services/system.service";
import { UserAutoUnlockKeyService } from "@bitwarden/common/platform/services/user-auto-unlock-key.service";
import {
  GlobalStateProvider,
  SingleUserStateProvider,
  StateEventRunnerService,
  StateProvider,
} from "@bitwarden/common/platform/state";
/* eslint-enable import/no-restricted-paths */
import { SyncService } from "@bitwarden/common/platform/sync";
// eslint-disable-next-line no-restricted-imports -- Needed for service creation
import { DefaultSyncService } from "@bitwarden/common/platform/sync/internal";
import { DefaultThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import { ApiService } from "@bitwarden/common/services/api.service";
import { AuditService } from "@bitwarden/common/services/audit.service";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { EventUploadService } from "@bitwarden/common/services/event/event-upload.service";
import { NotificationsService } from "@bitwarden/common/services/notifications.service";
import { SearchService } from "@bitwarden/common/services/search.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/services/vault-timeout/vault-timeout-settings.service";
import {
  PasswordStrengthService,
  PasswordStrengthServiceAbstraction,
} from "@bitwarden/common/tools/password-strength";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service";
import { SendApiService as SendApiServiceAbstraction } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { SendStateProvider } from "@bitwarden/common/tools/send/services/send-state.provider";
import { SendService } from "@bitwarden/common/tools/send/services/send.service";
import { InternalSendService as InternalSendServiceAbstraction } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { UserId } from "@bitwarden/common/types/guid";
import { VaultTimeoutStringType } from "@bitwarden/common/types/vault-timeout.type";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService as CollectionServiceAbstraction } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherFileUploadService as CipherFileUploadServiceAbstraction } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import { InternalFolderService as InternalFolderServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { TotpService as TotpServiceAbstraction } from "@bitwarden/common/vault/abstractions/totp.service";
import { VaultSettingsService as VaultSettingsServiceAbstraction } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/services/collection.service";
import { CipherFileUploadService } from "@bitwarden/common/vault/services/file-upload/cipher-file-upload.service";
import { FolderApiService } from "@bitwarden/common/vault/services/folder/folder-api.service";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";
import { TotpService } from "@bitwarden/common/vault/services/totp.service";
import { VaultSettingsService } from "@bitwarden/common/vault/services/vault-settings/vault-settings.service";
import {
  legacyPasswordGenerationServiceFactory,
  PasswordGenerationServiceAbstraction,
  legacyUsernameGenerationServiceFactory,
  UsernameGenerationServiceAbstraction,
} from "@bitwarden/generator-legacy";
import {
  ImportApiService,
  ImportApiServiceAbstraction,
  ImportService,
  ImportServiceAbstraction,
} from "@bitwarden/importer/core";
import {
  IndividualVaultExportService,
  IndividualVaultExportServiceAbstraction,
  OrganizationVaultExportService,
  OrganizationVaultExportServiceAbstraction,
  VaultExportService,
  VaultExportServiceAbstraction,
} from "@bitwarden/vault-export-core";

import { OverlayBackground as OverlayBackgroundInterface } from "../autofill/background/abstractions/overlay.background";
import ContextMenusBackground from "../autofill/background/context-menus.background";
import NotificationBackground from "../autofill/background/notification.background";
import { OverlayBackground } from "../autofill/background/overlay.background";
import TabsBackground from "../autofill/background/tabs.background";
import WebRequestBackground from "../autofill/background/web-request.background";
import { CipherContextMenuHandler } from "../autofill/browser/cipher-context-menu-handler";
import { ContextMenuClickedHandler } from "../autofill/browser/context-menu-clicked-handler";
import { MainContextMenuHandler } from "../autofill/browser/main-context-menu-handler";
import LegacyOverlayBackground from "../autofill/deprecated/background/overlay.background.deprecated";
import { Fido2Background as Fido2BackgroundAbstraction } from "../autofill/fido2/background/abstractions/fido2.background";
import { Fido2Background } from "../autofill/fido2/background/fido2.background";
import { AutofillService as AutofillServiceAbstraction } from "../autofill/services/abstractions/autofill.service";
import AutofillService from "../autofill/services/autofill.service";
import { SafariApp } from "../browser/safariApp";
import { addBrowserPlatformServices } from "../platform";
import { BrowserApi } from "../platform/browser/browser-api";
import { UpdateBadge } from "../platform/listeners/update-badge";
import { OffscreenDocumentService } from "../platform/offscreen-document/abstractions/offscreen-document";
import { DefaultOffscreenDocumentService } from "../platform/offscreen-document/offscreen-document.service";
import { BrowserTaskSchedulerService } from "../platform/services/abstractions/browser-task-scheduler.service";
import { BrowserCryptoService } from "../platform/services/browser-crypto.service";
import { BrowserEnvironmentService } from "../platform/services/browser-environment.service";
import BrowserMemoryStorageService from "../platform/services/browser-memory-storage.service";
import { BrowserScriptInjectorService } from "../platform/services/browser-script-injector.service";
import I18nService from "../platform/services/i18n.service";
import { LocalBackedSessionStorageService } from "../platform/services/local-backed-session-storage.service";
import { BackgroundPlatformUtilsService } from "../platform/services/platform-utils/background-platform-utils.service";
import { BrowserPlatformUtilsService } from "../platform/services/platform-utils/browser-platform-utils.service";
import { BackgroundTaskSchedulerService } from "../platform/services/task-scheduler/background-task-scheduler.service";
import { ForegroundTaskSchedulerService } from "../platform/services/task-scheduler/foreground-task-scheduler.service";
import { BackgroundMemoryStorageService } from "../platform/storage/background-memory-storage.service";
import { ForegroundMemoryStorageService } from "../platform/storage/foreground-memory-storage.service";
import { ForegroundSyncService } from "../platform/sync/foreground-sync.service";
import { SyncServiceListener } from "../platform/sync/sync-service.listener";
import VaultTimeoutService from "../services/vault-timeout/vault-timeout.service";
import FilelessImporterBackground from "../tools/background/fileless-importer.background";
import { BrowserFido2UserInterfaceService } from "../vault/fido2/browser-fido2-user-interface.service";
import { VaultFilterService } from "../vault/services/vault-filter.service";

import CommandsBackground from "./commands.background";
import IdleBackground from "./idle.background";
import { NativeMessagingBackground } from "./nativeMessaging.background";
import RuntimeBackground from "./runtime.background";

export default class MainBackground {
  memoryStorageForStateProviders: AbstractStorageService & ObservableStorageService;
  largeObjectMemoryStorageForStateProviders: AbstractStorageService & ObservableStorageService;
  i18nService: I18nServiceAbstraction;
  platformUtilsService: PlatformUtilsServiceAbstraction;
  keyGenerationService: KeyGenerationServiceAbstraction;
  cryptoService: CryptoServiceAbstraction;
  masterPasswordService: InternalMasterPasswordServiceAbstraction;
  tokenService: TokenServiceAbstraction;
  appIdService: AppIdServiceAbstraction;
  apiService: ApiServiceAbstraction;
  environmentService: BrowserEnvironmentService;
  cipherService: CipherServiceAbstraction;
  folderService: InternalFolderServiceAbstraction;
  userDecryptionOptionsService: InternalUserDecryptionOptionsServiceAbstraction;
  collectionService: CollectionServiceAbstraction;
  vaultTimeoutService: VaultTimeoutService;
  vaultTimeoutSettingsService: VaultTimeoutSettingsServiceAbstraction;
  passwordGenerationService: PasswordGenerationServiceAbstraction;
  syncService: SyncService;
  passwordStrengthService: PasswordStrengthServiceAbstraction;
  totpService: TotpServiceAbstraction;
  autofillService: AutofillServiceAbstraction;
  containerService: ContainerService;
  auditService: AuditServiceAbstraction;
  authService: AuthServiceAbstraction;
  loginEmailService: LoginEmailServiceAbstraction;
  importApiService: ImportApiServiceAbstraction;
  importService: ImportServiceAbstraction;
  exportService: VaultExportServiceAbstraction;
  searchService: SearchServiceAbstraction;
  notificationsService: NotificationsServiceAbstraction;
  stateService: StateServiceAbstraction;
  userNotificationSettingsService: UserNotificationSettingsServiceAbstraction;
  autofillSettingsService: AutofillSettingsServiceAbstraction;
  badgeSettingsService: BadgeSettingsServiceAbstraction;
  domainSettingsService: DomainSettingsService;
  systemService: SystemServiceAbstraction;
  eventCollectionService: EventCollectionServiceAbstraction;
  eventUploadService: EventUploadServiceAbstraction;
  policyService: InternalPolicyServiceAbstraction;
  sendService: InternalSendServiceAbstraction;
  sendStateProvider: SendStateProvider;
  fileUploadService: FileUploadServiceAbstraction;
  cipherFileUploadService: CipherFileUploadServiceAbstraction;
  organizationService: InternalOrganizationServiceAbstraction;
  providerService: ProviderServiceAbstraction;
  keyConnectorService: KeyConnectorServiceAbstraction;
  userVerificationService: UserVerificationServiceAbstraction;
  vaultFilterService: VaultFilterService;
  usernameGenerationService: UsernameGenerationServiceAbstraction;
  encryptService: EncryptService;
  folderApiService: FolderApiServiceAbstraction;
  policyApiService: PolicyApiServiceAbstraction;
  sendApiService: SendApiServiceAbstraction;
  userVerificationApiService: UserVerificationApiServiceAbstraction;
  fido2UserInterfaceService: Fido2UserInterfaceServiceAbstraction;
  fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction;
  fido2ClientService: Fido2ClientServiceAbstraction;
  avatarService: AvatarServiceAbstraction;
  mainContextMenuHandler: MainContextMenuHandler;
  cipherContextMenuHandler: CipherContextMenuHandler;
  configService: ConfigService;
  configApiService: ConfigApiServiceAbstraction;
  devicesApiService: DevicesApiServiceAbstraction;
  devicesService: DevicesServiceAbstraction;
  deviceTrustService: DeviceTrustServiceAbstraction;
  authRequestService: AuthRequestServiceAbstraction;
  accountService: AccountServiceAbstraction;
  pinService: PinServiceAbstraction;
  taskSchedulerService: BrowserTaskSchedulerService;
  fido2Background: Fido2BackgroundAbstraction;
  individualVaultExportService: IndividualVaultExportServiceAbstraction;
  organizationVaultExportService: OrganizationVaultExportServiceAbstraction;
  vaultSettingsService: VaultSettingsServiceAbstraction;
  biometricStateService: BiometricStateService;
  stateEventRunnerService: StateEventRunnerService;
  ssoLoginService: SsoLoginServiceAbstraction;
  billingAccountProfileStateService: BillingAccountProfileStateService;
  // eslint-disable-next-line rxjs/no-exposed-subjects -- Needed to give access to services module
  intraprocessMessagingSubject: Subject<Message<Record<string, unknown>>>;
  userAutoUnlockKeyService: UserAutoUnlockKeyService;
  scriptInjectorService: BrowserScriptInjectorService;
  kdfConfigService: kdfConfigServiceAbstraction;
  syncServiceListener: SyncServiceListener;

  messagingService: MessageSender;

  onUpdatedRan: boolean;
  onReplacedRan: boolean;
  loginToAutoFill: CipherView = null;

  private commandsBackground: CommandsBackground;
  private contextMenusBackground: ContextMenusBackground;
  private idleBackground: IdleBackground;
  private notificationBackground: NotificationBackground;
  private overlayBackground: OverlayBackgroundInterface;
  private filelessImporterBackground: FilelessImporterBackground;
  private runtimeBackground: RuntimeBackground;
  private tabsBackground: TabsBackground;
  private webRequestBackground: WebRequestBackground;

  private syncTimeout: any;
  private isSafari: boolean;
  private nativeMessagingBackground: NativeMessagingBackground;

  constructor(public popupOnlyContext: boolean = false) {
    const container = new Container();

    addBrowserPlatformServices(container);
    addCorePlatformServices(container);

    // TODO: Don't do this
    this.messagingService = container.get(MessageSender);

    // Services
    const lockedCallback = async (userId?: string) => {
      if (this.notificationsService != null) {
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.notificationsService.updateConnection(false);
      }
      await this.refreshBadge();
      await this.refreshMenu(true);
      if (this.systemService != null) {
        await this.systemService.clearPendingClipboard();
        await this.systemService.startProcessReload(this.authService);
      }
    };

    const logoutCallback = async (logoutReason: LogoutReason, userId?: UserId) =>
      await this.logout(logoutReason, userId);

    const refreshAccessTokenErrorCallback = () => {
      // Send toast to popup
      this.messagingService.send("showToast", {
        type: "error",
        title: this.i18nService.t("errorRefreshingAccessToken"),
        message: this.i18nService.t("errorRefreshingAccessTokenDesc"),
      });
    };

    this.keyGenerationService = new KeyGenerationService(container.get(CryptoFunctionService));

    // Needs to be available for the foreground
    this.intraprocessMessagingSubject = container.get("INTRAPROCESS_MESSAGING_SUBJECT");

    this.platformUtilsService = new BackgroundPlatformUtilsService(
      this.messagingService,
      (clipboardValue, clearMs) => this.clearClipboard(clipboardValue, clearMs),
      async () => this.biometricUnlock(),
      self,
      container.get(OffscreenDocumentService),
    );

    // Creates a session key for mv3 storage of large memory items
    const sessionKey = new Lazy(async () => {
      // Key already in session storage
      const sessionStorage = new BrowserMemoryStorageService();
      const existingKey = await sessionStorage.get<SymmetricCryptoKey>("session-key");
      if (existingKey) {
        if (sessionStorage.valuesRequireDeserialization) {
          return SymmetricCryptoKey.fromJSON(existingKey);
        }
        return existingKey;
      }

      // New key
      const { derivedKey } = await this.keyGenerationService.createKeyWithPurpose(
        128,
        "ephemeral",
        "bitwarden-ephemeral",
      );
      await sessionStorage.save("session-key", derivedKey);
      return derivedKey;
    });

    const mv3MemoryStorageCreator = () => {
      if (this.popupOnlyContext) {
        return new ForegroundMemoryStorageService();
      }

      return new LocalBackedSessionStorageService(
        sessionKey,
        this.storageService,
        new EncryptServiceImplementation(
          container.get(CryptoFunctionService),
          container.get(LogService),
          false,
        ),
        this.platformUtilsService,
        container.get(LogService),
      );
    };

    // secure storage is not supported in browsers, so we use local storage and warn users when it is used
    this.memoryStorageForStateProviders = BrowserApi.isManifestVersion(3)
      ? new BrowserMemoryStorageService() // mv3 stores to storage.session
      : popupOnlyContext
        ? new ForegroundMemoryStorageService()
        : new BackgroundMemoryStorageService(); // mv2 stores to memory
    this.memoryStorageService = BrowserApi.isManifestVersion(3)
      ? this.memoryStorageForStateProviders // manifest v3 can reuse the same storage. They are split for v2 due to lacking a good sync mechanism, which isn't true for v3
      : popupOnlyContext
        ? new ForegroundMemoryStorageService()
        : new BackgroundMemoryStorageService();
    this.largeObjectMemoryStorageForStateProviders = BrowserApi.isManifestVersion(3)
      ? mv3MemoryStorageCreator() // mv3 stores to local-backed session storage
      : this.memoryStorageForStateProviders; // mv2 stores to the same location

    this.accountService = new AccountServiceImplementation(
      this.messagingService,
      container.get(LogService),
      container.get(GlobalStateProvider),
    );

    this.taskSchedulerService = this.popupOnlyContext
      ? new ForegroundTaskSchedulerService(container.get(LogService), container.get(StateProvider))
      : new BackgroundTaskSchedulerService(container.get(LogService), container.get(StateProvider));
    this.taskSchedulerService.registerTaskHandler(ScheduledTaskNames.scheduleNextSyncInterval, () =>
      this.fullSync(),
    );

    this.environmentService = new BrowserEnvironmentService(
      container.get(LogService),
      container.get(StateProvider),
      this.accountService,
    );
    this.biometricStateService = new DefaultBiometricStateService(container.get(StateProvider));

    this.userNotificationSettingsService = new UserNotificationSettingsService(
      container.get(StateProvider),
    );

    this.tokenService = new TokenService(
      container.get(SingleUserStateProvider),
      container.get(GlobalStateProvider),
      this.platformUtilsService.supportsSecureStorage(),
      container.get("SECURE_STORAGE"),
      this.keyGenerationService,
      this.encryptService,
      container.get(LogService),
      logoutCallback,
    );

    this.stateService = new StateService(
      container.get("DISK_STORAGE"),
      container.get("SECURE_STORAGE"),
      container.get("MEMORY_STORAGE"),
      container.get(LogService),
      new StateFactory(GlobalState, Account),
      this.accountService,
      this.environmentService,
      this.tokenService,
      container.get(MigrationRunner),
    );

    const themeStateService = new DefaultThemeStateService(container.get(GlobalStateProvider));

    this.masterPasswordService = new MasterPasswordService(
      container.get(StateProvider),
      this.stateService,
      this.keyGenerationService,
      this.encryptService,
    );

    this.i18nService = new I18nService(
      BrowserApi.getUILanguage(),
      container.get(GlobalStateProvider),
    );

    this.kdfConfigService = new KdfConfigService(container.get(StateProvider));

    this.pinService = new PinService(
      this.accountService,
      container.get(CryptoFunctionService),
      this.encryptService,
      this.kdfConfigService,
      this.keyGenerationService,
      container.get(LogService),
      this.masterPasswordService,
      container.get(StateProvider),
      this.stateService,
    );

    this.cryptoService = new BrowserCryptoService(
      this.pinService,
      this.masterPasswordService,
      this.keyGenerationService,
      container.get(CryptoFunctionService),
      this.encryptService,
      this.platformUtilsService,
      container.get(LogService),
      this.stateService,
      this.accountService,
      container.get(StateProvider),
      this.biometricStateService,
      this.kdfConfigService,
    );

    this.appIdService = new AppIdService(container.get(GlobalStateProvider));

    this.userDecryptionOptionsService = new UserDecryptionOptionsService(
      container.get(StateProvider),
    );
    this.organizationService = new OrganizationService(container.get(StateProvider));
    this.policyService = new PolicyService(container.get(StateProvider), this.organizationService);

    this.vaultTimeoutSettingsService = new VaultTimeoutSettingsService(
      this.accountService,
      this.pinService,
      this.userDecryptionOptionsService,
      this.cryptoService,
      this.tokenService,
      this.policyService,
      this.biometricStateService,
      container.get(StateProvider),
      container.get(LogService),
      VaultTimeoutStringType.OnRestart, // default vault timeout
    );

    this.apiService = new ApiService(
      this.tokenService,
      this.platformUtilsService,
      this.environmentService,
      this.appIdService,
      refreshAccessTokenErrorCallback,
      container.get(LogService),
      (logoutReason: LogoutReason, userId?: UserId) => this.logout(logoutReason, userId),
      this.vaultTimeoutSettingsService,
    );

    this.domainSettingsService = new DefaultDomainSettingsService(container.get(StateProvider));
    this.fileUploadService = new FileUploadService(container.get(LogService));
    this.cipherFileUploadService = new CipherFileUploadService(
      this.apiService,
      this.fileUploadService,
    );
    this.searchService = new SearchService(
      container.get(LogService),
      this.i18nService,
      container.get(StateProvider),
    );

    this.collectionService = new CollectionService(
      this.cryptoService,
      this.i18nService,
      container.get(StateProvider),
    );

    this.autofillSettingsService = new AutofillSettingsService(
      container.get(StateProvider),
      this.policyService,
    );
    this.badgeSettingsService = new BadgeSettingsService(container.get(StateProvider));
    this.policyApiService = new PolicyApiService(this.policyService, this.apiService);
    this.keyConnectorService = new KeyConnectorService(
      this.accountService,
      this.masterPasswordService,
      this.cryptoService,
      this.apiService,
      this.tokenService,
      container.get(LogService),
      this.organizationService,
      this.keyGenerationService,
      logoutCallback,
      container.get(StateProvider),
    );

    this.passwordStrengthService = new PasswordStrengthService();

    this.passwordGenerationService = legacyPasswordGenerationServiceFactory(
      this.encryptService,
      this.cryptoService,
      this.policyService,
      this.accountService,
      container.get(StateProvider),
    );

    this.userDecryptionOptionsService = new UserDecryptionOptionsService(
      container.get(StateProvider),
    );

    this.devicesApiService = new DevicesApiServiceImplementation(this.apiService);
    this.deviceTrustService = new DeviceTrustService(
      this.keyGenerationService,
      container.get(CryptoFunctionService),
      this.cryptoService,
      this.encryptService,
      this.appIdService,
      this.devicesApiService,
      this.i18nService,
      this.platformUtilsService,
      container.get(StateProvider),
      container.get("SECURE_STORAGE"),
      this.userDecryptionOptionsService,
      container.get(LogService),
    );

    this.devicesService = new DevicesServiceImplementation(this.devicesApiService);

    this.authRequestService = new AuthRequestService(
      this.appIdService,
      this.accountService,
      this.masterPasswordService,
      this.cryptoService,
      this.apiService,
      container.get(StateProvider),
    );

    this.authService = new AuthService(
      this.accountService,
      this.messagingService,
      this.cryptoService,
      this.apiService,
      this.stateService,
      this.tokenService,
    );

    this.billingAccountProfileStateService = new DefaultBillingAccountProfileStateService(
      container.get(StateProvider),
    );

    this.ssoLoginService = new SsoLoginService(container.get(StateProvider));

    this.userVerificationApiService = new UserVerificationApiService(this.apiService);

    this.configApiService = new ConfigApiService(this.apiService, this.tokenService);

    this.configService = new DefaultConfigService(
      this.configApiService,
      this.environmentService,
      container.get(LogService),
      container.get(StateProvider),
      this.authService,
    );

    this.cipherService = new CipherService(
      this.cryptoService,
      this.domainSettingsService,
      this.apiService,
      this.i18nService,
      this.searchService,
      this.stateService,
      this.autofillSettingsService,
      this.encryptService,
      this.cipherFileUploadService,
      this.configService,
      container.get(StateProvider),
    );
    this.folderService = new FolderService(
      this.cryptoService,
      this.i18nService,
      this.cipherService,
      container.get(StateProvider),
    );
    this.folderApiService = new FolderApiService(this.folderService, this.apiService);

    this.userVerificationService = new UserVerificationService(
      this.cryptoService,
      this.accountService,
      this.masterPasswordService,
      this.i18nService,
      this.userVerificationApiService,
      this.userDecryptionOptionsService,
      this.pinService,
      container.get(LogService),
      this.vaultTimeoutSettingsService,
      this.platformUtilsService,
      this.kdfConfigService,
    );

    this.vaultFilterService = new VaultFilterService(
      this.organizationService,
      this.folderService,
      this.cipherService,
      this.collectionService,
      this.policyService,
      container.get(StateProvider),
      this.accountService,
    );

    this.vaultSettingsService = new VaultSettingsService(container.get(StateProvider));

    this.vaultTimeoutService = new VaultTimeoutService(
      this.accountService,
      this.masterPasswordService,
      this.cipherService,
      this.folderService,
      this.collectionService,
      this.platformUtilsService,
      this.messagingService,
      this.searchService,
      this.stateService,
      this.authService,
      this.vaultTimeoutSettingsService,
      this.stateEventRunnerService,
      this.taskSchedulerService,
      container.get(LogService),
      lockedCallback,
      logoutCallback,
    );
    this.containerService = new ContainerService(this.cryptoService, this.encryptService);

    this.sendStateProvider = new SendStateProvider(container.get(StateProvider));
    this.sendService = new SendService(
      this.cryptoService,
      this.i18nService,
      this.keyGenerationService,
      this.sendStateProvider,
      this.encryptService,
    );
    this.sendApiService = new SendApiService(
      this.apiService,
      this.fileUploadService,
      this.sendService,
    );

    this.avatarService = new AvatarService(this.apiService, container.get(StateProvider));

    this.providerService = new ProviderService(container.get(StateProvider));

    if (this.popupOnlyContext) {
      this.syncService = new ForegroundSyncService(
        this.stateService,
        this.folderService,
        this.folderApiService,
        this.messagingService,
        container.get(LogService),
        this.cipherService,
        this.collectionService,
        this.apiService,
        this.accountService,
        this.authService,
        this.sendService,
        this.sendApiService,
        container.get(MessageListener),
      );
    } else {
      this.syncService = new DefaultSyncService(
        this.masterPasswordService,
        this.accountService,
        this.apiService,
        this.domainSettingsService,
        this.folderService,
        this.cipherService,
        this.cryptoService,
        this.collectionService,
        this.messagingService,
        this.policyService,
        this.sendService,
        container.get(LogService),
        this.keyConnectorService,
        this.stateService,
        this.providerService,
        this.folderApiService,
        this.organizationService,
        this.sendApiService,
        this.userDecryptionOptionsService,
        this.avatarService,
        logoutCallback,
        this.billingAccountProfileStateService,
        this.tokenService,
        this.authService,
      );

      this.syncServiceListener = new SyncServiceListener(
        this.syncService,
        container.get(MessageListener),
        this.messagingService,
        container.get(LogService),
      );
    }
    this.eventUploadService = new EventUploadService(
      this.apiService,
      container.get(StateProvider),
      container.get(LogService),
      this.authService,
      this.taskSchedulerService,
    );
    this.eventCollectionService = new EventCollectionService(
      this.cipherService,
      container.get(StateProvider),
      this.organizationService,
      this.eventUploadService,
      this.authService,
      this.accountService,
    );
    this.totpService = new TotpService(
      container.get(CryptoFunctionService),
      container.get(LogService),
    );

    this.scriptInjectorService = new BrowserScriptInjectorService(
      this.platformUtilsService,
      container.get(LogService),
    );
    this.autofillService = new AutofillService(
      this.cipherService,
      this.autofillSettingsService,
      this.totpService,
      this.eventCollectionService,
      container.get(LogService),
      this.domainSettingsService,
      this.userVerificationService,
      this.billingAccountProfileStateService,
      this.scriptInjectorService,
      this.accountService,
      this.authService,
      this.configService,
      container.get(MessageListener),
    );
    this.auditService = new AuditService(container.get(CryptoFunctionService), this.apiService);

    this.importApiService = new ImportApiService(this.apiService);

    this.importService = new ImportService(
      this.cipherService,
      this.folderService,
      this.importApiService,
      this.i18nService,
      this.collectionService,
      this.cryptoService,
      this.pinService,
    );

    this.individualVaultExportService = new IndividualVaultExportService(
      this.folderService,
      this.cipherService,
      this.pinService,
      this.cryptoService,
      container.get(CryptoFunctionService),
      this.kdfConfigService,
    );

    this.organizationVaultExportService = new OrganizationVaultExportService(
      this.cipherService,
      this.apiService,
      this.pinService,
      this.cryptoService,
      container.get(CryptoFunctionService),
      this.collectionService,
      this.kdfConfigService,
    );

    this.exportService = new VaultExportService(
      this.individualVaultExportService,
      this.organizationVaultExportService,
    );

    this.notificationsService = new NotificationsService(
      container.get(LogService),
      this.syncService,
      this.appIdService,
      this.apiService,
      this.environmentService,
      logoutCallback,
      this.stateService,
      this.authService,
      this.messagingService,
      this.taskSchedulerService,
    );

    this.fido2UserInterfaceService = new BrowserFido2UserInterfaceService(this.authService);
    this.fido2AuthenticatorService = new Fido2AuthenticatorService(
      this.cipherService,
      this.fido2UserInterfaceService,
      this.syncService,
      container.get(LogService),
    );
    this.fido2ClientService = new Fido2ClientService(
      this.fido2AuthenticatorService,
      this.configService,
      this.authService,
      this.vaultSettingsService,
      this.domainSettingsService,
      this.taskSchedulerService,
      container.get(LogService),
    );

    const systemUtilsServiceReloadCallback = async () => {
      const forceWindowReload =
        this.platformUtilsService.isSafari() ||
        this.platformUtilsService.isFirefox() ||
        this.platformUtilsService.isOpera();
      await this.taskSchedulerService.clearAllScheduledTasks();
      BrowserApi.reloadExtension(forceWindowReload ? self : null);
    };

    this.systemService = new SystemService(
      this.pinService,
      this.messagingService,
      this.platformUtilsService,
      systemUtilsServiceReloadCallback,
      this.autofillSettingsService,
      this.vaultTimeoutSettingsService,
      this.biometricStateService,
      this.accountService,
      this.taskSchedulerService,
    );

    // Other fields
    this.isSafari = this.platformUtilsService.isSafari();

    // Background
    if (!this.popupOnlyContext) {
      this.fido2Background = new Fido2Background(
        container.get(LogService),
        this.fido2ClientService,
        this.vaultSettingsService,
        this.scriptInjectorService,
      );
      this.runtimeBackground = new RuntimeBackground(
        this,
        this.autofillService,
        this.platformUtilsService as BrowserPlatformUtilsService,
        this.notificationsService,
        this.autofillSettingsService,
        this.systemService,
        this.environmentService,
        this.messagingService,
        container.get(LogService),
        this.configService,
        this.fido2Background,
        container.get(MessageListener),
        this.accountService,
      );
      this.nativeMessagingBackground = new NativeMessagingBackground(
        this.accountService,
        this.masterPasswordService,
        this.cryptoService,
        container.get(CryptoFunctionService),
        this.runtimeBackground,
        this.messagingService,
        this.appIdService,
        this.platformUtilsService,
        this.stateService,
        container.get(LogService),
        this.authService,
        this.biometricStateService,
      );
      this.commandsBackground = new CommandsBackground(
        this,
        this.passwordGenerationService,
        this.platformUtilsService,
        this.vaultTimeoutService,
        this.authService,
      );
      this.notificationBackground = new NotificationBackground(
        this.autofillService,
        this.cipherService,
        this.authService,
        this.policyService,
        this.folderService,
        this.userNotificationSettingsService,
        this.domainSettingsService,
        this.environmentService,
        container.get(LogService),
        themeStateService,
        this.configService,
      );

      this.filelessImporterBackground = new FilelessImporterBackground(
        this.configService,
        this.authService,
        this.policyService,
        this.notificationBackground,
        this.importService,
        this.syncService,
        this.scriptInjectorService,
      );

      const contextMenuClickedHandler = new ContextMenuClickedHandler(
        (options) => this.platformUtilsService.copyToClipboard(options.text),
        async (_tab) => {
          const options = (await this.passwordGenerationService.getOptions())?.[0] ?? {};
          const password = await this.passwordGenerationService.generatePassword(options);
          this.platformUtilsService.copyToClipboard(password);
          // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.passwordGenerationService.addHistory(password);
        },
        async (tab, cipher) => {
          this.loginToAutoFill = cipher;
          if (tab == null) {
            return;
          }

          // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          BrowserApi.tabSendMessage(tab, {
            command: "collectPageDetails",
            tab: tab,
            sender: "contextMenu",
          });
        },
        this.authService,
        this.cipherService,
        this.totpService,
        this.eventCollectionService,
        this.userVerificationService,
        this.accountService,
      );

      this.contextMenusBackground = new ContextMenusBackground(contextMenuClickedHandler);
    }

    this.idleBackground = new IdleBackground(
      this.vaultTimeoutService,
      this.notificationsService,
      this.accountService,
      this.vaultTimeoutSettingsService,
    );

    this.usernameGenerationService = legacyUsernameGenerationServiceFactory(
      this.apiService,
      this.i18nService,
      this.cryptoService,
      this.encryptService,
      this.policyService,
      this.accountService,
      container.get(StateProvider),
    );

    if (!this.popupOnlyContext) {
      this.mainContextMenuHandler = new MainContextMenuHandler(
        this.stateService,
        this.autofillSettingsService,
        this.i18nService,
        container.get(LogService),
        this.billingAccountProfileStateService,
      );

      this.cipherContextMenuHandler = new CipherContextMenuHandler(
        this.mainContextMenuHandler,
        this.authService,
        this.cipherService,
      );

      if (chrome.webRequest != null && chrome.webRequest.onAuthRequired != null) {
        this.webRequestBackground = new WebRequestBackground(
          this.platformUtilsService,
          this.cipherService,
          this.authService,
          chrome.webRequest,
        );
      }
    }

    this.userAutoUnlockKeyService = new UserAutoUnlockKeyService(this.cryptoService);

    this.configService
      .getFeatureFlag(FeatureFlag.InlineMenuPositioningImprovements)
      .then(async (enabled) => {
        if (!enabled) {
          this.overlayBackground = new LegacyOverlayBackground(
            this.cipherService,
            this.autofillService,
            this.authService,
            this.environmentService,
            this.domainSettingsService,
            this.autofillSettingsService,
            this.i18nService,
            this.platformUtilsService,
            themeStateService,
          );
        } else {
          this.overlayBackground = new OverlayBackground(
            container.get(LogService),
            this.cipherService,
            this.autofillService,
            this.authService,
            this.environmentService,
            this.domainSettingsService,
            this.autofillSettingsService,
            this.i18nService,
            this.platformUtilsService,
            themeStateService,
          );
        }

        this.tabsBackground = new TabsBackground(
          this,
          this.notificationBackground,
          this.overlayBackground,
        );

        await this.overlayBackground.init();
        await this.tabsBackground.init();
      })
      .catch((error) =>
        container.get(LogService).error(`Error initializing OverlayBackground: ${error}`),
      );
  }

  async bootstrap() {
    this.containerService.attachToGlobal(self);

    // Only the "true" background should run migrations
    await this.stateService.init({ runMigrations: !this.popupOnlyContext });

    // This is here instead of in in the InitService b/c we don't plan for
    // side effects to run in the Browser InitService.
    const accounts = await firstValueFrom(this.accountService.accounts$);

    const setUserKeyInMemoryPromises = [];
    for (const userId of Object.keys(accounts) as UserId[]) {
      // For each acct, we must await the process of setting the user key in memory
      // if the auto user key is set to avoid race conditions of any code trying to access
      // the user key from mem.
      setUserKeyInMemoryPromises.push(
        this.userAutoUnlockKeyService.setUserKeyInMemoryIfAutoUserKeySet(userId),
      );
    }
    await Promise.all(setUserKeyInMemoryPromises);

    await (this.i18nService as I18nService).init();
    (this.eventUploadService as EventUploadService).init(true);

    if (this.popupOnlyContext) {
      return;
    }

    await this.vaultTimeoutService.init(true);
    this.fido2Background.init();
    await this.runtimeBackground.init();
    await this.notificationBackground.init();
    this.filelessImporterBackground.init();
    await this.commandsBackground.init();
    this.contextMenusBackground?.init();
    await this.idleBackground.init();
    this.webRequestBackground?.startListening();
    this.syncServiceListener?.listener$().subscribe();

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        await this.refreshBadge();
        await this.fullSync(true);
        await this.taskSchedulerService.setInterval(
          ScheduledTaskNames.scheduleNextSyncInterval,
          5 * 60 * 1000, // check every 5 minutes
        );
        setTimeout(() => this.notificationsService.init(), 2500);
        await this.taskSchedulerService.verifyAlarmsState();
        resolve();
      }, 500);
    });
  }

  async refreshBadge() {
    await new UpdateBadge(self, this).run();
  }

  async refreshMenu(forLocked = false) {
    if (!chrome.windows || !chrome.contextMenus) {
      return;
    }

    await MainContextMenuHandler.removeAll();

    if (forLocked) {
      await this.mainContextMenuHandler?.noAccess();
      this.onUpdatedRan = this.onReplacedRan = false;
      return;
    }

    await this.mainContextMenuHandler?.init();

    const tab = await BrowserApi.getTabFromCurrentWindow();
    if (tab) {
      await this.cipherContextMenuHandler?.update(tab.url);
      this.onUpdatedRan = this.onReplacedRan = false;
    }
  }

  /**
   * Switch accounts to indicated userId -- null is no active user
   */
  async switchAccount(userId: UserId) {
    let nextAccountStatus: AuthenticationStatus;
    try {
      // HACK to ensure account is switched before proceeding
      const switchPromise = firstValueFrom(
        this.accountService.activeAccount$.pipe(
          filter((account) => (account?.id ?? null) === (userId ?? null)),
          timeout({
            first: 1_000,
            with: () => {
              throw new Error(
                "The account switch process did not complete in a reasonable amount of time.",
              );
            },
          }),
        ),
      );
      await this.accountService.switchAccount(userId);
      await switchPromise;
      // Clear sequentialized caches
      clearCaches();

      if (userId == null) {
        await this.refreshBadge();
        await this.refreshMenu();
        await this.overlayBackground?.updateOverlayCiphers(); // null in popup only contexts
        this.messagingService.send("goHome");
        return;
      }

      nextAccountStatus = await this.authService.getAuthStatus(userId);
      const forcePasswordReset =
        (await firstValueFrom(this.masterPasswordService.forceSetPasswordReason$(userId))) !=
        ForceSetPasswordReason.None;

      await this.systemService.clearPendingClipboard();
      await this.notificationsService.updateConnection(false);

      if (nextAccountStatus === AuthenticationStatus.LoggedOut) {
        this.messagingService.send("goHome");
      } else if (nextAccountStatus === AuthenticationStatus.Locked) {
        this.messagingService.send("locked", { userId: userId });
      } else if (forcePasswordReset) {
        this.messagingService.send("update-temp-password", { userId: userId });
      } else {
        this.messagingService.send("unlocked", { userId: userId });
        await this.refreshBadge();
        await this.refreshMenu();
        await this.overlayBackground?.updateOverlayCiphers(); // null in popup only contexts
        await this.syncService.fullSync(false);
      }
    } finally {
      this.messagingService.send("switchAccountFinish", {
        userId: userId,
        status: nextAccountStatus,
      });
    }
  }

  async logout(logoutReason: LogoutReason, userId?: UserId) {
    const activeUserId = await firstValueFrom(
      this.accountService.activeAccount$.pipe(
        map((a) => a?.id),
        timeout({
          first: 2000,
          with: () => {
            throw new Error("No active account found to logout");
          },
        }),
      ),
    );

    const userBeingLoggedOut = userId ?? activeUserId;

    await this.eventUploadService.uploadEvents(userBeingLoggedOut);

    const newActiveUser =
      userBeingLoggedOut === activeUserId
        ? await firstValueFrom(this.accountService.nextUpAccount$.pipe(map((a) => a?.id)))
        : null;

    await this.switchAccount(newActiveUser);

    // HACK: We shouldn't wait for the authentication status to change but instead subscribe to the
    // authentication status to do various actions.
    const logoutPromise = firstValueFrom(
      this.authService.authStatusFor$(userBeingLoggedOut).pipe(
        filter((authenticationStatus) => authenticationStatus === AuthenticationStatus.LoggedOut),
        timeout({
          first: 5_000,
          with: () => {
            throw new Error("The logout process did not complete in a reasonable amount of time.");
          },
        }),
      ),
    );

    await Promise.all([
      this.syncService.setLastSync(new Date(0), userBeingLoggedOut),
      this.cryptoService.clearKeys(userBeingLoggedOut),
      this.cipherService.clear(userBeingLoggedOut),
      this.folderService.clear(userBeingLoggedOut),
      this.collectionService.clear(userBeingLoggedOut),
      this.vaultTimeoutSettingsService.clear(userBeingLoggedOut),
      this.vaultFilterService.clear(),
      this.biometricStateService.logout(userBeingLoggedOut),
      /* We intentionally do not clear:
       *  - autofillSettingsService
       *  - badgeSettingsService
       *  - userNotificationSettingsService
       */
    ]);

    //Needs to be checked before state is cleaned
    const needStorageReseed = await this.needsStorageReseed(userBeingLoggedOut);

    await this.stateService.clean({ userId: userBeingLoggedOut });
    await this.accountService.clean(userBeingLoggedOut);

    await this.stateEventRunnerService.handleEvent("logout", userBeingLoggedOut);

    // HACK: Wait for the user logging outs authentication status to transition to LoggedOut
    await logoutPromise;

    this.messagingService.send("doneLoggingOut", {
      logoutReason: logoutReason,
      userId: userBeingLoggedOut,
    });

    if (needStorageReseed) {
      await this.reseedStorage();
    }

    if (BrowserApi.isManifestVersion(3)) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.sendMessage("updateBadge");
    }
    await this.refreshBadge();
    await this.mainContextMenuHandler?.noAccess();
    await this.notificationsService.updateConnection(false);
    await this.systemService.clearPendingClipboard();
    await this.systemService.startProcessReload(this.authService);
  }

  private async needsStorageReseed(userId: UserId): Promise<boolean> {
    const currentVaultTimeout = await firstValueFrom(
      this.vaultTimeoutSettingsService.getVaultTimeoutByUserId$(userId),
    );
    return currentVaultTimeout == VaultTimeoutStringType.Never ? false : true;
  }

  async collectPageDetailsForContentScript(tab: any, sender: string, frameId: number = null) {
    if (tab == null || !tab.id) {
      return;
    }

    const options: any = {};
    if (frameId != null) {
      options.frameId = frameId;
    }

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BrowserApi.tabSendMessage(
      tab,
      {
        command: "collectPageDetails",
        tab: tab,
        sender: sender,
      },
      options,
    );
  }

  async openPopup() {
    // Chrome APIs cannot open popup

    // TODO: Do we need to open this popup?
    if (!this.isSafari) {
      return;
    }
    await SafariApp.sendMessageToApp("showPopover", null, true);
  }

  async reseedStorage() {
    if (
      !this.platformUtilsService.isChrome() &&
      !this.platformUtilsService.isVivaldi() &&
      !this.platformUtilsService.isOpera()
    ) {
      return;
    }

    const storage = await this.storageService.getAll();
    await this.storageService.clear();

    for (const key in storage) {
      // eslint-disable-next-line
      if (!storage.hasOwnProperty(key)) {
        continue;
      }
      await this.storageService.save(key, storage[key]);
    }
  }

  async clearClipboard(clipboardValue: string, clearMs: number) {
    if (this.systemService != null) {
      await this.systemService.clearClipboard(clipboardValue, clearMs);
    }
  }

  async biometricUnlock(): Promise<boolean> {
    if (this.nativeMessagingBackground == null) {
      return false;
    }

    const responsePromise = this.nativeMessagingBackground.getResponse();
    await this.nativeMessagingBackground.send({ command: "biometricUnlock" });
    const response = await responsePromise;
    return response.response === "unlocked";
  }

  private async fullSync(override = false) {
    const syncInternal = 6 * 60 * 60 * 1000; // 6 hours
    const lastSync = await this.syncService.getLastSync();

    let lastSyncAgo = syncInternal + 1;
    if (lastSync != null) {
      lastSyncAgo = new Date().getTime() - lastSync.getTime();
    }

    if (override || lastSyncAgo >= syncInternal) {
      await this.syncService.fullSync(override);
    }
  }
}
