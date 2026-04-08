const path = require("path");
const fs = require("fs");

const { v4 } = require("uuid");
const { supabase } = require("../../config/supabase");
const { internalTTS, internalGetTimestamps } = require("../speechController");
const { default: axios } = require("axios");
const { getInternalProjectById } = require("../script.controller");
const { internalGenerateImage } = require("../imageController");
const {
  internalGenerateVideo,
} = require("../video_controller/video_controller");

const createJobandGenerateVideo = async (req, res) => {
  try {
    const { projectId } = req.body;
    const jobId = v4();

    // // 1. Create Job
    // const { error: jobError } = await supabase.from("jobs").insert({
    //   id: jobId,
    //   project_id: projectId,
    //   type: "render",
    //   status: "queued",
    //   progress: 0,
    // });

    // if (jobError) throw jobError;

    // // 2. Update Project Status
    // const { error: projectError } = await supabase
    //   .from("projects")
    //   .update({ status: "rendering" })
    //   .eq("id", projectId);

    // if (projectError) throw projectError;

    // 3. TODO: Trigger worker / queue here
    // await videoQueue.add({ projectId, jobId });

    console.log("Getting Project..");
    const project = await getInternalProjectById(projectId, true);
    const { scenes } = project.script;
    const { art_style } = project.video_preferences;
    const fullScript = scenes.map((s) => s.text).join(". ");

    let images = project?.images;
    let supabaseAudioUrl = project?.audio?.[0]?.audio_url;
    let transcription = project?.transcriptions?.transcription_json;

    const isTest = false;

    //Audio -----------------------------------------------------------
    // Generate Text To Speech Audio
    if (!supabaseAudioUrl) {
      console.log("Generating speech from text...");
      const TTSRes = await internalTTS(fullScript, isTest);
      const externalAudioUrl = TTSRes.output.result;

      // Upload to Supabase Storage
      supabaseAudioUrl = await uploadAudioToSupabase(
        externalAudioUrl,
        projectId,
        TTSRes,
      );
      console.log("speech generation success...");
    }

    //-----------------------------------------------------------

    //Transcription-----------------------------------------------------------

    // const tempUrl =
    //   "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/449de2c1-de89-4b2b-a217-c87eecb3aa01/audio/audio.mp3";
    if (!transcription) {
      console.log("Getting timestamp transcription from speech...");
      transcription = await internalGetTimestamps(supabaseAudioUrl, isTest);
      var transcriptionSaveRes = await saveTranscription(
        projectId,
        transcription,
      );
      console.log("timestamp transcription success...");
    }

    //-----------------------------------------------------------

    //Image-----------------------------------------------------------
    if (!images?.[0]) {
      console.log(`Statring Image generation...`);
      images = await generateAndSaveImages(
        projectId,
        transcription.segments,
        scenes,
        art_style,
        isTest,
      );
      console.log(`Image generation success...`);
    }

    //-----------------------------------------------------------

    const videoData = await generateVidoFromProjectId(projectId);

    return res.status(200).json({
      success: true,
      data: {
        videoData,
        jobId,
        supabaseAudioUrl,
        transcriptionSaveRes,
        images,
      },
    });
  } catch (error) {
    console.error("createJobandGenerateVideo Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const uploadAudioToSupabase = async (audioUrl, projectId, TTSRes) => {
  try {
    // 1. Download audio file
    const response = await axios({
      url: audioUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    const fileBuffer = Buffer.from(response.data);
    const fileName = `${projectId}/audio/audio.mp3`;

    // 2. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("project_files")
      .upload(fileName, fileBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (error) throw error;
    // 3. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("project_files")
      .getPublicUrl(fileName);

    // Save to DB
    await supabase.from("audio").insert({
      project_id: projectId,
      audio_url: publicUrlData.publicUrl,
      cost: TTSRes.output.cost,
    });

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Upload Audio Error:", error);
    throw error;
  }
};

const saveTranscription = async (projectId, transcription) => {
  try {
    const { data, error } = await supabase
      .from("transcriptions")
      .upsert(
        {
          project_id: projectId,
          full_text: transcription.text,
          language: transcription.language,
          duration: transcription.duration,
          transcription_json: transcription,
        },
        { onConflict: "project_id" },
      )
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Save Transcription Error:", error);
    throw error;
  }
};

const uploadImageToSupabase = async (imageUrl, projectId, index) => {
  const response = await axios({
    url: imageUrl,
    method: "GET",
    responseType: "arraybuffer",
  });

  const fileBuffer = Buffer.from(response.data);
  const fileName = `${projectId}/images/scene_${index}.jpg`;

  await supabase.storage.from("project_files").upload(fileName, fileBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  const { data } = supabase.storage
    .from("project_files")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

const generateAndSaveImages = async (
  projectId,
  segments,
  scenes,
  artStyle,
  isTest,
) => {
  try {
    const dummyResult = [
      "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/449de2c1-de89-4b2b-a217-c87eecb3aa01/images/scene_0.jpg",
      "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/449de2c1-de89-4b2b-a217-c87eecb3aa01/images/scene_1.jpg",
      "https://ujkcelfopwalsjonkndn.supabase.co/storage/v1/object/public/project_files/449de2c1-de89-4b2b-a217-c87eecb3aa01/images/scene_2.jpg",
    ];

    const imagePromises = segments.map(async (seg, i) => {
      console.log(`Generating image for scene: ${i + 1}`);

      const sceneText = scenes[i]?.text || seg?.text;

      const prompt = scenes[i]?.image_prompt
        ? `${scenes[i]?.image_prompt}, art style: ${artStyle}`
        : `${sceneText}, art style: ${artStyle}`;

      // 1. Generate image

      let imgRes = {
        delayTime: 127,
        executionTime: 2031,
        id: "sync-7ce9c20e-4a93-4793-9070-8a23e1aa9c6c-e2",
        output: {
          cost: 0.00188744,
          image_url:
            "https://image.runpod.ai/4/7/UUMS6hYLb3/a4e61a24-3dff-4206-8f6d-afd1ffc6be2e.jpeg",
        },
        status: "COMPLETED",
        workerId: "ddji69ureeyupa",
      };

      if (!isTest) {
        imgRes = await internalGenerateImage({ prompt });
      }

      const externalImageUrl = imgRes?.output?.image_url;

      // 2. Upload to Supabase
      console.log(`uploading image for scene: ${i + 1}`);
      const supabaseUrl = await uploadImageToSupabase(
        externalImageUrl,
        projectId,
        i,
      );

      // 3. Save to DB
      console.log(`DB update for image for scene: ${i + 1}`);
      await supabase.from("images").upsert(
        {
          project_id: projectId,
          segment_index: i,
          image_url: supabaseUrl,
          cost: imgRes.output.cost,
        },
        { onConflict: "project_id,segment_index" },
      );

      return supabaseUrl;
    });

    const results = await Promise.all(imagePromises);
    return results;
  } catch (error) {
    console.error("generateAndSaveImages Error:", error);
    throw error;
  }
};

const generateVidoFromProjectId = async (projectId) => {
  try {
    const projectData = await getInternalProjectById(projectId, true);

    const images = projectData?.images;
    const audioUrl = projectData?.audio?.[0]?.audio_url;
    const transcription = projectData?.transcriptions?.transcription_json;

    // Create working directory
    // const workDir = path.join(__dirname, `test`);
    const workDir = path.join(__dirname, `tmp_${projectId}`);
    const imagesDir = path.join(workDir, "images");

    fs.mkdirSync(imagesDir, { recursive: true });

    // -----------------------------
    // 1. Download Images
    // -----------------------------
    const imageDownloads = images.map(async (imgData, i) => {
      const filename = `scene_${imgData.segment_index}.jpg`;
      const response = await axios({
        url: imgData?.image_url,
        method: "GET",
        responseType: "arraybuffer",
      });

      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, response.data);
    });

    await Promise.all(imageDownloads);

    // -----------------------------
    // 2. Download Audio
    // -----------------------------
    const audioPath = path.join(workDir, "audio.wav");

    const audioRes = await axios({
      url: audioUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    fs.writeFileSync(audioPath, audioRes.data);

    // -----------------------------
    // 3. Prepare Timestamps Format
    // -----------------------------
    const timestamps = {
      data: transcription,
    };

    // -----------------------------
    // 4. Style + Audio Options
    // -----------------------------
    const styleOptions = {
      textColor: "#FFFFFF",
      outlineColor: "#000000",
      highlightColor: "#FFD93D",
    };

    const audioOptions = {
      bgmVolume: 0.2,
      voiceVolume: 1.0,
    };

    // -----------------------------
    // 5. Generate Video
    // -----------------------------
    const finalVideoPath = await internalGenerateVideo(
      workDir,
      timestamps,
      styleOptions,
      audioOptions,
    );

    console.log("Video Generated:", finalVideoPath);

    return finalVideoPath;
  } catch (error) {
    console.error("generateVidoFromProjectId Error:", error);
    throw error;
  }
};

module.exports = { createJobandGenerateVideo };
