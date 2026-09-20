use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::Cursor;

use arboard::{Clipboard, Error as ClipboardError};
use image::ImageFormat;
use serde::Serialize;
use xcap::{Monitor, Window};

#[derive(Serialize)]
pub struct CaptureTarget {
    id: String,
    kind: String,
    label: String,
}

#[tauri::command]
pub fn list_capture_targets() -> Result<Vec<CaptureTarget>, String> {
    let mut targets = Vec::new();

    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    for monitor in monitors {
        let id = monitor.id().map_err(|e| e.to_string())?;
        let name = monitor.name().map_err(|e| e.to_string())?;
        targets.push(CaptureTarget {
            id: id.to_string(),
            kind: "monitor".to_string(),
            label: name,
        });
    }

    let windows = Window::all().map_err(|e| e.to_string())?;
    for window in windows {
        // Minimized windows can't be captured on most platforms; skip them.
        if window.is_minimized().unwrap_or(false) {
            continue;
        }
        let id = window.id().map_err(|e| e.to_string())?;
        let title = window.title().unwrap_or_default();
        let app_name = window.app_name().unwrap_or_default();
        if title.is_empty() {
            continue;
        }
        targets.push(CaptureTarget {
            id: id.to_string(),
            kind: "window".to_string(),
            label: format!("{title} — {app_name}"),
        });
    }

    Ok(targets)
}

#[tauri::command]
pub fn capture_target(kind: String, id: String) -> Result<Vec<u8>, String> {
    let target_id: u32 = id.parse().map_err(|_| "Invalid target id".to_string())?;

    let image = match kind.as_str() {
        "monitor" => {
            let monitor = Monitor::all()
                .map_err(|e| e.to_string())?
                .into_iter()
                .find(|m| m.id().map(|mid| mid == target_id).unwrap_or(false))
                .ok_or_else(|| "Monitor not found".to_string())?;
            monitor.capture_image().map_err(|e| e.to_string())?
        }
        "window" => {
            let window = Window::all()
                .map_err(|e| e.to_string())?
                .into_iter()
                .find(|w| w.id().map(|wid| wid == target_id).unwrap_or(false))
                .ok_or_else(|| "Window not found".to_string())?;
            window.capture_image().map_err(|e| e.to_string())?
        }
        _ => return Err("Unknown capture target kind".to_string()),
    };

    let mut bytes: Vec<u8> = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    Ok(bytes)
}

// Region selection is delegated to Windows' own Snip & Sketch tool (the same
// UI bound to PrtScn / Win+Shift+S) instead of a custom overlay window, since
// window creation/destruction must run on the thread owning the message pump
// and a custom overlay adds native-window complexity for no real benefit here.
// Snip & Sketch copies the selected region to the clipboard when the user
// finishes dragging, so the frontend polls for that instead.
#[tauri::command]
pub fn trigger_native_snip() -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/C", "start", "", "ms-screenclip:"])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn hash_clipboard_image(width: usize, height: usize, bytes: &[u8]) -> u64 {
    let mut hasher = DefaultHasher::new();
    width.hash(&mut hasher);
    height.hash(&mut hasher);
    bytes.hash(&mut hasher);
    hasher.finish()
}

// Cheap poll target: hashes whatever image currently sits on the clipboard
// (or None if there isn't one) without PNG-encoding it, so the frontend can
// poll every ~500ms while the user is dragging a selection without repeatedly
// paying for PNG encoding until something actually changes. Returned as a
// string, not a u64 — JS numbers lose precision above 2^53 and this only
// ever needs to support equality comparison, not arithmetic.
#[tauri::command]
pub fn clipboard_image_signature() -> Result<Option<String>, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    match clipboard.get_image() {
        Ok(image_data) => Ok(Some(
            hash_clipboard_image(image_data.width, image_data.height, &image_data.bytes).to_string(),
        )),
        Err(ClipboardError::ContentNotAvailable) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn read_clipboard_image_png() -> Result<Vec<u8>, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    let image_data = clipboard.get_image().map_err(|e| e.to_string())?;
    let width = image_data.width as u32;
    let height = image_data.height as u32;
    let buffer: image::RgbaImage = image::ImageBuffer::from_raw(width, height, image_data.bytes.into_owned())
        .ok_or_else(|| "Invalid clipboard image buffer".to_string())?;

    let mut bytes: Vec<u8> = Vec::new();
    buffer
        .write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    Ok(bytes)
}
