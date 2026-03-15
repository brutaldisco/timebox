const ALWAYS_ON_TOP_KEY = "timebox.desktop.alwaysOnTop";

export const getAlwaysOnTopStorageKey = () => ALWAYS_ON_TOP_KEY;

export const isDesktopRuntime = () => {
  if (typeof window === "undefined") return false;
  return (
    window.navigator.userAgent.includes("Tauri") ||
    "__TAURI_INTERNALS__" in window
  );
};

export const setDesktopAlwaysOnTop = async (enabled: boolean) => {
  if (!isDesktopRuntime()) return false;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_always_on_top", { enabled });
    return true;
  } catch {
    return false;
  }
};
