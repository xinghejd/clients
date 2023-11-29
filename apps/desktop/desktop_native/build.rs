extern crate napi_build;
mod target_build;

use target_build::*;

fn main() {
    target_specific_build();
    napi_build::setup();
}
