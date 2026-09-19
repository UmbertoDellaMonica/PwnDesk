import { invoke } from "@tauri-apps/api/core";

export interface CaptureTarget {
  id: string;
  kind: "monitor" | "window";
  label: string;
}

export function listCaptureTargets(): Promise<CaptureTarget[]> {
  return invoke("list_capture_targets");
}

export async function captureTarget(kind: string, id: string): Promise<Blob> {
  const bytes = await invoke<number[]>("capture_target", { kind, id });
  return new Blob([new Uint8Array(bytes)], { type: "image/png" });
}

// Region selection is delegated to Windows' own Snip & Sketch tool (same UI
// as PrtScn / Win+Shift+S) rather than a custom overlay window — see
// screenshot.rs for why. It copies the selection to the clipboard when the
// user finishes dragging; triggerNativeSnip just launches it, and the caller
// polls clipboardImageSignature() until it changes from a recorded baseline.
export function triggerNativeSnip(): Promise<void> {
  return invoke("trigger_native_snip");
}

export function clipboardImageSignature(): Promise<string | null> {
  return invoke("clipboard_image_signature");
}

export async function readClipboardImagePng(): Promise<Blob> {
  const bytes = await invoke<number[]>("read_clipboard_image_png");
  return new Blob([new Uint8Array(bytes)], { type: "image/png" });
}
