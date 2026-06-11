mod ws;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};

#[derive(Debug, Deserialize)]
pub struct HttpRequestPayload {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub timeout_secs: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct HttpResponsePayload {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub duration_ms: u64,
    pub size_bytes: u64,
}

#[tauri::command]
async fn send_http_request(payload: HttpRequestPayload) -> Result<HttpResponsePayload, String> {
    let timeout = Duration::from_secs(payload.timeout_secs.unwrap_or(30));
    let client = reqwest::Client::builder()
        .timeout(timeout)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    let method = payload.method.to_uppercase();
    let mut request = match method.as_str() {
        "GET" => client.get(&payload.url),
        "POST" => client.post(&payload.url),
        other => return Err(format!("Unsupported HTTP method: {other}")),
    };

    for (key, value) in payload.headers {
        request = request.header(key, value);
    }

    if let Some(body) = payload.body {
        if !body.is_empty() {
            request = request.body(body);
        }
    }

    let started = Instant::now();
    let response = request
        .send()
        .await
        .map_err(format_network_error)?;

    let status = response.status();
    let status_text = status.canonical_reason().unwrap_or("Unknown").to_string();
    let header_map: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;
    let size_bytes = body_bytes.len() as u64;
    let body = String::from_utf8_lossy(&body_bytes).into_owned();
    let duration_ms = started.elapsed().as_millis() as u64;

    Ok(HttpResponsePayload {
        status: status.as_u16(),
        status_text,
        headers: header_map,
        body,
        duration_ms,
        size_bytes,
    })
}

fn format_network_error(err: reqwest::Error) -> String {
    if err.is_timeout() {
        return "Connection timed out. Check the URL or increase timeout in Settings.".to_string();
    }
    if err.is_connect() {
        return format!("Cannot connect to server: {err}");
    }
    if err.is_request() {
        return format!("Invalid request: {err}");
    }
    format!("Network error: {err}")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(ws::WsState::new())
        .invoke_handler(tauri::generate_handler![
            send_http_request,
            ws::ws_connect,
            ws::ws_disconnect,
            ws::ws_send,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
