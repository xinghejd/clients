import { ipcRenderer } from "electron";

export default {
  sync: (): Promise<void> => ipcRenderer.invoke("autofill.sync", {}),
};
