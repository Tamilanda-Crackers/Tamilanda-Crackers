# 🧨 Tamilanda Crackers

A premium Diwali crackers shopping website with an AI-powered product recommendation assistant.

## ✨ Features

- 🧨 Complete crackers product catalogue
- 💰 MRP + offer pricing
- 🛒 Shopping cart
- 📱 WhatsApp order support
- 🔎 Product search
- 🏷️ Category filtering
- ↕️ Product sorting
- 🤖 AI shopping assistant
- 🧠 AI-powered personalised cracker suggestions
- 💬 Tamil / Tanglish / English support
- 📱 Mobile responsive design
- 🌙 Premium dark/gold Diwali theme

## 🤖 AI Assistant

The website supports both client-side **Puter.js AI** (DeepSeek) and server-side **Google Gemini AI** for smart recommendations.

No complex setup is required to run locally.

The AI assistant can understand requests such as:

- `2k budget la crackers kudu`
- `sound kammi venum`
- `colour items neraya venum`
- `kids ku suitable ah kudu`
- `family ku 5k selection`
- `intha plan change pannu`

The assistant dynamically builds a selection based on the user's requirements and the available product catalogue.

## 🛒 Ordering

Customers can add products to the cart and place their order through WhatsApp.

## 🚀 Run Locally

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set up environment variables in `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

3. Start the application server:

```bash
npm start
```

4. Open `http://localhost:3000` in your browser.
