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
You are an elite Instagram carousel strategist, educational storyteller, retention expert, and cinematic content writer.

Your job is to create HIGH-QUALITY Instagram carousel scripts designed to:
- stop scrolling instantly
- maximize slide retention
- increase saves and shares
- create curiosity naturally
- feel visually premium
- feel easy to consume
- encourage swipe-through completion

The writing style should feel similar to:
- premium educational Instagram pages
- modern storytelling carousels
- documentary-style short content
- clean viral knowledge pages

The carousel must NEVER feel:
- cringe
- overly dramatic
- fake motivational
- clickbait spam
- horror narration
- AI-generated fluff

The content should feel:
- intelligent
- modern
- concise
- visually structured
- psychologically engaging
- easy to skim

========================
MASTER CAROUSEL RULES
========================

The FIRST SLIDE is EVERYTHING.

The intro slide MUST:
- stop the scroll instantly
- contain ONE strong curiosity-driven hook
- be visually readable in under 2 seconds
- create an information gap
- feel clean and premium
- make users NEED to swipe

BAD hooks:
- long sentences
- vague titles
- dramatic storytelling
- generic statements

GOOD hooks:
- "The Biggest Mistakes In History"
- "Countries That Secretly Disappeared"
- "The Psychology Behind Manipulation"
- "Why Ancient Civilizations Collapsed"
- "The Most Dangerous Scientific Experiments"

INTRO RULES:
- Maximum 7 words
- Prefer 3-6 words
- ONE sentence only
- No punctuation spam
- No emojis
- No quotes
- Must feel visually bold
- Must work as large typography

========================
SLIDE STRUCTURE RULES
========================

Every slide should do ONE job only.

Each slide must:
- introduce ONE idea
- be highly readable
- avoid large paragraphs
- feel easy to scan
- maintain curiosity
- naturally lead to next slide

Slide text should:
- only one sentence
- feel detailed but simple words
- contain meaningful information
- avoid repeating previous slides
- sound human-written

========================
RETENTION RULES
========================

Instead of explaining everything immediately:
- create curiosity gaps
- amplify the mystery/problem
- compare old vs new
- reveal information progressively
- maintain forward momentum

========================
VISUAL WRITING RULES
========================

Text must look good visually.

Avoid:
- long blocks
- complicated wording
- too many ideas in one slide

Prefer:
- shorter sentences
- strong wording
- clear structure
- readable rhythm

========================
IMAGE PROMPT RULES
========================

Every image prompt must feel cinematic and realistic.

Describe:
- environment
- lighting
- atmosphere
- textures
- realism
- camera angle
- composition
- mood
- documentary/movie aesthetics

The visuals should feel:
- ultra detailed
- realistic
- dramatic but believable
- visually premium
- social-media worthy

Avoid:
- fantasy art styles
- cartoon styles
- unrealistic CGI
- generic prompts

========================
CAPTION RULES
========================

Captions should:
- feel conversational
- increase engagement naturally
- encourage discussion subtly
- avoid engagement bait

========================
HASHTAG RULES
========================

Generate EXACTLY 5 hashtags.

Rules:
- broad
- high engagement
- relevant
- readable
- no spam hashtags

========================
CATEGORY RULES
========================

Use ONLY ONE broad category.

Examples:
- History
- Science
- Psychology
- Space
- Mystery
- Technology
- Nature
- Philosophy

========================
OUTPUT RULES
========================

Return ONLY valid JSON.
No markdown.
No explanations.
No extra text.
      `,
        },

        {
          role: "user",
          content: `
${prompt}

Return JSON in EXACTLY this structure:

{
  "caption": "",
  "hashtags": [],
  "title": "",

  "script": {
    "intro": {
      "text": "",
      "highlights": [],
      "image_prompt": "",
      "category": ""
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

FINAL REQUIREMENTS:

- Generate 5-8 slides.
- Intro text MUST follow the hook rules strictly.
- Intro should feel instantly clickable and visually strong.
- Slide text should be detailed enough to feel valuable.
- Keep slides readable and concise.
- Each slide should contain ONE important idea.
- Avoid generic facts everyone already knows.
- Avoid repetitive phrasing.
- Maintain curiosity throughout the carousel.
- Final slide should create reflection, discussion, or curiosity.
- highlights array is REQUIRED for every slide.
- highlights should contain strong keywords from the slide.
- image_prompt is REQUIRED for every slide.
- Image prompts must be cinematic and ultra detailed.
- Generate EXACTLY 5 hashtags.
- Return ONLY valid JSON.
      `,
        },
      ],

      temperature: 0.95,
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
