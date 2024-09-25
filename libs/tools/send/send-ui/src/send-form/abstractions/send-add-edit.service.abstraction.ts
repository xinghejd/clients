import { Observable } from "rxjs";

import { SendFormConfig } from "./send-form-config.service";

export abstract class SendAddEditService {
  config: SendFormConfig;
  headerText: string;
  deleteSend: () => Promise<boolean>;
  subscribeToParams: () => Observable<{ config: SendFormConfig; headerText: string }>;
}
