const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static("public"));

let lastData = {};

// Test
app.get("/test", (req, res) => {
    res.send("Server działa 🚀");
});

// GENEROWANIE
app.post("/generate", (req, res) => {
    const { 
        name, surname, address, phone, email, about, 
        linkedin, portfolio, 
        experience_data, education_data, 
        skills, certificates, 
        languages, interests,
        photo,
        template
    } = req.body;
    
    console.log("\n=== DANE Z FORMULARZA CV ===");
    console.log("Wybrany szablon:", template || "1");
    console.log("Dane kontaktowe:", { name, surname, email, phone, address, linkedin, portfolio });
    
    let experienceArray = [];
    let educationArray = [];
    
    try {
        if (experience_data) {
            experienceArray = JSON.parse(experience_data);
            console.log("Doświadczenie zawodowe:", experienceArray);
        }
        if (education_data) {
            educationArray = JSON.parse(education_data);
            console.log("Wykształcenie:", educationArray);
        }
    } catch (err) {
        console.error("Błąd parsowania JSON:", err);
    }
    
    console.log("Umiejętności:", skills);
    console.log("Certyfikaty:", certificates);
    console.log("Języki:", languages);
    console.log("Zainteresowania:", interests);
    if (photo) {
        console.log("Zdjęcie: [wgrane]");
    }
    console.log("=============================\n");
    
    lastData = req.body;
    
    // Wybór szablonu na podstawie parametru
    const templateNumber = template || "1";
    let templateFilename = "cv-template.html";
    
    if (templateNumber === "2") {
        templateFilename = "cv-template2.html";
    } else if (templateNumber === "3") {
        templateFilename = "cv-template3.html";
    } else if (templateNumber === "4") {
        templateFilename = "cv-template4.html";
    }
    
    const templatePath = path.join(__dirname, "public", "cv-templates", templateFilename);
    let html = fs.readFileSync(templatePath, "utf8");
    
    // Domyślne zdjęcie jeśli nie ma przesłanego
    const photoData = photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='80' fill='%23999' text-anchor='middle' dy='.3em'%3E📷%3C/text%3E%3C/svg%3E";
    
    // Generowanie HTML dla doświadczenia zawodowego
    const experienceHTML = experienceArray.map(exp => `
        <div class="job">
            <h4>${exp.role || ''} – ${exp.company || ''}</h4>
            <span>${exp.years || ''}</span>
            <p>${(exp.description || '').replace(/\n/g, '<br>')}</p>
        </div>
    `).join('');
    
    // Generowanie HTML dla wykształcenia
    const educationHTML = educationArray.map(edu => `
        <div class="school">
            <h4>${edu.degree || ''}</h4>
            <span>${edu.field || ''}</span>
            <span>${edu.institution || ''} ${edu.years || ''}</span>
        </div>
    `).join('');
    
    // Generowanie listy umiejętności
    const skillsArray = skills ? skills.split(';').map(s => s.trim()).filter(s => s.length > 0) : [];
    const skillsHTML = skillsArray.map(skill => `<li>${skill}</li>`).join('');
    
    // Generowanie listy certyfikatów
    const certificatesArray = certificates ? certificates.split(';').map(c => c.trim()).filter(c => c.length > 0) : [];
    const certificatesHTML = certificatesArray.map(cert => `<li>${cert}</li>`).join('');
    
    html = html
        .replaceAll("{{NAME}}", name || "")
        .replaceAll("{{SURNAME}}", surname || "")
        .replaceAll("{{ADDRESS}}", address || "")
        .replaceAll("{{EMAIL}}", email || "")
        .replaceAll("{{PHONE}}", phone || "")
        .replaceAll("{{LINKEDIN}}", linkedin || "")
        .replaceAll("{{PORTFOLIO}}", portfolio || "")
        .replaceAll("{{ABOUT}}", (about || "").replace(/\n/g, "<br>"))
        .replaceAll("{{EXPERIENCE}}", experienceHTML)
        .replaceAll("{{EDUCATION}}", educationHTML)
        .replaceAll("{{SKILLS}}", skillsHTML)
        .replaceAll("{{CERTIFICATES}}", certificatesHTML)
        .replaceAll("{{LANGUAGES}}", (languages || "").replace(/\n/g, "<br>"))
        .replaceAll("{{INTERESTS}}", (interests || "").replace(/\n/g, "<br>"))
        .replaceAll("{{PHOTO}}", photoData);

    // Zapis HTML bez przycisku
    const pdfPath = path.join(__dirname, "public", "generated-cv.pdf.html");
    fs.writeFileSync(pdfPath, html);

    // HTML podglądu - przycisk dodawany do CV
    const previewHTML = html.replace(
        "<body>",
        `<body style="background-color: #f4f7f6; padding-top: 140px; padding-bottom: 160px;">
        <header style="position: fixed; top: 0; left: 0; right: 0; background-color: white; color: #000a24; display: flex; align-items: center; justify-content: center; height: 100px; box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.05); z-index: 1000;">
            <h1 style="margin: 0; font-size: 2rem; font-weight: 700; letter-spacing: 0.5px;">KREATOR CV</h1>
            <a href="/cv-form.html" style="position: absolute; left: 20px; font-size: 2rem; cursor: pointer; color: #000a24; text-decoration: none; top: 50%; transform: translateY(-50%); padding: 0; margin: 0; line-height: 1;">
                <svg width="35px" height="35px" viewBox="-18.19 -18.19 112.18 112.18" xmlns="http://www.w3.org/2000/svg" fill="#000a24" stroke="#000a24" stroke-width="7.580299999999999"><path d="M660.313,383.588a1.5,1.5,0,0,1,1.06,2.561l-33.556,33.56a2.528,2.528,0,0,0,0,3.564l33.556,33.558a1.5,1.5,0,0,1-2.121,2.121L625.7,425.394a5.527,5.527,0,0,1,0-7.807l33.556-33.559A1.5,1.5,0,0,1,660.313,383.588Z" fill="#000a24" transform="translate(-624.082 -383.588)"></path></svg>
            </a>
        </header>`
    ).replace(
        "</body>",
        `
        <style>
            /* Przyciski nad stopką */
            .preview-button-container {
                position: fixed;
                bottom: 10px; /* ponad stopką */
                right: 40px;
                display: flex;
                gap: 12px;
                z-index: 1100;
                flex-direction: column;
                align-items: flex-end;
            }

            .preview-btn {
                padding: 12px 26px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.98rem;
                font-weight: 600;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                height: 50px;
                width: 135px;
                transition: transform 0.18s ease, box-shadow 0.18s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }

            .preview-btn-primary {
                background-color: #000a24;
                color: white;
                border: 2px solid #000a24;
            }

            .preview-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }

            .preview-btn-secondary {
                background-color: white;
                color: #000a24;
                border: 2px solid #000a24;
            }

            .preview-btn-secondary:hover { transform: translateY(-3px); }

            /* Zapewnij miejsce pod stopką */
            .cv-wrapper { margin-bottom: 0; margin-top: 20px; }

            @media (max-width: 768px) {
                .preview-button-container { right: 16px; bottom: 100px; }
                .preview-btn { width: 100%; justify-content: center; }
            }
        </style>

        <div class="preview-button-container">
            <a href="/download-pdf" class="preview-btn preview-btn-primary">
              Pobierz CV
            </a>
            <a href="/cv-form.html" class="preview-btn preview-btn-secondary">
              Edytuj CV
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
