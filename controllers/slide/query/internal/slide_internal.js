const { default: axios } = require("axios");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const { v4 } = require("uuid");
const { supabase } = require("../../../../config/supabase");
const { title } = require("process");

const internalGenerateSlide = async (slideData, isIntro) => {
  const isLocal = process.env.NODE_ENV === "dev";

  const browser = await puppeteer.launch(
    isLocal
      ? {
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          headless: true,
        }
      : {
          args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
          executablePath: await chromium.executablePath(),
          headless: true,
        },
  );

  const page = await browser.newPage();

  await page.setViewport({ width: 1024, height: 1280 });

  await page.setContent(generateTemplate(slideData, isIntro), {
    waitUntil: "networkidle0",
  });

  const buffer = await page.screenshot({ type: "png" });

  await browser.close();
  return buffer;
};

function formatTextWithHighlights(words, highlights = [], isUpperCase = true) {
  // Normalize + split highlights → single words
  const highlightSet = new Set(
    highlights
      .flatMap((h) => h.split(" "))
      .map((w) => w.replace(/[^\w]/g, "").toUpperCase())
      .filter((w) => w.length > 2), // optional: remove small words
  );

  return words
    .map((word) => {
      const cleanWord = word.replace(/[^\w]/g, "").toUpperCase();

      return highlightSet.has(cleanWord)
        ? `<span class="highlight">${isUpperCase ? word.toUpperCase() : word}</span>`
        : `<span>${isUpperCase ? word.toUpperCase() : word}</span>`;
    })
    .join(" ");
}

function generateTemplate(slideData, isIntro = false) {
  const {
    text = "",
    title = "",
    sub_title = "",
    imageUrl,
    category = "",
    highlights = [],
  } = slideData;

  const words = text.split(" ");

  const logoUrl =
    // "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/logo.png";
    "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/crypto_dose_logo_2.png";

  // const splittedHiglights = highlights ? highlights.split(",") : [];
  const splittedHiglights =
    typeof highlights === "string" ? highlights.split(",") : highlights;

  const formattedText = formatTextWithHighlights(
    words,
    splittedHiglights,
    true,
  );

  if (!isIntro) {
    return `
    <!doctype html>
<html lang="en">
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div class="card">
      <!-- Background -->

      <img
        class="bg-image"
        src="
   ${imageUrl}
      "
        alt="Sci Fi Background"
      />

      <div class="overlay"></div>
      <div class="logo-line">
        <hr />
        <img
          src="https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/briefonix_logo%20(1).png"
          alt="logo"
          class="logo"
        />
        <hr />
      </div>

      <!-- Title -->
      <div class="title-wrapper">
        <div class="title">${title}</div>
        <div class="text">
          ${formattedText}
        </div>

        <div class="pattern"></div>
      </div>
    </div>

    <style>
      :root {
        --bg: #090909;
        --surface: #171717;

        --primary: #ffffff;
        --secondary: #b3b3b3;

        --accent: #b7ff00;
        --accent-2: #66ff66;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: black;
        font-family: "Montserrat", sans-serif;
      }

      .card {
        width: 1024px;
        height: 1280px;
        position: relative;
        overflow: hidden;
        background: #000;
        
        color: white;
      }

      .top {
        position: absolute;

        top: 45px;
        left: 45px;
        right: 45px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        z-index: 10;
      }

      .tag {
        padding: 14px 24px;

        border-radius: 999px;

        background: rgba(0, 0, 0, 0.35);

        backdrop-filter: blur(12px);

        border: 1px solid rgba(183, 255, 0, 0.25);

        color: var(--accent-2);

        font-size: 22px;
        font-weight: 700;

        letter-spacing: 2px;

        font-family: "Space Grotesk", sans-serif;
      }

      .logo-line {
        z-index: 100;
        position: absolute;
        display: flex;
        width: 100%;
        align-items: center;
        gap: 30px;
      }

      .logo {
        width: 250px;
      }

      hr {
        width: 100%;
        opacity: 1;
        height: 3px;
        background-color: var(--accent-2);
        border: none;
      }

      .bg-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 1024px;
        object-fit: cover;
      }

      /* Dark overlay */
      .overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          transparent,
          transparent,
          rgba(0, 0, 0, 0.5),
          black
        );
      }

      /* Main title */
      .title-wrapper {
        position: absolute;
        bottom: 0px;
        width: 100%;
        text-align: center;
        background: linear-gradient(transparent, black, black, black);
        max-height: 480px;
        display: flex;
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px 40px 40px 40px;
      }

      .title {
        font-size: 65px;
        line-height: 1;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
        font-family: "Anton";
        margin:16px 0;
      }

      .text {
        text-transform: uppercase;
        padding-bottom: 20px;
        font-weight: 600;
        letter-spacing: 1.85px;
      }

      .highlight {
        color: var(--accent-2);
      }

      /* Tiny bottom pattern */
      .pattern {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 100%;
        opacity: 0.9;
        background-image: radial-gradient(
          rgba(255, 255, 255, 0.26) 1px,
          transparent 1px
        );
        background-size: 22px 22px;
        left: 0;
      }
    </style>

    <script>
      const textWrap = document.querySelector(".title-wrapper");
      const pattern = document.querySelector(".pattern");
      const logoLine = document.querySelector(".logo-line");

      function alignLogo() {
        const h = textWrap.clientHeight;
        logoLine.style.bottom = h + "px";
      }

      function resizePattern() {
        const h = textWrap.clientHeight;
        const w = textWrap.clientWidth;

        console.log(h);
        console.log(w);

        pattern.style.height = h;
        pattern.style.width = w;
      }

      function autoResizeText() {
        const el = document.querySelector(".title-wrapper");
        const txt = document.querySelector(".text");

        let fontSize = 150;
        const minSize = 10;

        while (fontSize > minSize) {
          txt.style.fontSize = fontSize + "px";

          const isOverflowing =
            el.scrollHeight > el.clientHeight ||
            el.scrollWidth > el.clientWidth;

          if (!isOverflowing) break;

          fontSize -= 2;
        }
      }

      document.fonts.ready.then(() => {
        autoResizeText();
        resizePattern();
        alignLogo();
      });
    </script>
  </body>
</html>

    `;
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div class="card">
      <!-- Background -->

      <div class="top">
        <div class="tag">${category}</div>
      </div>

      <img
        class="bg-image"
        src="
    ${imageUrl}
      "
        alt="Sci Fi Background"
      />

      <div class="overlay"></div>
      <div class="logo-line">
        <hr />
        <img
          src="https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/briefonix_logo%20(1).png"
          alt="logo"
          class="logo"
        />
        <hr />
      </div>

      <!-- Title -->
      <div class="title-wrapper">
        <div class="title">
          ${formattedText}
        </div>
        <div class="pattern"></div>
      </div>
    </div>

    <style>
      :root {
        --bg: #090909;
        --surface: #171717;

        --primary: #ffffff;
        --secondary: #b3b3b3;

        --accent: #b7ff00;
        --accent-2: #66ff66;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: black;
        font-family: "Montserrat", sans-serif;
      }

      .card {
        width: 1024px;
        height: 1280px;
        position: relative;
        overflow: hidden;
        background: #000;
        
        color: white;
      }

      .top {
        position: absolute;

        top: 45px;
        left: 45px;
        right: 45px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        z-index: 10;
      }

      .tag {
        padding: 14px 24px;

        border-radius: 999px;

        background: rgba(0, 0, 0, 0.35);

        backdrop-filter: blur(12px);

        border: 1px solid rgba(183, 255, 0, 0.25);

        color: var(--accent-2);

        font-size: 22px;
        font-weight: 700;

        letter-spacing: 2px;

        font-family: "Space Grotesk", sans-serif;
      }

      .logo-line {
        z-index: 100;
        position: absolute;
        display: flex;
        width: 100%;
        align-items: center;
        gap: 30px;
      }

      .logo {
        width: 250px;
      }

      hr {
        width: 100%;
        opacity: 1;
        height: 3px;
        background-color: var(--accent-2);
        border: none;
      }

      .bg-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 1024px;
        object-fit: cover;
      }

      /* Dark overlay */
      .overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          transparent,
          transparent,
          rgba(0, 0, 0, 0.5),
          black
        );
      }

      /* Main title */
      .title-wrapper {
        position: absolute;
        bottom: 0px;
        width: 100%;
        
        
        text-align: center;
        background: linear-gradient(transparent, black, black, black);
        max-height: 450px;
        min-height: 300px;
        display: flex;
        align-items: center;
        /* border-top: 1px solid var(--accent-2); */
      }

      .title {
        /* font-family: "Anton", sans-serif; */
        font-size: 88px;
        line-height: 1;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        text-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
        font-weight: 600;
        padding: 40px;

      }

      .highlight {
        color: var(--accent-2);
      }

      /* Tiny bottom pattern */
      .pattern {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 100%;
        opacity: 0.9;
        background-image: radial-gradient(white 1px, transparent 1px);
        background-size: 22px 22px;
        left: 0;
      }
    </style>

    <script>
      const textWrap = document.querySelector(".title-wrapper");
      const pattern = document.querySelector(".pattern");
      const logoLine = document.querySelector(".logo-line");

      function alignLogo() {
        const h = textWrap.clientHeight;
        logoLine.style.bottom = h + "px";
      }

      function resizePattern() {
        const h = textWrap.clientHeight;
        const w = textWrap.clientWidth;

        console.log(h);
        console.log(w);

        pattern.style.height = h;
        pattern.style.width = w;
      }

      function autoResizeText() {
        const el = document.querySelector(".title-wrapper");
        const txt = document.querySelector(".title");

        let fontSize = 150;
        const minSize = 10;

        while (fontSize > minSize) {
          txt.style.fontSize = fontSize + "px";

          const isOverflowing =
            el.scrollHeight > el.clientHeight ||
            el.scrollWidth > el.clientWidth;

          if (!isOverflowing) break;

          fontSize -= 2;
        }
      }

      document.fonts.ready.then(() => {
        autoResizeText();
        resizePattern();
        alignLogo();
      });
    </script>
  </body>
</html>
`;
}

const uploadSlideToSupabase = async (imageBuffer) => {
  // ✅ Download image as buffer
  const id = v4();
  const fileName = `history/${id}.png`;

  // ✅ Upload buffer

  console.log("Image Upload started...");

  await supabase.storage.from("project_files").upload(fileName, imageBuffer, {
    contentType: "image/png",
    upsert: true,
  });

  console.log("Image Upload success...");

  const { data } = supabase.storage
    .from("project_files")
    .getPublicUrl(fileName);
  console.log("Image gett url success...");

  return data;
};

module.exports = {
  internalGenerateSlide,
  uploadSlideToSupabase,
};
