const axios = require("axios");
const fs = require("fs");

const STABLE_DIFFUSION_URL =
  process.env.STABLE_DIFFUSION_URL ||
  "https://api.runpod.ai/v2/black-forest-labs-flux-1-schnell/runsync";

async function generateImage(prompt, width = 720, height = 1280) {
  const response = await axios.post(
    STABLE_DIFFUSION_URL,
    {
      input: {
        prompt: `
      ${prompt},
      ultra detailed, sharp focus, high resolution, 8k quality,
      professional photography, cinematic lighting, global illumination,
      realistic textures, fine details, depth of field,
      highly detailed environment, dramatic composition
    `,
        seed: -1,
        num_inference_steps: 6,
        guidance: 6.5,
        negative_prompt: `
      blurry, low quality, low detail, pixelated, noise,
      overexposed, underexposed, washed out,
      distorted, bad anatomy, artifacts, watermark, text
    `,
        image_format: "jpeg",
        width,
        height,
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
}

const internalGenerateImage = async ({ prompt, width, height }) => {
  try {
    return await generateImage(prompt, width, height);
  } catch (error) {
    console.error(
      `[ImageGen] Critical Failure — prompt: "${prompt}" | error: ${error.message}`,
    );
    throw error;
  }
};

const generateImageEndpoint = async (req, res) => {
  try {
    const { prompt } = req.body;

    const base64Image = await generateImage(prompt, "test_img");
    return res.status(201).json({
      success: true,
      data: base64Image,
    });
  } catch (error) {
    console.error(`[ImageGen] Critical Failure — error: ${error.message}`);
    return res.status(500).json(error.message);
  }
};

module.exports = {
  generateImage,
  internalGenerateImage,
  generateImageEndpoint,
};
