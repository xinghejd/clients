import { BaseResponse } from "../../../../../models/response/base.response";
import { CipherRepromptType } from "../../../../enums/cipher-reprompt-type";
import { CardApiV2 } from "../../api/v2/card.api";
import { FieldApiV2 } from "../../api/v2/field.api";
import { IdentityApiV2 } from "../../api/v2/identity.api";
import { LoginApiV2 } from "../../api/v2/login.api";
import { SecureNoteApiV2 } from "../../api/v2/secure-note.api";

import { AttachmentResponseV2 } from "./attachment.response";
import { PasswordHistoryResponseV2 } from "./password-history.response";

export class CipherResponseV2 extends BaseResponse {
  version: 2;
  id: string;
  organizationId: string;
  folderId: string;
  type: number;
  name: string;
  notes: string;
  fields: FieldApiV2[];
  login: LoginApiV2;
  card: CardApiV2;
  identity: IdentityApiV2;
  secureNote: SecureNoteApiV2;
  favorite: boolean;
  edit: boolean;
  viewPassword: boolean;
  organizationUseTotp: boolean;
  revisionDate: string;
  attachments: AttachmentResponseV2[];
  passwordHistory: PasswordHistoryResponseV2[];
  collectionIds: string[];
  creationDate: string;
  deletedDate: string;
  reprompt: CipherRepromptType;
  key: string;

  constructor(response: any) {
    super(response);
    this.version = 2;
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
      this.login = new LoginApiV2(login);
    }

    const card = this.getResponseProperty("Card");
    if (card != null) {
      this.card = new CardApiV2(card);
    }

    const identity = this.getResponseProperty("Identity");
    if (identity != null) {
      this.identity = new IdentityApiV2(identity);
    }

    const secureNote = this.getResponseProperty("SecureNote");
    if (secureNote != null) {
      this.secureNote = new SecureNoteApiV2(secureNote);
    }

    const fields = this.getResponseProperty("Fields");
    if (fields != null) {
      this.fields = fields.map((f: any) => new FieldApiV2(f));
    }

    const attachments = this.getResponseProperty("Attachments");
    if (attachments != null) {
      this.attachments = attachments.map((a: any) => new AttachmentResponseV2(a));
    }

    const passwordHistory = this.getResponseProperty("PasswordHistory");
    if (passwordHistory != null) {
      this.passwordHistory = passwordHistory.map((h: any) => new PasswordHistoryResponseV2(h));
    }

    this.reprompt = this.getResponseProperty("Reprompt") || CipherRepromptType.None;
    this.key = this.getResponseProperty("Key") || null;
  }
}
