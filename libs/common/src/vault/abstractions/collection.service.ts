import { Observable } from "rxjs";

import { CollectionId } from "../../types/guid";
import { CollectionData } from "../models/data/collection.data";
import { Collection } from "../models/domain/collection";
import { TreeNode } from "../models/domain/tree-node";
import { CollectionView } from "../models/view/collection.view";

export abstract class CollectionService {
  abstract clearActiveUserCache(): Promise<void>;
  abstract encrypt(model: CollectionView): Promise<Collection>;
  abstract decryptedCollectionViews$(ids: CollectionId[]): Observable<CollectionView[]>;
  /**
   * @deprecated This method will soon be made private, use `decryptedCollectionViews$` instead.
   */
  abstract decryptMany(collections: Collection[]): Promise<CollectionView[]>;
  abstract get(id: string): Promise<Collection>;
  abstract getAll(): Promise<Collection[]>;
  abstract getAllDecrypted(): Promise<CollectionView[]>;
  abstract getAllNested(collections?: CollectionView[]): Promise<TreeNode<CollectionView>[]>;
  abstract getNested(id: string): Promise<TreeNode<CollectionView>>;
  abstract upsert(collection: CollectionData | CollectionData[]): Promise<any>;
  abstract replace(collections: { [id: string]: CollectionData }): Promise<any>;
  abstract clear(userId: string): Promise<any>;
  abstract delete(id: string | string[]): Promise<any>;
}
