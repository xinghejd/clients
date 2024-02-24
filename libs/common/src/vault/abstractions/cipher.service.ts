import { SymmetricCryptoKey } from "../../platform/models/domain/symmetric-crypto-key";
import { UriMatchType } from "../enums";
import { CipherType } from "../enums/cipher-type";
import { CipherData } from "../models/data/cipher.data";
import { Cipher } from "../models/domain/cipher";
import { Field } from "../models/domain/field";
import { CipherView } from "../models/view/cipher.view";
import { FieldView } from "../models/view/field.view";

export abstract class CipherService {
  abstract clearCache(userId?: string): Promise<void>;
  abstract encrypt(
    model: CipherView,
    keyForEncryption?: SymmetricCryptoKey,
    keyForCipherKeyDecryption?: SymmetricCryptoKey,
    originalCipher?: Cipher,
  ): Promise<Cipher>;
  abstract encryptFields(fieldsModel: FieldView[], key: SymmetricCryptoKey): Promise<Field[]>;
  abstract encryptField(fieldModel: FieldView, key: SymmetricCryptoKey): Promise<Field>;
  abstract get(id: string): Promise<Cipher>;
  abstract getAll(): Promise<Cipher[]>;
  abstract getAllDecrypted(): Promise<CipherView[]>;
  abstract getAllDecryptedForGrouping(groupingId: string, folder?: boolean): Promise<CipherView[]>;
  abstract getAllDecryptedForUrl(
    url: string,
    includeOtherTypes?: CipherType[],
    defaultMatch?: UriMatchType,
  ): Promise<CipherView[]>;
  abstract getAllFromApiForOrganization(organizationId: string): Promise<CipherView[]>;
  /**
   * Gets ciphers belonging to the specified organization that the user has explicit collection level access to.
   * Ciphers that are not assigned to any collections are only included for users with admin access.
   */
  abstract getManyFromApiForOrganization(organizationId: string): Promise<CipherView[]>;
  abstract getLastUsedForUrl(url: string, autofillOnPageLoad: boolean): Promise<CipherView>;
  abstract getLastLaunchedForUrl(url: string, autofillOnPageLoad: boolean): Promise<CipherView>;
  abstract getNextCipherForUrl(url: string): Promise<CipherView>;
  abstract updateLastUsedIndexForUrl(url: string): void;
  abstract updateLastUsedDate(id: string): Promise<void>;
  abstract updateLastLaunchedDate(id: string): Promise<void>;
  abstract saveNeverDomain(domain: string): Promise<void>;
  abstract createWithServer(cipher: Cipher, orgAdmin?: boolean): Promise<any>;
  abstract updateWithServer(cipher: Cipher, orgAdmin?: boolean, isNotClone?: boolean): Promise<any>;
  abstract shareWithServer(
    cipher: CipherView,
    organizationId: string,
    collectionIds: string[],
  ): Promise<any>;
  abstract shareManyWithServer(
    ciphers: CipherView[],
    organizationId: string,
    collectionIds: string[],
  ): Promise<any>;
  abstract saveAttachmentWithServer(
    cipher: Cipher,
    unencryptedFile: any,
    admin?: boolean,
  ): Promise<Cipher>;
  abstract saveAttachmentRawWithServer(
    cipher: Cipher,
    filename: string,
    data: ArrayBuffer,
    admin?: boolean,
  ): Promise<Cipher>;
  abstract saveCollectionsWithServer(cipher: Cipher): Promise<any>;
  abstract upsert(cipher: CipherData | CipherData[]): Promise<any>;
  abstract replace(ciphers: { [id: string]: CipherData }): Promise<any>;
  abstract clear(userId: string): Promise<any>;
  abstract moveManyWithServer(ids: string[], folderId: string): Promise<any>;
  abstract delete(id: string | string[]): Promise<any>;
  abstract deleteWithServer(id: string, asAdmin?: boolean): Promise<any>;
  abstract deleteManyWithServer(ids: string[], asAdmin?: boolean): Promise<any>;
  abstract deleteAttachment(id: string, attachmentId: string): Promise<void>;
  abstract deleteAttachmentWithServer(id: string, attachmentId: string): Promise<void>;
  abstract sortCiphersByLastUsed(a: CipherView, b: CipherView): number;
  abstract sortCiphersByLastUsedThenName(a: CipherView, b: CipherView): number;
  abstract getLocaleSortingFunction(): (a: CipherView, b: CipherView) => number;
  abstract softDelete(id: string | string[]): Promise<any>;
  abstract softDeleteWithServer(id: string, asAdmin?: boolean): Promise<any>;
  abstract softDeleteManyWithServer(ids: string[], asAdmin?: boolean): Promise<any>;
  abstract restore(
    cipher: { id: string; revisionDate: string } | { id: string; revisionDate: string }[],
  ): Promise<any>;
  abstract restoreWithServer(id: string, asAdmin?: boolean): Promise<any>;
  abstract restoreManyWithServer(
    ids: string[],
    organizationId?: string,
    asAdmin?: boolean,
  ): Promise<void>;
  abstract getKeyForCipherKeyDecryption(cipher: Cipher): Promise<any>;
}
