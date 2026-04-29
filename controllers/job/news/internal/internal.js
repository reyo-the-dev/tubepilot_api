const { default: OpenAI } = require("openai");
// const path = require("path");

const internalGenerateScriptFromNews = async (
  news,
  slideCount = 5,
  isDuummy,
) => {
  if (isDuummy) {
    return {
      scriptData: {
        topic: "Bitcoin hits $79,000 amid US‑Iran talks",
        slides: [
          {
            text: "Bitcoin rockets past $79,000!",
            highlights: ["Bitcoin rockets", "$79,000", "crypto surge"],
            image_prompt:
              "Cinematic night skyline with glowing cryptocurrency symbols hovering above skyscrapers, dramatic lighting, high contrast, no text",
          },
          {
            text: "Bitcoin surged to over $79,000 after former President Trump hinted US‑Iran talks could restart Friday.",
            highlights: [
              "Bitcoin surged",
              "over $79,000",
              "Trump hinted",
              "US‑Iran talks",
            ],
            image_prompt:
              "Realistic trading floor with a large screen showing news anchor and crypto charts, dramatic shadows, high contrast, no text",
          },
          {
            text: "The price jump shows investors betting on diplomatic optimism, linking politics directly to crypto markets.",
            highlights: [
              "price jump",
              "investors betting",
              "diplomatic optimism",
              "politics to crypto",
            ],
            image_prompt:
              "Close‑up of a focused trader watching a political news broadcast while a glowing Bitcoin chart rises, cinematic lighting, high contrast, no text",
          },
          {
            text: "If the talks stall, the same volatility could erase gains, shaking global economic confidence.",
            highlights: [
              "talks stall",
              "volatility could erase gains",
              "global economic confidence",
            ],
            image_prompt:
              "Stormy financial exchange floor with trembling screens and falling charts, dramatic mood, cinematic lighting, no text",
          },
          {
            text: "Watch the negotiations—success could push Bitcoin higher, while failure may trigger a sharp correction.",
            highlights: [
              "watch negotiations",
              "push Bitcoin higher",
              "sharp correction",
            ],
            image_prompt:
              "Sunrise over a world map with subtle Bitcoin icons, hopeful yet tense atmosphere, cinematic lighting, high contrast, no text",
          },
        ],
      },
      meta: {
        slideCount: 5,
        type: "news_carousel",
        source: "news",
      },
    };
  }

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
          "You are an expert viral Instagram carousel scriptwriter specialized in breaking down NEWS into engaging, simple, high-retention carousel content. Always return ONLY valid JSON.",
      },
      {
        role: "user",
        content: `
Convert the following today in history into a viral Instagram carousel slide content.

Event: The 7.0 Mw  Racha earthquake affects Georgia with a maximum MSK intensity of IX (Destructive), killing 270 people.


- Tone: engaging, slightly dramatic but factual

For slide return:
- text (FULL sentence)
- highlights (2-3 key words)
- image_prompt (cinematic, realistic, no text, high contrast)

Image prompt rules:
- Must reflect real-world context (finance, politics, economy)
- No text inside image
- Cinematic lighting, dramatic mood

Return ONLY JSON:

   {
      "text": "",
      "highlights": [],
      "image_prompt": ""
    }

        `,
      },
      //       {
      //         role: "user",
      //         content: `
      // Convert the following NEWS into a viral Instagram carousel.

      // NEWS:
      // Title: ${news.title}
      // Description: ${news.description}

      // Requirements:
      // - Total slides: ${slideCount}
      // - Slide 1 = powerful hook based on the news (max 8 words)
      // - Slide 2 = what happened (simple explanation)
      // - Slide 3 = why it matters
      // - Slide 4 = deeper insight / impact / risk
      // - Slide 5 = conclusion or future outlook
      // - Keep each slide 1-2 sentences max
      // - Avoid jargon, keep it simple
      // - Tone: engaging, slightly dramatic but factual

      // For EACH slide return:
      // - text (FULL sentence)
      // - highlights (2-4 key phrases)
      // - image_prompt (cinematic, realistic, no text, high contrast)

      // Image prompt rules:
      // - Must reflect real-world context (finance, politics, economy)
      // - No text inside image
      // - Cinematic lighting, dramatic mood

      // Return ONLY JSON:
      // {
      //   "topic": "",
      //   "slides": [
      //     {
      //       "text": "",
      //       "highlights": [],
      //       "image_prompt": ""
      //     }
      //   ]
      // }
      //         `,
      //       },
    ],
    temperature: 0.6,
  });

  const clean = response.choices[0].message.content
    .replace(/```json|```/g, "")
    .trim();

  const jsonData = JSON.parse(clean);

  const fullScript = jsonData.slides.map((s) => s.text).join(" ");

  return {
    scriptData: jsonData,
    meta: {
      slideCount,
      type: "news_carousel",
      source: "news",
    },
  };
};

module.exports = {
  internalGenerateScriptFromNews,
};
