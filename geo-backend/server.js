// geo-backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("✅ Geo Finder API is working");
});

// Rich, fine-tuned prompt (no ``` fences inside)
const PROMPT = `
You are a world-class visual geolocation expert. Given an image, follow these steps:

1. Clues: Extract every visible feature that can vary by country/region.
   Pay special attention to:
   - Architecture styles
   - Bollard shapes and colors
   - Camera/Gantry types and branding
   - Company logos on buildings or vehicles
   - Country flags or emblems
   - Currency signs and denominations
   - Top-level domain suffixes on websites
   - Side of the road vehicles drive (left vs. right)
   - Escort/follow-car signage
   - Official/unofficial Google vehicles
   - House number fonts and placement
   - License plate formats and numbering schemes
   - Road line markings (center lines, edge lines)
   - Vegetation type and landscape (tropical vs. temperate)
   - Phone number formatting visible on signs
   - Postbox/mailbox design and color
   - Geological rifts or unique landforms
   - Scenic landmarks (mountains, coastlines, monuments)
   - Sidewalk construction and curb styles
   - Road signs, shapes, and symbols
   - Snow coverage and grooming on roads
   - Street suffix text (St, Rd, Ave, Strasse, Calle, etc.)
   - Traffic light pole design and count of lights
   - Utility pole spacing and wiring style
   - Year or date formats on posters/calendars

2. Inference: Based on those clues, determine the most likely country and city/region.

3. Answer: Return a JSON object exactly in this format:
{
  "clues": [
    "Architecture: half-timbered buildings",
    "Driving side: left",
    "License plates: yellow rear plates with black text",
    "Street suffix: 'Rd'",
    "Snow cover: heavy fresh snow",
    "Phone numbers: +44 prefix",
    "Traffic lights: horizontal mount"
  ],
  "location": "United Kingdom, London",
  "confidence": 88,
  "reason": "The half-timbered architecture, left-hand driving, UK phone code, and yellow rear plates point to London, UK."
}
`;

app.post("/api/geo", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image not provided" });
    }

    // Prepare data URL for Vision API
    const dataUrl = image; // e.g. "data:image/png;base64,...."

    // Call GPT-4 Vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: [
            // Empty text because the full instructions are in PROMPT
            { type: "text", text: "" },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ],
      max_tokens: 600
    });

    const reply = completion.choices[0].message.content;
    const location = (reply.match(/"location"\s*:\s*"([^"]+)"/) || [])[1]
      || (reply.match(/Most Likely Location:\s*(.+)/i) || [])[1]
      || "Unknown";
    const reason = (reply.match(/"reason"\s*:\s*"([^"]+)"/) || [])[1]
      || (reply.match(/Reason:\s*(.+)/i) || [])[1]
      || reply;

    res.json({ location: location.trim(), reason: reason.trim() });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "OpenAI request failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
