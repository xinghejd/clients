import { AvatarUpdateService as AvatarUpdateServiceAbstraction } from "@bitwarden/common/abstractions/account/avatar-update.service";
import { ApiService as ApiServiceAbstraction } from "@bitwarden/common/abstractions/api.service";
import { AuditService as AuditServiceAbstraction } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService as EventCollectionServiceAbstraction } from "@bitwarden/common/abstractions/event/event-collection.service";
import { EventUploadService as EventUploadServiceAbstraction } from "@bitwarden/common/abstractions/event/event-upload.service";
import { NotificationsService as NotificationsServiceAbstraction } from "@bitwarden/common/abstractions/notifications.service";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/abstractions/search.service";
import { SettingsService as SettingsServiceAbstraction } from "@bitwarden/common/abstractions/settings.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { InternalOrganizationServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { InternalPolicyService as InternalPolicyServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ProviderService as ProviderServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { AccountService as AccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthRequestCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth-request-crypto.service.abstraction";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { TokenService as TokenServiceAbstraction } from "@bitwarden/common/auth/abstractions/token.service";
import { TwoFactorService as TwoFactorServiceAbstraction } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { UserVerificationApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification-api.service.abstraction";
import { UserVerificationService as UserVerificationServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AppIdService as AppIdServiceAbstraction } from "@bitwarden/common/platform/abstractions/app-id.service";
import { ConfigApiServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config-api.service.abstraction";
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService as CryptoServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { FileUploadService as FileUploadServiceAbstraction } from "@bitwarden/common/platform/abstractions/file-upload/file-upload.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService as MessagingServiceAbstraction } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/platform/abstractions/system.service";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { ContainerService } from "@bitwarden/common/platform/services/container.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { MultithreadEncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/multithread-encrypt.service.implementation";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";
import {
  ActiveUserStateProvider,
  GlobalStateProvider,
  SingleUserStateProvider,
  StateProvider,
} from "@bitwarden/common/platform/state";
// eslint-disable-next-line import/no-restricted-paths -- We need the implementation to inject, but generally this should not be accessed
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";
import { UsernameGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/username";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { SendApiService as SendApiServiceAbstraction } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { InternalSendService as InternalSendServiceAbstraction } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService as CollectionServiceAbstraction } from "@bitwarden/common/vault/abstractions/collection.service";
import { Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction } from "@bitwarden/common/vault/abstractions/fido2/fido2-authenticator.service.abstraction";
import { Fido2ClientService as Fido2ClientServiceAbstraction } from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "@bitwarden/common/vault/abstractions/fido2/fido2-user-interface.service.abstraction";
import { CipherFileUploadService as CipherFileUploadServiceAbstraction } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import { InternalFolderService as InternalFolderServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { SyncNotifierService as SyncNotifierServiceAbstraction } from "@bitwarden/common/vault/abstractions/sync/sync-notifier.service.abstraction";
import { SyncService as SyncServiceAbstraction } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { TotpService as TotpServiceAbstraction } from "@bitwarden/common/vault/abstractions/totp.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { VaultExportServiceAbstraction } from "@bitwarden/exporter/vault-export";
import { ImportApiServiceAbstraction, ImportServiceAbstraction } from "@bitwarden/importer/core";

import ContextMenusBackground from "../../autofill/background/context-menus.background";
import NotificationBackground from "../../autofill/background/notification.background";
import OverlayBackground from "../../autofill/background/overlay.background";
import TabsBackground from "../../autofill/background/tabs.background";
import WebRequestBackground from "../../autofill/background/web-request.background";
import { CipherContextMenuHandler } from "../../autofill/browser/cipher-context-menu-handler";
import { MainContextMenuHandler } from "../../autofill/browser/main-context-menu-handler";
import { AutofillService as AutofillServiceAbstraction } from "../../autofill/services/abstractions/autofill.service";
import CommandsBackground from "../../background/commands.background";
import IdleBackground from "../../background/idle.background";
import { NativeMessagingBackground } from "../../background/nativeMessaging.background";
import RuntimeBackground from "../../background/runtime.background";
import VaultTimeoutService from "../../services/vault-timeout/vault-timeout.service";
import FilelessImporterBackground from "../../tools/background/fileless-importer.background";
import { Fido2Service as Fido2ServiceAbstraction } from "../../vault/services/abstractions/fido2.service";
import { VaultFilterService } from "../../vault/services/vault-filter.service";
import { BrowserStateService as StateServiceAbstraction } from "../services/abstractions/browser-state.service";
import { BrowserConfigService } from "../services/browser-config.service";
import { BrowserEnvironmentService } from "../services/browser-environment.service";
import BrowserLocalStorageService from "../services/browser-local-storage.service";
import BrowserMessagingService from "../services/browser-messaging.service";
import { LocalBackedSessionStorageService } from "../services/local-backed-session-storage.service";

import DependencyContainer from "./dependency-container/dependency-container";
import { DependencyConstructor } from "./dependency-container/dependency-container.abstractions";
import {
  browserMessagingServiceFactory,
  consoleLogServiceFactory,
  defaultGlobalStateProviderFactory,
  encryptServiceImplementationFactory,
  localBackedSessionStorageServiceFactory,
  multithreadEncryptServiceImplementationFactory,
  webCryptoFunctionServiceFactory,
} from "./dependency-container/dependency-factories";

class ManifestV3Background {
  // Dependencies
  messagingService: MessagingServiceAbstraction;
  storageService: AbstractStorageService;
  secureStorageService: AbstractStorageService;
  memoryStorageService: AbstractMemoryStorageService;
  i18nService: I18nServiceAbstraction;
  platformUtilsService: PlatformUtilsServiceAbstraction;
  logService: LogServiceAbstraction;
  cryptoService: CryptoServiceAbstraction;
  cryptoFunctionService: CryptoFunctionServiceAbstraction;
  tokenService: TokenServiceAbstraction;
  appIdService: AppIdServiceAbstraction;
  apiService: ApiServiceAbstraction;
  environmentService: BrowserEnvironmentService;
  settingsService: SettingsServiceAbstraction;
  cipherService: CipherServiceAbstraction;
  folderService: InternalFolderServiceAbstraction;
  collectionService: CollectionServiceAbstraction;
  vaultTimeoutService: VaultTimeoutService;
  vaultTimeoutSettingsService: VaultTimeoutSettingsServiceAbstraction;
  syncService: SyncServiceAbstraction;
  passwordGenerationService: PasswordGenerationServiceAbstraction;
  passwordStrengthService: PasswordStrengthServiceAbstraction;
  totpService: TotpServiceAbstraction;
  autofillService: AutofillServiceAbstraction;
  containerService: ContainerService;
  auditService: AuditServiceAbstraction;
  authService: AuthServiceAbstraction;
  importApiService: ImportApiServiceAbstraction;
  importService: ImportServiceAbstraction;
  exportService: VaultExportServiceAbstraction;
  searchService: SearchServiceAbstraction;
  notificationsService: NotificationsServiceAbstraction;
  stateService: StateServiceAbstraction;
  systemService: SystemServiceAbstraction;
  eventCollectionService: EventCollectionServiceAbstraction;
  eventUploadService: EventUploadServiceAbstraction;
  policyService: InternalPolicyServiceAbstraction;
  sendService: InternalSendServiceAbstraction;
  fileUploadService: FileUploadServiceAbstraction;
  cipherFileUploadService: CipherFileUploadServiceAbstraction;
  organizationService: InternalOrganizationServiceAbstraction;
  providerService: ProviderServiceAbstraction;
  keyConnectorService: KeyConnectorServiceAbstraction;
  userVerificationService: UserVerificationServiceAbstraction;
  twoFactorService: TwoFactorServiceAbstraction;
  vaultFilterService: VaultFilterService;
  usernameGenerationService: UsernameGenerationServiceAbstraction;
  encryptService: EncryptService;
  folderApiService: FolderApiServiceAbstraction;
  policyApiService: PolicyApiServiceAbstraction;
  sendApiService: SendApiServiceAbstraction;
  userVerificationApiService: UserVerificationApiServiceAbstraction;
  syncNotifierService: SyncNotifierServiceAbstraction;
  fido2UserInterfaceService: Fido2UserInterfaceServiceAbstraction;
  fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction;
  fido2ClientService: Fido2ClientServiceAbstraction;
  avatarUpdateService: AvatarUpdateServiceAbstraction;
  mainContextMenuHandler: MainContextMenuHandler;
  cipherContextMenuHandler: CipherContextMenuHandler;
  configService: BrowserConfigService;
  configApiService: ConfigApiServiceAbstraction;
  devicesApiService: DevicesApiServiceAbstraction;
  devicesService: DevicesServiceAbstraction;
  deviceTrustCryptoService: DeviceTrustCryptoServiceAbstraction;
  authRequestCryptoService: AuthRequestCryptoServiceAbstraction;
  accountService: AccountServiceAbstraction;
  globalStateProvider: GlobalStateProvider;
  singleUserStateProvider: SingleUserStateProvider;
  activeUserStateProvider: ActiveUserStateProvider;
  stateProvider: StateProvider;
  fido2Service: Fido2ServiceAbstraction;
  private commandsBackground: CommandsBackground;
  private contextMenusBackground: ContextMenusBackground;
  private idleBackground: IdleBackground;
  private notificationBackground: NotificationBackground;
  private overlayBackground: OverlayBackground;
  private filelessImporterBackground: FilelessImporterBackground;
  private runtimeBackground: RuntimeBackground;
  private tabsBackground: TabsBackground;
  private webRequestBackground: WebRequestBackground;
  private nativeMessagingBackground: NativeMessagingBackground;

  // Properties
  // backgroundWindow = globalThis; // TODO: CG - Service workers don't have access to window. This should be removed and we should rework how safari's popup handles theming.
  onUpdatedRan: boolean;
  onReplacedRan: boolean;
  loginToAutoFill: CipherView = null;
  popupOnlyContext: boolean;
  private syncTimeout: any;
  private isSafari: boolean;

  constructor() {}

  init() {
    this._initDependencies();
    this._registerLazyLoadedDependencies();
    this._setupListeners();
  }

  private _initDependencies() {
    this.storageService = new BrowserLocalStorageService();
    this.secureStorageService = new BrowserLocalStorageService();
  }

  private _registerLazyLoadedDependencies() {
    const dependencies = new Map<DependencyConstructor<any>, () => any>([
      [BrowserMessagingService, () => browserMessagingServiceFactory],
      [ConsoleLogService, () => consoleLogServiceFactory(false)],
      [WebCryptoFunctionService, () => webCryptoFunctionServiceFactory],
      [LocalBackedSessionStorageService, () => localBackedSessionStorageServiceFactory],
      [DefaultGlobalStateProvider, () => defaultGlobalStateProviderFactory(this.storageService)],
      [
        MultithreadEncryptServiceImplementation,
        () => multithreadEncryptServiceImplementationFactory,
      ],
      [EncryptServiceImplementation, () => encryptServiceImplementationFactory],
    ]);

    for (const [dependency, factory] of dependencies) {
      DependencyContainer.register(dependency, factory());
    }
  }

  private _setupListeners() {}
}

export default ManifestV3Background;
