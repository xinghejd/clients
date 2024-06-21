import { effect, inject, Injectable, Injector, signal, WritableSignal } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { Jsonify } from "type-fest";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { MessageSender } from "@bitwarden/common/platform/messaging";
import { GlobalStateProvider } from "@bitwarden/common/platform/state";

import {
  POPUP_VIEW_CACHE_KEY,
  SAVE_VIEW_CACHE_COMMAND,
} from "../../services/popup-view-cache-background.service";

export type DirtyFormRef = {
  /** Clear the cached form value from state; should be used when submitting the form  */
  clear: () => void;
};

type BaseCacheOptions<T> = {
  key: string;
  deserializer?: (jsonValue: Jsonify<T>) => T;
  injector?: Injector;
};

export type SignalCacheOptions<T> = BaseCacheOptions<T> & {
  initialValue: T;
};

export type FormCacheOptions<
  ControlValue,
  ControlRawValue extends ControlValue,
> = BaseCacheOptions<ControlRawValue> & {
  form: AbstractControl<ControlValue, ControlRawValue>;
};

/** Saves dirty form values to state */
@Injectable({
  providedIn: "root",
})
export class PopupViewCacheService {
  private globalStateProvider = inject(GlobalStateProvider);
  private messageSender = inject(MessageSender);
  private configService = inject(ConfigService);

  private state = this.globalStateProvider.get(POPUP_VIEW_CACHE_KEY);
  private cacheMap: Map<string, unknown>;
  private featureFlagEnabled: boolean;

  async init() {
    this.featureFlagEnabled = await this.configService.getFeatureFlag(FeatureFlag.PersistPopupView);

    const initialState = await firstValueFrom(this.state.state$);
    this.cacheMap = new Map(Object.entries(initialState));
  }

  /**
   * Must be used within an injection context.
   *
   * @param options
   */
  cacheSignal<T>(options: SignalCacheOptions<T>): WritableSignal<T> {
    if (!this.cacheMap) {
      throw new Error("View cache not initialized.");
    }

    if (!this.featureFlagEnabled) {
      return signal(options.initialValue);
    }

    // TODO
    // const deserializer = options.deserializer ?? JSON.parse;
    const rawInitialValue = this.cacheMap.has(options.key)
      ? (this.cacheMap.get(options.key) as T)
      : options.initialValue;
    const _signal = signal(rawInitialValue);

    effect(
      () => {
        this.messageSender.send(SAVE_VIEW_CACHE_COMMAND, {
          key: options.key,
          value: _signal(),
        });
      },
      { injector: options?.injector },
    );

    return _signal;
  }

  /**
   * Initializes a form control from a cached dirty value; saves form value updates to cache.
   * If a cached value is found, marks the form as dirty.
   */
  cacheForm<ControlValue, ControlRawValue extends ControlValue>(
    options: FormCacheOptions<ControlValue, ControlRawValue>,
  ): DirtyFormRef {
    const { form, key } = options;

    const dirtyFormRef: DirtyFormRef = {
      clear: () => {
        this.messageSender.send(SAVE_VIEW_CACHE_COMMAND, {
          key,
          value: null,
        });
      },
    };

    if (!this.featureFlagEnabled) {
      return dirtyFormRef;
    }
    const cache = this.cacheSignal({ ...options, initialValue: undefined });

    if (cache()) {
      form.patchValue(cache());
      form.markAsDirty();
    }

    form.valueChanges.subscribe(() => {
      cache.set(form.getRawValue());
    });

    return dirtyFormRef;
  }

  async clear() {
    return this.state.update(() => ({}), {
      shouldUpdate: (state) => state && Object.keys(state).length !== 0,
    });
  }
}
