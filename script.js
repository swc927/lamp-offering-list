  let lampBackground = "Lamp.jpg";
let deceasedBackground = "Deceased.jpg";

function cleanDeceasedName(name) {
  return name
    .replace(/^(故|已故|仙逝|往生)\s*/g, "")
    .replace(/[\[\(（【{]{1}.*?(祖先|冤亲债主|众生|歷代|历代).*?[\]\)）】}]{1}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generate() {
  const input = document.getElementById("input").value.trim();
  const lines = input
    .split("\n")
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter((line) => line);

  const output = document.getElementById("output");
  output.innerHTML = "";

  let page, deceasedPage;
  let regularCount = 0,
      deceasedCount = 0;

  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return;

    const number = parts[0];
    
    const originalNameRaw = parts.slice(1).join(" ");
    let nameRaw = originalNameRaw.replace(/\s+/g, " ").trim().toLowerCase();

    const isDeceasedEntry =
      nameRaw.startsWith("故") ||
      nameRaw.includes("众生") ||
      nameRaw.includes("歷代") ||
      nameRaw.includes("历代") ||
      nameRaw.includes("祖宗") ||
      nameRaw.includes("祖先") ||
      nameRaw.includes("冤亲债主") ||
      nameRaw.includes("sentient beings") ||
      nameRaw.includes("all sentient beings");

let cleanedName = originalNameRaw;
if (isDeceasedEntry) {
  cleanedName = cleanDeceasedName(cleanedName);
}
const name = smartCapitalize(cleanedName);



    if (isDeceasedEntry) {
  if (!deceasedPage || deceasedCount % 65 === 0) {
    deceasedPage = createPage(deceasedBackground, "deceased");
  }
  createEntry(deceasedPage, number, name, true);
  deceasedCount++;
} else {
  if (!page || regularCount % 65 === 0) {
    page = createPage(lampBackground, "regular");
  }
  createEntry(page, number, name);
  regularCount++;
}
  });
  
    scalePages();
  
const totalPages = document.querySelectorAll(".container").length;
document.getElementById("pageCount").textContent = `Total Pages: ${totalPages}`;
}

function createPage(background, type) {
  const container = document.createElement("div");
  container.className = "container";

  const page = document.createElement("div");
  page.className = `page ${type}`;
  page.style.backgroundImage = `url('${background}')`;

  container.appendChild(page);
  document.getElementById("output").appendChild(container);

  return page;
}

function createEntry(page, number, name, isDeceasedOverride = false) {
  const entry = document.createElement("div");
  entry.className = "entry";

  const nameWrapper = document.createElement("div");
  nameWrapper.className = "name-wrapper";

  let displayName = name;
  let isDeceased = isDeceasedOverride;
  let isSpecialDeceased = false;

  if (
    name.includes("众生") ||
    name.includes("歷代") ||
    name.includes("历代") ||
    name.includes("祖宗") ||
    name.includes("祖先") ||
    name.includes("冤亲债主")
  ) {
    isSpecialDeceased = true;
  }

  if (isDeceased) {
    const deceasedLabel = document.createElement("div");
    deceasedLabel.className = "deceased-label";
    deceasedLabel.innerText = "(已故)";
    nameWrapper.appendChild(deceasedLabel);
  }

  const nameDiv = document.createElement("div");
  nameDiv.className = "name";
  nameDiv.innerHTML = formatName(displayName, isSpecialDeceased).replace(/\n/g, "<br>");

  adjustFontSize(nameDiv, displayName);

  nameWrapper.appendChild(nameDiv);

  const numberDiv = document.createElement("div");
  numberDiv.className = "number";
  numberDiv.textContent = number;

  entry.appendChild(nameWrapper);
  entry.appendChild(numberDiv);
  page.appendChild(entry);
}

function formatName(name, isSpecialDeceased) {
  if (!isSpecialDeceased && name.includes("@")) {
    const [main, ...atParts] = name.split("@");
    const atName = atParts.join("@").trim();
    return main.trim() + "\n@" + atName;
  }
  
  if (isSpecialDeceased) {
    return splitNameToTwoLines(name);
  }

  if (isChinese(name)) {
    if (name.includes("[") || name.includes("（") || name.includes("(")) {
      const bracketIndex = name.indexOf("[");
      const roundBracketIndex = name.indexOf("（");
      const smallBracketIndex = name.indexOf("(");

      const validIndexes = [
        bracketIndex,
        roundBracketIndex,
        smallBracketIndex,
      ].filter((i) => i !== -1);

      const earliestIndex = Math.min(...validIndexes);

      const mainName = name.substring(0, earliestIndex).trim();
      const bracketPart = name.substring(earliestIndex).trim();
      return mainName + "\n" + bracketPart;
    }

    return splitChineseName(name);
  }

  if (name.includes("\n")) {
    name = name
      .split("\n")
      .map((p) => p.trim())
      .join(" ");
  }

  const words = name.split(" ").filter(Boolean);
  const allEnglish = words.every((word) => /^[a-zA-Z]+$/.test(word));
  const totalChars = name.replace(/\s+/g, "").length;

  if (words.length === 4 && allEnglish) {
    if (words[0].length > 4) {
      const firstLine = words[0];
      const secondLine = words.slice(1).join(" ");
      return firstLine + "\n" + secondLine;
    } else if (totalChars <= 16) {
      return name;
    } else {
      const firstLine = words.slice(0, 3).join(" ");
      const secondLine = words[3];
      return firstLine + "\n" + secondLine;
    }
  }

  if (words.length === 3 && allEnglish && totalChars <= 14) {
    return name;
  }

  if (words.length >= 3 && allEnglish && totalChars >= 17) {
    const firstHalf = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const secondHalf = words.slice(Math.ceil(words.length / 2)).join(" ");
    return firstHalf + "\n" + secondHalf;
  }

  return name;
}

function adjustFontSize(nameDiv, name) {
  if (isChinese(name)) {
    if (name.length > 20) nameDiv.style.fontSize = "24px";
    else if (name.length > 16) nameDiv.style.fontSize = "28px";
    else if (name.length > 7) nameDiv.style.fontSize = "47px";
    else if (name.length > 4) nameDiv.style.fontSize = "60px";
  } else {
    if (name.length > 45) nameDiv.style.fontSize = "30px";
    else if (name.length > 30) nameDiv.style.fontSize = "35px";
    else if (name.length > 20) nameDiv.style.fontSize = "36px";
    else if (name.length > 18) nameDiv.style.fontSize = "38px";
    else if (name.length > 14) nameDiv.style.fontSize = "45px";
    else if (name.length > 12) nameDiv.style.fontSize = "50px";
    else if (name.length > 10) nameDiv.style.fontSize = "58px";
  }
}

function smartCapitalize(name) {
  name = name.replace(/&amp;/g, " & ");

  let result = "";
  let currentWord = "";

  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (char.match(/[a-zA-Z]/)) {
      currentWord += char;
    } else {
      if (currentWord) {
        result +=
          currentWord.charAt(0).toUpperCase() +
          currentWord.slice(1).toLowerCase();
        currentWord = "";
      }
      result += char;
    }
  }
  if (currentWord) {
    result +=
      currentWord.charAt(0).toUpperCase() + currentWord.slice(1).toLowerCase();
  }
  return result;
}

function splitChineseName(name) {
  if (name.length <= 5) return name;

  const endings = ["有限责任公司", "私人有限公司", "有限公司"];

  let matchedEnding = null;

  for (const ending of endings) {
    if (name.endsWith(ending)) {
      matchedEnding = ending;
      break;
    }
  }

  if (matchedEnding) {
    const mainPart = name.slice(0, name.length - matchedEnding.length);
    const firstLine = mainPart.trim();
    const secondLine = matchedEnding.trim();
    return firstLine + "\n" + secondLine;
  }

  const mid = Math.ceil(name.length / 2);
  const firstLine = name.slice(0, mid).trim();
  const secondLine = name.slice(mid).trim();
  return firstLine + "\n" + secondLine;
}

function splitNameToTwoLines(name) {
  if (name.length <= 16) return name;
  const half = Math.floor(name.length / 2);
  return name.slice(0, half) + "\n" + name.slice(half);
}

function isChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

function scalePages() {
  const containers = document.querySelectorAll(".container");
  containers.forEach((container) => {
    const page = container.querySelector(".page");
    const scaleX = (window.innerWidth * 0.95) / 2480;
    const scaleY = (window.innerHeight * 0.9) / 3508;
    const scale = Math.min(scaleX, scaleY);
    page.style.transform = `scale(${scale})`;
    page.style.transformOrigin = "top center";
  });
}

window.addEventListener("resize", scalePages);

document.getElementById("csvInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const text = event.target.result;
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const formatted = lines
      .map((line) => {
        const [number, name] = line.split(",");
        return `${number} ${name}`;
      })
      .join("\n");
    document.getElementById("input").value = formatted;
  };
  reader.readAsText(file);
});

const { jsPDF } = window.jspdf;

function downloadPDF() {
  const output = document.getElementById("output");

  if (!output || output.innerHTML.trim() === "") {
    console.error("No content to generate PDF.");
    alert("No content to generate! Please click 'Generate' first.");
    return;
  }

  const containers = document.querySelectorAll(".container");
  if (containers.length === 0) {
    console.error("No pages to capture.");
    alert("No pages to capture! Please generate first.");
    return;
  }

  const originalTransforms = [];
  containers.forEach((container) => {
    const page = container.querySelector(".page");
    originalTransforms.push(page.style.transform);
    page.style.transform = "none";
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [3508, 4961],
  });

  let currentPage = 0;

  function capturePage(index) {
    if (index >= containers.length) {
      containers.forEach((container, idx) => {
        const page = container.querySelector(".page");
        page.style.transform = originalTransforms[idx];
      });
      pdf.save("Lamp_Offering_List_A3.pdf");
      return;
    }

    const container = containers[index];

    html2canvas(container, {
      scale: 2,
      useCORS: true,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.6);

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const ratio = Math.min(
          pdfWidth / imgProps.width,
          pdfHeight / imgProps.height
        );
        const imgWidth = imgProps.width * ratio;
        const imgHeight = imgProps.height * ratio;

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        if (index > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

        capturePage(index + 1);
      })
      .catch((error) => {
        console.error("Error capturing page:", error);
      });
  }

  capturePage(currentPage);
}
