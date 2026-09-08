import {
  DEFAULT_LEFT,
  DEFAULT_RIGHT,
  DEVICE_PRESETS,
  getDevice,
  viewportSize
} from "./devices.js";

const STORAGE_KEYS = {
  leftDevice: "leftDevice",
  rightDevice: "rightDevice",
  leftOrientation: "leftOrientation",
  rightOrientation: "rightOrientation",
  leftCustom: "leftCustom",
  rightCustom: "rightCustom"
};

const isExtension = Boolean(globalThis.chrome?.runtime?.id);

const els = {
  form: document.getElementById("url-form"),
  url: document.getElementById("url-input"),
  banner: document.getElementById("permission-banner"),
  grant: document.getElementById("grant-access"),
  reload: document.getElementById("reload-both"),
  windows: document.getElementById("open-windows"),
  leftDevice: document.getElementById("left-device"),
  rightDevice: document.getElementById("right-device"),
  leftOrientation: document.getElementById("left-orientation"),
  rightOrientation: document.getElementById("right-orientation"),
  leftCustom: document.getElementById("left-custom"),
  rightCustom: document.getElementById("right-custom"),
  leftWidth: document.getElementById("left-width"),
  leftHeight: document.getElementById("left-height"),
  rightWidth: document.getElementById("right-width"),
  rightHeight: document.getElementById("right-height"),
  leftMeta: document.getElementById("left-meta"),
  rightMeta: document.getElementById("right-meta"),
  leftStage: document.getElementById("left-stage"),
  rightStage: document.getElementById("right-stage"),
  leftFrameEl: document.getElementById("left-device-frame"),
  rightFrameEl: document.getElementById("right-device-frame"),
  leftIframe: document.getElementById("left-frame"),
  rightIframe: document.getElementById("right-frame"),
  leftOverlay: document.getElementById("left-overlay"),
  rightOverlay: document.getElementById("right-overlay")
};

function currentTargetUrl() {
  const fromQuery = new URLSearchParams(location.search).get("url");
  const typed = els.url.value.trim();
  return typed || fromQuery || "";
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function fillDeviceSelect(select, selectedId) {
  select.innerHTML = "";
  for (const device of DEVICE_PRESETS) {
    const option = document.createElement("option");
    option.value = device.id;
    option.textContent = device.name;
    select.append(option);
  }
  select.value = selectedId;
}

function paneState(side) {
  const deviceId = els[`${side}Device`].value;
  const orientation = els[`${side}Orientation`].value;
  const device = getDevice(deviceId);
  if (deviceId === "custom") {
    const width = Number(els[`${side}Width`].value) || device.width;
    const height = Number(els[`${side}Height`].value) || device.height;
    return { deviceId, orientation, width, height, type: device.type };
  }
  const size = viewportSize(device, orientation);
  return { deviceId, orientation, width: size.width, height: size.height, type: device.type };
}

function applyDeviceChrome(side) {
  const state = paneState(side);
  const frame = els[`${side}FrameEl`];
  frame.classList.toggle("tablet", state.type !== "phone");
  els[`${side}Custom`].hidden = state.deviceId !== "custom";
}

function fitPane(side) {
  const state = paneState(side);
  const iframe = els[`${side}Iframe`];
  const frame = els[`${side}FrameEl`];
  const stage = els[`${side}Stage`];

  iframe.style.width = `${state.width}px`;
  iframe.style.height = `${state.height}px`;

  const chrome = state.type === "phone" ? 20 : 24;
  const availW = Math.max(stage.clientWidth - 32, 120);
  const availH = Math.max(stage.clientHeight - 32, 120);
  const scale = Math.min(availW / (state.width + chrome), availH / (state.height + chrome), 1);
  frame.style.transform = `scale(${scale})`;

  const percent = Math.round(scale * 100);
  els[`${side}Meta`].textContent = `${state.width}×${state.height} • ${percent}% • ${state.orientation}`;
}

function persistPrefs() {
  if (!isExtension) {
    return;
  }
  chrome.storage.sync.set({
    [STORAGE_KEYS.leftDevice]: els.leftDevice.value,
    [STORAGE_KEYS.rightDevice]: els.rightDevice.value,
    [STORAGE_KEYS.leftOrientation]: els.leftOrientation.value,
    [STORAGE_KEYS.rightOrientation]: els.rightOrientation.value,
    [STORAGE_KEYS.leftCustom]: {
      width: Number(els.leftWidth.value),
      height: Number(els.leftHeight.value)
    },
    [STORAGE_KEYS.rightCustom]: {
      width: Number(els.rightWidth.value),
      height: Number(els.rightHeight.value)
    }
  });
}

function layout() {
  applyDeviceChrome("left");
  applyDeviceChrome("right");
  fitPane("left");
  fitPane("right");
  persistPrefs();
}

async function sendMessage(payload) {
  if (!isExtension) {
    return { ok: false, error: "Not running as an extension." };
  }
  return chrome.runtime.sendMessage(payload);
}

async function checkAccess(url) {
  if (!isExtension || !url) {
    els.banner.hidden = true;
    return true;
  }
  try {
    const origin = `${new URL(url).origin}/*`;
    const granted = await chrome.permissions.contains({ origins: [origin] });
    els.banner.hidden = granted;
    if (granted) {
      await sendMessage({ type: "ensure-rules" });
    }
    return granted;
  } catch {
    els.banner.hidden = false;
    return false;
  }
}

function showOverlay(side, html) {
  const overlay = els[`${side}Overlay`];
  overlay.hidden = !html;
  overlay.innerHTML = html || "";
}

function loadFrames(url) {
  showOverlay("left", "");
  showOverlay("right", "");
  const cacheBust = "";
  els.leftIframe.src = url + cacheBust;
  els.rightIframe.src = url + cacheBust;
}

async function navigate(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    return;
  }
  els.url.value = url;
  const next = new URL(location.href);
  next.searchParams.set("url", url);
  history.replaceState({}, "", next);

  document.title = `Responsiveness — ${url}`;
  await checkAccess(url);
  loadFrames(url);
}

async function restorePrefs() {
  fillDeviceSelect(els.leftDevice, DEFAULT_LEFT);
  fillDeviceSelect(els.rightDevice, DEFAULT_RIGHT);
  els.leftDevice.value = DEFAULT_LEFT;
  els.rightDevice.value = DEFAULT_RIGHT;
  els.leftOrientation.value = "portrait";
  els.rightOrientation.value = "landscape";
  els.leftWidth.value = "390";
  els.leftHeight.value = "844";
  els.rightWidth.value = "1024";
  els.rightHeight.value = "1366";

  if (!isExtension) {
    return;
  }

  const prefs = await chrome.storage.sync.get({
    [STORAGE_KEYS.leftDevice]: DEFAULT_LEFT,
    [STORAGE_KEYS.rightDevice]: DEFAULT_RIGHT,
    [STORAGE_KEYS.leftOrientation]: "portrait",
    [STORAGE_KEYS.rightOrientation]: "landscape",
    [STORAGE_KEYS.leftCustom]: { width: 390, height: 844 },
    [STORAGE_KEYS.rightCustom]: { width: 1024, height: 1366 }
  });

  els.leftDevice.value = prefs[STORAGE_KEYS.leftDevice];
  els.rightDevice.value = prefs[STORAGE_KEYS.rightDevice];
  els.leftOrientation.value = prefs[STORAGE_KEYS.leftOrientation];
  els.rightOrientation.value = prefs[STORAGE_KEYS.rightOrientation];
  els.leftWidth.value = prefs[STORAGE_KEYS.leftCustom]?.width || 390;
  els.leftHeight.value = prefs[STORAGE_KEYS.leftCustom]?.height || 844;
  els.rightWidth.value = prefs[STORAGE_KEYS.rightCustom]?.width || 1024;
  els.rightHeight.value = prefs[STORAGE_KEYS.rightCustom]?.height || 1366;
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  navigate(els.url.value);
});

els.grant.addEventListener("click", async () => {
  const url = normalizeUrl(currentTargetUrl());
  const result = await sendMessage({ type: "request-access", url });
  if (result?.granted) {
    els.banner.hidden = true;
    loadFrames(url);
  }
});

els.reload.addEventListener("click", () => {
  const url = normalizeUrl(currentTargetUrl());
  if (url) {
    loadFrames(url);
  }
});

els.windows.addEventListener("click", async () => {
  const url = normalizeUrl(currentTargetUrl());
  const left = paneState("left");
  const right = paneState("right");
  await sendMessage({ type: "open-windows", url, left, right });
});

for (const id of [
  "left-device",
  "right-device",
  "left-orientation",
  "right-orientation",
  "left-width",
  "left-height",
  "right-width",
  "right-height"
]) {
  document.getElementById(id).addEventListener("change", layout);
}

new ResizeObserver(layout).observe(els.leftStage);
new ResizeObserver(layout).observe(els.rightStage);

els.leftIframe.addEventListener("load", () => showOverlay("left", ""));
els.rightIframe.addEventListener("load", () => showOverlay("right", ""));

await restorePrefs();
layout();

const initial = new URLSearchParams(location.search).get("url");
if (initial) {
  els.url.value = initial;
  await navigate(initial);
} else {
  els.url.placeholder = "https://example.com";
}
