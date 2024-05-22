const { pathsToModuleNameMapper } = require("ts-jest");

const { compilerOptions } = require("../../../shared/tsconfig.libs");

/** @type {import('jest').Config} */
module.exports = {
  testMatch: ["**/+(*.)+(spec).+(ts)"],
  preset: "ts-jest",
  testEnvironment: "../../../shared/test.environment.js",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
    prefix: "<rootDir>/../../../",
  }),
};
