import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";

import { CollectionResponse } from "../../../vault/models/collection.response.js";
import { SelectionReadOnly } from "../selection-read-only.js";

export class OrganizationCollectionResponse extends CollectionResponse {
  groups: SelectionReadOnly[];

  constructor(o: CollectionView, groups: SelectionReadOnly[]) {
    super(o);
    this.object = "org-collection";
    this.groups = groups;
  }
}
