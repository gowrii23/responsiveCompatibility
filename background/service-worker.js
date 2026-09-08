const EMBED_RULE_ID = 1;
const RECENT_KEY = "recentUrls";
const MAX_RECENT = 8;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function originPattern(url) {
  const parsed = new URL(url);
  return `${parsed.origin}/*`;
}

async function ensureEmbedRules() {
  const rule = {
    id: EMBED_RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        { header: "x-frame-options", operation: "remove" },
        { header: "content-security-policy", operation: "remove" },
        { header: "content-security-policy-report-only", operation: "remove" }
      ]
    },
    condition: {
      resourceTypes: ["sub_frame"],
      initiatorDomains: [chrome.runtime.id]
    }
  };

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [EMBED_RULE_ID],
    addRules: [rule]
  });
}

function viewerUrl(targetUrl) {
  const page = chrome.runtime.getURL("viewer/viewer.html");
  return `${page}?url=${encodeURIComponent(targetUrl)}`;
}

async function rememberUrl(url) {
  if (!isHttpUrl(url)) {
    return;
  }
  const { [RECENT_KEY]: recent = [] } = await chrome.storage.local.get(RECENT_KEY);
  const next = [url, ...recent.filter((item) => item !== url)].slice(0, MAX_RECENT);
  await chrome.storage.local.set({ [RECENT_KEY]: next });
}

async function openViewer(targetUrl) {
  if (!isHttpUrl(targetUrl)) {
    return { ok: false, error: "Only http:// and https:// pages can be tested." };
  }

  await ensureEmbedRules();
  await rememberUrl(targetUrl);

  const existing = await chrome.tabs.query({
    url: `${chrome.runtime.getURL("viewer/viewer.html")}*`
  });

  if (existing[0]?.id) {
    await chrome.tabs.update(existing[0].id, { url: viewerUrl(targetUrl), active: true });
    if (existing[0].windowId) {
      await chrome.windows.update(existing[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: viewerUrl(targetUrl) });
  }

  return { ok: true };
}

async function requestHostAccess(url) {
  if (!isHttpUrl(url)) {
    return false;
  }
  const origins = [originPattern(url)];
  const already = await chrome.permissions.contains({ origins });
  if (already) {
    await ensureEmbedRules();
    return true;
  }
  const granted = await chrome.permissions.request({ origins });
  if (granted) {
    await ensureEmbedRules();
  }
  return granted;
}

async function openDualWindows(payload) {
  const { url, left, right } = payload;
  if (!isHttpUrl(url)) {
    return { ok: false, error: "Only http:// and https:// pages can be tested." };
  }

  const leftWin = await chrome.windows.create({
    url,
    type: "popup",
    width: Math.min(Math.max(left.width, 400), 1800),
    height: Math.min(Math.max(left.height + 72, 400), 1400),
    focused: true
  });

  await chrome.windows.create({
    url,
    type: "popup",
    width: Math.min(Math.max(right.width, 400), 1800),
    height: Math.min(Math.max(right.height + 72, 400), 1400),
    left: (leftWin.left || 0) + (leftWin.width || left.width) + 16,
    top: leftWin.top,
    focused: false
  });

  return { ok: true };
}

chrome.runtime.onInstalled.addListener(() => {
  ensureEmbedRules().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  ensureEmbedRules().catch(() => {});
});

chrome.permissions.onAdded.addListener(() => {
  ensureEmbedRules().catch(() => {});
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-tester") {
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && isHttpUrl(tab.url)) {
    await openViewer(tab.url);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const respond = (promise) => {
    promise.then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error.message || String(error) });
    });
    return true;
  };

  if (message?.type === "open-viewer") {
    return respond(openViewer(message.url));
  }
  if (message?.type === "request-access") {
    return respond(
      requestHostAccess(message.url).then((granted) => ({ ok: granted, granted }))
    );
  }
  if (message?.type === "open-windows") {
    return respond(openDualWindows(message));
  }
  if (message?.type === "ensure-rules") {
    return respond(ensureEmbedRules().then(() => ({ ok: true })));
  }
  return false;
});
