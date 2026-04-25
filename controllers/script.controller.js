// const { v4 } = require("uuid");
const { supabase } = require("../config/supabase");
const { internalGenerateScript } = require("./speechController");

const generateScript = async (req, res) => {
  try {
    const isDummy = req?.body?.isDummyData;

    let result = {
      id: "9b047029-f4f1-42be-be61-e25c67402398",
      user_id: "a1a06caf-e5bb-46bf-8c61-38333136f67f",
      title: "Top 5 Longest Rivers in 10 Seconds",
      topic: "Top 5 Longest Rivers in 10 Seconds",
      duration: 10,
      voice: null,
      art_style: null,
      music: null,
      ratio: "9:16",
      status: "script_generated",
      created_at: "2026-04-06T05:24:44.293441",
      updated_at: "2026-04-06T05:24:44.293441",
      scenes: [
        {
          id: "c9f4851d-4c37-406e-a672-d588617ae556",
          text: "5 longest rivers",
          duration: null,
          media_url: null,
          script_id: "9b047029-f4f1-42be-be61-e25c67402398",
          created_at: "2026-04-06T05:24:44.47204",
          image_prompt:
            "cinematic digital art of a glowing world map with highlighted river courses, dramatic sunrise lighting, high contrast",
          scene_number: 1,
        },
        {
          id: "c331e74c-98e5-4ce9-881b-620bfec43f9b",
          text: "1. Nile 6,650 km; 2. Amazon 6,575 km; 3. Yangtze 6,300 km",
          duration: null,
          media_url: null,
          script_id: "9b047029-f4f1-42be-be61-e25c67402398",
          created_at: "2026-04-06T05:24:44.47204",
          image_prompt:
            "cinematic digital art split-screen showing the Nile, Amazon, and Yangtze rivers flowing through vivid landscapes, epic lighting, digital brushstrokes",
          scene_number: 2,
        },
        {
          id: "a3fbca5c-0799-4c0f-9d20-568ae59e9fdd",
          text: "2. Mississippi-Missouri 6,275 km; 5. Yenisei 5,539 km",
          duration: null,
          media_url: null,
          script_id: "9b047029-f4f1-42be-be61-e25c67402398",
          created_at: "2026-04-06T05:24:44.47204",
          image_prompt:
            "cinematic digital art of the Mississippi-Missouri and Yenisei rivers, dramatic skies, sweeping camera angles, rich colors",
          scene_number: 3,
        },
      ],
    };

    if (!isDummy) {
      const newScript = await internalGenerateScript(
        req.body.topic,
        req.body.duration,
      );
      // const  = {
      //   scriptData: {
      //     title: "Rise & Conquer: 10-Second Motivation",
      //     scenes: [[Object], [Object], [Object]],
      //   },
      //   fullScript:
      //     "Rise early, chase your dreams with purpose today. Every step forward fuels confidence and momentum. Believe, act, succeed – make today unforgettable and bold!",
      //   meta: { duration: "10", sceneCount: 3 },
      // };

      result = {
        title: newScript.scriptData.title,
        topic: req.body.topic,
        duration: req.body.duration,
        voice: null,
        art_style: null,
        music: null,
        ratio: "9:16",
        status: "script_generated",
        created_at: "2026-04-06T05:24:44.293441",
        updated_at: "2026-04-06T05:24:44.293441",
        scenes: newScript.scriptData.scenes,
      };
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("GenerateScript Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const createtAndSaveScript = async (req, res) => {
  try {
    const { user } = req;
    const scriptId = "tttt";
    const projectId = "xxxx";

    const { error: projectError } = await supabase.from("projects").insert({
      id: projectId,
      user_id: user.id,
      title: req.body.title,
      topic: req.body.topic,
      duration: req.body.duration,
      status: "script_generated",
    });

    if (projectError) {
      return res
        .status(500)
        .json({ success: false, error: "create project error" });
    }

    const { error: scriptError } = await supabase.from("scripts").insert({
      id: scriptId,
      user_id: user.id,
      title: req.body.title,
      topic: req.body.title,
      duration: req.body.duration,
      status: "script_generated",
      project_id: projectId,
    });

    if (scriptError) {
      return res
        .status(500)
        .json({ success: false, error: "create script error" });
    }

    const { error: videoPreferencesError } = await supabase
      .from("video_preferences")
      .insert({
        project_id: projectId,
      });

    if (videoPreferencesError) {
      return res
        .status(500)
        .json({ success: false, error: "create videoPreferences error" });
    }

    const { error: audioPreferencesError } = await supabase
      .from("audio_preferences")
      .insert({
        project_id: projectId,
      });

    if (audioPreferencesError) {
      return res
        .status(500)
        .json({ success: false, error: "create audioPreferencesError error" });
    }

    const { scenes = [] } = req.body;

    const sceneRows = scenes.map((scene) => ({
      script_id: scriptId,
      scene_number: scene.scene_number,
      text: scene.text,
      image_prompt: scene.image_prompt,
    }));

    const { error: scenesError } = await supabase
      .from("scenes")
      .insert(sceneRows);

    if (scenesError) {
      return res
        .status(500)
        .json({ success: false, error: "create scenes error" });
    }

    const responseData = await getInternalProjectById(projectId);

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("GenerateScript Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getInternalProjectById(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getProjectById Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getInternalProjectById = async (id, includeAllTables) => {
  const query = `
        *,
        scripts (*,
        scenes (*)
        ),
        video_preferences(*),
        audio_preferences(*),
        videos(*)
        ${
          includeAllTables
            ? `
          ,transcriptions(*),
          audio(*),
          images(*)
          `
            : ""
        }
      `;

  const { data, error } = await supabase
    .from("projects")
    .select(query)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const responseData = {
    ...data,
    scripts: null,
    script: data.scripts[0],
    video_preferences: data?.video_preferences?.[0] || null,
    audio_preferences: data?.audio_preferences?.[0] || null,
    video: data?.videos || null,
  };

  return responseData;
};

module.exports = {
  generateScript,
  createtAndSaveScript,
  getProjectById,
  getInternalProjectById,
};
