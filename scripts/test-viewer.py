#!/usr/bin/env python3
"""Automated smoke test for the dual-viewport viewer."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = Path("/opt/cursor/artifacts")
ARTIFACTS.mkdir(parents=True, exist_ok=True)

VIEWER_URL = (
    "http://127.0.0.1:8765/viewer/viewer.html"
    "?url=http://127.0.0.1:8765/demo/responsive-lab.html"
)


def main() -> int:
    results: dict = {"ok": True, "checks": []}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1600, "height": 1000})
        page.goto(VIEWER_URL, wait_until="networkidle", timeout=30000)

        page.wait_for_selector("#left-frame", timeout=10000)
        page.wait_for_selector("#right-frame", timeout=10000)
        page.wait_for_timeout(1500)

        header = page.locator(".brand-name").inner_text()
        results["checks"].append({"header": header, "pass": header == "responsiveness"})

        left_meta = page.locator("#left-meta").inner_text()
        right_meta = page.locator("#right-meta").inner_text()
        results["checks"].append(
            {
                "left_meta": left_meta,
                "pass": "393" in left_meta and "portrait" in left_meta,
            }
        )
        results["checks"].append(
            {
                "right_meta": right_meta,
                "pass": "1366" in right_meta and "landscape" in right_meta,
            }
        )

        left_frame = page.frame_locator("#left-frame")
        right_frame = page.frame_locator("#right-frame")

        left_menu = left_frame.locator(".menu")
        right_nav = right_frame.locator("nav")
        left_menu.wait_for(timeout=10000)
        right_nav.wait_for(timeout=10000)

        left_menu_visible = left_menu.is_visible()
        right_nav_visible = right_nav.is_visible()
        results["checks"].append(
            {
                "mobile_hamburger": left_menu_visible,
                "tablet_nav": right_nav_visible,
                "pass": left_menu_visible and right_nav_visible,
            }
        )

        loaded_path = ARTIFACTS / "dual_viewport_loaded.png"
        page.screenshot(path=str(loaded_path), full_page=False)
        results["screenshots"] = [str(loaded_path)]

        page.locator("#left-stage").hover()
        page.mouse.wheel(0, 400)
        page.wait_for_timeout(500)

        left_scroll = page.evaluate(
            """() => {
              const iframe = document.getElementById('left-frame');
              try {
                return iframe.contentWindow.document.documentElement.scrollTop;
              } catch {
                return -1;
              }
            }"""
        )
        right_scroll_before = page.evaluate(
            """() => {
              const iframe = document.getElementById('right-frame');
              try {
                return iframe.contentWindow.document.documentElement.scrollTop;
              } catch {
                return -1;
              }
            }"""
        )

        page.locator("#right-stage").hover()
        page.mouse.wheel(0, 500)
        page.wait_for_timeout(500)

        right_scroll_after = page.evaluate(
            """() => {
              const iframe = document.getElementById('right-frame');
              try {
                return iframe.contentWindow.document.documentElement.scrollTop;
              } catch {
                return -1;
              }
            }"""
        )

        results["checks"].append(
            {
                "left_scroll": left_scroll,
                "right_scroll_before": right_scroll_before,
                "right_scroll_after": right_scroll_after,
                "pass": left_scroll >= 0 and right_scroll_after >= right_scroll_before,
            }
        )

        scrolled_path = ARTIFACTS / "dual_viewport_after_scroll.png"
        page.screenshot(path=str(scrolled_path), full_page=False)
        results["screenshots"].append(str(scrolled_path))

        browser.close()

    for check in results["checks"]:
        if not check.get("pass", False):
            results["ok"] = False

    print(json.dumps(results, indent=2))
    return 0 if results["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
