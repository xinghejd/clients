import { Component } from "@angular/core";

import { TableComponent } from "./table.component";

@Component({
  selector: "th[bitSelectAll]",
  template: `
    <input
      type="checkbox"
      bitCheckbox
      [checked]="table.dataSource.selection.selectAll"
      (change)="toggleSelectAll($any($event.target).checked)"
    />
  `,
})
export class SelectAllComponent {
  constructor(protected table: TableComponent) {}

  protected toggleSelectAll(value: boolean) {
    this.table.dataSource.selection.deselectAll();

    if (value) {
      this.table.dataSource.selection.setValue(this.table.dataSource.filteredData, true);
    }
  }
}
