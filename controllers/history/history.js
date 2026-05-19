const { v4 } = require("uuid");
const axios = require("axios");
const {
  internalGenerateimageForHistorySlide,
  internalGenerateSlideForEvent,
} = require("./internal/history_internal");
const { supabase } = require("../../config/supabase");

const generateImageForSlide = async (req, res) => {
  try {
    console.log("Image Generation started...");

    const imageRes = await internalGenerateimageForHistorySlide({
      prompt: req.body.imagePrompt,
    });

    console.log("Image Generated successfully...");

    const imageUrl = imageRes.output.image_url;

    // ✅ Download image as buffer
    console.log("Image Downloaded...");

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data, "binary");

    const id = v4();
    const fileName = `history/${id}.jpg`;

    // ✅ Upload buffer

    console.log("Image Upload started...");

    await supabase.storage.from("project_files").upload(fileName, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

    console.log("Image Upload success...");

    const { data } = supabase.storage
      .from("project_files")
      .getPublicUrl(fileName);

    console.log("Image gett url success...");

    return res.status(200).json({
      success: true,
      imageUrl: data.publicUrl,
      imageRes,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const generateSlidesForEvents = async (req, res) => {
  try {
    const { event, isIntro, isOutro } = req.body;

    const outroUrl =
      "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/history/ba7d9485-d6ab-4544-b016-e4959347f778.png";
    if (isOutro) {
      return res.status(200).json({
        success: true,
        data: {
          publicUrl: outroUrl,
        },
      });
    }

    const imageBuffer = await internalGenerateSlideForEvent(event, isIntro);

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

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { generateImageForSlide, generateSlidesForEvents };
