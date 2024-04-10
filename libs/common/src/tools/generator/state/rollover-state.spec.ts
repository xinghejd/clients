import { BehaviorSubject, firstValueFrom } from "rxjs";

import {
  mockAccountServiceWith,
  FakeStateProvider,
  awaitAsync,
  trackEmissions,
} from "../../../../spec";
import { GENERATOR_DISK, KeyDefinition } from "../../../platform/state";
import { UserId } from "../../../types/guid";

import { RolloverKeyDefinition } from "./rollover-key-definition";
import { RolloverState } from "./rollover-state";

const SomeUser = "SomeUser" as UserId;
const accountService = mockAccountServiceWith(SomeUser);
type SomeType = { foo: boolean; bar: boolean };

const SOME_KEY = new KeyDefinition<SomeType>(GENERATOR_DISK, "fooBar", {
  deserializer: (jsonValue) => jsonValue as SomeType,
});
const ROLLOVER_KEY = new RolloverKeyDefinition<SomeType>(GENERATOR_DISK, "fooBar_rollover", {
  deserializer: (jsonValue) => jsonValue as SomeType,
});

describe("RolloverState", () => {
  describe("state$", function () {
    it("reads from the output state", async () => {
      const provider = new FakeStateProvider(accountService);
      const value = { foo: true, bar: false };
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      await outputState.update(() => value);
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);

      const result = await firstValueFrom(rolloverState.state$);

      expect(result).toEqual(value);
    });

    it("updates when the output state updates", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      const secondValue = { foo: true, bar: true };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);

      const result = trackEmissions(rolloverState.state$);
      await outputState.update(() => secondValue);
      await awaitAsync();

      expect(result).toEqual([firstValue, secondValue]);
    });

    // this test is important for data migrations, which set
    // the rollover state without using the rollover state abstraction.
    it.each([[null], [undefined]])(
      "reads from the output state when the rollover state is '%p'",
      async (rolloverValue) => {
        const provider = new FakeStateProvider(accountService);
        const outputState = provider.getUser(SomeUser, SOME_KEY);
        const firstValue = { foo: true, bar: false };
        await outputState.update(() => firstValue);
        const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);
        await provider.setUserState(ROLLOVER_KEY.toKeyDefinition(), rolloverValue, SomeUser);

        const result = await firstValueFrom(rolloverState.state$);

        expect(result).toEqual(firstValue);
      },
    );

    // also important for data migrations
    it("rolls over pending values from the rollover state immediately by default", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      await outputState.update(() => ({ foo: true, bar: false }));
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);
      const rolloverValue = { foo: true, bar: true };
      await provider.setUserState(ROLLOVER_KEY.toKeyDefinition(), rolloverValue, SomeUser);

      const result = await firstValueFrom(rolloverState.state$);

      expect(result).toEqual(rolloverValue);
    });

    // also important for data migrations
    it("reads from the output state when shouldRollover is false", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const value = { foo: true, bar: false };
      await outputState.update(() => value);
      const shouldRollover = new BehaviorSubject<boolean>(false).asObservable();
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState, shouldRollover);
      await provider.setUserState(
        ROLLOVER_KEY.toKeyDefinition(),
        { foo: true, bar: true },
        SomeUser,
      );

      const result = await firstValueFrom(rolloverState.state$);

      expect(result).toEqual(value);
    });

    // also important for data migrations
    it("replaces the output state when shouldRollover becomes true", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const shouldRollover = new BehaviorSubject<boolean>(false);
      const rolloverState = new RolloverState(
        provider,
        ROLLOVER_KEY,
        outputState,
        shouldRollover.asObservable(),
      );
      const rolloverValue = { foo: true, bar: true };
      await provider.setUserState(ROLLOVER_KEY.toKeyDefinition(), rolloverValue, SomeUser);

      const result = trackEmissions(rolloverState.state$);
      shouldRollover.next(true);
      await awaitAsync();

      expect(result).toEqual([firstValue, rolloverValue]);
    });
  });

  describe("update", () => {
    it("updates state$", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      const secondValue = { foo: true, bar: true };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);

      const result = trackEmissions(rolloverState.state$);
      await outputState.update(() => secondValue);
      await awaitAsync();

      expect(result).toEqual([firstValue, secondValue]);
    });
  });

  describe("rollover", () => {
    it("updates state$ once per rollover", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      const secondValue = { foo: true, bar: true };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover(secondValue);
      await awaitAsync();

      expect(result).toEqual([firstValue, secondValue]);
    });

    it("emits the output state when shouldRollover is false", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const shouldRollover = new BehaviorSubject<boolean>(false);
      const rolloverState = new RolloverState(
        provider,
        ROLLOVER_KEY,
        outputState,
        shouldRollover.asObservable(),
      );
      const rolloverValue = { foo: true, bar: true };

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover(rolloverValue);
      await awaitAsync();

      expect(result).toEqual([firstValue, firstValue]);
    });

    it("replaces the output state when shouldRollover becomes true", async () => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const shouldRollover = new BehaviorSubject<boolean>(false);
      const rolloverState = new RolloverState(
        provider,
        ROLLOVER_KEY,
        outputState,
        shouldRollover.asObservable(),
      );
      const rolloverValue = { foo: true, bar: true };

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover(rolloverValue);
      shouldRollover.next(true);
      await awaitAsync();

      expect(result).toEqual([firstValue, firstValue, rolloverValue]);
    });

    it.each([[null], [undefined]])("ignores `%p`", async (rolloverValue) => {
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, ROLLOVER_KEY, outputState);

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover(rolloverValue);
      await awaitAsync();

      expect(result).toEqual([firstValue]);
    });

    it("discards the rollover data when isValid returns false", async () => {
      const rolloverKey = new RolloverKeyDefinition<SomeType>(GENERATOR_DISK, "fooBar_rollover", {
        deserializer: (jsonValue) => jsonValue as SomeType,
        isValid: () => Promise.resolve(false),
      });
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, rolloverKey, outputState);

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover({ foo: true, bar: true });
      await awaitAsync();

      expect(result).toEqual([firstValue, firstValue]);
    });

    it("applies the rollover data when isValid returns true", async () => {
      const rolloverKey = new RolloverKeyDefinition<SomeType>(GENERATOR_DISK, "fooBar_rollover", {
        deserializer: (jsonValue) => jsonValue as SomeType,
        isValid: () => Promise.resolve(true),
      });
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, rolloverKey, outputState);
      const rolloverValue = { foo: true, bar: true };

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover(rolloverValue);
      await awaitAsync();

      expect(result).toEqual([firstValue, rolloverValue]);
    });

    it("maps the rollover data when it rolls over", async () => {
      const mappedValue = { foo: true, bar: true };
      const rolloverKey = new RolloverKeyDefinition<SomeType>(GENERATOR_DISK, "fooBar_rollover", {
        deserializer: (jsonValue) => jsonValue as SomeType,
        map: () => Promise.resolve(mappedValue),
      });
      const provider = new FakeStateProvider(accountService);
      const outputState = provider.getUser(SomeUser, SOME_KEY);
      const firstValue = { foo: true, bar: false };
      await outputState.update(() => firstValue);
      const rolloverState = new RolloverState(provider, rolloverKey, outputState);

      const result = trackEmissions(rolloverState.state$);
      await rolloverState.rollover({ foo: false, bar: false });
      await awaitAsync();

      expect(result).toEqual([firstValue, mappedValue]);
    });
  });
});
