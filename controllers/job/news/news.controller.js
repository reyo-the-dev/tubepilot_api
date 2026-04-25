const fs = require("fs");
const path = require("path");
const { internalGenerateScriptFromNews } = require("./internal/internal");
const { internalGenerateImage } = require("../../imageController");
const {
  internalGenerateSlide,
  internalUploadImageToSupabase,
} = require("../image/internal/internal_functions");
const { file, success } = require("zod");
const { v4 } = require("uuid");

const genetateSlidesForNews = async (req, res) => {
  try {
    const { title, description, image_url, isDummy } = req.body;

    const slideScript = await internalGenerateScriptFromNews(
      req.body,
      5,
      isDummy,
    );

    const { slides } = slideScript.scriptData;

    const results = [];

    let imageCost = 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      // 1. Generate image
      let imageRes = {
        output: {
          image_url:
            "https://image.runpod.ai/4/23/rpV2736M5G/02a3717a-49b9-4361-8357-d12873755faa.jpeg",
        },
      };

      if (!isDummy) {
        imageRes = await internalGenerateImage({
          prompt: slide.image_prompt,
          width: 600,
          height: 750, // 4:5 ratio (optimized)
        });

        imageCost = imageCost + imageRes.output.cost;
      }

      // 2. Prepare slide data
      const slideData = {
        bg: imageRes.output.image_url,
        additionalImage: i == 0 && image_url,
        ...slide,
      };

      // 3. Generate final slide image
      const slideImageBuffer = await internalGenerateSlide(slideData, {
        isUpperCase: true,
      });

      // 4. Save uniquely
      const filePath = path.join(__dirname, `slide-${i + 1}.png`);
      fs.writeFileSync(filePath, slideImageBuffer);

      results.push({
        index: i + 1,
        file: filePath,
      });
    }

    const defaultOutroPath = path.join(__dirname, "internal", "outro.png");

    // destination path
    const outroFilePath = path.join(
      __dirname,
      `slide-${slides.length + 1}.png`,
    );

    // copy file
    fs.copyFileSync(defaultOutroPath, outroFilePath);

    // push to results
    results.push({
      index: slides.length + 1,
      file: outroFilePath,
    });

    return res.status(200).json({
      success: true,
      slides: results,
      slides,
      imageCost,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const generateScriptFromNews = async (req, res) => {
  try {
    const data = {
      success: true,
      data: {
        scriptData: {
          topic: "Tim Cook stepping down - Apple leadership change",
          slides: [
            {
              text: "Apple’s CEO is walking out the door.",
              highlights: ["Apple CEO", "stepping down", "big shakeup"],
              image_prompt:
                "Cinematic, high‑contrast hallway of a sleek corporate office, dim lighting casting long shadows, a silhouette of a leader walking away, subtle Apple logo reflected on glass, financial district skyline visible through windows, no text",
            },
            {
              text: "Tim Cook will leave his role in September, handing the reins to hardware chief John Ternus.",
              highlights: [
                "Tim Cook",
                "September exit",
                "John Ternus takeover",
              ],
              image_prompt:
                "Realistic boardroom with dramatic lighting, a polished wooden table, Tim Cook passing a futuristic iPhone to John Ternus, Apple headquarters in the background, high contrast shadows, no text",
            },
            {
              text: "The change matters because Apple’s future growth and its $300 billion empire now depend on a leader who grew the hardware, not the services‑first vision Cook built.",
              highlights: [
                "future growth",
                "Apple empire",
                "services vs hardware",
              ],
              image_prompt:
                "Cinematic scene of a massive digital stock‑market wall showing Apple’s market cap, hardware devices glowing, faint app icons fading, dramatic lighting emphasizing depth, no text",
            },
            {
              text: "Ternus inherits a sturdy business but faces fierce pressure on the App Store’s 30% cut, regulator scrutiny, and a market hungry for new innovation—risks that could reshape Apple’s profit engine.",
              highlights: [
                "App Store 30% cut",
                "regulator scrutiny",
                "profit engine risk",
              ],
              image_prompt:
                "Stormy night over Apple Park, lightning illuminating the iconic ring, shadowy silhouettes of government buildings and app icons swirling, high contrast, cinematic mood, no text",
            },
            {
              text: "If Ternus can balance hardware excellence with a refreshed services strategy, Apple could stay on top; if not, competitors may finally catch up.",
              highlights: [
                "balance hardware & services",
                "stay on top",
                "competitors catch up",
              ],
              image_prompt:
                "Sunrise over Apple campus, golden light breaking through clouds, silhouette of a confident leader looking toward the horizon, dramatic lighting, high contrast, no text",
            },
          ],
        },
        meta: { slideCount: 5, type: "news_carousel", source: "news" },
      },
    };

    let script = {
      scriptData: {
        topic: "China's J-20 Stealth Fighter Threat",
        slides: [
          {
            text: "Is China's J-20 the next air superpower?",
            highlights: ["J-20", "next air superpower", "China"],
            image_prompt:
              "Cinematic aerial view of a sleek stealth fighter silhouette soaring over a dimly lit map of Asia, dramatic lighting, high contrast, realistic, no text",
          },
          {
            text: "China unveiled its fifth-generation stealth jet, the J-20, designed for long-range strikes and advanced sensing.",
            highlights: [
              "fifth-generation stealth jet",
              "long-range strikes",
              "advanced sensing",
            ],
            image_prompt:
              "Realistic close-up of a Chengdu J-20 stealth fighter parked on a runway at dusk, technicians in flight suits, cinematic lighting, high contrast, no text",
          },
          {
            text: "The jet can fly far, stay hidden, and hit targets before anyone sees it, shifting the balance of power in the skies.",
            highlights: ["fly far", "stay hidden", "shift balance of power"],
            image_prompt:
              "Dramatic war room with glowing radar screens showing a faint stealth aircraft silhouette, commanders in discussion, cinematic mood, high contrast, realistic, no text",
          },
          {
            text: "If deployed in large numbers, the J-20 could challenge U.S. and allied air forces, forcing new tactics and costly counter-stealth tech.",
            highlights: [
              "challenge U.S. air forces",
              "new tactics",
              "counter-stealth tech",
            ],
            image_prompt:
              "High-contrast cinematic scene of a US fighter jet and a Chinese J-20 locked in a tense sky duel, clouds swirling, dramatic lighting, realistic, no text",
          },
          {
            text: "Experts say the race for stealth will intensify, with more upgrades and rival jets on the horizon.",
            highlights: ["race for stealth", "upgrades", "rival jets"],
            image_prompt:
              "Cinematic sunrise over an airbase with multiple next-generation stealth fighters lined up, silhouettes against bright sky, high contrast, realistic, no text",
          },
        ],
      },
      meta: { slideCount: 5, type: "news_carousel", source: "news" },
    };

    script = await internalGenerateScriptFromNews(req.body);

    const meta = script.meta;

    meta.article_id = req.body.article_id;
    meta.link = req.body.link;
    meta.description = req.body.description;
    meta.title = req.body.title;
    meta.keywords = req.body.keywords;
    meta.category = req.body.category;
    meta.image_url = req.body.image_url;
    meta.source_name = req.body.source_name;
    meta.source_url = req.body.source_url;
    meta.source_icon = req.body.source_icon;

    return res
      .status(200)
      .json({ success: true, script: script.scriptData, meta });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const generateSlideFromScript = async (req, res) => {
  try {
    const { script, meta } = req.body;

    const { slides } = script;

    const results = [];

    let imageCost = 0;

    const isDummy = false;

    const id = v4();

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`Generating slide ${i + 1}`);

      // 1. Generate image
      let imageRes = {
        output: {
          image_url:
            "https://image.runpod.ai/4/23/rpV2736M5G/02a3717a-49b9-4361-8357-d12873755faa.jpeg",
        },
      };

      if (!isDummy) {
        imageRes = await internalGenerateImage({
          prompt: slide.image_prompt,
          // width: 640,
          // height: 480,

          // width: 800,
          // height: 600,

          width: 1024,
          height: 768,
        });

        imageCost = imageCost + imageRes.output.cost;
      }

      console.log(`Image generation success for slide ${i + 1}`);

      // 2. Prepare slide data
      const slideData = {
        bg: imageRes.output.image_url,
        additionalImage: i == 0 && meta.image_url,
        ...slide,
      };

      // 3. Generate final slide image
      const slideImageBuffer = await internalGenerateSlide(slideData, {
        isUpperCase: true,
      });

      console.log(`Slide creation success for slide ${i + 1}`);

      const slideUrl = await internalUploadImageToSupabase(
        id,
        slideImageBuffer,
        i + 1,
      );

      console.log(`Upload success for slide ${i + 1}`);
      console.log(`------------------------------------------------`);

      results.push({
        index: i + 1,
        slideUrl,
      });
    }

    // const defaultOutroPath = path.join(__dirname, "internal", "outro.png");

    // const outroSlideNumber = slides.length + 1;

    // // destination path
    // const outroFilePath = path.join(__dirname, `slide-${outroSlideNumber}.png`);

    // // copy file
    // fs.copyFileSync(defaultOutroPath, outroFilePath);

    // console.log(
    //   `Outro slide added successfully as slide number ${outroSlideNumber}`,
    // );

    // // push to results
    // results.push({
    //   index: slides.length + 1,
    //   file: outroFilePath,
    // });

    console.log(`Total cost : $${imageCost}`);

    return res.status(200).json({
      success: true,
      slides: results,
      meta,
      imageCost,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  genetateSlidesForNews,
  generateScriptFromNews,
  generateSlideFromScript,
};
