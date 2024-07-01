const child = require("child_process");
const fse = require("fs-extra");

const paths = {
  extensionBuild: "./macos/build",
  macOsProject: "./macos/desktop.xcodeproj",
};

async function buildMacOs(cb) {
  if (fse.existsSync(paths.extensionBuild)) {
    fse.removeSync(paths.extensionBuild);
  }

  const proc = child.spawn("xcodebuild", [
    "-project",
    paths.macOsProject,
    "-alltargets",
    "-configuration",
    "Release",
  ]);
  stdOutProc(proc);
  await new Promise((resolve, reject) =>
    proc.on("close", (code) => {
      if (code > 0) {
        console.error("xcodebuild failed with code", code);
        return reject(new Error(`xcodebuild failed with code ${code}`));
      }
      console.log("xcodebuild success");
      resolve();
    }),
  );
}

function stdOutProc(proc) {
  proc.stdout.on("data", (data) => console.log(data.toString()));
  proc.stderr.on("data", (data) => console.error(data.toString()));
}

exports["build:macos"] = buildMacOs;
