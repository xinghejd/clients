import { BaseResponse } from "../../../../../models/response/base.response";
import { CipherRepromptType } from "../../../../enums/cipher-reprompt-type";
import { CardApiV1 } from "../../api/v1/card.api";
import { FieldApiV1 } from "../../api/v1/field.api";
import { IdentityApiV1 } from "../../api/v1/identity.api";
import { LoginApiV1 } from "../../api/v1/login.api";
import { SecureNoteApiV1 } from "../../api/v1/secure-note.api";

import { AttachmentResponseV1 } from "./attachment.response";
import { PasswordHistoryResponseV1 } from "./password-history.response";

export class CipherResponseV1 extends BaseResponse {
  version: 1;
  id: string;
  organizationId: string;
  folderId: string;
  type: number;
  name: string;
  notes: string;
  fields: FieldApiV1[];
  login: LoginApiV1;
  card: CardApiV1;
  identity: IdentityApiV1;
  secureNote: SecureNoteApiV1;
  favorite: boolean;
  edit: boolean;
  viewPassword: boolean;
  organizationUseTotp: boolean;
  revisionDate: string;
  attachments: AttachmentResponseV1[];
  passwordHistory: PasswordHistoryResponseV1[];
  collectionIds: string[];
  creationDate: string;
  deletedDate: string;
  reprompt: CipherRepromptType;
  key: string;

  constructor(response: any) {
    super(response);
    this.version = 1;
    this.id = this.getResponseProperty("Id");
    this.organizationId = this.getResponseProperty("OrganizationId");
    this.folderId = this.getResponseProperty("FolderId") || null;
    this.type = this.getResponseProperty("Type");
    this.name = this.getResponseProperty("Name");
    this.notes = this.getResponseProperty("Notes");
    this.favorite = this.getResponseProperty("Favorite") || false;
    this.edit = !!this.getResponseProperty("Edit");
    if (this.getResponseProperty("ViewPassword") == null) {
      this.viewPassword = true;
    } else {
      this.viewPassword = this.getResponseProperty("ViewPassword");
    }
    this.organizationUseTotp = this.getResponseProperty("OrganizationUseTotp");
    this.revisionDate = this.getResponseProperty("RevisionDate");
    this.collectionIds = this.getResponseProperty("CollectionIds");
    this.creationDate = this.getResponseProperty("CreationDate");
    this.deletedDate = this.getResponseProperty("DeletedDate");

    const login = this.getResponseProperty("Login");
    if (login != null) {
      this.login = new LoginApiV1(login);
    }

    const card = this.getResponseProperty("Card");
    if (card != null) {
      this.card = new CardApiV1(card);
    }

    const identity = this.getResponseProperty("Identity");
    if (identity != null) {
      this.identity = new IdentityApiV1(identity);
    }

    const secureNote = this.getResponseProperty("SecureNote");
    if (secureNote != null) {
      this.secureNote = new SecureNoteApiV1(secureNote);
    }

    const fields = this.getResponseProperty("Fields");
    if (fields != null) {
      this.fields = fields.map((f: any) => new FieldApiV1(f));
    }

    const attachments = this.getResponseProperty("Attachments");
    if (attachments != null) {
      this.attachments = attachments.map((a: any) => new AttachmentResponseV1(a));
    }

    const passwordHistory = this.getResponseProperty("PasswordHistory");
    if (passwordHistory != null) {
      this.passwordHistory = passwordHistory.map((h: any) => new PasswordHistoryResponseV1(h));
    }

    this.reprompt = this.getResponseProperty("Reprompt") || CipherRepromptType.None;
    this.key = this.getResponseProperty("Key") || null;
  }
}
