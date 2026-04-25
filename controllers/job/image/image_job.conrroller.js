const { createCanvas, loadImage } = require("canvas");

const {
  internalGenerateScriptForSlides,
  internalGenerateSlide,
} = require("./internal/internal_functions");
const { v4 } = require("uuid");
const path = require("path");

const generateCarousalImage = async (req, res) => {
  try {
    const { topic } = req.body;

    const script = {
      success: true,
      topic: "Why most people stay broke forever",
      script: {
        scriptData: {
          topic: "Why most people stay broke forever",
          slides: [
            {
              text: "Stuck in the Money Trap?",
              highlights: ["Money Trap", "Stuck"],
              image_prompt:
                "cinematic, high contrast scene of a dark alley with a broken golden chain lying on the ground, dramatic lighting, no text",
            },
            {
              text: "They believe money is luck, not a skill they can learn.",
              highlights: ["money is luck", "skill they can learn"],
              image_prompt:
                "cinematic, high contrast close-up of a hand holding lottery tickets against a blurred city background, dramatic shadows, no text",
            },
            {
              text: "Every day their expenses outpace income because they never budget.",
              highlights: ["expenses outpace income", "never budget"],
              image_prompt:
                "cinematic, high contrast view of a kitchen table covered in scattered receipts, bills, and a coffee mug, dramatic light from a window, no text",
            },
            {
              text: "Fear of risk keeps them from investing and growing wealth.",
              highlights: ["fear of risk", "investing"],
              image_prompt:
                "cinematic, high contrast silhouette of a person standing at the edge of a cliff looking down at a dark abyss, stormy sky, no text",
            },
            {
              text: "Start learning finance, set clear goals, and automate your savings.",
              highlights: ["learn finance", "automate savings", "clear goals"],
              image_prompt:
                "cinematic, high contrast sunrise over a modern city skyline with a faint upward graph overlay in the sky, warm light, no text",
            },
          ],
        },
        fullScript:
          "Stuck in the Money Trap? They believe money is luck, not a skill they can learn. Every day their expenses outpace income because they never budget. Fear of risk keeps them from investing and growing wealth. Start learning finance, set clear goals, and automate your savings.",
        meta: {
          slideCount: 5,
          type: "carousel",
        },
      },
    };

    const images = [
      "https://image.runpod.ai/4/14/yMHbG31J9p/a1c78b92-88bf-4dc0-9a10-d1b1effa70df.png",
      "https://image.runpod.ai/4/14/uzjeHY3Jen/53f69ec8-82bd-4da2-b5b6-2123d7a13d63.png",
      "https://image.runpod.ai/4/14/hPZt0WFJRO/89c475c1-72ec-463c-9eec-544ea1707d76.png",
      "https://image.runpod.ai/4/14/No3IBj3g_M/b56d055a-cf79-4d50-978d-a2490d19c51d.png",
      "https://image.runpod.ai/4/14/LYANTmgaZ5/ba28cf39-7133-474d-819a-56e3a94a7e63.png",
    ];

    console.log("Started..");

    const id = v4();

    const basPath = path.join(__dirname, id);

    const slideData = {
      ...script.script.scriptData.slides[3],

      bg: images[3],
    };

    const fileName = "xx5.png";

    await internalGenerateSlide(slideData, fileName, {
      isUpperCase: true,
    });

    // const script = await internalGenerateScriptForSlides(topic);

    return res.status(200).json({
      success: true,
      topic,
      script,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error.message);
  }
};

module.exports = { generateCarousalImage };
