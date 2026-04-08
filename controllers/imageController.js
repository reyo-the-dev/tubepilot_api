const axios = require("axios");
const fs = require("fs");

const STABLE_DIFFUSION_URL =
  process.env.STABLE_DIFFUSION_URL ||
  "https://api.runpod.ai/v2/black-forest-labs-flux-1-schnell/runsync";

async function generateImage(prompt) {
  const response = await axios.post(
    STABLE_DIFFUSION_URL,
    {
      input: {
        prompt,
        seed: -1,
        num_inference_steps: 4,
        guidance: 7,
        negative_prompt: "",
        image_format: "jpeg",
        width: 720,
        height: 1280,
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

const internalGenerateImage = async ({ prompt }) => {
  try {
    return await generateImage(prompt);
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
