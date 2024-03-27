import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CardView } from "@bitwarden/common/vault/models/view/card.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { Fido2CredentialView } from "@bitwarden/common/vault/models/view/fido2-credential.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";

import { ImportResult } from "../../models/import-result";
import { BaseImporter } from "../base-importer";
import { Importer } from "../importer";

import {
  CredentialExchangeFormat,
  AccountsEntity,
  Item,
  EditableField,
  BasicAuthCredential,
  CreditCardCredential,
  PasskeyCredential,
  CEFCollection,
} from "./types/cef-importer-types";

export class CEFImporter extends BaseImporter implements Importer {
  result = new ImportResult();

  async parse(data: string): Promise<ImportResult> {
    const exportData: CredentialExchangeFormat = JSON.parse(data);

    exportData.accounts.forEach((account: AccountsEntity) => {
      this.parseCollections(account.collections);
      account.items.forEach((item: Item) => {
        this.parseItem(item);
      });
    });

    if (this.organization) {
      this.moveFoldersToCollections(this.result);
    }

    this.result.success = true;
    return Promise.resolve(this.result);
  }

  private parseCollections(collections: CEFCollection[], parentCollectionTitle?: string) {
    collections.forEach((collection: CEFCollection) => {
      if (!Utils.isNullOrWhitespace(parentCollectionTitle)) {
        collection.title = parentCollectionTitle + "/" + collection.title;
      }

      collection.items.forEach((item: Item) => {
        this.processFolder(this.result, collection.title);
        this.parseItem(item);
      });
      if (collection.subCollections) {
        this.parseCollections(collection.subCollections, collection.title);
      }
    });
  }

  private parseItem(item: Item) {
    const cipher = this.initLoginCipher();

    cipher.name = item.title;

    item.credentials.forEach((credentials) => {
      switch (credentials.type) {
        case "basic-auth":
          this.processBasicAuth(credentials, cipher);
          break;
        case "passkey":
          this.processPasskey(credentials, cipher);
          break;
        case "credit-card":
          this.processCreditCard(credentials, cipher);
          break;
        default:
          break;
      }
    });

    this.cleanupCipher(cipher);
    this.result.ciphers.push(cipher);
  }

  private processBasicAuth(item: BasicAuthCredential, cipher: CipherView) {
    cipher.type = CipherType.Login;
    cipher.login = new LoginView();

    cipher.login.uris = this.makeUriArray(item.urls);

    cipher.login.username = item.username?.value;
    cipher.login.password = item.password?.value;
    // this.handleEditableField(item.username, cipher);
    // this.handleEditableField(item.password, cipher);
  }

  private handleEditableField(field: EditableField, cipher: CipherView) {
    if (field.designation === "username" && field.value !== "") {
      cipher.type = CipherType.Login;
      cipher.login.username = field.value;
      return;
    }

    if (field.designation === "password" && field.value !== "") {
      cipher.type = CipherType.Login;
      cipher.login.password = field.value;
      return;
    }

    // let fieldValue = field.value;
    // let fieldType: FieldType = FieldType.Text;
    // switch (field.fieldType) {
    //   case LoginFieldTypeEnum.Password:
    //     fieldType = FieldType.Hidden;
    //     break;
    //   case LoginFieldTypeEnum.CheckBox:
    //     fieldValue = field.value !== "" ? "true" : "false";
    //     fieldType = FieldType.Boolean;
    //     break;
    //   default:
    //     break;
    // }
    // this.processKvp(cipher, field.label, fieldValue, fieldType);
  }

  private processPasskey(item: PasskeyCredential, cipher: CipherView) {
    cipher.type = CipherType.Login;
    cipher.login = new LoginView();

    if (!cipher.login.hasFido2Credentials) {
      cipher.login.fido2Credentials = [];
    }
    const fido2Credentials: Fido2CredentialView = new Fido2CredentialView();
    fido2Credentials.rpId = item.rpId;
    fido2Credentials.userName = item.userName;
    fido2Credentials.userDisplayName = item.userDisplayName;
    fido2Credentials.userHandle = item.userHandle;
    cipher.login.fido2Credentials.push(fido2Credentials);
  }

  private processCreditCard(item: CreditCardCredential, cipher: CipherView) {
    cipher.type = CipherType.Card;
    cipher.card = new CardView();

    cipher.card.cardholderName = item.fullName;
    cipher.card.number = item.number;
    cipher.card.brand = item.cardType;
    this.setCardExpiration(cipher, item.expiryDate);

    cipher.card.code = item.verificationNumber;

    this.processKvp(cipher, "validFrom", item.validFrom);
  }
}
