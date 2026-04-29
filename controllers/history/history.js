const { v4 } = require("uuid");
const axios = require("axios");
const {
  internalGenerateimageForHistorySlide,
  internalGenerateSlideForEvent,
} = require("./internal/history_internal");
const { supabase } = require("../../config/supabase");

const generateImageForSlide = async (req, res) => {
  try {
    console.log("Imgage Generation started...");

    const imageRes = await internalGenerateimageForHistorySlide({
      prompt: req.body.imagePrompt,
    });

    console.log("Imgage Generated successfully...");

    const imageUrl = imageRes.output.image_url;

    // ✅ Download image as buffer
    console.log("Imgage Downloaded...");

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data, "binary");

    const id = v4();
    const fileName = `history/${id}.jpg`;

    // ✅ Upload buffer

    console.log("Imgage Upload started...");

    await supabase.storage.from("project_files").upload(fileName, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

    console.log("Imgage Upload success...");

    const { data } = supabase.storage
      .from("project_files")
      .getPublicUrl(fileName);

    console.log("Imgage gett url success...");

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
    const { event, isIntro } = req.body;

    const imageBuffer = await internalGenerateSlideForEvent(event, isIntro);

    const id = v4();
    const fileName = `history/${id}.png`;

    // ✅ Upload buffer

    console.log("Imgage Upload started...");

    await supabase.storage.from("project_files").upload(fileName, imageBuffer, {
      contentType: "image/png",
      upsert: true,
    });

    console.log("Imgage Upload success...");

    const { data } = supabase.storage
      .from("project_files")
      .getPublicUrl(fileName);
    console.log("Imgage gett url success...");

    console.log(data);

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
