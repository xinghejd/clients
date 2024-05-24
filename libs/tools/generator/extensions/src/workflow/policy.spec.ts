import { PolicyType } from "@bitwarden/common/src/admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "@bitwarden/common/src/admin-console/models/domain/policy";
import { PolicyId } from "@bitwarden/common/src/types/guid";

import { DefaultGeneratorNavigation, DisabledGeneratorNavigationPolicy } from "./data";
import { GeneratorNavigationEvaluator, preferPassword } from "./policy";

function createPolicy(
  data: any,
  type: PolicyType = PolicyType.PasswordGenerator,
  enabled: boolean = true,
) {
  return new Policy({
    id: "id" as PolicyId,
    organizationId: "organizationId",
    data,
    enabled,
    type,
  });
}

describe("leastPrivilege", () => {
  it("should return the accumulator when the policy type does not apply", () => {
    const policy = createPolicy({}, PolicyType.RequireSso);

    const result = preferPassword(DisabledGeneratorNavigationPolicy, policy);

    expect(result).toEqual(DisabledGeneratorNavigationPolicy);
  });

  it("should return the accumulator when the policy is not enabled", () => {
    const policy = createPolicy({}, PolicyType.PasswordGenerator, false);

    const result = preferPassword(DisabledGeneratorNavigationPolicy, policy);

    expect(result).toEqual(DisabledGeneratorNavigationPolicy);
  });

  it("should take the %p from the policy", () => {
    const policy = createPolicy({ defaultType: "passphrase" });

    const result = preferPassword({ ...DisabledGeneratorNavigationPolicy }, policy);

    expect(result).toEqual({ defaultType: "passphrase" });
  });

  it("should override passphrase with password", () => {
    const policy = createPolicy({ defaultType: "password" });

    const result = preferPassword({ defaultType: "passphrase" }, policy);

    expect(result).toEqual({ defaultType: "password" });
  });

  it("should not override password", () => {
    const policy = createPolicy({ defaultType: "passphrase" });

    const result = preferPassword({ defaultType: "password" }, policy);

    expect(result).toEqual({ defaultType: "password" });
  });
});

describe("GeneratorNavigationEvaluator", () => {
  describe("policyInEffect", () => {
    it.each([["passphrase"], ["password"]] as const)(
      "returns true if the policy has a defaultType (= %p)",
      (defaultType) => {
        const evaluator = new GeneratorNavigationEvaluator({ defaultType });

        expect(evaluator.policyInEffect).toEqual(true);
      },
    );

    it.each([[undefined], [null], ["" as any]])(
      "returns false if the policy has a falsy defaultType (= %p)",
      (defaultType) => {
        const evaluator = new GeneratorNavigationEvaluator({ defaultType });

        expect(evaluator.policyInEffect).toEqual(false);
      },
    );
  });

  describe("applyPolicy", () => {
    it("returns the input options", () => {
      const evaluator = new GeneratorNavigationEvaluator(null);
      const options = { type: "password" as const };

      const result = evaluator.applyPolicy(options);

      expect(result).toEqual(options);
    });
  });

  describe("sanitize", () => {
    it.each([["passphrase"], ["password"]] as const)(
      "defaults options to the policy's default type (= %p) when a policy is in effect",
      (defaultType) => {
        const evaluator = new GeneratorNavigationEvaluator({ defaultType });

        const result = evaluator.sanitize({});

        expect(result).toEqual({ type: defaultType });
      },
    );

    it("defaults options to the default generator navigation type when a policy is not in effect", () => {
      const evaluator = new GeneratorNavigationEvaluator(null);

      const result = evaluator.sanitize({});

      expect(result.type).toEqual(DefaultGeneratorNavigation.type);
    });

    it("retains the options type when it is set", () => {
      const evaluator = new GeneratorNavigationEvaluator({ defaultType: "passphrase" });

      const result = evaluator.sanitize({ type: "password" });

      expect(result).toEqual({ type: "password" });
    });
  });
});
