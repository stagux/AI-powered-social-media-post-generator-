// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Check for API key
if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not set in .env file');
    process.exit(1);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working!',
        apiKeyPresent: !!process.env.GOOGLE_API_KEY
    });
});

app.post('/api/generate', async (req, res) => {
    try {
        const { topic, platform, tone } = req.body;
        console.log('Received request:', { topic, platform, tone });

        if (!topic || !platform || !tone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Initialize model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Create prompt
        const prompt = `Create a ${tone.toLowerCase()} social media post for ${platform} about ${topic}.
                       Requirements:
                       - Match ${platform}'s style and format
                       - Use a ${tone.toLowerCase()} tone of voice
                       - Include relevant hashtags
                       - For Twitter, keep it within 280 characters
                       - For Instagram/Facebook, include appropriate emojis
                       - For LinkedIn, maintain professional language
                       Make it engaging and shareable!`;

        console.log('Sending prompt to Gemini:', prompt);

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedPost = response.text();

        console.log('Generated post:', generatedPost);

        res.json({ 
            success: true, 
            post: generatedPost 
        });

    } catch (error) {
        console.error('Error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate content'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Gemini API Key present:', !!process.env.GOOGLE_API_KEY);
});