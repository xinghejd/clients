import {
  AuthRequestService,
  AuthRequestServiceAbstraction,
  InternalUserDecryptionOptionsServiceAbstraction,
  LoginStrategyService,
  LoginStrategyServiceAbstraction,
  PinCryptoService,
  PinCryptoServiceAbstraction,
  UserDecryptionOptionsService,
} from "@bitwarden/auth/common";
import { ApiService as ApiServiceAbstraction } from "@bitwarden/common/abstractions/api.service";
import { NotificationsService as NotificationsServiceAbstraction } from "@bitwarden/common/abstractions/notifications.service";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/abstractions/search.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { InternalOrganizationServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { InternalPolicyService as InternalPolicyServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ProviderService as ProviderServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { OrganizationService } from "@bitwarden/common/admin-console/services/organization/organization.service";
import { PolicyService } from "@bitwarden/common/admin-console/services/policy/policy.service";
import { ProviderService } from "@bitwarden/common/admin-console/services/provider.service";
import { AccountService as AccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { AvatarService as AvatarServiceAbstraction } from "@bitwarden/common/auth/abstractions/avatar.service";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { TokenService as TokenServiceAbstraction } from "@bitwarden/common/auth/abstractions/token.service";
import { TwoFactorService as TwoFactorServiceAbstraction } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { UserVerificationApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification-api.service.abstraction";
import { UserVerificationService as UserVerificationServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AccountServiceImplementation } from "@bitwarden/common/auth/services/account.service";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { AvatarService } from "@bitwarden/common/auth/services/avatar.service";
import { DeviceTrustCryptoService } from "@bitwarden/common/auth/services/device-trust-crypto.service.implementation";
import { DevicesServiceImplementation } from "@bitwarden/common/auth/services/devices/devices.service.implementation";
import { DevicesApiServiceImplementation } from "@bitwarden/common/auth/services/devices-api.service.implementation";
import { KeyConnectorService } from "@bitwarden/common/auth/services/key-connector.service";
import { MasterPasswordService } from "@bitwarden/common/auth/services/master-password/master-password.service";
import { SsoLoginService } from "@bitwarden/common/auth/services/sso-login.service";
import { TokenService } from "@bitwarden/common/auth/services/token.service";
import { TwoFactorService } from "@bitwarden/common/auth/services/two-factor.service";
import { UserVerificationApiService } from "@bitwarden/common/auth/services/user-verification/user-verification-api.service";
import { UserVerificationService } from "@bitwarden/common/auth/services/user-verification/user-verification.service";
import {
  AutofillSettingsService,
  AutofillSettingsServiceAbstraction,
} from "@bitwarden/common/autofill/services/autofill-settings.service";
import {
  DefaultDomainSettingsService,
  DomainSettingsService,
} from "@bitwarden/common/autofill/services/domain-settings.service";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { DefaultBillingAccountProfileStateService } from "@bitwarden/common/billing/services/account/billing-account-profile-state.service";
import { AppIdService as AppIdServiceAbstraction } from "@bitwarden/common/platform/abstractions/app-id.service";
import { ConfigApiServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config-api.service.abstraction";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService as CryptoServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { FileUploadService as FileUploadServiceAbstraction } from "@bitwarden/common/platform/abstractions/file-upload/file-upload.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { KeyGenerationService as KeyGenerationServiceAbstraction } from "@bitwarden/common/platform/abstractions/key-generation.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService as MessagingServiceAbstraction } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
  ObservableStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import {
  BiometricStateService,
  DefaultBiometricStateService,
} from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { StateFactory } from "@bitwarden/common/platform/factories/state-factory";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { AppIdService } from "@bitwarden/common/platform/services/app-id.service";
import { ConfigApiService } from "@bitwarden/common/platform/services/config/config-api.service";
import { DefaultConfigService } from "@bitwarden/common/platform/services/config/default-config.service";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { MultithreadEncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/multithread-encrypt.service.implementation";
import { FileUploadService } from "@bitwarden/common/platform/services/file-upload/file-upload.service";
import { KeyGenerationService } from "@bitwarden/common/platform/services/key-generation.service";
import { MemoryStorageService } from "@bitwarden/common/platform/services/memory-storage.service";
import { MigrationBuilderService } from "@bitwarden/common/platform/services/migration-builder.service";
import { MigrationRunner } from "@bitwarden/common/platform/services/migration-runner";
import { StorageServiceProvider } from "@bitwarden/common/platform/services/storage-service.provider";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";
import {
  ActiveUserStateProvider,
  DerivedStateProvider,
  GlobalStateProvider,
  SingleUserStateProvider,
  StateEventRunnerService,
  StateProvider,
} from "@bitwarden/common/platform/state";
/* eslint-disable import/no-restricted-paths -- We need the implementation to inject, but generally these should not be accessed */
import { DefaultActiveUserStateProvider } from "@bitwarden/common/platform/state/implementations/default-active-user-state.provider";
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";
import { DefaultSingleUserStateProvider } from "@bitwarden/common/platform/state/implementations/default-single-user-state.provider";
import { DefaultStateProvider } from "@bitwarden/common/platform/state/implementations/default-state.provider";
import { StateEventRegistrarService } from "@bitwarden/common/platform/state/state-event-registrar.service";
/* eslint-enable import/no-restricted-paths */
import { ApiService } from "@bitwarden/common/services/api.service";
import { NotificationsService } from "@bitwarden/common/services/notifications.service";
import { SearchService } from "@bitwarden/common/services/search.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/services/vault-timeout/vault-timeout-settings.service";
import {
  PasswordGenerationService,
  PasswordGenerationServiceAbstraction,
} from "@bitwarden/common/tools/generator";
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
import { SendStateProvider } from "@bitwarden/common/tools/send/services/send-state.provider";
import { SendService } from "@bitwarden/common/tools/send/services/send.service";
import { InternalSendService as InternalSendServiceAbstraction } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService as CollectionServiceAbstraction } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherFileUploadService as CipherFileUploadServiceAbstraction } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import { InternalFolderService as InternalFolderServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { SyncService as SyncServiceAbstraction } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/services/collection.service";
import { CipherFileUploadService } from "@bitwarden/common/vault/services/file-upload/cipher-file-upload.service";
import { FolderApiService } from "@bitwarden/common/vault/services/folder/folder-api.service";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";
import { SyncService } from "@bitwarden/common/vault/services/sync/sync.service";
import {
  IndividualVaultExportService,
  IndividualVaultExportServiceAbstraction,
  OrganizationVaultExportService,
  OrganizationVaultExportServiceAbstraction,
} from "@bitwarden/vault-export-core";

import { Account } from "../models/account";
import { BrowserApi } from "../platform/browser/browser-api";
import { flagEnabled } from "../platform/flags";
import { BrowserStateService as StateServiceAbstraction } from "../platform/services/abstractions/browser-state.service";
import { BrowserCryptoService } from "../platform/services/browser-crypto.service";
import { BrowserEnvironmentService } from "../platform/services/browser-environment.service";
import BrowserLocalStorageService from "../platform/services/browser-local-storage.service";
import BrowserMemoryStorageService from "../platform/services/browser-memory-storage.service";
import BrowserMessagingPrivateModeBackgroundService from "../platform/services/browser-messaging-private-mode-background.service";
import BrowserMessagingService from "../platform/services/browser-messaging.service";
import { DefaultBrowserStateService } from "../platform/services/default-browser-state.service";
import I18nService from "../platform/services/i18n.service";
import { LocalBackedSessionStorageService } from "../platform/services/local-backed-session-storage.service";
import { BackgroundPlatformUtilsService } from "../platform/services/platform-utils/background-platform-utils.service";
import { BackgroundDerivedStateProvider } from "../platform/state/background-derived-state.provider";
import { BackgroundMemoryStorageService } from "../platform/storage/background-memory-storage.service";
import VaultTimeoutService from "../services/vault-timeout/vault-timeout.service";

export class SharedBgServicesContainer {
  private static _instance: SharedBgServicesContainer;

  // vault popup getBgServices dependencies
  readonly twoFactorService: TwoFactorServiceAbstraction;
  readonly authService: AuthServiceAbstraction;
  readonly loginStrategyService: LoginStrategyServiceAbstraction;
  readonly ssoLoginService: SsoLoginServiceAbstraction;
  readonly cipherService: CipherServiceAbstraction;
  readonly collectionService: CollectionServiceAbstraction;
  readonly cryptoService: CryptoServiceAbstraction;
  readonly authRequestService: AuthRequestServiceAbstraction;
  readonly deviceTrustCryptoService: DeviceTrustCryptoServiceAbstraction;
  readonly devicesService: DevicesServiceAbstraction;
  readonly passwordGenerationService: PasswordGenerationServiceAbstraction;
  readonly syncService: SyncServiceAbstraction;
  readonly keyConnectorService: KeyConnectorServiceAbstraction;
  readonly userVerificationService: UserVerificationServiceAbstraction;
  readonly vaultTimeoutSettingsService: VaultTimeoutSettingsServiceAbstraction;
  readonly vaultTimeoutService: VaultTimeoutService;
  readonly notificationsService: NotificationsServiceAbstraction;
  readonly memoryStorageService: AbstractMemoryStorageService;
  readonly memoryStorageForStateProviders: AbstractMemoryStorageService & ObservableStorageService;
  readonly usernameGenerationService: UsernameGenerationServiceAbstraction;

  // Required dependencies for getBgServices
  readonly cipherFileUploadService: CipherFileUploadServiceAbstraction;
  readonly searchService: SearchServiceAbstraction;
  readonly messagingService: MessagingServiceAbstraction;
  readonly logService: LogServiceAbstraction;
  readonly cryptoFunctionService: CryptoFunctionServiceAbstraction;
  readonly keyGenerationService: KeyGenerationServiceAbstraction;
  readonly storageService: AbstractStorageService & ObservableStorageService;
  readonly storageServiceProvider: StorageServiceProvider;
  readonly globalStateProvider: GlobalStateProvider;
  readonly i18nService: I18nServiceAbstraction;
  readonly platformUtilsService: PlatformUtilsServiceAbstraction;
  readonly accountService: AccountServiceAbstraction;
  readonly backgroundMessagingService: MessagingServiceAbstraction;
  readonly encryptService: EncryptService;
  readonly stateService: StateServiceAbstraction;
  readonly migrationRunner: MigrationRunner;
  readonly secureStorageService: AbstractStorageService;
  readonly environmentService: BrowserEnvironmentService;
  readonly stateProvider: StateProvider;
  readonly stateEventRegistrarService: StateEventRegistrarService;
  readonly singleUserStateProvider: SingleUserStateProvider;
  readonly activeUserStateProvider: ActiveUserStateProvider;
  readonly derivedStateProvider: DerivedStateProvider;
  readonly tokenService: TokenServiceAbstraction;
  readonly biometricStateService: BiometricStateService;
  readonly appIdService: AppIdServiceAbstraction;
  readonly apiService: ApiServiceAbstraction;
  readonly passwordStrengthService: PasswordStrengthServiceAbstraction;
  readonly policyService: InternalPolicyServiceAbstraction;
  readonly organizationService: InternalOrganizationServiceAbstraction;
  readonly userDecryptionOptionsService: InternalUserDecryptionOptionsServiceAbstraction;
  readonly billingAccountProfileStateService: BillingAccountProfileStateService;
  readonly fileUploadService: FileUploadServiceAbstraction;
  readonly domainSettingsService: DomainSettingsService;
  readonly autofillSettingsService: AutofillSettingsServiceAbstraction;
  readonly configApiService: ConfigApiServiceAbstraction;
  readonly configService: ConfigService;
  readonly devicesApiService: DevicesApiServiceAbstraction;
  readonly folderService: InternalFolderServiceAbstraction;
  readonly sendStateProvider: SendStateProvider;
  readonly sendService: InternalSendServiceAbstraction;
  readonly providerService: ProviderServiceAbstraction;
  readonly folderApiService: FolderApiServiceAbstraction;
  readonly sendApiService: SendApiServiceAbstraction;
  readonly avatarService: AvatarServiceAbstraction;
  readonly individualVaultExportService: IndividualVaultExportServiceAbstraction;
  readonly organizationVaultExportService: OrganizationVaultExportServiceAbstraction;
  readonly userVerificationApiService: UserVerificationApiServiceAbstraction;
  readonly pinCryptoService: PinCryptoServiceAbstraction;
  readonly stateEventRunnerService: StateEventRunnerService;
  readonly masterPasswordService: MasterPasswordService;

  constructor(
    public inPopupContext: boolean,
    private platformUtilsClipboardWriteCallback: (clipboardValue: string, clearMs: number) => void,
    private platformUtilsBiometricCallback: () => Promise<boolean>,
    private logoutCallback: (expired: boolean, userId?: UserId) => Promise<void>,
    private lockedCallback: () => Promise<void>,
    private selfReferentialBackgroundMessagingService?: MessagingServiceAbstraction,
  ) {
    if (SharedBgServicesContainer._instance) {
      throw new Error(
        "SharedBgServicesContainer is a singleton and should only be instantiated once within a given context.",
      );
    }
    SharedBgServicesContainer._instance = this;

    this.messagingService = this.inPopupContext
      ? new BrowserMessagingPrivateModeBackgroundService()
      : new BrowserMessagingService();
    this.logService = new ConsoleLogService(false);
    this.cryptoFunctionService = new WebCryptoFunctionService(self);
    this.keyGenerationService = new KeyGenerationService(this.cryptoFunctionService);
    this.storageService = new BrowserLocalStorageService();
    this.secureStorageService = this.storageService; // secure storage is not supported in browsers, so we use local storage and warn users when it is used
    this.memoryStorageForStateProviders = this.getMemoryStorageForStateProviders();
    this.storageServiceProvider = new StorageServiceProvider(
      this.storageService,
      this.memoryStorageForStateProviders,
    );
    this.globalStateProvider = new DefaultGlobalStateProvider(this.storageServiceProvider);
    this.accountService = new AccountServiceImplementation(
      this.messagingService,
      this.logService,
      this.globalStateProvider,
    );
    this.stateEventRegistrarService = new StateEventRegistrarService(
      this.globalStateProvider,
      this.storageServiceProvider,
    );
    this.singleUserStateProvider = new DefaultSingleUserStateProvider(
      this.storageServiceProvider,
      this.stateEventRegistrarService,
    );
    this.activeUserStateProvider = new DefaultActiveUserStateProvider(
      this.accountService,
      this.singleUserStateProvider,
    );
    this.derivedStateProvider = new BackgroundDerivedStateProvider(
      this.memoryStorageForStateProviders,
    );
    this.stateProvider = new DefaultStateProvider(
      this.activeUserStateProvider,
      this.singleUserStateProvider,
      this.globalStateProvider,
      this.derivedStateProvider,
    );
    this.i18nService = new I18nService(BrowserApi.getUILanguage(), this.globalStateProvider);
    this.platformUtilsService = new BackgroundPlatformUtilsService(
      this.messagingService,
      this.platformUtilsClipboardWriteCallback,
      this.platformUtilsBiometricCallback,
      self,
    );
    this.twoFactorService = new TwoFactorService(this.i18nService, this.platformUtilsService);
    this.memoryStorageService = this.getMemoryStorageService();
    this.backgroundMessagingService =
      this.selfReferentialBackgroundMessagingService || this.getBackgroundMessagingService();
    this.encryptService = this.getEncryptService();
    this.migrationRunner = new MigrationRunner(
      this.storageService,
      this.logService,
      new MigrationBuilderService(),
    );
    this.environmentService = new BrowserEnvironmentService(
      this.logService,
      this.stateProvider,
      this.accountService,
    );
    this.tokenService = new TokenService(
      this.singleUserStateProvider,
      this.globalStateProvider,
      this.platformUtilsService.supportsSecureStorage(),
      this.secureStorageService,
      this.keyGenerationService,
      this.encryptService,
      this.logService,
    );
    this.stateService = new DefaultBrowserStateService(
      this.storageService,
      this.secureStorageService,
      this.memoryStorageService,
      this.logService,
      new StateFactory(GlobalState, Account),
      this.accountService,
      this.environmentService,
      this.tokenService,
      this.migrationRunner,
    );
    this.biometricStateService = new DefaultBiometricStateService(this.stateProvider);
    this.masterPasswordService = new MasterPasswordService(this.stateProvider);
    this.cryptoService = new BrowserCryptoService(
      this.masterPasswordService,
      this.keyGenerationService,
      this.cryptoFunctionService,
      this.encryptService,
      this.platformUtilsService,
      this.logService,
      this.stateService,
      this.accountService,
      this.stateProvider,
      this.biometricStateService,
    );
    this.appIdService = new AppIdService(this.globalStateProvider);
    this.apiService = new ApiService(
      this.tokenService,
      this.platformUtilsService,
      this.environmentService,
      this.appIdService,
      this.stateService,
      this.logoutCallback,
    );
    this.authService = new AuthService(
      this.accountService,
      this.backgroundMessagingService,
      this.cryptoService,
      this.apiService,
      this.stateService,
      this.tokenService,
    );
    this.passwordStrengthService = new PasswordStrengthService();
    this.organizationService = new OrganizationService(this.stateProvider);
    this.policyService = new PolicyService(this.stateProvider, this.organizationService);
    this.userDecryptionOptionsService = new UserDecryptionOptionsService(this.stateProvider);
    this.billingAccountProfileStateService = new DefaultBillingAccountProfileStateService(
      this.stateProvider,
    );
    this.ssoLoginService = new SsoLoginService(this.stateProvider);
    this.searchService = new SearchService(this.logService, this.i18nService, this.stateProvider);
    this.fileUploadService = new FileUploadService(this.logService);
    this.cipherFileUploadService = new CipherFileUploadService(
      this.apiService,
      this.fileUploadService,
    );
    this.domainSettingsService = new DefaultDomainSettingsService(this.stateProvider);
    this.autofillSettingsService = new AutofillSettingsService(
      this.stateProvider,
      this.policyService,
    );
    this.configApiService = new ConfigApiService(this.apiService, this.tokenService);
    this.configService = new DefaultConfigService(
      this.configApiService,
      this.environmentService,
      this.logService,
      this.stateProvider,
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
    );
    this.collectionService = new CollectionService(
      this.cryptoService,
      this.i18nService,
      this.stateProvider,
    );
    this.cryptoService = new BrowserCryptoService(
      this.masterPasswordService,
      this.keyGenerationService,
      this.cryptoFunctionService,
      this.encryptService,
      this.platformUtilsService,
      this.logService,
      this.stateService,
      this.accountService,
      this.stateProvider,
      this.biometricStateService,
    );
    this.authRequestService = new AuthRequestService(
      this.appIdService,
      this.accountService,
      this.masterPasswordService,
      this.cryptoService,
      this.apiService,
      this.stateProvider,
    );
    this.devicesApiService = new DevicesApiServiceImplementation(this.apiService);
    this.deviceTrustCryptoService = new DeviceTrustCryptoService(
      this.keyGenerationService,
      this.cryptoFunctionService,
      this.cryptoService,
      this.encryptService,
      this.appIdService,
      this.devicesApiService,
      this.i18nService,
      this.platformUtilsService,
      this.stateProvider,
      this.secureStorageService,
      this.userDecryptionOptionsService,
    );
    this.devicesService = new DevicesServiceImplementation(this.devicesApiService);
    this.passwordGenerationService = new PasswordGenerationService(
      this.cryptoService,
      this.policyService,
      this.stateService,
    );
    this.folderService = new FolderService(
      this.cryptoService,
      this.i18nService,
      this.cipherService,
      this.stateService,
      this.stateProvider,
    );
    this.folderApiService = new FolderApiService(this.folderService, this.apiService);
    this.sendStateProvider = new SendStateProvider(this.stateProvider);
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
    this.avatarService = new AvatarService(this.apiService, this.stateProvider);
    this.providerService = new ProviderService(this.stateProvider);
    this.individualVaultExportService = new IndividualVaultExportService(
      this.folderService,
      this.cipherService,
      this.cryptoService,
      this.cryptoFunctionService,
      this.stateService,
    );
    this.organizationVaultExportService = new OrganizationVaultExportService(
      this.cipherService,
      this.apiService,
      this.cryptoService,
      this.cryptoFunctionService,
      this.stateService,
      this.collectionService,
    );
    this.keyConnectorService = new KeyConnectorService(
      this.accountService,
      this.masterPasswordService,
      this.cryptoService,
      this.apiService,
      this.tokenService,
      this.logService,
      this.organizationService,
      this.keyGenerationService,
      this.logoutCallback,
      this.stateProvider,
    );
    this.syncService = new SyncService(
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
      this.logService,
      this.keyConnectorService,
      this.stateService,
      this.providerService,
      this.folderApiService,
      this.organizationService,
      this.sendApiService,
      this.userDecryptionOptionsService,
      this.avatarService,
      this.logoutCallback,
      this.billingAccountProfileStateService,
    );
    this.loginStrategyService = new LoginStrategyService(
      this.accountService,
      this.masterPasswordService,
      this.cryptoService,
      this.apiService,
      this.tokenService,
      this.appIdService,
      this.platformUtilsService,
      this.backgroundMessagingService,
      this.logService,
      this.keyConnectorService,
      this.environmentService,
      this.stateService,
      this.twoFactorService,
      this.i18nService,
      this.encryptService,
      this.passwordStrengthService,
      this.policyService,
      this.deviceTrustCryptoService,
      this.authRequestService,
      this.userDecryptionOptionsService,
      this.globalStateProvider,
      this.billingAccountProfileStateService,
    );
    this.userVerificationApiService = new UserVerificationApiService(this.apiService);
    this.vaultTimeoutSettingsService = new VaultTimeoutSettingsService(
      this.userDecryptionOptionsService,
      this.cryptoService,
      this.tokenService,
      this.policyService,
      this.stateService,
      this.biometricStateService,
    );
    this.pinCryptoService = new PinCryptoService(
      this.stateService,
      this.cryptoService,
      this.vaultTimeoutSettingsService,
      this.logService,
    );
    this.userVerificationService = new UserVerificationService(
      this.stateService,
      this.cryptoService,
      this.accountService,
      this.masterPasswordService,
      this.i18nService,
      this.userVerificationApiService,
      this.userDecryptionOptionsService,
      this.pinCryptoService,
      this.logService,
      this.vaultTimeoutSettingsService,
      this.platformUtilsService,
    );
    this.stateEventRunnerService = new StateEventRunnerService(
      this.globalStateProvider,
      this.storageServiceProvider,
    );
    this.vaultTimeoutService = new VaultTimeoutService(
      this.accountService,
      this.masterPasswordService,
      this.cipherService,
      this.folderService,
      this.collectionService,
      this.cryptoService,
      this.platformUtilsService,
      this.messagingService,
      this.searchService,
      this.stateService,
      this.authService,
      this.vaultTimeoutSettingsService,
      this.stateEventRunnerService,
      this.lockedCallback,
      this.logoutCallback,
    );
    this.notificationsService = new NotificationsService(
      this.logService,
      this.syncService,
      this.appIdService,
      this.apiService,
      this.environmentService,
      this.logoutCallback,
      this.stateService,
      this.authService,
      this.authRequestService,
      this.messagingService,
    );
    this.usernameGenerationService = new UsernameGenerationService(
      this.cryptoService,
      this.stateService,
      this.apiService,
    );
  }

  async bootstrapBaseServices() {
    await this.stateService.init({ runMigrations: false });
    await (this.i18nService as I18nService).init();
    this.twoFactorService.init();
  }

  private mv3MemoryStorageCreator = (partitionName: string) => {
    return new LocalBackedSessionStorageService(
      this.getEncryptService(),
      this.keyGenerationService,
      new BrowserLocalStorageService(),
      new BrowserMemoryStorageService(),
      partitionName,
    );
  };

  private getMemoryStorageService(): AbstractMemoryStorageService {
    return BrowserApi.isManifestVersion(3)
      ? this.mv3MemoryStorageCreator("stateService")
      : new MemoryStorageService();
  }

  private getMemoryStorageForStateProviders(): AbstractMemoryStorageService &
    ObservableStorageService {
    return BrowserApi.isManifestVersion(3)
      ? this.mv3MemoryStorageCreator("stateProviders")
      : new BackgroundMemoryStorageService();
  }

  private getBackgroundMessagingService = (): MessagingServiceAbstraction => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    return new (class extends MessagingServiceAbstraction {
      send = (subscriber: string, arg: any = {}) => {
        void context.messagingService.send(subscriber, arg);
      };
    })();
  };

  private getEncryptService = () => {
    // eslint-disable-next-line no-restricted-globals
    return flagEnabled("multithreadDecryption") && typeof window !== "undefined"
      ? new MultithreadEncryptServiceImplementation(
          this.cryptoFunctionService,
          this.logService,
          true,
        )
      : new EncryptServiceImplementation(this.cryptoFunctionService, this.logService, true);
  };
}
