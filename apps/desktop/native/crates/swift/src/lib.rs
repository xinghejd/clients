use std::{collections::VecDeque, time::Duration, sync::{RwLock, Arc, Mutex}};

use desktop_core::ipc_client;
use tokio::time::sleep;

#[derive(Debug, thiserror::Error)]
pub enum IpcError {
    #[error("test")]
    Test,
}

pub trait MessageCallback: Send {
    fn message(&self, message: String);
}

#[derive(Debug)]
pub struct IpcClient {
    messages: Arc<Mutex<VecDeque<String>>>,
}

impl IpcClient {
    fn new() -> Self {
        Self {
            messages: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    fn start(&self, callback: Box<dyn MessageCallback>) {
        let rt = tokio::runtime::Runtime::new().unwrap();

        let messages = self.messages.clone();

        rt.block_on(async {
            let (in_tx, in_rx) = tokio::sync::mpsc::channel(32);
            let (out_tx, mut out_rx) = tokio::sync::mpsc::channel(32);

            ipc_client::start(out_tx, in_rx);

            tokio::spawn(async move {
                loop {
                    if let Some(msg) = out_rx.recv().await {
                        callback.message(msg);
                    }
                    sleep(Duration::from_millis(100)).await;
                }
            });

            tokio::spawn(async move {
                loop {
                    let msg = messages.lock().unwrap().pop_front();
                    if let Some(msg) = msg {
                        in_tx.send(msg).await.unwrap();
                    }
                    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                }
            });

            loop {
                sleep(Duration::from_secs(1)).await;
            }
        });
    }

    fn send(&self, message: String) {
        self.messages.lock().unwrap().push_back(message);
    }
}

uniffi_macros::include_scaffolding!("ipc");
