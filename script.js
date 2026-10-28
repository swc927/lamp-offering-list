import { parseCsv, parsePastedText, splitDisplayName, validateRows } from "./lib/label-logic.mjs?v=20261028-semantic-lines";

const PAGE_SIZE = 65;
const MIN_NAME_SIZE = 38;
const ENTRY_HORIZONTAL_INSET = 20;
const ENTRY_VERTICAL_INSET = 12;
const elements = {
  input: document.getElementById("input"), csv: document.getElementById("csvInput"), output: document.getElementById("output"),
  status: document.getElementById("status"), counts: document.getElementById("counts"), issues: document.getElementById("issues"),
  pageCount: document.getElementById("pageCount"), generate: document.getElementById("generate"), download: document.getElementById("downloadPDF"),
};
let generated = null;

function setStatus(message, type = "") { elements.status.textContent = message; elements.status.className = type; }
function appendTextLines(target, lines) { lines.forEach((line, index) => { if (index) target.appendChild(document.createElement("br")); target.appendChild(document.createTextNode(line)); }); }

function initialFontSize(name) {
  const length = name.length;
  if (/[^\u0000-\u00ff]/u.test(name)) {
    if (length > 20) return 24; if (length > 16) return 28; if (length >= 7) return 40; if (length > 4) return 60; return 70;
  }
  if (length > 45) return 30; if (length > 30) return 35; if (length > 20) return 36; if (length > 18) return 38;
  if (length > 14) return 45; if (length > 12) return 50; if (length > 10) return 58; return 70;
}

function createPage(type) {
  const container = document.createElement("div"); container.className = "container";
  const page = document.createElement("section"); page.className = `page ${type}`;
  page.setAttribute("aria-label", `${type === "deceased" ? "Deceased" : "Living"} lamp labels`);
  container.appendChild(page); elements.output.appendChild(container); return page;
}

function createEntry(page, row) {
  const entry = document.createElement("article"); entry.className = "entry"; entry.dataset.number = row.number;
  const wrapper = document.createElement("div"); wrapper.className = "name-wrapper";
  if (row.deceased) { const label = document.createElement("div"); label.className = "deceased-label"; label.textContent = "(已故)"; wrapper.appendChild(label); }
  const name = document.createElement("div"); name.className = "name"; name.style.fontSize = `${Math.max(initialFontSize(row.name), MIN_NAME_SIZE)}px`;
  const preferredLines = splitDisplayName(row.name, row.deceased);
  appendTextLines(name, preferredLines); wrapper.appendChild(name);
  const number = document.createElement("div"); number.className = "number"; number.textContent = row.number;
  entry.append(wrapper, number); page.appendChild(entry); return entry;
}

function fitEntry(entry) {
  const name = entry.querySelector(".name"), wrapper = entry.querySelector(".name-wrapper"), number = entry.querySelector(".number");
  const fits = () => wrapper.scrollWidth <= entry.clientWidth - (ENTRY_HORIZONTAL_INSET * 2)
    && wrapper.scrollHeight + number.offsetHeight + 10 <= entry.clientHeight - (ENTRY_VERTICAL_INSET * 2);
  const startingSize = Number.parseFloat(name.style.fontSize);
  let size = startingSize;
  while (!fits() && size > MIN_NAME_SIZE) { size -= 2; name.style.fontSize = `${size}px`; }
  if (!fits() && !name.querySelector("br")) {
    const row = { name: name.textContent, deceased: Boolean(entry.querySelector(".deceased-label")) };
    const lines = splitDisplayName(row.name, row.deceased);
    if (lines.length > 1) {
      name.replaceChildren(); appendTextLines(name, lines); size = startingSize; name.style.fontSize = `${size}px`;
      while (!fits() && size > MIN_NAME_SIZE) { size -= 2; name.style.fontSize = `${size}px`; }
    }
  }
  const okay = fits(); entry.classList.toggle("overflow-error", !okay); return okay;
}

function renderPages(rows) {
  elements.output.replaceChildren(); const entries = [];
  for (const [type, group] of [["regular", rows.filter(row => !row.deceased)], ["deceased", rows.filter(row => row.deceased)]]) {
    let page;
    group.forEach((row, index) => { if (index % PAGE_SIZE === 0) page = createPage(type); entries.push({ row, entry: createEntry(page, row) }); });
  }
  const overflow = entries.filter(({ entry }) => !fitEntry(entry)).map(({ row }) => row.number); scalePages(); return overflow;
}

function renderReport({ valid, issues, overflow }) {
  const living = valid.filter(row => !row.deceased).length, deceased = valid.length - living, pages = elements.output.querySelectorAll(".page").length;
  elements.counts.replaceChildren();
  [[valid.length, "valid labels"], [living, "living"], [deceased, "deceased"], [pages, "pages"]].forEach(([count, label]) => {
    const item = document.createElement("span"), strong = document.createElement("strong"); strong.textContent = count; item.append(strong, ` ${label}`); elements.counts.appendChild(item);
  });
  const messages = [...issues.map(issue => `Line ${issue.line}: ${issue.message}`), ...overflow.map(number => `${number}: name cannot fit safely inside its label box.`)];
  elements.issues.replaceChildren(...messages.map(message => { const item = document.createElement("li"); item.textContent = message; return item; }));
  elements.pageCount.textContent = pages ? `Total pages: ${pages}` : ""; return messages;
}

function generate() {
  const { valid, issues } = validateRows(parsePastedText(elements.input.value));
  const overflow = valid.length ? renderPages(valid) : [];
  const messages = renderReport({ valid, issues, overflow });
  generated = messages.length || !valid.length ? null : { rows: valid, pages: elements.output.querySelectorAll(".page").length };
  elements.download.disabled = !generated;
  setStatus(generated ? `Verified ${valid.length} labels. Review the preview before downloading.` : messages.length ? "Resolve every issue before downloading the PDF." : "Enter at least one valid lamp label.", generated ? "success" : "error");
}

function scalePages() {
  elements.output.querySelectorAll(".container").forEach(container => {
    const page = container.querySelector(".page"); const scale = Math.min((window.innerWidth * .94) / 2480, (window.innerHeight * .86) / 3508);
    page.style.transform = `scale(${scale})`; container.style.height = `${3508 * scale}px`;
  });
}

async function downloadPDF() {
  if (!generated) { setStatus("Validate the current list before downloading.", "error"); return; }
  if (!window.html2canvas || !window.jspdf?.jsPDF) { setStatus("The PDF libraries did not load. Check the connection and reload the page.", "error"); return; }
  elements.download.disabled = true; elements.generate.disabled = true;
  const pages = [...elements.output.querySelectorAll(".page")];
  const captureState = pages.map(page => ({
    page,
    transform: page.style.transform,
    container: page.parentElement,
    containerWidth: page.parentElement.style.width,
    containerHeight: page.parentElement.style.height,
    containerOverflow: page.parentElement.style.overflow,
    containerJustifyContent: page.parentElement.style.justifyContent,
  }));
  const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a3" });
  try {
    captureState.forEach(({ page, container }) => {
      page.style.transform = "none";
      container.style.width = "2480px";
      container.style.height = "3508px";
      container.style.overflow = "visible";
      container.style.justifyContent = "flex-start";
    });
    for (let index = 0; index < pages.length; index += 1) {
      setStatus(`Creating PDF page ${index + 1} of ${pages.length}…`);
      const canvas = await window.html2canvas(pages[index], {
        scale: 1,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 2480,
        height: 3508,
        windowWidth: 2480,
        windowHeight: 3508,
        scrollX: 0,
        scrollY: 0,
      });
      const image = canvas.toDataURL("image/jpeg", .88); if (index) pdf.addPage();
      pdf.addImage(image, "JPEG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()); canvas.width = 1; canvas.height = 1;
    }
    const first = generated.rows[0].number, last = generated.rows.at(-1).number;
    pdf.save(`Lamp_Offering_Labels_${first}-${last}.pdf`); setStatus(`PDF created for ${generated.rows.length} verified labels (${first}–${last}).`, "success");
  } catch (error) {
    console.error("PDF generation failed", error); setStatus("PDF generation failed. Nothing was marked printed; reload and try again.", "error");
  } finally {
    captureState.forEach(({ page, transform, container, containerWidth, containerHeight, containerOverflow, containerJustifyContent }) => {
      page.style.transform = transform;
      container.style.width = containerWidth;
      container.style.height = containerHeight;
      container.style.overflow = containerOverflow;
      container.style.justifyContent = containerJustifyContent;
    });
    elements.download.disabled = false; elements.generate.disabled = false; scalePages();
  }
}

elements.csv.addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  const rows = parseCsv(await file.text()); elements.input.value = rows.map(row => `${row.number}\t${row.name}`).join("\n");
  setStatus(`Imported ${rows.length} CSV rows. Validate them before downloading.`); elements.download.disabled = true; generated = null;
});
elements.generate.addEventListener("click", generate);
elements.download.addEventListener("click", downloadPDF);
elements.input.addEventListener("input", () => { generated = null; elements.download.disabled = true; });
window.addEventListener("resize", scalePages);
