import { Jsonify } from "type-fest";

import { SymmetricCryptoKey } from "../../../../../platform/models/domain/symmetric-crypto-key";
import { CipherRepromptType, CipherType } from "../../../../enums";
import { CipherResponseV2 } from "../../response/v2/cipher.response";
import { CipherDataV1 } from "../v1/cipher.data";

import { AttachmentData } from "./attachment.data";
import { CardDataV2 } from "./card.data";
import { FieldDataV2 } from "./field.data";
import { IdentityDataV2 } from "./identity.data";
import { LoginDataV2 } from "./login.data";
import { PasswordHistoryDataV2 } from "./password-history.data";
import { SecureNoteDataV2 } from "./secure-note.data";

export class CipherDataV2 {
  version: 2;
  id: string;
  organizationId: string;
  folderId: string;
  edit: boolean;
  viewPassword: boolean;
  organizationUseTotp: boolean;
  favorite: boolean;
  revisionDate: string;
  // TODO: Enums should probably also be versioned
  type: CipherType;
  name: string;
  notes: string;
  login?: LoginDataV2;
  secureNote?: SecureNoteDataV2;
  card?: CardDataV2;
  identity?: IdentityDataV2;
  fields?: FieldDataV2[];
  attachments?: AttachmentData[];
  passwordHistory?: PasswordHistoryDataV2[];
  collectionIds?: string[];
  creationDate: string;
  deletedDate: string;
  reprompt: CipherRepromptType;
  key: string;

  constructor(response?: CipherResponseV2, collectionIds?: string[]) {
    if (response == null) {
      return;
    }

    this.id = response.id;
    this.organizationId = response.organizationId;
    this.folderId = response.folderId;
    this.edit = response.edit;
    this.viewPassword = response.viewPassword;
    this.organizationUseTotp = response.organizationUseTotp;
    this.favorite = response.favorite;
    this.revisionDate = response.revisionDate;
    this.type = response.type;
    this.name = response.name;
    this.notes = response.notes;
    this.collectionIds = collectionIds != null ? collectionIds : response.collectionIds;
    this.creationDate = response.creationDate;
    this.deletedDate = response.deletedDate;
    this.reprompt = response.reprompt;
    this.key = response.key;

    switch (this.type) {
      case CipherType.Login:
        this.login = new LoginDataV2(response.login);
        break;
      case CipherType.SecureNote:
        this.secureNote = new SecureNoteDataV2(response.secureNote);
        break;
      case CipherType.Card:
        this.card = new CardDataV2(response.card);
        break;
      case CipherType.Identity:
        this.identity = new IdentityDataV2(response.identity);
        break;
      default:
        break;
    }

    if (response.fields != null) {
      this.fields = response.fields.map((f) => new FieldDataV2(f));
    }
    if (response.attachments != null) {
      this.attachments = response.attachments.map((a) => new AttachmentData(a));
    }
    if (response.passwordHistory != null) {
      this.passwordHistory = response.passwordHistory.map((ph) => new PasswordHistoryDataV2(ph));
    }
  }

  static fromJSON(obj: Jsonify<CipherDataV2>) {
    return Object.assign(new CipherDataV2(), obj);
  }

  static async migrate(old: CipherDataV1, key: SymmetricCryptoKey): Promise<CipherDataV2> {
    const migrated = new CipherDataV2();

    migrated.id = old.id;
    migrated.organizationId = old.organizationId;
    migrated.folderId = old.folderId;
    migrated.edit = old.edit;
    migrated.viewPassword = old.viewPassword;
    migrated.organizationUseTotp = old.organizationUseTotp;
    migrated.favorite = old.favorite;
    migrated.revisionDate = old.revisionDate;
    migrated.type = old.type;
    migrated.name = old.name;
    migrated.notes = old.notes;
    migrated.collectionIds = old.collectionIds;
    migrated.creationDate = old.creationDate;
    migrated.deletedDate = old.deletedDate;
    migrated.reprompt = old.reprompt;
    migrated.key = old.key;

    switch (migrated.type) {
      case CipherType.Login:
        migrated.login = await LoginDataV2.migrate(old.login, migrated.organizationId, key);
        break;
      case CipherType.SecureNote:
        migrated.secureNote = SecureNoteDataV2.migrate(old.secureNote);
        break;
      case CipherType.Card:
        migrated.card = CardDataV2.migrate(old.card);
        break;
      case CipherType.Identity:
        migrated.identity = IdentityDataV2.migrate(old.identity);
        break;
      default:
        break;
    }

    return migrated;
  }
}
