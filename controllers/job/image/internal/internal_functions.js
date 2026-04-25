const { default: OpenAI } = require("openai");
// const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const { v4 } = require("uuid");
const { supabase } = require("../../../../config/supabase");

const internalGenerateScriptForSlides = async (topic, slideCount = 5) => {
  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const response = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You are an expert viral Instagram carousel scriptwriter and AI image prompt engineer. Always return ONLY valid JSON. No markdown. No explanation.",
      },
      {
        role: "user",
        content: `
Create a high-performing Instagram carousel script about: ${topic}.

Requirements:
- Total slides: ${slideCount}
- Slide 1 = short, catchy intro (max 8 words, scroll-stopping)
- Remaining slides = informative, clear, value-driven (1-2 sentences each)
- Each slide should explain properly (not vague or clickbait)
- Language: simple and easy to understand
- Tone: engaging and slightly dramatic

For EACH slide return:
- text (FULL sentence)
- highlights (array of 2-4 important words or phrases from the text)
- image_prompt (cinematic, descriptive, no text in image, suitable for background)

Image prompt rules:
- Must match the meaning of the slide
- Include: cinematic, high contrast, no text

Return ONLY JSON in this format:
{
  "topic": "",
  "slides": [
    {
      "text": "",
      "highlights": [],
      "image_prompt": ""
    }
  ]
}
        `,
      },
    ],
    temperature: 0.7,
  });

  // Clean response
  const clean = response.choices[0].message.content
    .replace(/```json|```/g, "")
    .trim();

  const jsonData = JSON.parse(clean);

  // Combine all slide text
  const fullScript = jsonData.slides.map((s) => s.text).join(" ");

  return {
    scriptData: jsonData,
    fullScript,
    meta: {
      slideCount,
      type: "carousel",
    },
  };
};

async function internalGenerateSlide(
  slideData,
  options = {
    isUpperCase: false,
  },
) {
  const isLocal = process.env.NODE_ENV === "dev";
  // const isLocal = true;

  const browser = await puppeteer.launch(
    isLocal
      ? {
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          headless: true,
        }
      : {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        },
  );

  const page = await browser.newPage();

  await page.setViewport({ width: 1024, height: 1280 });

  await page.setContent(
    generateTemplate(slideData, options),

    {
      waitUntil: "networkidle0",
    },
  );

  const buffer = await page.screenshot({ type: "png" });

  await browser.close();
  return buffer;
}

function formatTextWithHighlights(words, highlights = [], isUpperCase = false) {
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

function generateTemplate(
  { bg, additionalImage, text, highlights = [] },
  options = {
    isUpperCase: false,
  },
) {
  const words = text.split(" ");

  const logoUrl =
    // "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/logo.png";
    "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/crypto_dose_logo_2.png";

  const formattedText = formatTextWithHighlights(
    words,
    highlights,
    options?.isUpperCase,
  );

  const isOutro = false;

  const source = "TechCrunch";
  const name = "@daily_new_and_facts";

  const highlightColor = "#dc2626";
  const backgroundColor = "#111114";
  const textPrimaryColor = "white";
  const textSecondaryColor = "#a0a4af";

  return `<html>
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@800&display=swap"
      rel="stylesheet"
    />

      <link
      href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap"
      rel="stylesheet"
    />

    
    <link
      href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&display=swap"
      rel="stylesheet"
    />
  </head>

  <body style="margin: 0">
    <div class="card">
      <div class="tag">Technology</div>
      <div class="image"></div>
      
      ${additionalImage ? `<img src="${additionalImage}" class="addImg" />` : ""}
      <div class="text-wrap">
        <div class="text">
          ${formattedText}
        </div>

        <div class="bottom">
          <div class="source">Source : ${source}</div>
          <div class="name">${name}</div>
        </div>
      </div>
    </div>

    <style>
      :root {
        --highlight-color: ${highlightColor};
        --background-color: ${backgroundColor};
        --text-primary-color: ${textPrimaryColor};
        --text-secondary-color: ${textSecondaryColor};
      }

      .card {
        width: 1024px;
        height: 1280px;
        font-family: "Montserrat", sans-serif;
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: var(--background-color);
      }

        .addImg {
        position: absolute;
        box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
      }

      .tag {
        position: absolute;
        top: 10px;
        left: 10px;
        background-color: var(--highlight-color);
        font-size: 25px;
        padding: 8px 20px;
        border-radius: 8px;
        color: var(--background-color);
        border: 1px solid #04022729;
      }

      .image {
        background-image: url("${bg}");
        
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        width: 100%;
        height: 768px;
      }

      .overlay {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 100%;
        /* background-color: rgba(0, 0, 0, 0.7); */
      }

      .logo {
        position: absolute;
        background: url("https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/crypto_dose_logo_2.png")
          center/cover no-repeat;
        height: 150px;
        width: 150px;
        bottom: 180px;
        right: 50%;
        transform: translateX(50%);
        z-index: 100;
      }

      .text-wrap {
        background-color: var(--background-color);
        display: flex;
        align-items: center;
        height: 512px;
        border-top: 2px solid var(--highlight-color);
        position: relative;
      }

      .text {
        color: var(--text-primary-color);
        font-size: 70px;
        line-height: 1.2;
        text-align: center;
        word-wrap: break-word;
        height: fit-content;
        font-family: "Anton", sans-serif;
        padding: 70px;
        padding-top: 35px;
        text-transform: uppercase;
        
      }

      .bottom {
        position: absolute;

        display: flex;
        justify-content: space-between;
        bottom: 0;
        width: 100%;
        padding-bottom: 20px;
      }

      .source {
        margin-left: 50px;
        color: var(--text-secondary-color);
        font-size: 20px;
      }

      .name {
        margin-right: 50px;
        color: var(--highlight-color);
        font-size: 20px;
      }

      .highlight
       {
        color: var(--highlight-color);
        letter-spacing: 1px;
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

      function autoResizeImage() {
        const addImg = document.querySelector(".addImg");

        const isPortrait = addImg.clientHeight > addImg.clientWidth;

        // console.log();

        if (isPortrait) {
          addImg.style.height = "500px";
          addImg.style.width = "auto";
          addImg.style.top = "278px";
        } else {
          addImg.style.width = "500px";
          addImg.style.height = "auto";
          addImg.style.top = 768 - addImg.clientHeight + "px";
          
          
        }
      }
      // 🔥 Wait for fonts + DOM properly
      document.fonts.ready.then(() => {
        autoResizeText();
        autoResizeImage();
      });
    </script>
  </body>
</html>
`;
}

const internalUploadImageToSupabase = async (id, slideimage, index) => {
  const fileName = `slides/${id}/slide_${index}.png`;

  await supabase.storage.from("project_files").upload(fileName, slideimage, {
    contentType: "image/png",
    upsert: true,
  });

  const { data } = supabase.storage
    .from("project_files")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

module.exports = {
  internalGenerateScriptForSlides,
  internalGenerateSlide,
  internalUploadImageToSupabase,
};
