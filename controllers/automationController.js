const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
  internalGenerateScript,
  internalTTS,
  internalGetTimestamps,
} = require("./speechController");

const {
  internalGenerateVideo,
} = require("./video_controller/video_controller");

const { internalGenerateImage } = require("./imageController");

const automateVideoGeneration = async (req, res) => {
  const {
    topic,
    artStyle = "digital art",
    duration = 30,
    styleOptions = {},
    audioOptions = {},
  } = req.body;

  const projectId = crypto.randomUUID();
  const workspaceDir = path.join(__dirname, "../videos", projectId);
  const imagesDir = path.join(workspaceDir, "images");

  try {
    // 1. Initialize Workspace
    console.log("[Automation] Initializing workspace...");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 2. Script Generation
    console.log("[Automation] Step 1: Generating Script...");
    const scriptData = await internalGenerateScript(topic, artStyle, duration);

    fs.writeFileSync(
      path.join(workspaceDir, "script.json"),
      JSON.stringify(scriptData, null, 2),
    );

    // 3. Text to Speech
    console.log("[Automation] Step 2: Converting Text to Speech...");
    const audioFilePath = path.join(workspaceDir, "audio.wav");
    await internalTTS(scriptData.fullScript, audioFilePath);

    // 4. Transcription (Timestamps)
    console.log("[Automation] Step 3: Extracting Timestamps...");
    const timestampData = { data: await internalGetTimestamps(audioFilePath) };

    fs.writeFileSync(
      path.join(workspaceDir, "timeStamps.json"),
      JSON.stringify(timestampData, null, 2),
    );

    // Copy BGM if exists
    const sourceBgm = path.join(
      __dirname,
      "video_controller/test_video/bgm.mp3",
    );
    if (fs.existsSync(sourceBgm)) {
      fs.copyFileSync(sourceBgm, path.join(workspaceDir, "bgm.mp3"));
    }

    // 5. Image Generation
    console.log("[Automation] Step 4: Generating Images...");

    const { scenes } = scriptData.jsonData;
    const segmentCount = timestampData.data.segments.length;

    const imagePromises = [];

    for (let i = 0; i < segmentCount; i++) {
      const sceneText = scenes[i]?.text || `Scene about ${topic}`;

      const prompt =
        scenes[i]?.image_prompt ||
        `
        ${sceneText},
        ${artStyle},
        cinematic lighting,
        dramatic composition,
        high detail,
        digital illustration,
        vibrant colors,
        9:16 portrait
      `;

      const outputPath = path.join(imagesDir, `scene_${i + 1}`);

      console.log(`[Automation] Generating Image ${i + 1}/${segmentCount}`);

      imagePromises.push(
        internalGenerateImage({
          prompt,
          outputPath,
        }),
      );
    }

    // Generate images in parallel
    await Promise.all(imagePromises);

    // 6. Video Generation
    console.log("[Automation] Step 5: Rendering Video...");

    const videoPath = await internalGenerateVideo(
      workspaceDir,
      timestampData,
      { data: scriptData.jsonData },
      styleOptions,
      audioOptions,
    );

    return res.json({
      success: true,
      message: "Automation completed successfully!",
      data: {
        videoUrl: `/videos/${projectId}/final.mp4`,
        script: scriptData.jsonData,
        duration: timestampData.data.duration,
        workspace: projectId,
      },
    });
  } catch (err) {
    console.error("[Automation Controller] Epic Failure:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

module.exports = { automateVideoGeneration };
