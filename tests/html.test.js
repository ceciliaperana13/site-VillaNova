import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

describe("Tests du fichier index.html", () => {

  let document;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, "../html/index.html");
    const html = fs.readFileSync(filePath, "utf8");
    const dom = new JSDOM(html);
    document = dom.window.document;
  });

  test("La page contient un titre <h1>", () => {
    const h1 = document.querySelector("h1");
    expect(h1).not.toBeNull();
  });

  test("La page contient un menu de navigation", () => {
    const nav = document.querySelector("nav");
    expect(nav).not.toBeNull();
  });

  test("La page contient au moins un lien <a>", () => {
    const liens = document.querySelectorAll("a");
    expect(liens.length).toBeGreaterThan(0);
  });

  test("La page contient une section <main>", () => {
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
  });

});
