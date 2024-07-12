export async function load(envName) {
  return {
    ...(await loadConfig(envName)),
    ...(await loadConfig("local")),
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
    const data = await import(`./${configName}.json`, { assert: { type: "json" } });
    return data;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.code);
    }
    if (e instanceof Error && e.code === "ERR_MODULE_NOT_FOUND") {
      return {};
    } else {
      throw e;
    }
  }
}
