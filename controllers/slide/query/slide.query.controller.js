const { OpenAI } = require("openai/client.js");
const {
  internalGenerateimageForHistorySlide,
} = require("../../history/internal/history_internal");
const {
  internalGenerateSlide,
  uploadSlideToSupabase,
} = require("./internal/slide_internal");

const generateScriptForSlides = async (req, res) => {
  try {
    const { topic } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const prompt = topic
      ? `Create a viral Instagram carousel script about: ${topic}`
      : `
Generate a completely original viral Instagram carousel content idea automatically.

Choose a topic with HIGH viral potential in niches like:
- dark history
- hidden facts
- mystery
- psychology
- ancient civilizations
- strange events
- historical secrets
- forgotten disasters
- business secrets
- shocking science
- human behavior
- philosophy
- mythology
- unsolved mysteries
- bizarre true stories
- futuristic concepts
- crime stories
- conspiracy theories
- survival stories

The topic should:
- instantly trigger curiosity
- feel emotionally addictive
- encourage saves and shares
- work perfectly as a swipe-based carousel
- feel cinematic and premium
- be visually powerful
`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `
You are an elite Instagram carousel creator, viral content strategist, educational content writer, and cinematic AI image prompt engineer.

You create faceless Instagram carousel content optimized for:
- high retention
- saves
- shares
- comments
- binge-following
- curiosity

The content should feel:
- modern
- visually clean
- interesting
- informative
- highly readable
- premium

DO NOT make the writing overly dramatic, emotional, dark, or exaggerated.

The tone should feel similar to:
- modern educational Instagram pages
- documentary-style content
- interesting facts pages
- clean storytelling

Examples of good intro styles:
- "Top 5 Mysteries Of The World"
- "Strange Facts About Space"
- "Ancient Civilizations That Disappeared"
- "Biggest Scientific Mistakes Ever"
- "Historical Mysteries Still Unsolved"

Avoid:
- cringe hooks
- excessive suspense
- horror narration
- dramatic storytelling
- clickbait language

The content should be simple, concise, and easy to consume in carousel format.

Always return ONLY valid JSON.
No markdown.
No explanations.
No extra text.

Carousel Writing Rules:
- Keep slides concise and visually readable.
- Each slide should provide one interesting piece of information.
- Maintain curiosity naturally without being overly dramatic.
- Final slide should encourage discussion, curiosity, or sharing.

Category Rules:
- category must be a simple broad category.
- Examples:
  - "History"
  - "Science"
  - "Facts"
  - "Space"
  - "Technology"
  - "Psychology"
  - "Mystery"
  - "Nature"
- Use ONLY one category.

Intro text Rules:
- Maximum 7 words (important)
- text should be short and clean.
- It should support the intro title naturally.
- Examples:
  - "Unsolved stories from history"
  - "Facts that sound unbelievable"
  - "Mysteries scientists still study"
  - "Events that changed the world"

Image Prompt Rules:
- Every image prompt must be cinematic and ultra detailed.
- Describe lighting, atmosphere, composition, mood, realism, textures, and camera style.
- Visuals should feel like scenes from a documentary or movie.
- Keep prompts realistic and visually striking.
- Avoid fantasy-style prompts unless the topic requires it.

Caption Rules:
- Make captions engaging and natural.
- Encourage comments/saves/shares subtly.
- Avoid aggressive engagement bait.

Hashtag Rules:
- Generate EXACTLY 5 hashtags.
- Keep them broad and high-engagement.
      `,
        },
        {
          role: "user",
          content: `
${prompt}

Return JSON in EXACTLY this structure:

{
  "title": "",
  "caption": "",
  "hashtags": [],
  
  "script": {
    "intro": {
      "text": "", // 7 words maximum
      "highlights": [],
      "image_prompt": "",
      "sub_title": "",
      "category": "",
    },
    "slides": [
      {
        "title": "",
        "text": "",
        "image_prompt": "",
        "highlights": []
      }
    ]
  }
}

Requirements:
- Generate 5-8 carousel slides automatically.
- Slide titles are optional. Only add them if necessary.
- Intro text should be simple and catchy, and should explain the content shortly.
- Content should feel informative and modern.
- Text should be concise and visually readable.
- highlights array is mandatory for every slide.
- highlights should contain impactful keywords from the slide.
- image_prompt should generate cinematic realistic visuals.
- Final slide should encourage curiosity or discussion naturally.
- Caption should feel modern and engaging.
- Generate EXACTLY 5 hashtags.
- Return ONLY valid JSON.
      `,
        },
      ],
      temperature: 0.9,
    });

    const clean = response.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    const jsonData = JSON.parse(clean);

    return res.status(200).json({
      success: true,
      data: jsonData,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const generateImageForSlide = async (req, res) => {
  try {
    const { imagePrompt } = req.body;

    console.log("Image Generation Started..");

    const imageRes = await internalGenerateimageForHistorySlide({
      prompt: imagePrompt,
    });

    console.log("Image Generation Success..");

    return res.status(200).json({
      success: true,
      data: imageRes,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const generateSlideFromTemplate = async (req, res) => {
  // console.log();

  // const x = {
  //   slideData: {
  //     text: "On July 28, 1976, the Chinese city of Tangshan was shattered by a 7.8 magnitude quake, killing over 240,000 people in minutes.",
  //     highlights: ["July 28, 1976", "7.8 magnitude", "240,000+ deaths"],
  //     image_prompt:
  //       "Cinematic early morning aerial view of Tangshan city before the quake, soft sunrise lighting, quiet streets, subtle dust in the air, realistic textures, shot with a wide-angle lens, atmospheric and calm mood",
  //     sub_title: "A disaster that reshaped a nation",
  //     imageUrl:
  //       "https://image.runpod.ai/5/19/AOhAz3YgUD/757c8b60-64f6-4353-962d-855c9e4da689.jpeg",
  //   },
  //   isIntro: true,
  // };

  const image = await internalGenerateSlide(
    req.body.slideData,
    req.body.isIntro,
  );

  const uploadRes = await uploadSlideToSupabase(image);

  try {
    return res.status(200).json({
      success: true,
      data: uploadRes,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateScriptForSlides,
  generateImageForSlide,
  generateSlideFromTemplate,
};
