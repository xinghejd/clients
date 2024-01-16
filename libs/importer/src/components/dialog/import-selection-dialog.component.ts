import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import {
  ButtonModule,
  DialogModule,
  TableDataSource,
  TableModule,
  AsyncActionsModule,
  FormFieldModule,
} from "@bitwarden/components";

import { ImportResult } from "../../models";

type SelectImportListItem = {
  checked?: boolean;
  index: number;
  icon: string;
  type: string;
  name: string;
  cipher?: CipherView;
  folder?: FolderView;
  collection?: CollectionView;
};

@Component({
  templateUrl: "import-selection-dialog.component.html",
  standalone: true,
  imports: [
    CommonModule,
    JslibModule,
    DialogModule,
    FormFieldModule,
    AsyncActionsModule,
    TableModule,
    ButtonModule,
    ReactiveFormsModule,
  ],
})
export class ImportSelectionDialogComponent implements OnInit {
  protected dataSource = new TableDataSource<SelectImportListItem>();
  rows: SelectImportListItem[];
  protected formGroup = this.formBuilder.group({
    importSelection: [false],
  });
  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: ImportResult,
    protected formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    if (this.data != null) {
      const rows = this.buildSelectList();
      this.dataSource.data = rows;
      this.rows = rows;
    }
  }

  private buildSelectList(): SelectImportListItem[] {
    const list: SelectImportListItem[] = [];
    this.data.ciphers.map((c, idx) => {
      switch (c.type) {
        case CipherType.Login:
          list.push({ cipher: c, index: idx, icon: "globe", type: "typeLogin", name: c.name });
          break;
        case CipherType.Card:
          list.push({ cipher: c, index: idx, icon: "credit-card", type: "typeCard", name: c.name });
          break;
        case CipherType.SecureNote:
          list.push({
            cipher: c,
            index: idx,
            icon: "sticky-note",
            type: "typeSecureNote",
            name: c.name,
          });
          break;
        case CipherType.Identity:
          list.push({ cipher: c, index: idx, icon: "id-card", type: "typeIdentity", name: c.name });
          break;
        default:
          break;
      }
    });

    if (this.data.collections.length > 0) {
      this.data.collections.map((cl, idx) => {
        list.push({
          collection: cl,
          index: idx,
          icon: "collection",
          type: "collections",
          name: cl.name,
        });
      });
    }

    if (this.data.folders.length > 0) {
      this.data.folders.map((f, idx) => {
        list.push({ folder: f, index: idx, icon: "folder", type: "folders", name: f.name });
      });
    }
    return list;
  }

  toggleAll(event: Event) {
    this.dataSource.data.forEach((x) => (x.checked = (event.target as HTMLInputElement).checked));
  }

  importItemSelected(item: SelectImportListItem) {
    item.checked = !item.checked;
  }

  submit = async () => {
    this.formGroup.markAsTouched();

    const importResult = new ImportResult();
    this.dataSource.data.forEach((x) => {
      if (x.checked) {
        importResult.ciphers.push(x.cipher);
      }
    });

    this.dialogRef.close(importResult);
  };
}
