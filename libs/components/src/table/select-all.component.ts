import { Component } from "@angular/core";

import { TableComponent } from "./table.component";

@Component({
  selector: "th[bitSelectAll]",
  template: `
    <input type="checkbox" bitCheckbox [formControl]="table.dataSource.selection.allControl" />
  `,
})
export class SelectAllComponent {
  constructor(protected table: TableComponent) {}
}
