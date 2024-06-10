import { inject, Injectable, signal } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { CanDeactivateFn, NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { Jsonify } from "type-fest";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { MessageSender } from "@bitwarden/common/platform/messaging";
import { GlobalStateProvider } from "@bitwarden/common/platform/state";

import { DialogService } from "../../../../../../libs/components/src/dialog";
import { DirtyFormStateService } from "../../services/dirty-form-state.service";

// TODO
export type DirtyFormRef = {
  showWarningDialog: () => Promise<boolean>;
  clearState: () => void;
};

/** Saves dirty form values to state */
@Injectable({
  providedIn: "root",
})
export class DirtyFormService {
  private globalStateProvider = inject(GlobalStateProvider);
  private messageSender = inject(MessageSender);
  private configService = inject(ConfigService);
  private router = inject(Router);

  showNavigationWarning = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.showNavigationWarning.set(false);
      this.messageSender.send(DirtyFormStateService.COMMANDS.CLEAR_ALL, {});
    });

    window.addEventListener("pagehide", (event) => {
      this.messageSender.send(DirtyFormStateService.COMMANDS.CLEAR_ALL, {});
    });
  }

  /**
   * Registers a form control to save dirty values to and initialize from state
   * @param control The form control to register
   * @param options
   * @returns Whether the form intialized from a stored dirty state
   */
  async register<ControlValue, ControlRawValue extends ControlValue>(
    control: AbstractControl<ControlValue, ControlRawValue>,
    options: {
      key: string;
      deserializer?: (jsonValue: Jsonify<ControlRawValue>) => ControlRawValue;
      showNavigationWarning?: boolean;
      clearOnNavigation?: boolean;
    },
  ): Promise<boolean> {
    if (!(await this.configService.getFeatureFlag(FeatureFlag.ExtensionRefresh))) {
      return false;
    }

    // TODO: remove `any`
    const state = (await DirtyFormStateService.getDirtyFormStateByKey(
      options.key,
      this.globalStateProvider,
    )) as any;
    if (state != null) {
      this.showNavigationWarning.set(true);

      // TODO: use options.deserializer
      const valueToPatch = state;
      control.patchValue(valueToPatch, { emitEvent: false });
      control.markAsDirty();
    }

    // TODO: takeUntil
    control.valueChanges.subscribe((value) => {
      this.showNavigationWarning.set(true);
      this.messageSender.send(DirtyFormStateService.COMMANDS.UPDATE, { key: options.key, value });
    });

    return true;
  }
}

/** If the component to be deactivated contains a dirty form, present a confirmation dialog to the user. */
export const dirtyFormGuard: CanDeactivateFn<any> = async () => {
  const dirtyFormService = inject(DirtyFormService);
  if (!dirtyFormService.showNavigationWarning()) {
    return true;
  }

  // TODO: upate with actual copy
  return inject(DialogService).openSimpleDialog({
    title: "Unsaved changes",
    type: "warning",
    content: "Proceed?",
  });
};
