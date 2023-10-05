import { EncryptService } from "../abstractions/encrypt.service";
import { UserKey } from "../models/domain/symmetric-crypto-key";

import { StorageLocation } from "./state-definition";

// TODO: Move type
export class DeriveContext {
  constructor(readonly activeUserKey: UserKey, readonly encryptService: EncryptService) {}
}

export class DerivedStateDefinition<TFrom, TTo> {
  constructor(
    readonly location: StorageLocation,
    readonly converter: (data: TFrom, context: DeriveContext) => Promise<TTo>
  ) {}
}
