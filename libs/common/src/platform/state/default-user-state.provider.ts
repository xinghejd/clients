import { AccountService } from "../../auth/abstractions/account.service";
import { EncryptService } from "../abstractions/encrypt.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "../abstractions/storage.service";
import { UserStateProvider } from "../abstractions/user-state.provider";
import { DefaultUserState } from "../state/default-user-state";
import { KeyDefinition } from "../state/key-definition";

export class DefaultUserStateProvider implements UserStateProvider {
  private userStateCache: Record<string, DefaultUserState<unknown>> = {};

  constructor(
    private accountService: AccountService, // Inject the lightest weight service that provides accountUserId$
    private encryptService: EncryptService,
    private memoryStorage: AbstractMemoryStorageService,
    private diskStorage: AbstractStorageService,
    private secureStorage: AbstractStorageService
  ) {}

  create<T>(keyDefinition: KeyDefinition<T>): DefaultUserState<T> {
    const locationDomainKey = `${keyDefinition.stateDefinition.storageLocation}_${keyDefinition.stateDefinition.name}_${keyDefinition.key}`;
    const existingUserState = this.userStateCache[locationDomainKey];
    if (existingUserState != null) {
      // I have to cast out of the unknown generic but this should be safe if rules
      // around domain token are made
      return existingUserState as DefaultUserState<T>;
    }

    const newUserState = new DefaultUserState<T>(
      keyDefinition,
      this.accountService,
      this.encryptService,
      this.memoryStorage,
      this.secureStorage,
      this.diskStorage
    );
    this.userStateCache[locationDomainKey] = newUserState;
    return newUserState;
  }
}
