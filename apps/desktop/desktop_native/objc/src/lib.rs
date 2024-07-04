use anyhow::Result;

pub fn obj_hello_world(value: String) -> Result<String> {
    println!("[OBJC] Hello, world! {}", value);
    Ok(value)
}
