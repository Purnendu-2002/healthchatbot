require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 2000;

app.use(cors());
app.use(bodyParser.json());

// Google AI API Key loaded from .env
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("ERROR: GOOGLE_API_KEY not found in environment variables!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// **System Instructions for Mental Health Counseling**
const counselingInfo = `
Healthcare App Information:
Website: www.healthcareapp.com
We provide:
- Mental Health Support & Counseling
- Guided Yoga & Meditation
- Personalized Nutrition Planning
- Healthcare Provider Locator
- Emergency First-Aid Guide
- Community Platform

## Mental Health Counseling:
1. Conduct an **MCQ-based self-assessment** for stress, anxiety, or mood levels.
2. Analyze user messages for emotional concerns.
3. Provide **personalized relaxation techniques**, mindfulness exercises, or guided meditation.
4. Recommend **professional help** for severe symptoms.
5. Ensure responses are supportive, educational, and empathetic.

### Example Assessment:
**Q1:** How often do you feel overwhelmed?
   - A) Rarely
   - B) Sometimes
   - C) Often
   - D) Always

**Q2:** Do you have trouble sleeping due to stress?
   - A) No
   - B) Occasionally
   - C) Frequently
   - D) Every night

### Responses:
- **Mild Stress:** Breathing exercises, journaling tips.
- **Moderate Stress:** Meditation & lifestyle changes.
- **Severe Anxiety:** Consider professional counseling.

Greeting:
"Hi! I'm PocketCare AI. I can assist with mental wellness. Would you like a self-assessment or just talk about how you're feeling?"
`;

// **System Instructions for Personalized Nutrition Planning**
const nutritionInfo = `
We specialize in:
- Personalized Meal Planning based on health goals (weight loss, muscle gain, diabetic-friendly, etc.)
- Mental Health Support & Counseling
- Healthcare Provider Locator
- Emergency First-Aid Guide
- Community Platform
- Yoga Assistance

## Meal Plan Generation:
1. Ask users for dietary preferences, restrictions, and goals.
2. Consider calorie intake, macronutrients (protein, carbs, fats), and meal timing.
3. Provide a structured meal plan for breakfast, lunch, dinner, and snacks.
4. Suggest easy-to-make meals with ingredient details.
5. Keep responses clear, supportive, and educational.

Greeting:
"Hello! I'm PocketCare AI. Tell me your dietary preferences and health goals, and I'll generate a personalized meal plan for you!"
`;

// Models for Different Functionalities
const mentalHealthModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: counselingInfo
});

const nutritionModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: nutritionInfo
});

// Chat Histories for Better Context
let mentalHealthHistory = { history: [] };
let nutritionHistory = { history: [] };

// **Function to Handle Counseling Requests**
async function getCounselingResponse(userMessage) {
    const chat = mentalHealthModel.startChat(mentalHealthHistory);
    const result = await chat.sendMessageStream(userMessage);

    let fullResponse = '';
    for await (const chunk of result.stream) {
        fullResponse += chunk.text();
    }

    mentalHealthHistory.history.push({ role: "user", parts: [{ text: userMessage }] });
    mentalHealthHistory.history.push({ role: "model", parts: [{ text: fullResponse }] });

    return fullResponse;
}

// **Function to Handle Nutrition Requests**
async function getNutritionResponse(userMessage) {
    const chat = nutritionModel.startChat(nutritionHistory);
    const result = await chat.sendMessageStream(userMessage);

    let fullResponse = '';
    for await (const chunk of result.stream) {
        fullResponse += chunk.text();
    }

    nutritionHistory.history.push({ role: "user", parts: [{ text: userMessage }] });
    nutritionHistory.history.push({ role: "model", parts: [{ text: fullResponse }] });

    return fullResponse;
}

// **API Routes**
app.get("/", (req, res) => {
    res.send("Pocketcare AI is running! Use /counseling for mental health support or /nutrition for meal planning.");
});

// **Mental Health Counseling Endpoint**
app.post("/counseling", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const responseText = await getCounselingResponse(message);
        res.json({ reply: responseText });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// **Nutrition Planning Endpoint**
app.post("/nutrition", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const responseText = await getNutritionResponse(message);
        res.json({ reply: responseText });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// **Start Server**
app.listen(PORT, () => {
    console.log(`PocketCare AI running at http://localhost:${PORT}`);
});
