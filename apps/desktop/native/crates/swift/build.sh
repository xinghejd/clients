#!/usr/bin/env bash

cargo build
cp ../../target/debug/libdesktop_swift.a IpcFFI.framework/IpcFFI
rm -r Ipc/Sources/IpcFFI.xcframework
xcodebuild -create-xcframework -framework ./IpcFFI.framework -output Ipc/Sources/IpcFFI.xcframework

exit
uniffi-bindgen scaffolding ./src/ipc.udl
uniffi-bindgen generate ./src/ipc.udl --language swift --out-dir generated
swiftc \
    -module-name ipc \
    -emit-library -o generated/libdesktop_swift.dylib \
    -emit-module -emit-module-path ./ \
    -parse-as-library \
    -L ../../target/debug/ \
    -libdesktop_swift \
    -Xcc -fmodule-map-file=generated/ipcFFI.modulemap \
    generated/ipc.swift \
