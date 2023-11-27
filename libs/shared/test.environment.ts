import JSDOMEnvironment from "jest-environment-jsdom";

/**
 * Maps missing jsdom APIs to the Node.js implementation.
 * Details for each interface are in the FIXME(s) below.
 * @remarks To use this test environment, reference this file
 * in the `testEnvironment` property of the Jest configuration
 * or using `@jest-environment path/to/test.environment.ts`
 * @see https://github.com/facebook/jest/blob/v29.4.3/website/versioned_docs/version-29.4/Configuration.md#testenvironment-string
 */
export default class FixJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args);

    // FIXME https://github.com/jsdom/jsdom/issues/3363#issuecomment-1467894943
    this.global.structuredClone = structuredClone;

    // FIXME https://github.com/jsdom/jsdom/issues/1724#issuecomment-1446858041
    this.global.fetch = fetch;
    this.global.Headers = Headers;
    this.global.Request = Request;
    this.global.Response = Response;
  }
}
