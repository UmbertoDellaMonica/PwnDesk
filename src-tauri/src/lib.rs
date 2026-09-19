mod screenshot;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            screenshot::list_capture_targets,
            screenshot::capture_target,
            screenshot::trigger_native_snip,
            screenshot::clipboard_image_signature,
            screenshot::read_clipboard_image_png
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
