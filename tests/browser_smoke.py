#!/usr/bin/env python3
"""Browser smoke/interaction checks for the published static application.

Usage: python3 -m pip install playwright && python3 -m playwright install chromium
       python3 tests/browser_smoke.py
The suite starts its own local HTTP server and stores screenshots in artifacts/.
"""
import json
import os
import threading
import unittest
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

class BrowserSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))
        )
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = "http://127.0.0.1:%d/" % cls.server.server_address[1]
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(
            viewport={"width": 1280, "height": 800}, accept_downloads=True
        )
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda err: self.errors.append(str(err)))
        self.page.goto(self.url, wait_until="load")
        expect(self.page.locator(".result-card")).to_have_count(5)

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
        finally:
            self.context.close()

    def saved(self):
        data = self.page.evaluate(
            "() => JSON.parse(localStorage.getItem('custo-veiculo-simulacao-v1'))"
        )
        self.assertIsInstance(data, dict)
        return data

    def test_render_charts_and_compare_costs(self):
        page = self.page
        self.assertIn("MENOR CUSTO SIMULADO", page.locator("#resultSummary").inner_text())
        self.assertIn("não", page.locator("#resultWarnings").inner_text().lower())
        self.assertEqual(page.locator("#comparisonChart .chart-bar-row").count(), 5)
        self.assertEqual(page.locator("#timelineChart svg").count(), 1)
        self.assertEqual(page.locator("#sensitivityPanel tbody tr").count(), 5)
        self.assertEqual(page.locator("#sensitivityPanel tbody td").count(), 25)
        old_cost = page.locator("#resultCards .result-card").first.inner_text()
        page.locator('input[data-path="vehicle.price"]').fill("90000")
        self.assertEqual(self.saved()["vehicle"]["price"], 90000)
        self.assertNotEqual(old_cost, page.locator("#resultCards .result-card").first.inner_text())
        page.screenshot(path=str(ARTIFACTS / "browser-desktop.png"), full_page=True)

    def test_strategy_toggle_and_invalid_fields(self):
        page = self.page
        page.locator('input[data-strategy="subscription"]').uncheck()
        expect(page.locator(".result-card")).to_have_count(4)
        self.assertEqual(page.locator("#breakEvenPanel").inner_text().strip(), "")
        self.assertEqual(self.saved()["selectedScenarioIds"].count("subscription"), 0)
        page.locator('input[data-path="financing.downPayment"]').fill("100000")
        expect(page.locator("#errors")).to_be_visible()
        self.assertIn("downPayment", page.locator("#errors").inner_text())
        # Invalid edits are deliberately not persisted.
        self.assertNotEqual(self.saved()["financing"]["downPayment"], 100000)

    def test_wizard_cancel_then_complete_and_restore(self):
        page = self.page
        initial = self.saved()
        page.locator("#openGuidedSetup").click()
        expect(page.locator("#guidedDialog")).to_be_visible()
        page.locator("#guidedAnswer").select_option("loan")
        page.locator("#guidedNext").click()
        page.locator("#guidedClose").click()
        expect(page.locator("#guidedDialog")).not_to_be_visible()
        self.assertEqual(self.saved(), initial)
        page.locator("#openGuidedSetup").click()
        # Current defaults produce a complete example in each question.
        for _ in range(20):
            if page.locator("#guidedNext").inner_text() == "Criar simulação":
                break
            page.locator("#guidedNext").click()
        else:
            self.fail("Wizard did not reach review")
        self.assertIn("Revisar", page.locator("#guidedTitle").inner_text())
        page.locator("#guidedNext").click()
        expect(page.locator("#guidedDialog")).not_to_be_visible()
        self.assertTrue(self.saved()["name"].startswith("Simulação guiada"))
        page.once("dialog", lambda dialog: dialog.accept())
        page.locator("#restoreButton").click()
        self.assertEqual(self.saved()["name"], initial["name"])

    def test_export_import_and_mobile_layout(self):
        page = self.page
        with page.expect_download() as download_info:
            page.locator("#exportButton").click()
        downloaded = download_info.value
        original = json.loads(Path(downloaded.path()).read_text(encoding="utf-8"))
        self.assertIn("schemaVersion", original)
        page.locator('input[data-path="vehicle.price"]').fill("91000")
        page.once("dialog", lambda dialog: dialog.accept())
        page.locator("#importFile").set_input_files({
            "name": "preset.json", "mimeType": "application/json",
            "buffer": json.dumps(original).encode("utf-8")
        })
        expect(page.locator("#errors")).to_be_hidden()
        self.assertEqual(self.saved()["vehicle"]["price"], original["vehicle"]["price"])
        page.locator("#importFile").set_input_files({
            "name": "invalido.json", "mimeType": "application/json",
            "buffer": b'{"schemaVersion":999}'
        })
        expect(page.locator("#errors")).to_be_visible()
        self.assertEqual(self.saved()["vehicle"]["price"], original["vehicle"]["price"])
        page.set_viewport_size({"width": 390, "height": 844})
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 391)
        page.screenshot(path=str(ARTIFACTS / "browser-mobile.png"), full_page=True)

if __name__ == "__main__":
    unittest.main(verbosity=2)
