use anyhow::Result;

pub fn run_command(value: String) -> Result<String> {
    desktop_objc::run_command(value)
}
