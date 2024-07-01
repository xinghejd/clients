import { Component, Input } from "@angular/core";

import { TableComponent } from "./table.component";

@Component({
  selector: "td[bitSelectRow]",
  template: `
    <input
      type="checkbox"
      bitCheckbox
      [checked]="table.dataSource.selection.getValue(bitSelectRow)"
      (change)="table.dataSource.selection.setValue(bitSelectRow, $any($event.target).checked)"
    />
  `,
})
export class SelectRowComponent<T> {
  @Input() bitSelectRow: T;

  constructor(protected table: TableComponent) {}
}
