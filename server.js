const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // statyczne pliki HTML, CSS, JS

let lastData = {}; // przechowuje dane z formularza

// Test serwera
app.get("/test", (req, res) => {
    res.send("✅ Serwer działa poprawnie 🚀");
});

// === GENEROWANIE PODGLĄDU ===
app.post("/generate", (req, res) => {
    const { name, email, phone, experience, education, huj} = req.body;
    lastData = req.body;

    const templatePath = path.join(__dirname, "public", "cv-template.html");
    let html = fs.readFileSync(templatePath, "utf8");

    html = html
        .replace("{{NAME}}", name || "")
        .replace("{{EMAIL}}", email || "")
        .replace("{{PHONE}}", phone || "")
        .replace("{{EXPERIENCE}}", experience || "")
        .replace("{{EDUCATION}}", education || "")
        .replace("{{huj}}", huj || "");

    // Zapisujemy czysty HTML do PDF (bez przycisku)
    const pdfPath = path.join(__dirname, "public", "generated-cv.pdf.html");
    fs.writeFileSync(pdfPath, html);

    // Tworzymy HTML podglądu w przeglądarce z przyciskiem
    const previewHtml = html.replace(
        "</body>",
        `
        <div style="text-align:center; margin-top:30px;">
            <a href="/download-pdf"
            style="display:inline-block; background-color:#4CAF50; color:white;
                    padding:10px 20px; text-decoration:none; border-radius:5px;">
            📄 Pobierz jako PDF
            </a>
        </div>
        </body>`
    );

    const previewPath = path.join(__dirname, "public", "generated-cv.html");
    fs.writeFileSync(previewPath, previewHtml);

    res.redirect("/preview");
});

// Podgląd w przeglądarce
app.get("/preview", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "generated-cv.html"));
});

// Pobranie PDF
app.get("/download-pdf", async (req, res) => {
  try {
    const html = fs.readFileSync(
      path.join(__dirname, "public", "generated-cv.pdf.html"),
      "utf8"
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // krótki timeout dla bezpieczeństwa
    await new Promise((resolve) => setTimeout(resolve, 500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Moje_CV.pdf",
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Błąd PDF:", err);
    res.status(500).send("Błąd podczas generowania PDF.");
  }
});

const PORT = 3000;
app.listen(PORT, () =>
    console.log(`Serwer działa na http://localhost:${PORT}`)
);
