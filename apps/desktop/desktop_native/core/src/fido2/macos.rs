use anyhow::Result;
use desktop_objc::obj_hello_world;

pub fn hello_world(value: String) -> Result<String> {
    obj_hello_world(value)
}

#[cfg(test)]
mod tests {
    // use super::*;
}
