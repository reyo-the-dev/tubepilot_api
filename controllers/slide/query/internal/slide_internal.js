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
    return `<html>
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
  </head>

  <body>
    <div class="card">
      <!-- BACKGROUND -->
      <div class="bg"></div>

      <!-- IMAGE -->
      <div class="image-wrap">
        <img
          src="${imageUrl}"
        />
      </div>

      <!-- OVERLAY -->
      <div class="overlay"></div>

      <!-- NOISE -->
      <div class="noise"></div>

      <!-- TOP -->
   

      <!-- MAIN CONTENT -->
      <div class="content">
        <!-- TITLE -->
        <div class="title-wrap">
          <div class="title-bg">${title}</div>

          <div class="title">${title}</div>
        </div>

        <!-- DESCRIPTION -->
        <div class="desc-wrap">
          <div class="desc">
           ${formattedText}
          </div>
        </div>
      </div>

      <!-- DECOR -->
      <div class="circle"></div>
      <div class="gradient-line"></div>
    </div>

    <style>
      * {
        box-sizing: border-box;
      }

      :root {
        --bg: #090909;
        --surface: #171717;
        --primary: #ffffff;
        --secondary: #b3b3b3;
        --accent: #b7ff00;
        --accent-2: #66ff66;
      }

      body {
        margin: 0;
        background: black;
      }

      .card {
        width: 1024px;
        height: 1280px;

        position: relative;
        overflow: hidden;

        background: var(--bg);

        font-family: "Inter", sans-serif;
      }

      /* BG */

      .bg {
        position: absolute;
        inset: 0;

        background:
          radial-gradient(
            circle at top right,
            rgba(0, 255, 213, 0.15),
            transparent 35%
          ),
          radial-gradient(
            circle at bottom left,
            rgba(0, 166, 255, 0.12),
            transparent 35%
          ),
          linear-gradient(to bottom, #0f1117, #070707);
      }

      /* IMAGE */

      .image-wrap {
        position: absolute;

        top: 0;
        left: 0;

        width: 100%;
        height: 1024px;

        z-index: 1;

        display: flex;
        justify-content: center;
        align-items: center;
      }

      img {
        width: 100%;
        height: 100%;

        object-fit: contain;

        /* filter: brightness(0.72) contrast(1.08) saturate(0.9) grayscale(0.08); */
      }

      /* OVERLAY */

      .overlay {
        position: absolute;
        inset: 0;

        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 1) 0%,
          rgba(0, 0, 0, 0.9) 18%,
          rgba(0, 0, 0, 0.45) 48%,
          rgba(0, 0, 0, 0.1) 72%,
          rgba(0, 0, 0, 0.55) 100%
        );

        z-index: 2;
      }

      /* NOISE */

      .noise {
        position: absolute;
        inset: 0;

        opacity: 0.03;

        background-image: repeating-radial-gradient(
          circle at 0 0,
          transparent 0,
          #fff 1px,
          transparent 2px
        );

        background-size: 12px 12px;

        z-index: 3;
      }

      /* TOP BAR */

      .top-bar {
        position: absolute;

        top: 50px;
        left: 50px;
        right: 50px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        z-index: 10;
      }

      .category {
        padding: 14px 24px;

        border: 1px solid rgba(255, 255, 255, 0.12);

        background: rgba(255, 255, 255, 0.05);

        backdrop-filter: blur(14px);

        border-radius: 999px;

        color: var(--accent);

        font-size: 22px;
        font-weight: 700;

        letter-spacing: 2px;

        font-family: "Space Grotesk", sans-serif;
      }

      .slide-no {
        font-size: 42px;
        font-weight: 900;

        color: rgba(255, 255, 255, 0.25);

        letter-spacing: -2px;
      }

      /* CONTENT */

      .content {
        position: absolute;

        left: 55px;
        right: 55px;
        bottom: 65px;

        z-index: 10;
      }

      /* TITLE WRAP */

      .title-wrap {
        position: relative;

        margin-bottom: 35px;
      }

      .title-bg {
        position: absolute;

        top: -90px;
        left: -10px;

        font-size: 150px;
        font-weight: 900;

        color: rgba(255, 255, 255, 0.04);

        letter-spacing: -12px;

        text-transform: uppercase;

        pointer-events: none;
      }

      .title {
        position: relative;

        color: white;

        font-size: 100px;
        line-height: 0.88;

        font-weight: 900;

        letter-spacing: -6px;

        text-transform: uppercase;

        text-shadow: 0px 8px 30px rgba(0, 0, 0, 0.75);
      }

      /* DESC */

      .desc-wrap {
        height: 300px;
        overflow: hidden;

        max-width: 900px;
      }

      .desc {
        color: rgba(255, 255, 255, 0.92);

        font-weight: 700;

        line-height: 1.12;

        text-shadow: 0px 4px 18px rgba(0, 0, 0, 0.8);
      }

      .highlight {
        color: var(--accent);
        font-weight: 800;
      }

      /* DECOR */

      .circle {
        position: absolute;

        width: 260px;
        height: 260px;

        border-radius: 50%;

        border: 2px solid rgba(255, 255, 255, 0.06);

        right: -80px;
        bottom: 240px;

        z-index: 0;
      }

      .gradient-line {
        position: absolute;

        bottom: 0;
        left: 0;

        width: 100%;
        height: 10px;

        background: linear-gradient(
          to right,
          var(--accent),
          var(--accent-2),
          white
        );

        z-index: 20;
      }
    </style>

    <script>
      function autoResizeText() {
        const el = document.querySelector(".desc-wrap");
        const txt = document.querySelector(".desc");

        let fontSize = 58;
        const minSize = 22;

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
      });
    </script>
  </body>
</html>
`;
  }

  return `
<html>
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&family=Space+Grotesk:wght@500;700&display=swap"
      rel="stylesheet"
    />
  </head>

  <body>
    <div class="card">
      <!-- IMAGE -->
      <div class="image-wrap">
        <img
        class="bg-img"
          src="${imageUrl}"
        />
      </div>

      <!-- LIGHT OVERLAY -->
      <div class="overlay"></div>

      <!-- TOP -->
      <div class="top">
        <div class="tag">${category}</div>
      </div>

      
      <img
        class="logo"
        alt="@briefonix"
        src="https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/briefonix_logo%20(1).png"
      />

      <!-- MAIN -->
      <div class="content">
        <!-- HUGE TITLE -->
        <div class="title">
          ${text}
        </div>

        <!-- SUBTEXT -->
        <div class="subtitle">
          ${sub_title}
        </div>
      </div>

      <!-- SIDE PANEL -->
      <div class="side-panel">
        <div class="panel-text">SWIPE →</div>
      </div>

      <!-- DECOR -->
      <div class="ring"></div>
      <div class="bottom-line"></div>
    </div>

    <style>
      * {
        box-sizing: border-box;
      }

      :root {
        --bg: #090909;
        --surface: #171717;

        --primary: #ffffff;
        --secondary: #b3b3b3;

        --accent: #b7ff00;
        --accent-2: #66ff66;
      }

      body {
        margin: 0;
        background: black;
      }

      .card {
        width: 1024px;
        height: 1280px;
        position: relative;
        overflow: hidden;
        background: var(--bg);
        font-family: "Inter", sans-serif;
      }

      /* IMAGE */

      .image-wrap {
        position: absolute;
        inset: 0;
        z-index: 1;
      }

      .bg-img {
        width: 100%;
        height: 100%;
        object-fit: cover;

        /* filter: brightness(0.72) contrast(1.08) saturate(0.95); */
      }

      /* LIGHT OVERLAY */

      .overlay {
        position: absolute;
        inset: 0;

        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.82) 0%,
          rgba(0, 0, 0, 0.25) 45%,
          rgba(0, 0, 0, 0.12) 100%
        );

        z-index: 2;
      }

      /* TOP */

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

       .logo {
        width: 250px;
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        /* transform: translateX(50%); */
      }

      .tag {
        padding: 14px 24px;

        border-radius: 999px;

        background: rgba(0, 0, 0, 0.35);

        backdrop-filter: blur(12px);

        border: 1px solid rgba(183, 255, 0, 0.25);

        color: var(--accent);

        font-size: 22px;
        font-weight: 700;

        letter-spacing: 2px;

        font-family: "Space Grotesk", sans-serif;
      }

      .number {
        color: white;

        font-size: 70px;
        font-weight: 900;

        letter-spacing: -4px;

        text-shadow: 0px 6px 20px rgba(0, 0, 0, 0.5);
      }

      /* CONTENT */

      .content {
        position: absolute;

        left: 60px;
        right: 120px;
        bottom: 90px;

        z-index: 10;
      }

      .title {
        color: white;

        font-size: 108px;
        line-height: 0.9;

        font-weight: 900;

        letter-spacing: -7px;

        text-transform: uppercase;

        margin-bottom: 35px;

        text-shadow: 0px 8px 30px rgba(0, 0, 0, 0.7);
      }

      .title::after {
        content: "";

        display: block;

        width: 260px;
        height: 10px;

        border-radius: 999px;

        margin-top: 30px;

        background: linear-gradient(to right, var(--accent), var(--accent-2));

        box-shadow: 0 0 30px rgba(183, 255, 0, 0.4);
      }

      .subtitle {
        max-width: 720px;

        color: rgba(255, 255, 255, 0.88);

        font-size: 44px;
        line-height: 1.28;

        font-weight: 600;
        text-shadow: 0px 4px 18px rgba(0, 0, 0, 0.7);
      }

      /* SIDE PANEL */

      .side-panel {
        position: absolute;

        top: 0;
        right: 0;

        width: 90px;
        height: 100%;

        background: linear-gradient(to left, rgba(0, 0, 0, 0.45), transparent);

        display: flex;
        justify-content: center;
        align-items: center;

        z-index: 10;
      }

      .panel-text {
        color: var(--accent);

        font-size: 22px;
        font-weight: 800;

        letter-spacing: 5px;

        transform: rotate(90deg);

        white-space: nowrap;
      }

      /* RING */

      .ring {
        position: absolute;

        width: 420px;
        height: 420px;

        border-radius: 50%;

        border: 2px solid rgba(183, 255, 0, 0.12);

        top: 180px;
        right: -140px;

        z-index: 3;
      }

      /* BOTTOM LINE */

      .bottom-line {
        position: absolute;

        bottom: 0;
        left: 0;

        width: 100%;
        height: 10px;

        background: linear-gradient(to right, var(--accent), var(--accent-2));

        z-index: 20;
      }
    </style>
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
