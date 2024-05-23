import { Jsonify } from "type-fest";

import { CipherRepromptType, CipherType } from "../../../../enums";
import { CipherResponseV2 } from "../../response/v2/cipher.response";

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
}
