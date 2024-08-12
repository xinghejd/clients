export async function load(envName) {
  const base = (await import("./config/base.json", { assert: { type: "json" } })).default;
  const env = await loadConfig(envName);
  const local = await loadConfig("local");

  return {
    ...base,
    ...env,
    ...local,
    dev: {
      ...base.dev,
      ...env.dev,
      ...local.dev,
    },
    flags: {
      ...base.flags,
      ...env.flags,
      ...local.flags,
    },
    devFlags: {
      ...base.devFlags,
      ...env.devFlags,
      ...local.devFlags,
    },
  };
}

export function log(configObj) {
  const repeatNum = 50;
  console.log(`${"=".repeat(repeatNum)}\nenvConfig`);
  console.log(JSON.stringify(configObj, null, 2));
  console.log(`${"=".repeat(repeatNum)}`);
}

async function loadConfig(configName) {
  try {
    return (await import(`./config/${configName}.json`, { assert: { type: "json" } })).default;
  } catch (e) {
    if (e instanceof Error && e.code === "MODULE_NOT_FOUND") {
      return {};
    } else {
      throw e;
    }
  }
}
