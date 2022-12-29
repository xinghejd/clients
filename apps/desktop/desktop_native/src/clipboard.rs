use anyhow::{Result};
use arboard::{Clipboard, SetExtWindows};

pub fn read() -> Result<String> {
    let mut clipboard = Clipboard::new()?;

    Ok(clipboard.get_text()?)
}

pub fn write(text: String, password: bool) -> Result<()> {
    let mut clipboard = Clipboard::new()?;

    let mut set = clipboard.set();

    if password {
        if cfg!(windows) {
            set = set.exclude_from_history();
        }
    }

    set.text(text)?;
    Ok(())
}
