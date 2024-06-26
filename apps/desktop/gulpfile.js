const child = require("child_process");

const paths = {
  build: "./build/",
  dist: "./dist/",
  node_modules: "./node_modules/",
  macOsProject: "./macos/desktop.xcodeproj",
  macOsBuild: "./build-macos",
};

async function buildMacOs(cb) {
  const proc = child.spawn("xcodebuild", [
    "-project",
    paths.macOsProject,
    "-alltargets",
    "-configuration",
    "Release",
  ]);
  stdOutProc(proc);
  await new Promise((resolve) => proc.on("close", resolve));
}

function stdOutProc(proc) {
  proc.stdout.on("data", (data) => console.log(data.toString()));
  proc.stderr.on("data", (data) => console.error(data.toString()));
}

exports["build:macos"] = buildMacOs;
