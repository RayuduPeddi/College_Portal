const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { GoogleGenAI } = require("@google/genai");

router.use(authMiddleware);

// POST /api/ai/query
router.post('/query', async (req, res) => {
  const { prompt, apiKey } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ success: false, message: 'Prompt is required' });
  }

  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      let response;

      try {
        console.log('Attempting Gemini query with model: gemini-2.5-flash');
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are CampusConnet AI, a helpful, intelligent assistant for a college portal. Help the user with their request: ${prompt}`
        });
        console.log('Gemini 2.5 query succeeded.');
      } catch (gemini25Error) {
        console.warn('Gemini 2.5 Flash query failed. Falling back to Gemini 1.5 Flash. Error:', gemini25Error.message || gemini25Error);
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `You are CampusConnet AI, a helpful, intelligent assistant for a college portal. Help the user with their request: ${prompt}`
        });
        console.log('Gemini 1.5 query succeeded.');
      }

      const aiResponse = response.text;

      if (aiResponse) {
        return res.json({ success: true, source: 'Gemini API', text: aiResponse });
      } else {
        throw new Error('Invalid response from Gemini');
      }
    } catch (err) {
      console.error('Error querying Gemini via SDK:', err);
      // Fallback to mock on connection/key error
    }
  }

  // Local Contextual Fallback Assistant (Mock Engine)
  const lowerPrompt = prompt.toLowerCase();
  let responseText = '';

  if (lowerPrompt.includes('notice') || lowerPrompt.includes('announcement')) {
    responseText = `📝 **Notice Draft Generator (CampusConnet AI)**

Subject: [Insert Notice Title here]
Date: ${new Date().toLocaleDateString()}

Dear Students & Faculty,

This is to announce that [describe event/news details here].
Please note the following dates and times:
- Event: [Name of Event]
- Date & Time: [Specify Date & Time]
- Location: [Location or Online Link]

For queries, please contact [Contact Person/Office].

Best Regards,
[Your Name / Title]
Campus Administration`;
  } else if (lowerPrompt.includes('email') || lowerPrompt.includes('draft') || lowerPrompt.includes('letter')) {
    responseText = `✉️ **Email Template (CampusConnet AI)**

Subject: Request for [Topic, e.g. Attendance Correction / Leave Request]

Dear Professor [Professor Name],

I hope you are doing well.

I am writing to request [state your request, e.g. leave of absence for 2 days due to health issues / assistance regarding the assignment].
My details:
- Name: [Your Name]
- Roll Number: [Your Roll No]
- Department: [Your Department]

Thank you for your time and guidance.

Sincerely,
[Your Name]`;
  } else if (lowerPrompt.includes('study') || lowerPrompt.includes('schedule') || lowerPrompt.includes('exam')) {
    responseText = `📚 **Study & Exam Preparation Schedule (CampusConnet AI)**

Here is a recommended 4-phase prep plan:
1. **Understand Key Concepts (Days 1-2)**: Review study resources uploaded by your faculty in the **Study Materials** section.
2. **Practice & Solve (Days 3-4)**: Work through class handouts, tutorial sheets, and mock tests.
3. **Clarify Doubts (Day 5)**: Use the **Live Chat** feature to message teachers or classmates to explain hard concepts.
4. **Final Review (Day 6)**: Revise short summary notes and rest well before exam day.`;
  } else if (lowerPrompt.includes('help') || lowerPrompt.includes('feature') || lowerPrompt.includes('dashboard')) {
    responseText = `🤖 **CampusConnet Portal Assistant Guide**

I can help you navigate this portal easily:
- **📊 Dashboard**: View statistics, attendance graphs, and profile summaries.
- **📢 Notices**: Check notices from college admin.
- **⚠️ Complaints**: File and track grievance records.
- **📚 Study Materials**: Download resources and reference documents.
- **💬 Live Chat**: Send instant messages to peers and staff.

*Note: Configure \`GEMINI_API_KEY\` in the backend \`.env\` to unlock conversational live AI responses!*`;
  } else {
    responseText = `🤖 **Welcome to CampusConnet AI Assistant!**

I am ready to help you with portal inquiries, writing notices, drafting emails, study schedules, or explaining academic topics.

Currently, I am running in **Offline Mode**. To enable the full capabilities of **Google Gemini AI** (which answers complex math, programming, and general questions), please request the administrator to add the **\`GEMINI_API_KEY\`** to the backend \`.env\` file.

How can I help you today?
- *Tip: Try asking me to "draft a notice" or "create a study plan".*`;
  }

  return res.json({ success: true, source: 'Local AI Fallback', text: responseText });
});

module.exports = router;
