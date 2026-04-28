import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

test("le bouton est rouge", () => {
  const html = `<button id="btn" class="rouge">OK</button>`;
  const css = fs.readFileSync(path.resolve(__dirname, "../css/style.css"), "utf8");

  const dom = new JSDOM(html, { runScripts: "dangerously" });
  const document = dom.window.document;

  const style = dom.window.document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.getElementById("btn");
  const color = dom.window.getComputedStyle(btn).color;

  expect(color).toBe("rgb(255, 0, 0)");
});
