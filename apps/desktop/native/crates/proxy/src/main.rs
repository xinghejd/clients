use anyhow::Result;
use std::{
    io::{self, Read, Write, stdin},
    path::PathBuf,
    sync::Arc,
    time::Duration,
};

use anyhow::Error;
use env_logger::Env;
use log::{debug, info};
use parity_tokio_ipc::Endpoint;
use tokio::{
    io::{split, AsyncReadExt, AsyncWriteExt},
    sync::Mutex,
    time::sleep,
};

#[tokio::main]
async fn main() {
    env_logger::Builder::from_env(Env::default().default_filter_or("debug")).init();

    eprintln!(r" ____  _ _                         _            ");
    eprintln!(r"| __ )(_) |___      ____ _ _ __ __| | ___ _ __  ");
    eprintln!(r"|  _ \| | __\ \ /\ / / _` | '__/ _` |/ _ \ '_ \ ");
    eprintln!(r"| |_) | | |_ \ V  V / (_| | | | (_| |  __/ | | |");
    eprintln!(r"|____/|_|\__| \_/\_/ \__,_|_|  \__,_|\___|_| |_|");
    eprintln!();
    eprintln!("Starting Bitwarden IPC Proxy.");

    let (in_tx, in_rx) = tokio::sync::mpsc::channel(32);
    let (out_tx, mut out_rx) = tokio::sync::mpsc::channel(32);

    start_ipc(out_tx, in_rx);

    tokio::spawn(async move {
        loop {
            if let Some(msg) = out_rx.recv().await {
                write(msg);
            }
            sleep(Duration::from_millis(100)).await;
        }
    });

    loop {
        match read(stdin()) {
            Ok(msg) => {
                in_tx.send(String::from_utf8(msg).unwrap()).await.unwrap();
            }
            Err(e) => {
                eprintln!("Error: {}", e);
            }
        }
    }
}

fn start_ipc(tx: tokio::sync::mpsc::Sender<String>, rx: tokio::sync::mpsc::Receiver<String>) {
    let path: PathBuf = if cfg!(windows) {
        PathBuf::from(r"\\.\pipe\bitwarden.sock")
    } else {
        dirs::home_dir().unwrap().join("tmp").join("bitwarden.sock")
    };

    let mrx = Arc::new(Mutex::new(rx));

    tokio::spawn(async move {
        loop {
            info!("Attempting to connect to {}", path.display());

            let client = Endpoint::connect(&path).await;

            let mrx = mrx.clone();

            if let Ok(c) = client {
                info!("Connected to {}", path.display());

                let (mut reader, mut writer) = split(c);

                write("{\"command\":\"connected\"}".to_owned());

                // Start output task
                let task = tokio::spawn(async move {
                    loop {
                        if let Some(msg) = mrx.lock().await.recv().await {
                            debug!("SENDING: {}", msg);
                            writer.write_all(msg.as_bytes()).await.unwrap();
                        }
                    }
                });

                // Listening
                loop {
                    let mut buffer = vec![0; 4096].into_boxed_slice();

                    let n = reader.read(&mut buffer[..]).await.unwrap();
                    let s = String::from_utf8_lossy(&buffer[..n]).to_string();

                    if n == 0 {
                        write("{\"command\":\"disconnected\"}".to_owned());
                        info!("Connection closed");
                        break;
                    }

                    debug!("RECEIVED: {}", s);
                    tx.send(s).await.unwrap();

                    sleep(Duration::from_millis(100)).await;
                }
            } else {
                info!("Failed to connect to {}", path.display());
            }

            sleep(Duration::from_secs(5)).await;
        }
    });
}

/// Write a message to stdout. The message is prefixed with its length.
///
/// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
fn write(message: String) {
    let bytes = message.as_bytes();
    let header: [u8; 4] = (bytes.len() as u32).to_ne_bytes();
    io::stdout().write(&header).ok();
    io::stdout().write(bytes).ok();
    io::stdout().flush().ok();
}

/// Read input from stdin. The input is expected to be prefixed with its length.
///
/// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
pub fn read<R: Read>(mut input: R) -> Result<Vec<u8>> {
    let mut buf = [0; 4];
    let length = input
        .read_exact(&mut buf)
        .map(|()| u32::from_ne_bytes(buf))?;

    let mut buffer = vec![0; length as usize];
    input.read_exact(&mut buffer)?;
    Ok(buffer)
}
