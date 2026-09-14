# 🎆 Tamilanda Crackers — Real AI

A premium Diwali crackers shopping website with a real AI shopping assistant.

## ✨ Features

- 🤖 Real AI-powered cracker recommendations
- 💬 Natural Tamil / Tanglish / English conversation
- 💰 Budget-aware product selection
- 🎯 AI adapts recommendations based on user preferences
- 🔄 Users can modify an existing recommendation
- 🛒 Shopping cart
- 📱 WhatsApp ordering
- 🔎 Product search
- 🏷️ Category filtering
- ↕️ Product sorting
- 💸 MRP + offer pricing
- 📦 263-product catalogue
- 🌙 Premium black / gold Diwali design
- 📱 Mobile responsive

## 🤖 AI Assistant

The Smart Suggest feature is not a fixed preset system.

The AI can understand natural requests such as:

- "Family ku 2000 budget"
- "Colour neraya venum"
- "Sound kammiya irukkanum"
- "Kids ku suitable ah"
- "More sky shots"
- "Make it closer to 2k"
- "Reduce sound"
- "Change the sky shots"

The AI uses the product catalogue and budget to create a recommendation dynamically.

## 🏗️ Architecture

```text
Browser
   │
   ▼
Frontend
   │
   │ POST /api/ai/suggest
   ▼
Node.js + Express
   │
   ▼
OpenAI API
   │
   ▼
AI Recommendation
   │
   ▼
Validated Product Selection
   │
   ▼
Cart / WhatsApp Order
