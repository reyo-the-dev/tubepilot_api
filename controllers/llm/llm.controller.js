const { default: OpenAI } = require("openai");

const converseWithLLM = async (req, res) => {
  try {
    const { systemPrompt, prompt } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const messages = [
      {
        role: "user",
        content: `You are an expert viral Instagram carousel scriptwriter specialized in breaking down today in history events into engaging, simple, high-retention content.

Convert the following today in history event into content for ONLY ONE Instagram slide.

Event:
"After refusing induction into the United States Army the previous day, Muhammad Ali is stripped of his boxing title."

Tone:
engaging, slightly dramatic but factual

STRICT RULES:
- Generate content for EXACTLY ONE slide
- Do NOT create multiple slides
- Do NOT return an array
- Return only a single JSON object

CRITICAL IMAGE RULE:
- The image_prompt MUST explicitly include the main subject of the event (person, place, or object)
- If the event is about a person, INCLUDE their name and visual description
- The image must directly represent the exact moment or consequence described in the event
- The image_prompt is invalid if the main subject is missing

For the slide return:
- text (FULL sentence)
- highlights (2-3 key words)
- image_prompt (cinematic, realistic, no text, high contrast)

Image prompt rules:
- Must reflect real-world context accurately
- MUST include the main subject (e.g., Muhammad Ali for this event)
- No text inside image
- Cinematic lighting, dramatic mood

Return ONLY JSON in this format:
{
  "text": "",
  "highlights": [],
  "image_prompt": ""
}

If you return anything other than ONE object, the response is invalid.`,
      },
    ];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    console.log(messages);

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: 0.7,
    });

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("saveAudioVideoPreferences Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { converseWithLLM };
