const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

let lastData = {};

// Test
app.get("/test", (req, res) => {
    res.send("Server działa 🚀");
});

// GENEROWANIE
app.post("/generate", (req, res) => {
    const { name, surname, address, phone, email, about, educationYears, university, interests } = req.body;
    console.log("REQ BODY:", req.body);
    lastData = req.body;
    const templatePath = path.join(__dirname, "public", "cv-templates/cv-template.html");
    let html = fs.readFileSync(templatePath, "utf8");
    html = html
        .replaceAll("{{NAME}}", name || "")
        .replaceAll("{{SURNAME}}", surname || "")
        .replaceAll("{{ADDRESS}}", address || "")
        .replaceAll("{{EMAIL}}", email || "")
        .replaceAll("{{PHONE}}", phone || "")
        .replaceAll("{{ABOUT}}", about || "")
        .replaceAll("{{EDUCATIONYEARS}}", educationYears || "")
        .replaceAll("{{UNIVERSITY}}", university || "")
        .replaceAll("{{INTERESTS}}", interests || "" );

    // Zapis HTML bez przycisku
    const pdfPath = path.join(__dirname, "public", "generated-cv.pdf.html");
    fs.writeFileSync(pdfPath, html);

    // HTML podglądu
    const previewHTML = html.replace(
        "</body>",
        `
        <div style="text-align:center; margin-top:30px;">
            <a href="/download-pdf"
               style="background:#4CAF50; color:white; padding:10px 20px;
                      border-radius:5px; text-decoration:none;">
                📄 Pobierz PDF
            </a>
        </div>
        </body>`
    );

    fs.writeFileSync(path.join(__dirname, "public", "generated-cv.html"), previewHTML);

    res.redirect("/preview");
});

// PODGLĄD
app.get("/preview", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "generated-cv.html"));
});

// PDF
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

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" }
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Moje_CV.pdf"
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("Błąd podczas generowania PDF.");
  }
});

app.listen(3000, () => console.log("Serwer działa na http://localhost:3000"));
