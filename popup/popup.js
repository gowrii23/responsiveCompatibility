function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function showError(text) {
  const el = document.getElementById("error");
  el.hidden = !text;
  el.textContent = text || "";
}

async function openTester(url) {
  showError("");
  if (!isHttpUrl(url)) {
    showError("Enter a full http:// or https:// URL, or open a website tab.");
    return;
  }

  const origin = `${new URL(url).origin}/*`;
  try {
    await chrome.permissions.request({ origins: [origin] });
  } catch {
    // Permission prompts can only run from a user gesture; ignore if unavailable.
  }

  const result = await chrome.runtime.sendMessage({ type: "open-viewer", url });
  if (!result?.ok) {
    showError(result?.error || "Could not open the tester.");
    return;
  }
  window.close();
}

async function fillCurrent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && isHttpUrl(tab.url)) {
    document.getElementById("url").value = tab.url;
    return tab.url;
  }
  return "";
}

async function renderRecent() {
  const { recentUrls = [] } = await chrome.storage.local.get("recentUrls");
  const wrap = document.getElementById("recent-wrap");
  const list = document.getElementById("recent");
  list.innerHTML = "";
  if (!recentUrls.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  for (const url of recentUrls) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = url;
    button.addEventListener("click", () => openTester(url));
    item.append(button);
    list.append(item);
  }
}

document.getElementById("open-form").addEventListener("submit", (event) => {
  event.preventDefault();
  openTester(document.getElementById("url").value.trim());
});

document.getElementById("current").addEventListener("click", async () => {
  const url = await fillCurrent();
  if (!url) {
    showError("This tab is not a website. Open a page first, or paste a URL.");
    return;
  }
  await openTester(url);
});

document.getElementById("options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

await fillCurrent();
await renderRecent();
