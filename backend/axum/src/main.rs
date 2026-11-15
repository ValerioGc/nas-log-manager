use axum::{
    extract::State,
    http::Uri,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use nas_app_core::prepare_socket;
use serde_json::json;
use std::{env, path::PathBuf};
use tokio::net::UnixListener;

#[derive(Clone)]
struct AppState {
    ui_dir: PathBuf,
}

async fn health() -> impl IntoResponse {
    Json(json!({"status":"ok","version":env!("CARGO_PKG_VERSION")}))
}

fn ui_dir_for(
    override_dir: Option<PathBuf>,
    executable: Result<PathBuf, String>,
) -> Result<PathBuf, String> {
    if let Some(path) = override_dir {
        return Ok(path);
    }
    let executable = executable?;
    let binary_dir = executable.parent().ok_or("Invalid executable path")?;
    let packaged = binary_dir
        .parent()
        .ok_or("Invalid executable path")?
        .join("dist");
    if packaged.join("index.html").is_file() {
        Ok(packaged)
    } else {
        Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../dist/axum"))
    }
}

fn socket_path(
    args: Vec<std::ffi::OsString>,
    configured: Option<std::ffi::OsString>,
) -> Result<PathBuf, String> {
    let mut listen = configured;
    let mut args = args.into_iter();
    while let Some(arg) = args.next() {
        if arg == "--listen" {
            listen = Some(args.next().ok_or("--listen requires a socket path")?);
        } else {
            return Err(format!("Unrecognized argument: {}", arg.to_string_lossy()));
        }
    }
    let path = PathBuf::from(listen.ok_or("Provide --listen or NAS_APP_SOCKET")?);
    if path.as_os_str().is_empty() {
        return Err("Empty socket path".into());
    }
    Ok(path)
}

async fn static_file(State(state): State<AppState>, uri: Uri) -> Response {
    nas_app_core::serve_static(&state.ui_dir, uri.path()).await
}

async fn run(
    args: Vec<std::ffi::OsString>,
    configured_socket: Option<std::ffi::OsString>,
    configured_ui: Option<PathBuf>,
    shutdown_signal: impl std::future::Future<Output = ()> + Send + 'static,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let path = socket_path(args, configured_socket)?;
    let state = AppState {
        ui_dir: ui_dir_for(
            configured_ui,
            env::current_exe().map_err(|error| error.to_string()),
        )?,
    };
    if !state.ui_dir.join("index.html").is_file() {
        return Err(format!("Frontend not found: {}", state.ui_dir.display()).into());
    }
    prepare_socket(&path).await?;
    let listener = UnixListener::bind(&path)?;
    let app = Router::new()
        .route("/health", get(health))
        .fallback(get(static_file))
        .with_state(state);
    println!("nas-log-manager listening on {}", path.display());
    let result = axum::serve(nas_app_core::LauncherOnly::new(listener), app)
        .with_graceful_shutdown(shutdown_signal)
        .await;
    if let Err(error) = tokio::fs::remove_file(&path).await {
        eprintln!("unable to remove the socket ({error})");
    }
    result?;
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut terminate = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())?;
    run(
        env::args_os().skip(1).collect(),
        env::var_os("NAS_APP_SOCKET"),
        env::var_os("NAS_UI_DIR").map(PathBuf::from),
        async move {
            tokio::select! {
                _ = tokio::signal::ctrl_c() => {},
                _ = terminate.recv() => {},
            }
        },
    )
    .await
}

#[cfg(test)]
#[path = "../tests/unit/axum/main.rs"]
mod tests;
