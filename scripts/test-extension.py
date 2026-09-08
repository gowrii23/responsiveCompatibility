#!/usr/bin/env python3
"""Verify the unpacked extension loads in Chrome."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = Path("/opt/cursor/artifacts")
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def main() -> int:
    results = {"ok": True, "checks": []}

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/responsiveness-ext-test",
            headless=True,
            args=[
                f"--disable-extensions-except={ROOT}",
                f"--load-extension={ROOT}",
                "--no-first-run",
                "--no-default-browser-check",
            ],
        )
        page = context.new_page()
        page.goto("http://127.0.0.1:8765/demo/responsive-lab.html", wait_until="networkidle")

        ext_id = None
        for sw in context.service_workers:
            if "chrome-extension://" in sw.url:
                ext_id = sw.url.split("/")[2]
                break

        if not ext_id:
            targets = context.background_pages
            for target in targets:
                if "chrome-extension://" in target.url:
                    ext_id = target.url.split("/")[2]
                    break

        results["checks"].append({"extension_id_found": bool(ext_id), "ext_id": ext_id})

        if ext_id:
            viewer = (
                f"chrome-extension://{ext_id}/viewer/viewer.html"
                f"?url=http://127.0.0.1:8765/demo/responsive-lab.html"
            )
            page.goto(viewer, wait_until="networkidle", timeout=30000)
            page.wait_for_selector("#left-frame", timeout=15000)
            page.wait_for_timeout(1500)

            header = page.locator(".brand-name").inner_text()
            left_meta = page.locator("#left-meta").inner_text()
            right_meta = page.locator("#right-meta").inner_text()

            results["checks"].append(
                {
                    "header": header,
                    "left_meta": left_meta,
                    "right_meta": right_meta,
                    "pass": header == "responsiveness"
                    and "393" in left_meta
                    and "1366" in right_meta,
                }
            )

            shot = ARTIFACTS / "extension_dual_viewport.png"
            page.screenshot(path=str(shot), full_page=False)
            results["screenshots"] = [str(shot)]
        else:
            results["ok"] = False
            results["error"] = "Could not resolve extension id"

        context.close()

    for check in results["checks"]:
        if "pass" in check and not check["pass"]:
            results["ok"] = False
        if check.get("extension_id_found") is False:
            results["ok"] = False

    print(json.dumps(results, indent=2))
    return 0 if results["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
