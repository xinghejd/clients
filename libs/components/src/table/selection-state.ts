const MAX_SELECTION = 500;

export class SelectionState<T> {
  private _selectMap: Map<T, boolean>;

  selectAll = false;

  set data(data: T[]) {
    const keyValuePairs: [T, boolean][] = data.map((row) => [row, false]);
    this._selectMap = new Map(keyValuePairs);
  }

  getValue(row: T) {
    return this._selectMap.get(row);
  }

  setValue(data: T | T[], value: boolean) {
    if (Array.isArray(data)) {
      data = data.slice(0, MAX_SELECTION);
      data.forEach((r) => this._selectMap.set(r, value));
      return;
    }

    this._selectMap.set(data, value);
  }

  getControl(data: T) {
    return this._selectMap.get(data);
  }

  get selectedRows(): T[] {
    const selectedRows: T[] = [];
    this._selectMap.forEach((value, row) => {
      if (value) {
        selectedRows.push(row);
      }
    });

    return selectedRows;
  }

  deselectAll() {
    for (const key of this._selectMap.keys()) {
      this._selectMap.set(key, false);
    }
  }
}
