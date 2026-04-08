const { supabase } = require("../../config/supabase");

const saveAudioVideoPreferences = async (req, res) => {
  try {
    const { videoPreferences, audioPreferences } = req.body;

    // Upsert video preferences
    if (videoPreferences) {
      const { error: videoError } = await supabase
        .from("video_preferences")
        .upsert(videoPreferences, { onConflict: "id" });

      if (videoError) throw videoError;
    }

    // Upsert audio preferences
    if (audioPreferences) {
      const { error: audioError } = await supabase
        .from("audio_preferences")
        .upsert(audioPreferences, { onConflict: "id" });

      if (audioError) throw audioError;
    }

    return res.status(200).json({
      success: true,
      message: "Preferences saved",
    });
  } catch (error) {
    console.error("saveAudioVideoPreferences Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const { id } = req.user;

    const { data: userProjects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", id);

    if (error) {
      return res
        .status(500)
        .json({ success: false, error: "get userProjects error" });
    }

    return res.status(200).json({
      success: true,
      data: userProjects || [],
    });
  } catch (error) {
    console.error("saveAudioVideoPreferences Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { saveAudioVideoPreferences, getUserProjects };
