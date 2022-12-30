use std::sync::Arc;

use futures::StreamExt as _;

use anyhow::Result;
use once_cell::sync::Lazy;
use parity_tokio_ipc::{Endpoint, SecurityAttributes};
use tokio::{
    io::{split, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    sync::Mutex,
};

#[derive(Debug)]
pub struct Message {
    pub client_id: u32,
    pub kind: MessageType,
    pub message: String,
}

#[derive(Debug)]
pub enum MessageType {
    Connected,
    Disconnected,
    Message,
}

pub struct IpcContext {
    messages: Vec<String>,
}

trait Ty: AsyncWrite + Unpin + Send {}
impl<T: AsyncWrite + Unpin + Send> Ty for T {}

static INSTANCE: Lazy<Mutex<IpcContext>> = Lazy::new(|| {
    Mutex::new(IpcContext {
        messages: Vec::new(),
    })
});

pub async fn start(tx: tokio::sync::mpsc::Sender<Message>) {
    let path = r"\\.\pipe\bitwarden.sock";

    let mut endpoint = Endpoint::new(path.to_owned());
    endpoint.set_security_attributes(SecurityAttributes::allow_everyone_create().unwrap());

    let incoming = endpoint.incoming().expect("failed to open new socket");
    futures::pin_mut!(incoming);

    let connections: Arc<Mutex<Vec<Arc<Mutex<Box<dyn Ty>>>>>> = Arc::new(Mutex::new(Vec::new()));

    let c = connections.clone();
    tokio::spawn(async move {
        loop {
            let msg = INSTANCE.lock().await.messages.pop();
            if let Some(msg) = msg {
                print!("Sending message2: {}", msg);
                for connection in c.lock().await.iter_mut() {
                    connection
                        .lock()
                        .await
                        .write_all(msg.as_bytes())
                        .await
                        .unwrap();
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
    });

    let mut nextClientId = 1;
    while let Some(result) = incoming.next().await {
        match result {
            Ok(stream) => {
                let (mut reader, mut writer) = split(stream);
                let client_id = nextClientId;
                nextClientId += 1;

                let mutex: Arc<Mutex<Box<dyn Ty>>> = Arc::new(Mutex::new(Box::new(writer)));

                connections.lock().await.push(mutex.clone());
                //let x = Arc::new(Mutex::new(writer));
                //connections.push(x);
                let tx2 = tx.clone();

                tx2.send(Message {
                    client_id: client_id,
                    kind: MessageType::Connected,
                    message: "Connected".to_owned(),
                })
                .await
                .unwrap();

                tokio::spawn(async move {
                    loop {
                        let mut buf = [0u8; 4];
                        if let Err(_) = reader.read_exact(&mut buf).await {
                            tx2.send(Message {
                                client_id: client_id,
                                kind: MessageType::Disconnected,
                                message: "Disconnected".to_owned(),
                            })
                            .await
                            .unwrap();
                            break;
                        }
                        let msg = std::str::from_utf8(&buf[..]);
                        println!("Sending message: {}", msg.unwrap());

                        tx2.send(Message {
                            client_id: client_id,
                            kind: MessageType::Message,
                            message: msg.unwrap().to_owned(),
                        })
                        .await
                        .unwrap();
                    }
                });
            }
            _ => unreachable!("ideally"),
        }
    }
}

pub async fn send(message: String) -> Result<()> {
    INSTANCE.lock().await.messages.push(message);
    Ok(())
}
