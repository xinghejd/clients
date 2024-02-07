import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { delay, map, Observable, ReplaySubject, share, startWith, tap } from "rxjs";

import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import { Folder } from "@bitwarden/common/vault/models/domain/folder";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";

@Component({
  selector: "app-folders",
  templateUrl: "folders.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoldersComponent implements OnInit {
  folders$: Observable<FolderView[]>;
  myValue$: Observable<Folder[]>;

  constructor(
    private folderService: FolderService,
    private router: Router,
    private cryptoService: CryptoService,
    private changeD: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // this.myValue$ = this.folderService.folders$.pipe(
    //   tap({
    //     subscribe: () => console.log("e Folders subscribe"),
    //     next: (folders) => console.log("e Folders next", folders),
    //     unsubscribe: () => console.log("e Folders unsubscribed"),
    //     complete: () => console.log("e Folders complete"),
    //     finalize: () => console.log("e Folders finalize"),
    //     error: (err) => console.error("e Folders error", err),
    //   }),
    // );
    // const rs = new ReplaySubject<FolderView[]>(1);
    // this.folders$ = rs.asObservable();

    // setTimeout(() => {
    //   rs.next([]);
    // }, 200);
    this.folders$ = this.folderService.folderViews$.pipe(
      map((folders) => {
        if (folders.length > 0) {
          folders = folders.slice(0, folders.length - 1);
        }

        return folders;
      }),
      delay(1000),
      tap({
        subscribe: () => console.log("Folders subscribe"),
        next: (folders) => console.log("Folders next", folders),
        unsubscribe: () => console.log("Folders unsubscribed"),
        complete: () => console.log("Folders complete"),
        finalize: () => console.log("Folders finalize"),
        error: (err) => console.error("Folders error", err),
      }),
    );
  }

  folderSelected(folder: FolderView) {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/edit-folder"], { queryParams: { folderId: folder.id } });
  }

  addFolder() {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/add-folder"]);
  }
}
