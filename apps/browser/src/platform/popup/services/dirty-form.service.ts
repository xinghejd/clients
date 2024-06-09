import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { Jsonify } from "type-fest";

import { MessageSender } from "@bitwarden/common/platform/messaging";
import {
  ActiveUserStateProvider,
} from "@bitwarden/common/platform/state";

import { DirtyFormStateService } from "../../services/dirty-form-state.service";

/** Saves dirty form values to state */
@Injectable({
  providedIn: "root"
})
export class DirtyFormService {
  private activeUserStateProvider = inject(ActiveUserStateProvider);
  private messageSender = inject(MessageSender);

  /**
   * Registers a form control to save dirty values to and initialize from state
   * @param control The form control to register
   * @param options 
   * @returns Whether the form intialized from a stored dirty state
   */
  async register<ControlValue, ControlRawValue extends ControlValue>(control: AbstractControl<ControlValue, ControlRawValue>, options: {
    key: string;
    deserializer?: (jsonValue: Jsonify<ControlRawValue>) => ControlRawValue;
    // todo
    destroyRef?: any;
  }): Promise<boolean> {
    // todo any
    const state = await DirtyFormStateService.getDirtyFormState(options.key, this.activeUserStateProvider) as any;
    if (state != null) {
      // todo use options.deserializer
      const valueToPatch = state;
      control.patchValue(valueToPatch);
      control.markAsDirty();
    }
    
    // todo takeUntil
    control.valueChanges.subscribe(value => {
      this.messageSender.send(DirtyFormStateService.COMMANDS.SAVE, { key: options.key, value })
    });

    return true;
  }
}

// todo can activate