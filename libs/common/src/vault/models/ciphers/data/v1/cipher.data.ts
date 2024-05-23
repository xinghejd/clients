import { Jsonify } from "type-fest";

import { CipherRepromptType, CipherType } from "../../../../enums";
import { CipherResponseV1 } from "../../response/v1/cipher.response";

import { AttachmentData } from "./attachment.data";
import { CardDataV1 } from "./card.data";
import { FieldDataV1 } from "./field.data";
import { IdentityDataV1 } from "./identity.data";
import { LoginDataV1 } from "./login.data";
import { PasswordHistoryDataV1 } from "./password-history.data";
import { SecureNoteDataV1 } from "./secure-note.data";

export class CipherDataV1 {
  // THOUGHT: If we defined this as a string then we could create "virtual versions"
  // that are instead calculated by looking at which fields are present, e.g: `version: "1.cipher-key";`.
  // This would allow us to convert older "implicit versions" to explicit ones, and handle them
  // using the migration mechanisms, possibly simplifying the code base.
  version: 1;
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
  login?: LoginDataV1;
  secureNote?: SecureNoteDataV1;
  card?: CardDataV1;
  identity?: IdentityDataV1;
  fields?: FieldDataV1[];
  attachments?: AttachmentData[];
  passwordHistory?: PasswordHistoryDataV1[];
  collectionIds?: string[];
  creationDate: string;
  deletedDate: string;
  reprompt: CipherRepromptType;
  key: string;

  constructor(response?: CipherResponseV1, collectionIds?: string[]) {
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
        this.login = new LoginDataV1(response.login);
        break;
      case CipherType.SecureNote:
        this.secureNote = new SecureNoteDataV1(response.secureNote);
        break;
      case CipherType.Card:
        this.card = new CardDataV1(response.card);
        break;
      case CipherType.Identity:
        this.identity = new IdentityDataV1(response.identity);
        break;
      default:
        break;
    }

    if (response.fields != null) {
      this.fields = response.fields.map((f) => new FieldDataV1(f));
    }
    if (response.attachments != null) {
      this.attachments = response.attachments.map((a) => new AttachmentData(a));
    }
    if (response.passwordHistory != null) {
      this.passwordHistory = response.passwordHistory.map((ph) => new PasswordHistoryDataV1(ph));
    }
  }

  static fromJSON(obj: Jsonify<CipherDataV1>) {
    return Object.assign(new CipherDataV1(), obj);
  }
}
