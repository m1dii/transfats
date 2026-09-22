require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Увеличиваем лимит размера JSON, так как мы передаем изображения в Base64
app.use(express.json({ limit: '50mb' }));

// Раздаем статические файлы (наш index.html и папки с картинками)
app.use(express.static(__dirname));

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt, mimeType, imageBase64 } = req.body;
        
        const API_KEY = process.env.GEMINI_API_KEY;
        const MODEL_NAME = 'gemini-3.5-flash-lite';

        if (!API_KEY) {
            return res.status(500).json({ error: 'API ключ не настроен на сервере' });
        }

        // Формируем запрос к Google Gemini
        const geminiPayload = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    }
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(geminiPayload)
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("Gemini API Error:", errData);
            return res.status(response.status).json({ error: 'Ошибка ответа API от Google' });
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        res.json({ text: rawText });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен. Откройте в браузере: http://localhost:${PORT}`);
});
