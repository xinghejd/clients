use anyhow::Result;

pub fn obj_hello_world(value: String) -> Result<String> {
    println!("Hello, world! {}", value);
    Ok(value)
}
