import { Component, Input } from "@angular/core";

import { TableComponent } from "./table.component";

@Component({
  selector: "td[bitSelectRow]",
  template: `
    <input
      type="checkbox"
      bitCheckbox
      [formControl]="table.dataSource.selection.getControl(bitSelectRow)"
    />
  `,
})
export class SelectRowComponent<T> {
  @Input() bitSelectRow: T;

  constructor(protected table: TableComponent) {}
}
