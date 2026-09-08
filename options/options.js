const ALL = { origins: ["http://*/*", "https://*/*"] };
const checkbox = document.getElementById("all-sites");
const status = document.getElementById("status");

async function refresh() {
  checkbox.checked = await chrome.permissions.contains(ALL);
}

checkbox.addEventListener("change", async () => {
  status.textContent = "";
  if (checkbox.checked) {
    const granted = await chrome.permissions.request(ALL);
    checkbox.checked = granted;
    status.textContent = granted
      ? "All-site access granted. Embedding rules will apply to pages you load in the tester."
      : "Permission was not granted.";
    if (granted) {
      await chrome.runtime.sendMessage({ type: "ensure-rules" });
    }
    return;
  }
  await chrome.permissions.remove(ALL);
  status.textContent = "All-site access removed. You can still allow one site at a time.";
});

await refresh();
