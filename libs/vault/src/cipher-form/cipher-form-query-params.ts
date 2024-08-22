import { Params } from "@angular/router";

import { CipherId, CollectionId, OrganizationId } from "@bitwarden/common/types/guid";
import { CipherType } from "@bitwarden/common/vault/enums";

/**
 * Helper class to parse query parameters for the AddEdit route.
 */
export class CipherFormQueryParams {
  constructor(params: Params) {
    this.cipherId = params.cipherId;
    this.type = params.type != undefined ? parseInt(params.type, null) : undefined;
    this.clone = params.clone === "true";
    this.folderId = params.folderId;
    this.organizationId = params.organizationId;
    this.collectionId = params.collectionId;
    this.uri = params.uri;
    this.username = params.username;
    this.name = params.name;
  }

  /**
   * The ID of the cipher to edit or clone.
   */
  cipherId?: CipherId;

  /**
   * The type of cipher to create.
   */
  type?: CipherType;

  /**
   * Whether to clone the cipher.
   */
  clone?: boolean;

  /**
   * Optional folderId to pre-select.
   */
  folderId?: string;

  /**
   * Optional organizationId to pre-select.
   */
  organizationId?: OrganizationId;

  /**
   * Optional collectionId to pre-select.
   */
  collectionId?: CollectionId;

  /**
   * Optional URI to pre-fill for login ciphers.
   */
  uri?: string;

  /**
   * Optional username to pre-fill for login/identity ciphers.
   */
  username?: string;

  /**
   * Optional name to pre-fill for the cipher.
   */
  name?: string;
}
