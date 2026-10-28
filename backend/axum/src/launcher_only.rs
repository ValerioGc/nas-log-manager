//! Socket listener that accepts only the launcher, the app user and root.
//!
//! Every app shares the group of the sockets folder, so file permissions are not enough.
//! Each peer uid is checked against the owner of the folder, which is the launcher, and the owner
//! of the socket.

use axum::serve::Listener;
use std::{io, os::unix::fs::MetadataExt};
use tokio::net::{unix::SocketAddr, UnixListener, UnixStream};

pub struct LauncherOnly {
    listener: UnixListener,
    launcher: Option<u32>,
    own: Option<u32>,
}

impl LauncherOnly {
    pub fn new(listener: UnixListener) -> Self {
        let socket = listener
            .local_addr()
            .ok()
            .and_then(|address| address.as_pathname().map(ToOwned::to_owned));
        let owner =
            |path: &std::path::Path| std::fs::metadata(path).ok().map(|metadata| metadata.uid());
        let launcher = socket
            .as_deref()
            .map(folder_of)
            .and_then(|folder| owner(&folder));
        let own = socket.as_deref().and_then(owner);
        Self {
            listener,
            launcher,
            own,
        }
    }

    fn admits(&self, uid: u32) -> bool {
        uid == 0 || Some(uid) == self.launcher || Some(uid) == self.own
    }
}

/// Parent folder of the socket, or the current folder for a bare name
fn folder_of(socket: &std::path::Path) -> std::path::PathBuf {
    match socket.parent() {
        Some(folder) if !folder.as_os_str().is_empty() => folder.to_owned(),
        _ => std::path::PathBuf::from("."),
    }
}

impl Listener for LauncherOnly {
    type Io = UnixStream;
    type Addr = SocketAddr;

    async fn accept(&mut self) -> (Self::Io, Self::Addr) {
        loop {
            let (stream, address) = Listener::accept(&mut self.listener).await;
            match stream.peer_cred() {
                Ok(peer) if self.admits(peer.uid()) => return (stream, address),
                Ok(peer) => eprintln!(
                    "<4>Connection refused for uid {}, only the launcher, the app user and root are allowed",
                    peer.uid()
                ),
                Err(error) => eprintln!("<4>Connection refused without peer credentials: {error}"),
            }
        }
    }

    fn local_addr(&self) -> io::Result<Self::Addr> {
        self.listener.local_addr()
    }
}

#[cfg(test)]
#[path = "../tests/unit/axum/launcher_only.rs"]
mod tests;
