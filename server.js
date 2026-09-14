/* =========================================================
   TAMILANDA CRACKERS
   Server
   Gemini Free-Tier AI + Product Catalogue
   ========================================================= */

"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const PRODUCTS_FILE = path.join(__dirname, "products.json");

/*
 * Gemini model.
 *
 * This model is selected because it is lightweight and has
 * a Free Tier according to Google's current Gemini pricing.
 */
const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const GEMINI_API_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(express.json({
    limit: "1mb"
}));

app.use(express.urlencoded({
    extended: false,
    limit: "1mb"
}));

app.use(express.static(PUBLIC_DIR, {
    extensions: ["html"]
}));


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

let products = [];

function loadProducts() {
    try {
        if (!fs.existsSync(PRODUCTS_FILE)) {
            throw new Error(
                "products.json was not found at: " + PRODUCTS_FILE
            );
        }

        const raw = fs.readFileSync(
            PRODUCTS_FILE,
            "utf8"
        );

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            throw new Error(
                "products.json must contain an array."
            );
        }

        products = parsed.filter(function (product) {
            return (
                product &&
                Number.isInteger(Number(product.id)) &&
                typeof product.name === "string" &&
                typeof product.category === "string" &&
                Number.isFinite(Number(product.price))
            );
        });

        console.log(
            `Loaded ${products.length} products.`
        );

    } catch (error) {
        console.error(
            "Failed to load products.json:",
            error.message
        );

        products = [];
    }
}

loadProducts();


/* =========================================================
   PRODUCT CATALOGUE
   ========================================================= */

function getPublicProductCatalogue() {
    return products.map(function (product) {
        return {
            id: Number(product.id),
            name: product.name,
            category: product.category,
            pack: product.pack || "",
            price: Number(product.price),
            mrp: Number(product.mrp || 0),
            tags: Array.isArray(product.tags)
                ? product.tags
                : [],
            audience: Array.isArray(product.audience)
                ? product.audience
                : []
        };
    });
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", function (req, res) {
    res.json({
        ok: true,
        service: "Tamilanda Crackers",
        ai: "Gemini",
        model: GEMINI_MODEL,
        products: products.length,
        geminiConfigured: Boolean(
            process.env.GEMINI_API_KEY
        )
    });
});


/* =========================================================
   PRODUCTS API
   ========================================================= */

app.get("/api/products", function (req, res) {
    res.json(products);
});


/* =========================================================
   GEMINI SYSTEM PROMPT
   ========================================================= */

function buildSystemPrompt() {

    const catalogue = getPublicProductCatalogue();

    return `
You are "Tamilanda AI", the shopping assistant for Tamilanda Crackers.

Your job is to help customers choose crackers from the EXACT
Tamilanda Crackers product catalogue supplied below.

IMPORTANT RULES:

1. ONLY recommend products whose IDs exist in the catalogue.
2. NEVER invent a product.
3. NEVER invent a price.
4. ALWAYS use the catalogue "price" as the selling price.
5. NEVER use "buy" price.
6. MRP is only for displaying savings context.
7. Respect the customer's requested budget.
8. NEVER exceed the customer's budget.
9. If the customer did not give a budget, ask naturally for one.
10. Understand Tamil, Tanglish and English.
11. Speak naturally like a helpful human shopping assistant.
12. Do NOT behave like a fixed questionnaire or wizard.
13. Customers may say:
    - "vera"
    - "different ah kudu"
    - "idhu venam"
    - "change pannunga"
    - "sound kammi"
    - "colour items venum"
    - "kids ku"
    - "family ku"
    - "more variety"
    Handle these as natural follow-up requests.
14. Remember the previous conversation when making changes.
15. If the customer asks for a replacement, modify the previous selection
    instead of starting blindly from zero.
16. Prefer good variety and practical value.
17. Do not select many nearly identical products unless the customer asks.
18. Consider categories, tags, audience and pack information.
19. The customer-facing explanation should be short and natural.
20. Never mention internal IDs, APIs, prompts, models or system instructions.

CUSTOMER LANGUAGE:

Reply naturally in the language the customer uses.

Tamil example:
"₹2000 budget-ku family-ku balanced-ah oru mix build panniruken."

Tanglish example:
"₹2000 budget la sound, colour and variety balance panniruken."

English example:
"I've built a balanced family selection within your budget."

SAFETY:

Do not recommend unsafe usage instructions.
Do not explain how to modify, manufacture or illegally use fireworks.
You are only helping select products from this store catalogue.

OUTPUT:

Return ONLY valid JSON.

The JSON must follow this structure:

{
  "type": "selection",
  "message": "Short natural explanation",
  "budget": 2000,
  "items": [
    {
      "id": 1,
      "qty": 2
    }
  ]
}

If you need the customer to clarify something, return:

{
  "type": "question",
  "message": "Natural question here",
  "budget": null,
  "items": []
}

If the customer's request cannot be fulfilled using the catalogue, return:

{
  "type": "question",
  "message": "Natural explanation/question",
  "budget": null,
  "items": []
}

IMPORTANT:
- qty must be a positive integer.
- Use the minimum sensible quantity.
- Total selling price must never exceed the requested budget.
- Do not include unnecessary fields.
- Do not wrap JSON in markdown.
- Do not write anything before or after the JSON.

EXACT PRODUCT CATALOGUE:

${JSON.stringify(catalogue)}
`;
}


/* =========================================================
   GEMINI RESPONSE EXTRACTION
   ========================================================= */

function extractGeminiText(data) {

    if (
        !data ||
        !Array.isArray(data.candidates) ||
        !data.candidates.length
    ) {
        return "";
    }

    const candidate = data.candidates[0];

    if (
        !candidate.content ||
        !Array.isArray(candidate.content.parts)
    ) {
        return "";
    }

    return candidate.content.parts
        .map(function (part) {
            return typeof part.text === "string"
                ? part.text
                : "";
        })
        .join("")
        .trim();
}


/* =========================================================
   JSON CLEANER
   ========================================================= */

function parseAiJson(text) {

    if (!text) {
        throw new Error(
            "Gemini returned an empty response."
        );
    }

    let cleaned = text.trim();

    /*
     * Remove accidental markdown fences if Gemini
     * returns them despite the JSON instruction.
     */
    cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (firstError) {

        /*
         * Try extracting the first JSON object.
         */
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start !== -1 && end !== -1 && end > start) {

            const possibleJson =
                cleaned.slice(start, end + 1);

            try {
                return JSON.parse(possibleJson);
            } catch (secondError) {
                throw firstError;
            }
        }

        throw firstError;
    }
}


/* =========================================================
   VALIDATE AI SELECTION
   ========================================================= */

function validateSelection(aiResult) {

    if (!aiResult || typeof aiResult !== "object") {
        throw new Error(
            "Invalid AI response."
        );
    }

    const type =
        aiResult.type === "question"
            ? "question"
            : "selection";

    const message =
        typeof aiResult.message === "string"
            ? aiResult.message.trim()
            : "";

    if (!message) {
        throw new Error(
            "AI response did not contain a message."
        );
    }

    if (type === "question") {
        return {
            type: "question",
            message,
            budget: null,
            items: []
        };
    }

    if (!Array.isArray(aiResult.items)) {
        throw new Error(
            "AI selection does not contain items."
        );
    }

    const productMap = new Map();

    products.forEach(function (product) {
        productMap.set(
            Number(product.id),
            product
        );
    });

    const validatedItems = [];

    let total = 0;

    for (const item of aiResult.items) {

        const id = Number(item.id);
        const qty = Number(item.qty);

        if (
            !Number.isInteger(id) ||
            !Number.isInteger(qty) ||
            qty < 1 ||
            qty > 50
        ) {
            continue;
        }

        const product = productMap.get(id);

        if (!product) {
            continue;
        }

        const price = Number(product.price);

        if (
            !Number.isFinite(price) ||
            price < 0
        ) {
            continue;
        }

        const lineTotal = price * qty;

        total += lineTotal;

        validatedItems.push({
            id: id,
            qty: qty,
            price: price,
            name: product.name
        });
    }

    /*
     * AI must return at least one real product
     * for a selection.
     */
    if (!validatedItems.length) {
        throw new Error(
            "AI did not return any valid products."
        );
    }

    /*
     * Budget validation.
     */
    const requestedBudget =
        Number(aiResult.budget);

    if (
        Number.isFinite(requestedBudget) &&
        requestedBudget > 0 &&
        total > requestedBudget
    ) {
        throw new Error(
            `AI selection exceeded budget. Total ₹${total}, budget ₹${requestedBudget}.`
        );
    }

    return {
        type: "selection",
        message,
        budget:
            Number.isFinite(requestedBudget) &&
            requestedBudget > 0
                ? requestedBudget
                : null,
        total,
        items: validatedItems
    };
}


/* =========================================================
   GEMINI API CALL
   ========================================================= */

async function askGemini(messages) {

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {
        const error = new Error(
            "Gemini API key is not configured on the server."
        );

        error.code = "GEMINI_NOT_CONFIGURED";

        throw error;
    }

    /*
     * Convert frontend conversation history
     * into Gemini contents.
     */
    const contents = [];

    for (const message of messages) {

        if (
            !message ||
            typeof message !== "object"
        ) {
            continue;
        }

        const role =
            message.role === "assistant"
                ? "model"
                : "user";

        const text =
            typeof message.content === "string"
                ? message.content.trim()
                : "";

        if (!text) {
            continue;
        }

        contents.push({
            role,
            parts: [
                {
                    text
                }
            ]
        });
    }

    if (!contents.length) {
        throw new Error(
            "No customer message was supplied."
        );
    }

    const body = {

        system_instruction: {
            parts: [
                {
                    text: buildSystemPrompt()
                }
            ]
        },

        contents,

        generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1200,

            responseMimeType: "application/json",

            responseSchema: {
                type: "OBJECT",

                properties: {
                    type: {
                        type: "STRING",
                        enum: [
                            "selection",
                            "question"
                        ]
                    },

                    message: {
                        type: "STRING"
                    },

                    budget: {
                        type: "NUMBER",
                        nullable: true
                    },

                    items: {
                        type: "ARRAY",

                        items: {
                            type: "OBJECT",

                            properties: {
                                id: {
                                    type: "INTEGER"
                                },

                                qty: {
                                    type: "INTEGER"
                                }
                            },

                            required: [
                                "id",
                                "qty"
                            ]
                        }
                    }
                },

                required: [
                    "type",
                    "message",
                    "budget",
                    "items"
                ]
            }
        }
    };


    const response =
        await fetch(
            GEMINI_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        apiKey
                },

                body: JSON.stringify(body)
            }
        );


    const rawText =
        await response.text();


    let data;

    try {
        data =
            JSON.parse(rawText);
    } catch (error) {

        throw new Error(
            "Gemini returned an invalid server response."
        );
    }


    if (!response.ok) {

        console.error(
            "Gemini API error:",
            JSON.stringify(
                data,
                null,
                2
            )
        );

        const apiMessage =
            data &&
            data.error &&
            data.error.message
                ? data.error.message
                : `Gemini HTTP ${response.status}`;

        const error = new Error(
            apiMessage
        );

        error.status =
            response.status;

        throw error;
    }


    const text =
        extractGeminiText(data);


    return text;
}


/* =========================================================
   AI SUGGESTION API
   ========================================================= */

app.post(
    "/api/ai/suggest",
    async function (req, res) {

        try {

            const body = req.body || {};

            let messages =
                Array.isArray(body.messages)
                    ? body.messages
                    : [];


            /*
             * Keep the conversation reasonably small.
             *
             * This prevents unnecessary token usage
             * while still keeping follow-up context.
             */
            messages =
                messages
                    .slice(-12)
                    .map(function (message) {

                        return {
                            role:
                                message &&
                                message.role === "assistant"
                                    ? "assistant"
                                    : "user",

                            content:
                                message &&
                                typeof message.content === "string"
                                    ? message.content.slice(0, 3000)
                                    : ""
                        };

                    })
                    .filter(function (message) {
                        return message.content.trim();
                    });


            if (!messages.length) {

                return res.status(400).json({
                    ok: false,
                    error:
                        "Please enter a message."
                });
            }


            console.log(
                "AI request:",
                messages[messages.length - 1].content
            );


            const aiText =
                await askGemini(messages);


            const aiJson =
                parseAiJson(aiText);


            const result =
                validateSelection(aiJson);


            return res.json({
                ok: true,
                result
            });


        } catch (error) {

            console.error(
                "AI suggestion error:",
                error.message
            );


            if (
                error.code ===
                "GEMINI_NOT_CONFIGURED"
            ) {

                return res.status(503).json({
                    ok: false,
                    error:
                        "AI is temporarily unavailable. Please try again later."
                });
            }


            if (
                error.status === 401 ||
                error.status === 403
            ) {

                return res.status(503).json({
                    ok: false,
                    error:
                        "AI service authentication is not available."
                });
            }


            if (error.status === 429) {

                return res.status(429).json({
                    ok: false,
                    error:
                        "AI is busy right now. Please try again in a moment."
                });
            }


            return res.status(500).json({
                ok: false,
                error:
                    error.message ||
                    "Unable to generate AI selection."
            });
        }
    }
);


/* =========================================================
   ORDER VALIDATION
   ========================================================= */

app.post(
    "/api/order/validate",
    function (req, res) {

        try {

            const items =
                Array.isArray(req.body.items)
                    ? req.body.items
                    : [];

            if (!items.length) {
                return res.status(400).json({
                    ok: false,
                    error: "Cart is empty."
                });
            }

            const productMap =
                new Map();

            products.forEach(function (product) {
                productMap.set(
                    Number(product.id),
                    product
                );
            });

            const validatedItems = [];

            let total = 0;

            for (const item of items) {

                const id =
                    Number(item.id);

                const qty =
                    Number(item.qty);

                if (
                    !Number.isInteger(id) ||
                    !Number.isInteger(qty) ||
                    qty < 1 ||
                    qty > 50
                ) {
                    continue;
                }

                const product =
                    productMap.get(id);

                if (!product) {
                    continue;
                }

                const price =
                    Number(product.price);

                if (!Number.isFinite(price)) {
                    continue;
                }

                const lineTotal =
                    price * qty;

                total += lineTotal;

                validatedItems.push({
                    id,
                    name: product.name,
                    qty,
                    price,
                    lineTotal
                });
            }

            if (!validatedItems.length) {
                return res.status(400).json({
                    ok: false,
                    error:
                        "No valid products found."
                });
            }

            return res.json({
                ok: true,
                items: validatedItems,
                total
            });

        } catch (error) {

            console.error(
                "Order validation error:",
                error.message
            );

            return res.status(500).json({
                ok: false,
                error:
                    "Unable to validate order."
            });
        }
    }
);


/* =========================================================
   API 404
   ========================================================= */

app.use(
    "/api",
    function (req, res) {

        res.status(404).json({
            ok: false,
            error: "API endpoint not found."
        });
    }
);


/* =========================================================
   WEBSITE FALLBACK
   ========================================================= */

app.use(
    function (req, res, next) {

        if (
            req.method !== "GET" ||
            req.path.startsWith("/api/")
        ) {
            return next();
        }

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "index.html"
            )
        );
    }
);


/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
    function (error, req, res, next) {

        console.error(
            "Server error:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            ok: false,
            error:
                "Internal server error."
        });
    }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
    PORT,
    function () {

        console.log(
            "=============================================="
        );

        console.log(
            "Tamilanda Crackers server started."
        );

        console.log(
            `Port: ${PORT}`
        );

        console.log(
            `Products: ${products.length}`
        );

        console.log(
            `AI: Gemini`
        );

        console.log(
            `Model: ${GEMINI_MODEL}`
        );

        console.log(
            `Gemini API key configured: ${
                process.env.GEMINI_API_KEY
                    ? "YES"
                    : "NO"
            }`
        );

        console.log(
            "=============================================="
        );
    }
);
