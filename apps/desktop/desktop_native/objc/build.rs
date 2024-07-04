fn main() {
    cc::Build::new()
        .file("src/native/autofill.m")
        .compile("autofill");
    println!("cargo::rerun-if-changed=src/native/autofill.m");
}
