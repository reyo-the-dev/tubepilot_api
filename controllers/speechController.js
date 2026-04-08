const fs = require("fs");
const path = require("path");
const { default: OpenAI } = require("openai");
const { default: axios } = require("axios");

const internalGenerateScript = async (topic, duration) => {
  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  let sceneDuration;
  if (duration <= 20) sceneDuration = 3;
  else if (duration <= 40) sceneDuration = 5;
  else if (duration <= 60) sceneDuration = 6;
  else sceneDuration = 8;

  const sceneCount = Math.max(3, Math.round(duration / sceneDuration));
  const wordsPerSecond = 2.3;
  const totalWords = Math.floor(duration * wordsPerSecond);
  const minWords = Math.floor(duration * 2);
  const maxWords = Math.floor(duration * 2.6);
  const sceneWordsMin = Math.floor(minWords / sceneCount);
  const sceneWordsMax = Math.floor(maxWords / sceneCount);

  const response = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You are an expert YouTube Shorts scriptwriter and AI image prompt engineer. Always return ONLY valid JSON. No markdown. No explanation.",
      },
      {
        role: "user",
        content: `Create a YouTube Shorts script about: ${topic}. Duration: ${duration}s. Scenes: ${sceneCount}. 
        Word count: ~${totalWords}. Return ONLY JSON with fields: title, scenes (array of {scene_number, text, image_prompt}).`,
        // content: `Create a YouTube Shorts script about: ${topic}. Duration: ${duration}s. Scenes: ${sceneCount}.
        // Art Style: ${artStyle}.
        // Word count: ~${totalWords}. Return ONLY JSON with fields: title, scenes (array of {scene, text, image_prompt}).`,
      },
    ],
    temperature: 0.7,
  });

  const clean = response.choices[0].message.content
    .replace(/```json|```/g, "")
    .trim();
  const jsonData = JSON.parse(clean);
  const fullScript = jsonData.scenes.map((s) => s.text).join(" ");

  return { scriptData: jsonData, fullScript, meta: { duration, sceneCount } };
};

// const internalTTS = async (text, filePath) => {
// const openai = new OpenAI({
//   apiKey: process.env.GROQ_API_KEY,
//   baseURL: "https://api.groq.com/openai/v1",
// });

// const voices = ["autumn", "diana", "hannah", "austin", "daniel", "troy"];
// const currentVoice = "troy";

// const response = await openai.audio.speech.create({
//   model: "canopylabs/orpheus-v1-english",
//   voice: currentVoice,
//   input: text,
//   response_format: "wav",
// });

// const buffer = Buffer.from(await response.arrayBuffer());
// fs.writeFileSync(filePath, buffer);
// return filePath;
// };

const internalTTS = async (fullScript, isTest) => {
  const API_URL = "https://api.runpod.ai/v2/minimax-speech-02-hd/runsync";
  const API_KEY = process.env.RUNPOD_API_KEY;
  if (!API_KEY) throw new Error("Set RUNPOD_API_KEY in your environment.");

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  const payload = {
    input: {
      prompt: fullScript,
      voice_id: "Deep_Voice_Man",
      speed: 1,
      volume: 1,
      pitch: 0,
      emotion: "happy",
      english_normalization: false,
      default_audio_url:
        "https://d1q70pf5vjeyhc.cloudfront.net/predictions/f981a3dca8204b14ab24151fa0532c26/1.mp3",
    },
  };

  let res = {
    data: {
      delayTime: 103,
      executionTime: 32403,
      id: "sync-7fc2949d-bf1d-47dd-b0f7-1a6141bc692d-e1",
      output: {
        cost: 0.019250000000000003,
        result:
          "https://d1q70pf5vjeyhc.cloudfront.net/predictions/ee72cf0aa41b4782a31ec05f8b7ef961/1.mp3",
      },
      status: "COMPLETED",
      workerId: "mpasqzctysqwgh",
    },
  };

  if (!isTest) {
    res = await axios.post(API_URL, payload, {
      headers,
    });
  }

  return res.data;
};

const internalGetTimestamps = async (fileUrl, isTest) => {
  let transcription = {
    task: "transcribe",
    language: "English",
    duration: 10.14,
    text: " Boy hears a creak as lights flicker. Whispers Echo. His phone shows no signal. A cold hand grabs his shoulder's silence in the dark.",
    segments: [
      {
        id: 0,
        seek: 0,
        start: 0,
        end: 3.2,
        text: " Boy hears a creak as lights flicker.",
        temperature: 0,
        avg_logprob: -0.24068277,
        compression_ratio: 1.1891892,
        no_speech_prob: 4.7859472e-12,
      },
      {
        id: 1,
        seek: 0,
        start: 3.2,
        end: 6.3,
        text: " Whispers Echo. His phone shows no signal.",
        temperature: 0,
        avg_logprob: -0.24068277,
        compression_ratio: 1.1891892,
        no_speech_prob: 4.7859472e-12,
      },
      {
        id: 2,
        seek: 0,
        start: 6.3,
        end: 10.1,
        text: " A cold hand grabs his shoulder's silence in the dark.",
        temperature: 0,
        avg_logprob: -0.24068277,
        compression_ratio: 1.1891892,
        no_speech_prob: 4.7859472e-12,
      },
    ],
    x_groq: { id: "req_01knk066saerkvy70z2y9vhmfb" },
  };

  if (!isTest) {
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const tempFile = path.join(__dirname, "audio.mp3");

    // Download file from Supabase
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send file to Whisper
    transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["segment", "word"],
    });

    fs.unlinkSync(tempFile);
  }

  return transcription;
};

const convertTextToSpeech = async (req, res) => {
  try {
    const audioDir = path.join(__dirname, "../public/audio/openAi");
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    const filePath = path.join(audioDir, `speech_${Date.now()}.wav`);
    await internalTTS(req.body.text, filePath);
    return res.json({
      success: true,
      file: `/audio/openAi/${path.basename(filePath)}`,
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getTimeStamps = async (req, res) => {
  try {
    const fileName = req.body.fileName;
    const filePath = path.join(__dirname, "../public/audio/openAi", fileName);
    const data = await internalGetTimestamps(filePath);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("getTimeStamps Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  convertTextToSpeech,
  getTimeStamps,
  internalGenerateScript,
  internalTTS,
  internalGetTimestamps,
};
