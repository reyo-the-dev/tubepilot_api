const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegInstaller);

const FPS = 25;
const WIDTH = 720;
const HEIGHT = 1280;

const hexToAssColor = (hex) => {
  if (!hex) return null;
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 6) {
    const r = cleanHex.substring(0, 2);
    const g = cleanHex.substring(2, 4);
    const b = cleanHex.substring(4, 6);
    return `&H00${b}${g}${r}&`; // BGR format
  }
  return hex; // Return as is if already in ASS format or invalid
};

const formatASSTime = (seconds) => {
  const date = new Date(seconds * 1000);
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const s = date.getUTCSeconds();
  const ms = Math.floor(date.getUTCMilliseconds() / 10);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
};

const generateASS = (segments, words, assPath, options = {}) => {
  const {
    fontName = "Fredoka One",
    fontSize = 110,
    primaryColor = "&H00FFFFFF&", // White
    highlightColor = "&H0000FFFF&", // Yellow
    outlineColor = "&H00000000&", // Black outline
    outlineWidth = 8,
    chunkSize = 1,
  } = options;

  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${outlineWidth},0,5,50,50,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);

    chunk.forEach((activeWord, idx) => {
      const startTime = formatASSTime(activeWord.start);
      const nextWord = words[i + idx + 1];
      const endTime = nextWord
        ? formatASSTime(nextWord.start)
        : formatASSTime(activeWord.end);

      let lineText = "";
      chunk.forEach((w, j) => {
        if (j === idx) {
          lineText += `{\\c${highlightColor}\\fscx130\\fscy130}${w.word}{\\r} `;
        } else {
          lineText += `${w.word} `;
        }
      });

      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${lineText.trim()}\n`;
    });
  }

  fs.writeFileSync(assPath, ass);
};

// const renderScenes = (sceneMap, imagesDir, outputVideo) => {
//   return new Promise((resolve, reject) => {
//     const command = ffmpeg();

//     sceneMap.forEach((scene) => {
//       command.input(path.join(imagesDir, `scene_${scene.id}.jpg`));
//     });

//     const filters = [];

//     sceneMap.forEach((scene, i) => {
//       const frames = Math.floor(scene.duration * FPS);

//       filters.push({
//         filter: "scale",
//         options: "2160:3840",
//         inputs: `${i}:v`,
//         outputs: `scaled${i}`,
//       });

//       filters.push({
//         filter: "zoompan",
//         options: {
//           z: "min(zoom+0.0015,1.5)",
//           d: frames,
//           s: `${WIDTH}x${HEIGHT}`,
//           fps: FPS,
//           x: "iw/2-(iw/zoom/2)",
//           y: "ih/2-(ih/zoom/2)",
//         },
//         inputs: `scaled${i}`,
//         outputs: `zoom${i}`,
//       });

//       filters.push({
//         filter: "setpts",
//         options: "PTS-STARTPTS",
//         inputs: `zoom${i}`,
//         outputs: `v${i}`,
//       });
//     });

//     const concatInputs = sceneMap.map((_, i) => `v${i}`);

//     filters.push({
//       filter: "concat",
//       options: { n: sceneMap.length, v: 1, a: 0 },
//       inputs: concatInputs,
//       outputs: "vout",
//     });

//     command
//       .complexFilter(filters)
//       .outputOptions([
//         "-map [vout]",
//         "-c:v libx264",
//         "-pix_fmt yuv420p",
//         "-r 25",
//         "-y",
//       ])
//       .output(outputVideo)
//       .on("end", resolve)
//       .on("error", reject)
//       .run();
//   });
// };

const renderScenes = (sceneMap, _, outputVideo) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    const filters = [];

    sceneMap.forEach((scene, i) => {
      command.input(scene.image);
      command.inputOptions(["-loop 1", `-t ${scene.duration}`, `-r ${FPS}`]);
      // 1. scale
      // filters.push({
      //   filter: "scale",
      //   options: `${WIDTH}:${HEIGHT}`,
      //   inputs: `${i}:v`,
      //   outputs: `scaled${i}`,
      // });

      filters.push({
        filter: "scale",
        // options: "2160:3840",
        options: `${WIDTH * 2}:${HEIGHT * 2}`,
        inputs: `${i}:v`,
        outputs: `scaled${i}`,
      });

      filters.push({
        filter: "zoompan",
        options: {
          z: "min(1 + 0.0015*on, 1.5)",
          d: 1,
          s: `${WIDTH}x${HEIGHT}`,
          fps: FPS,
          x: "(iw - iw/zoom)/2",
          y: "(ih - ih/zoom)/2",
        },
        inputs: `scaled${i}`,
        outputs: `zoom${i}`,
      });

      filters.push({
        filter: "setsar",
        options: "1",
        inputs: `zoom${i}`,
        outputs: `sar${i}`,
      });

      // 3. setpts
      filters.push({
        filter: "setpts",
        options: "PTS-STARTPTS",
        inputs: `sar${i}`,
        outputs: `v${i}`,
      });
    });

    filters.push({
      filter: "concat",
      options: { n: sceneMap.length, v: 1, a: 0 },
      inputs: sceneMap.map((_, i) => `v${i}`),
      outputs: "vout",
    });

    command
      .complexFilter(filters)
      .outputOptions([
        "-map [vout]",
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        `-r ${FPS}`,
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        "-y",
      ])

      .output(outputVideo)
      .on("start", () => {
        console.log("[FFmpeg] Started...");
      })
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

const addSubtitles = (inputVideo, assFile, outputVideo) => {
  // FFmpeg subtitle filter is extremely picky on Windows with spaces and drive letters
  // 1. Use forward slashes
  // 2. Escape the colon (e.g., C\: /...)
  // 3. Wrap in single quotes to handle spaces
  const escapedAssPath = assFile.replace(/\\/g, "/").replace(/:/g, "\\:");
  const filterString = `subtitles=filename='${escapedAssPath}'`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputVideo)
      .videoFilters(filterString)
      .output(outputVideo)
      .on("end", resolve)
      .on("error", (err) => {
        console.error("[FFmpeg Subtitles] Detailed Error:", err);
        reject(err);
      })
      .run();
  });
};

const mixAudioAndBGM = (
  inputVideo,
  voiceFile,
  bgmFile,
  outputVideo,
  options = {},
) => {
  const { bgmVolume = 0.15, voiceVolume = 1.0 } = options;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputVideo) // Subtitled video (silent)
      .input(voiceFile) // Narration
      .input(bgmFile) // Background Music
      .complexFilter([
        `[1:a]volume=${voiceVolume}[voice]`,
        `[2:a]volume=${bgmVolume}[bgm]`,
        "[voice][bgm]amix=inputs=2:duration=first[aout]",
      ])
      .outputOptions([
        "-map 0:v", // Take video from input 0
        "-map [aout]", // Take mixed audio
        "-c:v copy", // Do not re-encode video
        "-c:a aac",
        "-shortest",
      ])
      .output(outputVideo)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

const internalGenerateVideo = async (
  workDir,
  timestamps,
  rawStyleOptions,
  audioOptions,
) => {
  console.log(workDir);

  const imagesDir = path.join(workDir, "images");
  const scenesVideo = path.join(workDir, "scenes.mp4");
  const subsVideo = path.join(workDir, "subs.mp4");
  const finalVideoOutput = path.join(workDir, "final.mp4");
  const assPath = path.join(workDir, "subs.ass");
  const audioPath = path.join(workDir, "audio.wav");
  const bgmPath = path.join(__dirname, "bgm.mp3");

  // Convert styles to ASS format
  const styleOptions = {
    ...rawStyleOptions,
    primaryColor: hexToAssColor(
      rawStyleOptions.textColor || rawStyleOptions.primaryColor,
    ),
    outlineColor: hexToAssColor(rawStyleOptions.outlineColor),
    highlightColor: hexToAssColor(rawStyleOptions.highlightColor),
  };
  // Clean up nulls
  Object.keys(styleOptions).forEach(
    (key) => styleOptions[key] === null && delete styleOptions[key],
  );

  const segments = timestamps.data.segments;
  const words = timestamps.data.words;
  const totalAudioDuration = timestamps.data.duration;

  const sceneMap = segments.map((seg, i) => {
    const nextStart = segments[i + 1]
      ? segments[i + 1].start
      : totalAudioDuration;

    return {
      id: i,
      duration: Math.max(0.1, nextStart - seg.start),
      image: path.join(imagesDir, `scene_${i}.jpg`),
    };
  });

  try {
    console.log(`1: [FFmpeg] Rendering Scenes...`);

    await renderScenes(sceneMap, imagesDir, scenesVideo);

    console.log("2: [FFmpeg] Generating Subtitles...");
    generateASS(segments, words, assPath, styleOptions);
    console.log("3: [FFmpeg] Adding Subtitles...");
    await addSubtitles(scenesVideo, assPath, subsVideo);
    console.log("4: [FFmpeg] Mixing Narration and BGM...");
    await mixAudioAndBGM(
      subsVideo,
      audioPath,
      bgmPath,
      finalVideoOutput,
      audioOptions,
    );
    return finalVideoOutput;
  } finally {
    console.log("succes..");
    [scenesVideo, subsVideo, assPath].forEach((file) => {
      if (fs.existsSync(file))
        try {
          fs.unlinkSync(file);
        } catch (e) {}
    });
  }
};

const generateVideo = async (req, res) => {
  try {
    const baseDir = path.join(__dirname, "test_video");
    const timestamps = JSON.parse(
      fs.readFileSync(path.join(baseDir, "timeStamps.json")),
    );
    const script = JSON.parse(
      fs.readFileSync(path.join(baseDir, "script.json")),
    );
    const styleOptions = (req.body && req.body.styleOptions) || {};
    const audioOptions = (req.body && req.body.audioOptions) || {};
    const videoPath = await internalGenerateVideo(
      baseDir,
      timestamps,
      script,
      styleOptions,
      audioOptions,
    );
    return res.json({ success: true, video: videoPath });
  } catch (err) {
    console.error("Video Generation Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { generateVideo, internalGenerateVideo };
