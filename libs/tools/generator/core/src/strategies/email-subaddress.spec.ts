import { mock } from "jest-mock-extended";
import { of, firstValueFrom } from "rxjs";

import { PolicyType } from "@bitwarden/common/src/admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "@bitwarden/common/src/admin-console/models/domain/policy";
import { StateProvider } from "@bitwarden/common/src/platform/state";
import { UserId } from "@bitwarden/common/src/types/guid";

import { DefaultSubaddressOptions } from "../data";
import { Randomizer } from "../engine";
import { DefaultPolicyEvaluator } from "../policies";
//import { SubaddressGenerationOptions, } from "../types";

import { SubaddressGeneratorStrategy } from "./email-subaddress";
import { SUBADDRESS_SETTINGS } from "./storage";

const SomeUser = "some user" as UserId;
const SomePolicy = mock<Policy>({
  type: PolicyType.PasswordGenerator,
  data: {
    minLength: 10,
  },
});

describe("Email subaddress list generation strategy", () => {
  describe("toEvaluator()", () => {
    it.each([[[]], [null], [undefined], [[SomePolicy]], [[SomePolicy, SomePolicy]]])(
      "should map any input (= %p) to the default policy evaluator",
      async (policies) => {
        const strategy = new SubaddressGeneratorStrategy(null, null);

        const evaluator$ = of(policies).pipe(strategy.toEvaluator());
        const evaluator = await firstValueFrom(evaluator$);

        expect(evaluator).toBeInstanceOf(DefaultPolicyEvaluator);
      },
    );
  });

  describe("durableState", () => {
    it("should use password settings key", () => {
      const provider = mock<StateProvider>();
      const randomizer = mock<Randomizer>();
      const strategy = new SubaddressGeneratorStrategy(randomizer, provider);

      strategy.durableState(SomeUser);

      expect(provider.getUser).toHaveBeenCalledWith(SomeUser, SUBADDRESS_SETTINGS);
    });
  });

  describe("defaults$", () => {
    it("should return the default subaddress options", async () => {
      const strategy = new SubaddressGeneratorStrategy(null, null);

      const result = await firstValueFrom(strategy.defaults$(SomeUser));

      expect(result).toEqual(DefaultSubaddressOptions);
    });
  });

  describe("policy", () => {
    it("should use password generator policy", () => {
      const randomizer = mock<Randomizer>();
      const strategy = new SubaddressGeneratorStrategy(randomizer, null);

      expect(strategy.policy).toBe(PolicyType.PasswordGenerator);
    });
  });

  describe("generate()", () => {
    it.todo("generate email subaddress tests");
  });
});
