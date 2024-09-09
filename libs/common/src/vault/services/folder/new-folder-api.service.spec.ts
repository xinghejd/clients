import { mock, MockProxy } from "jest-mock-extended";
import { Observable, Subject } from "rxjs";

import { ObservableTracker } from "../../../../spec";
import { ApiService } from "../../../abstractions/api.service";
import { Utils } from "../../../platform/misc/utils";
import { FolderId } from "../../../types/guid";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderRequest } from "../../models/request/folder.request";

import { NewFolderApiService } from "./new-folder-api.service";

describe("NewFolderApiService", () => {
  const folderId = Utils.newGuid() as FolderId;
  let subject: Subject<Folder>;
  let apiService: MockProxy<ApiService>;

  let sut: NewFolderApiService;
  let updateObservable: Observable<FolderData>;
  let tracker: ObservableTracker<FolderData>;

  beforeEach(() => {
    apiService = mock<ApiService>();

    subject = new Subject<Folder>();
    sut = new NewFolderApiService(apiService);
  });

  afterEach(() => {
    tracker?.unsubscribe();
    subject.complete();
  });

  it("deletes a folder if the folder is null", async () => {
    updateObservable = subject.pipe(sut.updateFolderWithServer(folderId));
    tracker = new ObservableTracker<FolderData>(updateObservable);

    subject.next(null);

    await tracker.expectEmission();

    expect(apiService.send).toHaveBeenCalledWith(
      "DELETE",
      "/folders/" + folderId,
      null,
      true,
      false,
    );
  });

  it("puts the folder if it already has an id", async () => {
    updateObservable = subject.pipe(sut.updateFolderWithServer(folderId));
    tracker = new ObservableTracker<FolderData>(updateObservable);

    const folder = new Folder(
      new FolderData({ id: folderId, name: "test", revisionDate: new Date().toJSON() }),
    );

    subject.next(folder);

    await tracker.expectEmission();

    expect(apiService.send).toHaveBeenCalledWith(
      "PUT",
      "/folders/" + folderId,
      new FolderRequest(folder),
      true,
      true,
    );
  });

  it("posts the folder if it does not have an id", async () => {
    updateObservable = subject.pipe(sut.updateFolderWithServer(null));
    tracker = new ObservableTracker<FolderData>(updateObservable);

    const folder = new Folder(new FolderData({ name: "test", revisionDate: new Date().toJSON() }));

    subject.next(folder);

    await tracker.expectEmission();

    expect(apiService.send).toHaveBeenCalledWith(
      "POST",
      "/folders",
      new FolderRequest(folder),
      true,
      true,
    );
  });
});
