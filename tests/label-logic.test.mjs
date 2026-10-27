import test from "node:test";
import assert from "node:assert/strict";
import { classifyName, parseCsv, parsePastedText, splitDisplayName, validateRows } from "../lib/label-logic.mjs";

test("all supported deceased prefixes are classified and removed", () => {
  for (const prefix of ["故", "已故", "仙逝", "往生"]) assert.deepEqual(classifyName(`${prefix} Sample Name`), { name: "Sample Name", deceased: true });
});
test("special deceased groups remain visible", () => {
  assert.deepEqual(classifyName("历代祖先"), { name: "历代祖先", deceased: true });
  assert.deepEqual(classifyName("All Sentient Beings"), { name: "All Sentient Beings", deceased: true });
  assert.deepEqual(classifyName("Nepal-Tibet Flood Victims And Deceased"), { name: "Nepal-Tibet Flood Victims And Deceased", deceased: true });
});
test("pasted rows require number and name", () => {
  const result = validateRows(parsePastedText("M0001\tSMJ\nM0002\nwrong Name"));
  assert.deepEqual(result.valid.map(row => [row.number, row.name]), [["M0001", "SMJ"]]); assert.equal(result.issues.length, 2);
});
test("repeated physical labels are allowed but conflicting names are blocked", () => {
  const repeated = validateRows(parsePastedText("M0001 Name One\nM0001 Name One"));
  assert.equal(repeated.valid.length, 2); assert.equal(repeated.issues.length, 0);
  const conflict = validateRows(parsePastedText("M0001 Name One\nM0001 Name Two"));
  assert.equal(conflict.valid.length, 1); assert.match(conflict.issues[0].message, /conflicts/);
});
test("suffixed lamp numbers are accepted", () => {
  const result = validateRows(parsePastedText("M0683A Name A\nM0683B Name B"));
  assert.deepEqual(result.valid.map(row => row.number), ["M0683A", "M0683B"]); assert.equal(result.issues.length, 0);
});
test("CSV parser preserves commas and escaped quotes", () => {
  const rows = parseCsv('M0001,"Quek Hui Ping, Sherlynn"\nM0002,"A ""Quoted"" Name"');
  assert.equal(rows[0].name, "Quek Hui Ping, Sherlynn"); assert.equal(rows[1].name, 'A "Quoted" Name');
});
test("display formatting does not change source capitalization", () => {
  assert.deepEqual(splitDisplayName("SMJ"), ["SMJ"]);
  assert.equal(splitDisplayName("Links Management Group Pte Ltd").join(" "), "Links Management Group Pte Ltd");
});
test("fallback line breaks preserve meaningful name groups", () => {
  assert.deepEqual(splitDisplayName("Kum Yan Wai Shernine"), ["Kum Yan Wai", "Shernine"]);
  assert.deepEqual(splitDisplayName("Quek Hui Ping, Sherlynn"), ["Quek Hui Ping", "Sherlynn"]);
  assert.deepEqual(splitDisplayName("Jeremy Ng Hwa Yong"), ["Jeremy", "Ng Hwa Yong"]);
  assert.deepEqual(splitDisplayName("Morawakegey Keerti Perera"), ["Morawakegey", "Keerti Perera"]);
  assert.deepEqual(splitDisplayName("Sukhita Wong Poh Muay"), ["Sukhita", "Wong Poh Muay"]);
  assert.deepEqual(splitDisplayName("Tan Le Huan, Genevieve"), ["Tan Le Huan", "Genevieve"]);
  assert.deepEqual(splitDisplayName("See Yin Lin Rachelle"), ["See Yin Lin", "Rachelle"]);
  assert.deepEqual(splitDisplayName("Arthur Wong Xin Chang"), ["Arthur", "Wong Xin Chang"]);
  assert.deepEqual(splitDisplayName("Wong Guan Xiong Augustine"), ["Wong Guan Xiong", "Augustine"]);
  assert.deepEqual(splitDisplayName("Michelle Eng Hwee Ee (Xing Weiyu)"), ["Michelle Eng Hwee Ee", "(Xing Weiyu)"]);
});
