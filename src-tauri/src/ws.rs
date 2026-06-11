use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{
    connect_async,
    tungstenite::{
        client::IntoClientRequest,
        http::HeaderValue,
        Message,
    },
};

const MAIN_SESSION: &str = "main";

#[derive(Debug, Deserialize)]
pub struct WsConnectPayload {
    pub url: String,
    pub headers: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WsStatusEvent {
    pub session_id: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WsMessageEvent {
    pub session_id: String,
    pub direction: String,
    pub content: String,
    pub timestamp: u64,
}

struct ActiveSession {
    send_tx: mpsc::Sender<String>,
    abort: tokio::task::JoinHandle<()>,
}

pub struct WsState {
    inner: Mutex<Option<ActiveSession>>,
}

impl WsState {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(None),
        }
    }
}

fn emit_status(app: &AppHandle, status: &str, message: Option<String>) {
    let _ = app.emit(
        "ws-status",
        WsStatusEvent {
            session_id: MAIN_SESSION.to_string(),
            status: status.to_string(),
            message,
        },
    );
}

fn emit_message(app: &AppHandle, direction: &str, content: String) {
    let _ = app.emit(
        "ws-message",
        WsMessageEvent {
            session_id: MAIN_SESSION.to_string(),
            direction: direction.to_string(),
            content,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0),
        },
    );
}

async fn disconnect_internal(state: &WsState) {
    let mut guard = state.inner.lock().await;
    if let Some(session) = guard.take() {
        session.abort.abort();
    }
}

#[tauri::command]
pub async fn ws_connect(
    app: AppHandle,
    state: State<'_, WsState>,
    payload: WsConnectPayload,
) -> Result<String, String> {
    disconnect_internal(&state).await;
    emit_status(&app, "connecting", None);

    let url = payload.url.trim();
    if url.is_empty() {
        let msg = "WebSocket URL is empty".to_string();
        emit_status(&app, "error", Some(msg.clone()));
        return Err(msg);
    }

    let mut request = url
        .into_client_request()
        .map_err(|e| format!("Invalid WebSocket URL: {e}"))?;

    for (key, value) in payload.headers {
        if key.is_empty() {
            continue;
        }
        let header_name = key
            .parse::<http::HeaderName>()
            .map_err(|e| format!("Invalid header name '{key}': {e}"))?;
        let header_value = HeaderValue::from_str(&value)
            .map_err(|e| format!("Invalid header value for '{key}': {e}"))?;
        request.headers_mut().insert(header_name, header_value);
    }

    let (ws_stream, _) = connect_async(request)
        .await
        .map_err(|e| {
            let msg = format!("WebSocket connection failed: {e}");
            emit_status(&app, "error", Some(msg.clone()));
            msg
        })?;

    emit_status(&app, "connected", None);

    let (mut write, mut read) = ws_stream.split();
    let (send_tx, mut send_rx) = mpsc::channel::<String>(64);
    let app_read = app.clone();
    let app_write = app.clone();

    let read_task = tokio::spawn(async move {
        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => emit_message(&app_read, "received", text.to_string()),
                Ok(Message::Binary(data)) => {
                    emit_message(&app_read, "received", format!("[binary {} bytes]", data.len()))
                }
                Ok(Message::Ping(_)) | Ok(Message::Pong(_)) => {}
                Ok(Message::Close(frame)) => {
                    let reason = frame
                        .map(|f| f.reason.to_string())
                        .unwrap_or_else(|| "Connection closed".to_string());
                    emit_status(&app_read, "disconnected", Some(reason));
                    break;
                }
                Ok(_) => {}
                Err(err) => {
                    emit_status(&app_read, "error", Some(format!("Read error: {err}")));
                    break;
                }
            }
        }
        emit_status(&app_read, "disconnected", None);
    });

    let write_task = tokio::spawn(async move {
        while let Some(text) = send_rx.recv().await {
            if write.send(Message::Text(text.into())).await.is_err() {
                emit_status(&app_write, "error", Some("Failed to send message".to_string()));
                break;
            }
        }
    });

    let abort = tokio::spawn(async move {
        tokio::select! {
            _ = read_task => {},
            _ = write_task => {},
        }
    });

    let mut guard = state.inner.lock().await;
    *guard = Some(ActiveSession { send_tx, abort });

    Ok(MAIN_SESSION.to_string())
}

#[tauri::command]
pub async fn ws_disconnect(state: State<'_, WsState>, app: AppHandle) -> Result<(), String> {
    disconnect_internal(&state).await;
    emit_status(&app, "disconnected", Some("Disconnected by user".to_string()));
    Ok(())
}

#[tauri::command]
pub async fn ws_send(
    state: State<'_, WsState>,
    session_id: String,
    message: String,
    app: AppHandle,
) -> Result<(), String> {
    if session_id != MAIN_SESSION {
        return Err(format!("Unknown session: {session_id}"));
    }

    let guard = state.inner.lock().await;
    let session = guard
        .as_ref()
        .ok_or_else(|| "WebSocket is not connected".to_string())?;

    session
        .send_tx
        .send(message.clone())
        .await
        .map_err(|_| "Failed to queue message".to_string())?;

    emit_message(&app, "sent", message);
    Ok(())
}
