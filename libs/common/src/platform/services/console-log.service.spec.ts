import { interceptConsole, restoreConsole } from "../../../spec";

import { ConsoleLogService } from "./console-log.service";

describe("ConsoleLogService", () => {
  const error = new Error("this is an error");
  const obj = { a: 1, b: 2 };
  let consoleSpy: {
    log: jest.Mock<any, any>;
    warn: jest.Mock<any, any>;
    error: jest.Mock<any, any>;
  };
  let logService: ConsoleLogService;

  beforeEach(() => {
    consoleSpy = interceptConsole();
    logService = new ConsoleLogService(true);
  });

  afterEach(() => {
    restoreConsole();
    jest.resetAllMocks();
  });

  it("filters messages below the set threshold", () => {
    logService = new ConsoleLogService(true, () => false);
    logService.debug("debug", error, obj);
    logService.info("info", error, obj);
    logService.warning("warning", error, obj);
    logService.error("error", error, obj);

    expect(consoleSpy.log).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.error).not.toHaveBeenCalled();
  });

  it("writes messages when no filter is set", () => {
    logService = new ConsoleLogService(true, null);
    logService.debug("debug", error, obj);
    logService.info("info", error, obj);
    logService.warning("warning", error, obj);
    logService.error("error", error, obj);

    expect(consoleSpy.log).toHaveBeenCalledTimes(2);
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.error).toHaveBeenCalledTimes;
  });

  describe("updateFilter", () => {
    it("updates filter behavior", () => {
      logService = new ConsoleLogService(true, () => false);
      logService.debug("debug", error, obj);

      expect(consoleSpy.log).not.toHaveBeenCalled();

      logService.updateFilter(() => true);

      logService.debug("debug", error, obj);
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    });
  });

  it("only writes debug messages in dev mode", () => {
    logService = new ConsoleLogService(false);

    logService.debug("debug message");
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it("writes debug/info messages to console.log", () => {
    logService.debug("this is a debug message", error, obj);
    logService.info("this is an info message", error, obj);

    expect(consoleSpy.log).toHaveBeenCalledTimes(2);
    expect(consoleSpy.log).toHaveBeenCalledWith("this is a debug message", error, obj);
    expect(consoleSpy.log).toHaveBeenCalledWith("this is an info message", error, obj);
  });

  it("writes warning messages to console.warn", () => {
    logService.warning("this is a warning message", error, obj);

    expect(consoleSpy.warn).toHaveBeenCalledWith("this is a warning message", error, obj);
  });

  it("writes error messages to console.error", () => {
    logService.error("this is an error message", error, obj);

    expect(consoleSpy.error).toHaveBeenCalledWith("this is an error message", error, obj);
  });
});
