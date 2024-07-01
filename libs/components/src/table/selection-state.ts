import { FormControl } from "@angular/forms";

import { TableDataSource } from "./table-data-source";

const MAX_SELECTION = 500;

export class SelectionState<T> {
  private _selectMap: Map<T, FormControl>;

  allControl = new FormControl(false);

  constructor(private dataSource: TableDataSource<T>) {
    // TODO: unsubscribe?
    this.allControl.valueChanges.subscribe((checked) => {
      // Always deselect all to make sure there are no selected rows that have been filtered out
      this.deselectAll();

      if (checked) {
        this.selectFiltered();
      }
    });
  }

  populateControls(data: T[]) {
    const keyValuePairs: [T, FormControl][] = data.map((row) => [row, new FormControl(false)]);
    this._selectMap = new Map(keyValuePairs);
  }

  getControl(data: T) {
    return this._selectMap.get(data);
  }

  get selectedRows(): T[] {
    const selectedRows: T[] = [];
    this._selectMap.forEach((formControl, data) => {
      if (formControl.value) {
        selectedRows.push(data);
      }
    });

    return selectedRows;
  }

  private deselectAll() {
    this._selectMap.forEach((formControl, data) => formControl.setValue(false));
  }

  private selectFiltered() {
    this.dataSource.filteredData
      .slice(0, MAX_SELECTION)
      .forEach((data) => this._selectMap.get(data)?.setValue(true));
  }
}
