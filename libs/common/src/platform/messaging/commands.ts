import { CommandDefinition } from "./types";

/** Command to cancel process realod */
export const CANCEL_PROCESS_RELOAD = new CommandDefinition<Record<string, never>>(
  "cancelProcessReload",
);
/** Response to `CANCEL_PROCESS_RELOAD` indicating whether process reload was cancelled */
export const CANCELLED_PROCESS_RELOAD = new CommandDefinition<{ cancelled: boolean }>(
  "cancelledProcessReload",
);
