import { CipherId } from "../../../types/guid";
import { CipherView } from "../../models/view/cipher.view";

export type SimpleVaultIndex = {
  fido2CredentialRpId: FieldIndex;
};

export type FieldIndex = {
  [value: string]: CipherId[];
};

export type IndexedField = keyof SimpleVaultIndex;

/**
 * A service that allows for indexing ciphers by field values, and searching
 * the index for ciphers with specific values. This is useful for quickly
 * finding ciphers with known values of their fields.
 *
 * Internally, this service keeps an index of ENC(cipherField) => cipherId,
 * which allows for two things:
 *  1. Quickly find ciphers known values of their fields.
 *  2. Searching the index without first having to decrypt the index.
 */
export abstract class SimpleVaultIndexService {
  /**
   * Get ids for all ciphers that have the given value for the given field.
   * @param field The field to search.
   * @param value The unencrypted value for the field.
   */
  abstract getItemIds(field: IndexedField, value: string): Promise<CipherId[]>;

  /**
   * Get and decrypt all ciphers that have the given value for the given field.
   * @param field The field to search.
   * @param value The unencrypted value for the field.
   */
  abstract getDecryptedItems(field: IndexedField, value: string): Promise<CipherView[]>;
}
