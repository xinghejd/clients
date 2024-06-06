use anyhow::bail;
use napi::threadsafe_function::{ErrorStrategy::CalleeHandled, ThreadsafeFunction};

pub async fn authenticate(challenge: String, origin: String, pin: Option<String>, touch_required_callback: ThreadsafeFunction<(), CalleeHandled>, no_devices_callback: ThreadsafeFunction<(), CalleeHandled>) -> Result<String, anyhow::Error> {
    bail!("Not implemented")
}