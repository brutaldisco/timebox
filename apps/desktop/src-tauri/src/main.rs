#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

#[tauri::command]
fn set_always_on_top(window: tauri::WebviewWindow, enabled: bool) -> Result<(), String> {
  window
    .set_always_on_top(enabled)
    .map_err(|err| err.to_string())
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_autostart::init(
      MacosLauncher::LaunchAgent,
      None::<Vec<&str>>,
    ))
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![set_always_on_top])
    .setup(|app| {
      let webview_url = if cfg!(debug_assertions) {
        let dev_url = std::env::var("TIMEBOX_DEV_URL")
          .unwrap_or_else(|_| "http://127.0.0.1:3000".to_string());
        let parsed = dev_url
          .parse()
          .expect("TIMEBOX_DEV_URL must be a valid URL");
        WebviewUrl::External(parsed)
      } else if let Ok(remote_url) = std::env::var("TIMEBOX_REMOTE_URL") {
        let parsed = remote_url
          .parse()
          .expect("TIMEBOX_REMOTE_URL must be a valid URL");
        WebviewUrl::External(parsed)
      } else {
        WebviewUrl::App("index.html".into())
      };

      let window = WebviewWindowBuilder::new(app, "main", webview_url)
        .title("Timebox")
        .inner_size(360.0, 520.0)
        .min_inner_size(360.0, 420.0)
        .max_inner_size(360.0, 1200.0)
        .resizable(true)
        .center()
        .always_on_top(true)
        .build()?;
      let _ = window.set_always_on_top(true);

      let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyT);
      let app_handle = app.handle().clone();
      if let Err(err) = app
        .global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, _event| {
          if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        })
      {
        eprintln!("global shortcut handler setup failed: {err}");
      }
      if let Err(err) = app.global_shortcut().register(shortcut) {
        eprintln!("global shortcut registration failed: {err}");
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running timebox desktop");
}
