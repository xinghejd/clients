import { CipherType } from "@bitwarden/common/vault/enums";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";

import { CEFImporter } from "../src/importers";

import { basicAuthString } from "./test-data/cef/basic-auth";
import { creditCardString } from "./test-data/cef/credit-card";
import { foldersString } from "./test-data/cef/folders";
import { passkeyString } from "./test-data/cef/passkey";
import { subFoldersString } from "./test-data/cef/sub-folders";

function validateCustomField(fields: FieldView[], fieldName: string, expectedValue: any) {
  expect(fields).toBeDefined();
  const customField = fields.find((f) => f.name === fieldName);
  expect(customField).toBeDefined();

  expect(customField.value).toEqual(expectedValue);
}

describe("CEF (Credential Exchange Format) Importer", () => {
  it("should parse login data", async () => {
    const importer = new CEFImporter();
    const result = await importer.parse(basicAuthString);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();

    expect(cipher.type).toEqual(CipherType.Login);
    expect(cipher.name).toEqual("Login full");

    expect(cipher.login.username).toEqual("Email or username");
    expect(cipher.login.password).toEqual("password");
    expect(cipher.login.uris.length).toEqual(1);
    expect(cipher.login.uri).toEqual("https://website.com");
  });

  it("should parse passkey data", async () => {
    const importer = new CEFImporter();
    const result = await importer.parse(passkeyString);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();

    expect(cipher.type).toEqual(CipherType.Login);
    expect(cipher.name).toEqual("passkeys.io");

    const fido2Credentials = cipher.login.fido2Credentials.shift();

    expect(fido2Credentials.rpId).toEqual("www.passkeys.io");
    expect(fido2Credentials.userName).toEqual("wrong@email.com");
    expect(fido2Credentials.userDisplayName).toEqual("");
    expect(fido2Credentials.userHandle).toEqual("");
    expect(fido2Credentials.keyValue).toEqual(
      "pgECAyYgASFYIP6iIen16POjtGroSJ+Qh9OmBUezMG2DAx3pLTa3bIOpIlggjxS3dNeWIy3sfFH8Yu2M/AOv5jy5oP3UiuSSfPaqTH0jWCBHxRWAKLl48xmjMo0AJK2S4mPIxHW6KsKFd2vwiFX40A==",
    );
  });

  it("should create credit card records", async () => {
    const importer = new CEFImporter();
    const result = await importer.parse(creditCardString);
    expect(result != null).toBe(true);
    const cipher = result.ciphers.shift();

    expect(cipher.name).toEqual("CreditCard title");

    const card = cipher.card;
    expect(card.cardholderName).toEqual("John Doe");
    expect(card.number).toEqual("422242224222");
    expect(card.code).toEqual("123");
    expect(card.brand).toEqual("Visa");
    expect(card.expMonth).toEqual("1");
    expect(card.expYear).toEqual("2026");

    // remaining fields as custom fields
    expect(cipher.fields.length).toEqual(1);
    validateCustomField(cipher.fields, "validFrom", "01/24");
  });

  it("should parse items in collections (Bitwarden folders)", async () => {
    const importer = new CEFImporter();
    const result = await importer.parse(foldersString);
    expect(result != null).toBe(true);

    expect(result.ciphers.length).toBe(2);
    expect(result.folders.length).toBe(1);

    expect(result.folders[0].name).toBe("2Passwords");

    expect(result.folderRelationships.length).toBe(2);
    expect(result.folderRelationships[0]).toEqual([0, 0]);
    expect(result.folderRelationships[1]).toEqual([1, 0]);
  });

  it("should parse items in sub-collections (Bitwarden folders)", async () => {
    const importer = new CEFImporter();
    const result = await importer.parse(subFoldersString);
    expect(result != null).toBe(true);

    expect(result.ciphers.length).toBe(4);
    expect(result.folders.length).toBe(2);

    expect(result.folders[0].name).toBe("2Passwords");
    expect(result.folders[1].name).toBe("2Passwords/SubZero");

    expect(result.folderRelationships.length).toBe(4);
    expect(result.folderRelationships[0]).toEqual([0, 0]);
    expect(result.folderRelationships[1]).toEqual([1, 0]);
    expect(result.folderRelationships[2]).toEqual([2, 1]);
    expect(result.folderRelationships[3]).toEqual([3, 1]);
  });

  it("should parse items in collections (Bitwarden collections)", async () => {
    const importer = new CEFImporter();
    importer.organizationId = "someOrgId";
    const result = await importer.parse(foldersString);
    expect(result != null).toBe(true);

    expect(result.ciphers.length).toBe(2);
    expect(result.collections.length).toBe(1);

    expect(result.collections[0].name).toBe("2Passwords");

    expect(result.collectionRelationships.length).toBe(2);
    expect(result.collectionRelationships[0]).toEqual([0, 0]);
    expect(result.collectionRelationships[1]).toEqual([1, 0]);
  });

  it("should parse items in sub-collections (Bitwarden collections)", async () => {
    const importer = new CEFImporter();
    importer.organizationId = "SomeOrgId";
    const result = await importer.parse(subFoldersString);
    expect(result != null).toBe(true);

    expect(result.ciphers.length).toBe(4);
    expect(result.collections.length).toBe(2);

    expect(result.collections[0].name).toBe("2Passwords");
    expect(result.collections[1].name).toBe("2Passwords/SubZero");

    expect(result.collectionRelationships.length).toBe(4);
    expect(result.collectionRelationships[0]).toEqual([0, 0]);
    expect(result.collectionRelationships[1]).toEqual([1, 0]);
    expect(result.collectionRelationships[2]).toEqual([2, 1]);
    expect(result.collectionRelationships[3]).toEqual([3, 1]);
  });
});
