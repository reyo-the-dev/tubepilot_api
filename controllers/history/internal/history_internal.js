const { default: axios } = require("axios");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const fs = require("fs");

const STABLE_DIFFUSION_URL =
  process.env.STABLE_DIFFUSION_URL ||
  "https://api.runpod.ai/v2/black-forest-labs-flux-1-schnell/runsync";

const internalGenerateimageForHistorySlide = async ({ prompt }) => {
  const response = await axios.post(
    STABLE_DIFFUSION_URL,
    {
      input: {
        prompt,
        seed: -1,
        num_inference_steps: 6,
        guidance: 6.5,
        negative_prompt: `
              no text
            `,
        image_format: "jpeg",
        width: 800,
        height: 600,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

const internalGenerateSlideForEvent = async (event, isIntro) => {
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

  await page.setContent(generateTemplate(event, isIntro), {
    waitUntil: "networkidle0",
  });

  const buffer = await page.screenshot({ type: "png" });

  fs.writeFileSync("screenshot.png", buffer);

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

function generateTemplate(event, isIntro = false) {
  const { text, imageUrl, year, highlights = "" } = event;

  const words = text.split(" ");

  const logoUrl =
    // "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/logo.png";
    "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/crypto_dose_logo_2.png";

  const splittedHiglights = highlights ? highlights.split(",") : [];

  const formattedText = formatTextWithHighlights(
    words,
    splittedHiglights,
    true,
  );

  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  const date = new Date();

  const day = date.getDate();

  const monthIndex = date.getMonth();

  const month = months[monthIndex];

  if (isIntro) {
    return `<html>
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Montserrat:wght@800;400;600&display=swap"
      rel="stylesheet"
    />
  </head>

  <body style="margin: 0; background-color: rgb(37, 30, 30)">
    <div class="card">
      <p>TODAY IN</p>
      <h2>HISTORY</h2>
      <img src="https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/pattern/flare.png" />
      <h1>${day}</h1>
      <h1 class="tst">${day}</h1>

      <small>${month}</small>

      <div class="bottom">
        EVERY DAY<span>. </span>EVERY STORY<span>.</span> FORVER
        <span class="highlight">HISTORY</span>
      </div>
    </div>

    <style>
      :root {
        --highlight-color: #f2b702;
        --background-color: #0b0f1a;
        --text-primary-color: white;
        --text-secondary-color: #a0a4af;
        --bg-img: url("${imageUrl}");
      }

      .card {
        width: 1024px;
        height: 1280px;
        background:
          radial-gradient(rgba(0, 0, 0, 0.6)),
          radial-gradient(transparent, black), var(--bg-img);
        background-size: cover;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: "Montserrat";
        position: relative;
      }

      .bottom {
        position: absolute;
        bottom: 25px;
        font-size: 25px;
        letter-spacing: 8px;
      }

      .highlight {
        color: var(--highlight-color);
      }

      * {
        color: white;
        margin: 0;
        position: relative;
        z-index: 100;
        /* letter-spacing: 40px; */
      }

      img {
        position: absolute;
        width: 1000px;
        top: 180px;
        opacity: 0.8;
      }

      p {
        font-size: 65px;
        font-weight: 400;
        line-height: 0px;
        text-shadow: 0 0 100px black;
        letter-spacing: 20px;
      }

      h2 {
        font-size: 170px;
        color: var(--highlight-color);

        background-image: url("https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/pattern/gold.jpg");
        background-size: cover;
        background-position: center;

        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        /* optional */
        background-clip: text;
        color: transparent;
        font-weight: 800;
        letter-spacing: -2px;
      }

      h1 {
        font-size: 450px;
        line-height: 400px;
        /* 0 0 100px var(--highlight-color); */
        color: white;

        background-image: url("https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/pattern/silver.jpg");
        background-size: cover;
        background-position: top;

        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        background-clip: text;
        color: transparent;
        font-weight: 800;
      }

      .tst {
        position: absolute;
        top: 497px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 0;
        display: block;
        text-shadow:
          0px 0px 50px black,
          0px 0px 70px var(--highlight-color);
        border-bottom: 1px solid var(--highlight-color);
      }

      small {
        font-size: 80px;
        line-height: 50px;
        text-shadow: 0 0 100px black;
        color: var(--highlight-color);
        font-weight: 600;
        letter-spacing: 20px;
        margin-top: 50px;
      }
    </style>
    <script>
      function autoResizeText() {
        const el = document.querySelector(".text-wrap");
        const txt = document.querySelector(".text");

        let fontSize = 75;
        const minSize = 14;

        while (fontSize > minSize) {
          txt.style.fontSize = fontSize + "px";

          const isOverflowing =
            el.scrollHeight > el.clientHeight ||
            el.scrollWidth > el.clientWidth;

          console.log(isOverflowing);

          if (!isOverflowing) break;

          fontSize -= 2;
        }
      }

      // 🔥 Wait for fonts + DOM properly
      document.fonts.ready.then(() => {
        autoResizeText();
      });
    </script>
  </body>
</html>
`;
  }

  return `<html>
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Montserrat:wght@800;400;600&display=swap"
      rel="stylesheet"
    />
  </head>

  <body style="margin: 0; background-color: rgb(37, 30, 30)">
    <div class="card">
      <img src="${imageUrl}" />
      <div class="text-wrap">
        <div class="text">
        <h1>${year}</h1>
         ${formattedText}
        </div>
      </div>
    </div>

    <style>
      body {
        box-sizing: border-box;
      }
      :root {
        /* #1f1f1f */
        --highlight-color: #f2b702;
        --background-color: #0d0d0d;
        --text-primary-color: white;
        --text-secondary-color: #a0a4af;
        --bg-img: url("bg.png");
      }

      .card {
        width: 1024px;
        height: 1280px;
        font-family: "Montserrat";
        position: relative;
        position: relative;
      }

      img {
        height: 768px;
        width: 100%;
      }

      .text-wrap {
           height: 512px;
        background-color: var(--background-color);
        border-top: 1px solid var(--highlight-color);
      }

      .text {
        color: white;
        padding: 0px 30px 40px 30px;
        font-weight: 600;
        text-align: center;
      }

      h1 {
        margin: 0;
        background-image: url("https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/pattern/gold.jpg");
        background-size: cover;
        background-position: center;

        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        /* optional */
        background-clip: text;
        color: transparent;
        /* font-size: 100px; */
      }

      .highlight {
        color: var(--highlight-color);
        font-weight: 800;

        background-image: url("https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/pattern/gold.jpg");
        background-size: cover;
        background-position: center;

        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        /* optional */
        background-clip: text;
        color: transparent;
      }
    </style>
    <script>
      function autoResizeText() {
        const el = document.querySelector(".text-wrap");
        const txt = document.querySelector(".text");

        let fontSize = 75;
        const minSize = 14;

        while (fontSize > minSize) {
          txt.style.fontSize = fontSize + "px";

          const isOverflowing =
            el.scrollHeight > el.clientHeight ||
            el.scrollWidth > el.clientWidth;

          console.log(isOverflowing);

          if (!isOverflowing) break;

          fontSize -= 2;
        }
      }

      // 🔥 Wait for fonts + DOM properly
      document.fonts.ready.then(() => {
        autoResizeText();
      });
    </script>
  </body>
</html>
`;
}

module.exports = {
  internalGenerateimageForHistorySlide,
  internalGenerateSlideForEvent,
};
