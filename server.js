"use strict";

/*
 * =========================================================
 * TAMILANDA CRACKERS
 * REAL AI BACKEND
 * =========================================================
 *
 * Stack:
 * - Node.js
 * - Express
 * - OpenAI Responses API
 *
 * IMPORTANT:
 * - Never put OPENAI_API_KEY in frontend files.
 * - The key belongs only in .env on the server.
 * =========================================================
 */


const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const OpenAI = require("openai");


/* =========================================================
   ENVIRONMENT
   ========================================================= */

dotenv.config();


const PORT =
  Number(process.env.PORT || 3000);


const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";


const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;


if (!OPENAI_API_KEY) {

  console.warn(
    "WARNING: OPENAI_API_KEY is not configured."
  );

}


/* =========================================================
   OPENAI CLIENT
   ========================================================= */

const openai =
  OPENAI_API_KEY
    ? new OpenAI({
        apiKey: OPENAI_API_KEY
      })
    : null;


/* =========================================================
   EXPRESS
   ========================================================= */

const app =
  express();


app.disable("x-powered-by");


app.use(
  express.json({
    limit: "1mb"
  })
);


/* =========================================================
   PATHS
   ========================================================= */

const ROOT_DIR =
  __dirname;


const PUBLIC_DIR =
  path.join(
    ROOT_DIR,
    "public"
  );


const PRODUCTS_FILE =
  path.join(
    ROOT_DIR,
    "products.json"
  );


/* =========================================================
   PRODUCT CATALOGUE
   ========================================================= */

let PRODUCTS = [];


function loadProducts() {

  try {

    const raw =
      fs.readFileSync(
        PRODUCTS_FILE,
        "utf8"
      );


    const parsed =
      JSON.parse(raw);


    if (!Array.isArray(parsed)) {

      throw new Error(
        "products.json must contain an array."
      );
    }


    PRODUCTS =
      parsed
        .filter(isValidProduct)
        .map(normalizeProduct);


    console.log(
      `Loaded ${PRODUCTS.length} products.`
    );


  } catch (error) {

    console.error(
      "Failed to load products.json:",
      error
    );


    process.exit(1);
  }
}


function isValidProduct(product) {

  return (
    product &&
    Number.isInteger(
      Number(product.id)
    ) &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    Number.isFinite(
      Number(product.price)
    )
  );
}


function normalizeProduct(product) {

  return {

    id:
      Number(product.id),

    name:
      product.name,

    category:
      product.category,

    sourceCategory:
      product.sourceCategory || "",

    pack:
      product.pack || "",

    buy:
      Number(product.buy || 0),

    mrp:
      Number(
        product.mrp ||
        product.price ||
        0
      ),

    price:
      Number(product.price || 0),

    profit:
      Number(product.profit || 0),

    margin:
      Number(product.margin || 0),

    discount:
      Number(product.discount || 0),

    savings:
      Number(product.savings || 0),

    tags:
      Array.isArray(product.tags)
        ? product.tags
        : [],

    audience:
      Array.isArray(product.audience)
        ? product.audience
        : [],

    image:
      product.image || ""
  };
}


loadProducts();


/* =========================================================
   STATIC FRONTEND
   ========================================================= */

app.use(
  express.static(
    PUBLIC_DIR
  )
);


/*
 * public/products.js fetches /products.json.
 * The JSON file itself lives in the repository root,
 * so serve it explicitly.
 */

app.get(
  "/products.json",
  function (req, res) {

    res.sendFile(
      PRODUCTS_FILE
    );
  }
);


/* =========================================================
   CORS
   ========================================================= */

const PUBLIC_ORIGIN =
  process.env.PUBLIC_ORIGIN;


app.use(
  function (req, res, next) {

    if (PUBLIC_ORIGIN) {

      res.header(
        "Access-Control-Allow-Origin",
        PUBLIC_ORIGIN
      );

      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type"
      );

      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS"
      );
    }


    if (req.method === "OPTIONS") {

      return res.sendStatus(
        204
      );
    }


    next();
  }
);


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",
  function (req, res) {

    res.json({

      ok: true,

      service:
        "Tamilanda Crackers AI",

      model:
        OPENAI_MODEL,

      openaiConfigured:
        Boolean(openai),

      products:
        PRODUCTS.length

    });
  }
);


/* =========================================================
   PRODUCT HELPERS
   ========================================================= */

function getProductById(
  id
) {

  return PRODUCTS.find(
    product =>
      product.id ===
      Number(id)
  ) || null;
}


function buildCompactCatalog() {

  return PRODUCTS.map(
    product => ({

      id:
        product.id,

      name:
        product.name,

      category:
        product.category,

      pack:
        product.pack,

      price:
        product.price,

      mrp:
        product.mrp,

      tags:
        product.tags,

      audience:
        product.audience

    })
  );
}


/* =========================================================
   MONEY / BUDGET HELPERS
   ========================================================= */

function extractBudget(
  text
) {

  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const normalized =
    text
      .toLowerCase()
      .replace(
        /,/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      );


  /*
   * Examples:
   * ₹2000
   * rs 2000
   * rs. 2000
   * 2000 budget
   * 2k
   * 2.5k
   */

  const currencyMatch =
    normalized.match(
      /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(k)?/i
    );


  if (currencyMatch) {

    let amount =
      Number(
        currencyMatch[1]
      );


    if (
      currencyMatch[2]
    ) {
      amount *= 1000;
    }


    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return amount;
    }
  }


  const kMatch =
    normalized.match(
      /\b(\d+(?:\.\d+)?)\s*k\b/i
    );


  if (kMatch) {

    const amount =
      Number(
        kMatch[1]
      ) * 1000;


    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return amount;
    }
  }


  const budgetMatch =
    normalized.match(
      /\b(\d+(?:\.\d+)?)\s*(?:budget|rupees|rs|inr)\b/i
    );


  if (budgetMatch) {

    const amount =
      Number(
        budgetMatch[1]
      );


    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return amount;
    }
  }


  return null;
}


/* =========================================================
   CONVERSATION BUDGET
   ========================================================= */

function findConversationBudget(
  conversation
) {

  if (
    !Array.isArray(
      conversation
    )
  ) {
    return null;
  }


  for (
    let i =
      conversation.length - 1;
    i >= 0;
    i--
  ) {

    const item =
      conversation[i];


    if (
      !item ||
      typeof item.content !== "string"
    ) {
      continue;
    }


    const budget =
      extractBudget(
        item.content
      );


    if (budget) {
      return budget;
    }
  }


  return null;
}


/* =========================================================
   TOTAL CALCULATION
   ========================================================= */

function calculateSelectionTotal(
  items
) {

  return items.reduce(
    (
      total,
      item
    ) => {

      const product =
        getProductById(
          item.productId
        );


      if (!product) {
        return total;
      }


      const quantity =
        Math.max(
          1,
          Math.min(
            99,
            Number(
              item.quantity
            ) || 1
          )
        );


      return (
        total +
        product.price *
        quantity
      );
    },
    0
  );
}


/* =========================================================
   VALIDATE AI ITEMS
   ========================================================= */

function validateAIItems(
  items
) {

  if (
    !Array.isArray(items)
  ) {
    return [];
  }


  const clean = [];


  for (
    const item of items
  ) {

    const productId =
      Number(
        item.productId
      );


    const product =
      getProductById(
        productId
      );


    if (!product) {
      continue;
    }


    const quantity =
      Math.max(
        1,
        Math.min(
          99,
          Math.floor(
            Number(
              item.quantity
            ) || 1
          )
        )
      );


    clean.push({

      productId:
        product.id,

      quantity,

      reason:
        typeof item.reason ===
        "string"
          ? item.reason.slice(
              0,
              300
            )
          : "Recommended for your preferences."

    });
  }


  /*
   * Remove duplicate product IDs.
   */

  const merged =
    new Map();


  for (
    const item of clean
  ) {

    if (
      merged.has(
        item.productId
      )
    ) {

      const existing =
        merged.get(
          item.productId
        );


      existing.quantity =
        Math.min(
          99,
          existing.quantity +
          item.quantity
        );

    } else {

      merged.set(
        item.productId,
        {
          ...item
        }
      );
    }
  }


  return [
    ...merged.values()
  ];
}


/* =========================================================
   FIT SELECTION INTO BUDGET
   ========================================================= */

function fitSelectionToBudget(
  items,
  budget
) {

  if (
    !budget ||
    budget <= 0
  ) {
    return items;
  }


  const result =
    items.map(
      item => ({
        ...item
      })
    );


  let total =
    calculateSelectionTotal(
      result
    );


  if (total <= budget) {
    return result;
  }


  /*
   * Reduce quantities from expensive items first.
   * This is a server-side safety net.
   */

  const sorted =
    [...result].sort(
      (a, b) => {

        const productA =
          getProductById(
            a.productId
          );

        const productB =
          getProductById(
            b.productId
          );


        return (
          (productB
            ? productB.price
            : 0) -
          (productA
            ? productA.price
            : 0)
        );
      }
    );


  for (
    const item of sorted
  ) {

    const product =
      getProductById(
        item.productId
      );


    if (!product) {
      continue;
    }


    while (
      item.quantity > 1 &&
      total > budget
    ) {

      item.quantity--;

      total -=
        product.price;
    }
  }


  /*
   * If still over budget, remove
   * the most expensive products.
   */

  for (
    let i =
      sorted.length - 1;
    i >= 0 &&
    total > budget;
    i--
  ) {

    const item =
      sorted[i];


    const product =
      getProductById(
        item.productId
      );


    if (!product) {
      continue;
    }


    if (
      item.quantity > 0
    ) {

      total -=
        product.price *
        item.quantity;

      item.quantity = 0;
    }
  }


  return result.filter(
    item =>
      item.quantity > 0
  );
}


/* =========================================================
   RESPONSE SCHEMA
   ========================================================= */

const AI_RESPONSE_SCHEMA = {

  type: "object",

  additionalProperties: false,

  properties: {

    type: {
      type: "string",
      enum: [
        "question",
        "result"
      ]
    },


    message: {
      type: "string"
    },


    budget: {
      type: [
        "number",
        "null"
      ]
    },


    total: {
      type: [
        "number",
        "null"
      ]
    },


    remaining: {
      type: [
        "number",
        "null"
      ]
    },


    confidence: {
      type: [
        "string",
        "null"
      ]
    },


    profile: {
      type: [
        "string",
        "null"
      ]
    },


    items: {

      type: "array",

      items: {

        type: "object",

        additionalProperties: false,

        properties: {

          productId: {
            type: "integer"
          },

          quantity: {
            type: "integer"
          },

          reason: {
            type: "string"
          }

        },

        required: [
          "productId",
          "quantity",
          "reason"
        ]
      }
    }

  },

  required: [
    "type",
    "message",
    "budget",
    "total",
    "remaining",
    "confidence",
    "profile",
    "items"
  ]
};


/* =========================================================
   AI SYSTEM PROMPT
   ========================================================= */

function buildSystemPrompt(
  budget
) {

  return `
You are the real AI shopping assistant for Tamilanda Crackers.

Your job is to help a customer build a Diwali cracker selection
from the EXACT product catalogue supplied below.

You are NOT a preset recommendation engine.

You must reason dynamically from:
- the user's budget
- family size
- kids/adults
- colour preference
- sound preference
- visual preference
- sky shots
- variety
- value for money
- previous conversation
- changes requested by the user

LANGUAGE:
Understand Tamil, Tanglish and English naturally.

Examples:
"family ku 2k"
"colour neraya"
"sound kammi"
"kids ku"
"more sky"
"2k la best mix"
"make it closer to 2000"
"reduce sound"
"change the sky shots"

CONVERSATION:
Remember the user's earlier requirements from the conversation.
If the user says "more colour", "less sound", "change this",
"make it closer to 2k", etc., modify the previous plan instead
of starting from zero.

BUDGET:
${budget ? `The detected budget is ₹${budget}. Stay at or below it.` : "No reliable budget has been detected yet."}

If there is not enough information to make a useful selection,
return type="question" and ask ONE natural follow-up question.

If you have enough information, return type="result".

IMPORTANT:
- Only use product IDs that exist in the supplied catalogue.
- Never invent products.
- Never invent prices.
- Never recommend a product outside the catalogue.
- Prefer variety when the user wants a family/general selection.
- Respect explicit sound preferences.
- Respect explicit audience preferences.
- Do not blindly spend the entire budget if doing so hurts the user's preferences.
- Explain briefly why each selected item fits.
- Keep recommendations practical and easy to understand.

SAFETY:
You are a shopping assistant only.
Do not provide instructions for manufacturing, modifying,
igniting, weaponising or illegally using fireworks.

OUTPUT:
Return ONLY the required structured JSON.
`;
}


/* =========================================================
   AI ENDPOINT
   ========================================================= */

app.post(
  "/api/ai/suggest",
  async function (req, res) {

    try {

      if (!openai) {

        return res.status(503).json({

          error:
            "OpenAI API is not configured on the server."

        });
      }


      const message =
        typeof req.body?.message === "string"
          ? req.body.message.trim()
          : "";


      if (!message) {

        return res.status(400).json({

          error:
            "Message is required."

        });
      }


      if (
        message.length > 1000
      ) {

        return res.status(400).json({

          error:
            "Message is too long."

        });
      }


      const conversation =
        Array.isArray(
          req.body?.conversation
        )
          ? req.body.conversation
              .filter(
                item =>
                  item &&
                  (
                    item.role ===
                      "user" ||
                    item.role ===
                      "assistant"
                  ) &&
                  typeof item.content ===
                    "string"
              )
              .slice(-12)
          : [];


      const budget =
        extractBudget(
          message
        ) ||
        findConversationBudget(
          conversation
        );


      const compactCatalog =
        buildCompactCatalog();


      const userPrompt = `
CURRENT USER MESSAGE:
${message}

RECENT CONVERSATION:
${JSON.stringify(
  conversation,
  null,
  2
)}

CURRENT CART:
${JSON.stringify(
  Array.isArray(req.body?.cart)
    ? req.body.cart
    : [],
  null,
  2
)}

PRODUCT CATALOGUE:
${JSON.stringify(
  compactCatalog
)}

Now decide whether to ask one useful question
or return a personalised product selection.
`;


      const response =
        await openai.responses.create({

          model:
            OPENAI_MODEL,

          input: [
            {
              role:
                "system",

              content:
                buildSystemPrompt(
                  budget
                )
            },

            {
              role:
                "user",

              content:
                userPrompt
            }
          ],

          text: {

            format: {

              type:
                "json_schema",

              name:
                "tamilanda_ai_result",

              strict:
                true,

              schema:
                AI_RESPONSE_SCHEMA
            }
          }

        });


      const outputText =
        response.output_text;


      if (
        typeof outputText !==
          "string" ||
        !outputText.trim()
      ) {

        throw new Error(
          "OpenAI returned an empty response."
        );
      }


      let aiData;


      try {

        aiData =
          JSON.parse(
            outputText
          );

      } catch (parseError) {

        console.error(
          "AI JSON parse error:",
          outputText
        );

        throw new Error(
          "AI returned invalid structured data."
        );
      }


      /* =====================================================
         QUESTION RESPONSE
         ===================================================== */

      if (
        aiData.type ===
        "question"
      ) {

        return res.json({

          type:
            "question",

          message:
            aiData.message ||
            "Konjam more details sollunga 😊",

          budget:
            budget,

          total:
            null,

          remaining:
            null,

          confidence:
            aiData.confidence ||
            null,

          profile:
            aiData.profile ||
            null,

          items:
            []

        });
      }


      /* =====================================================
         RESULT RESPONSE
         ===================================================== */

      let items =
        validateAIItems(
          aiData.items
        );


      /*
       * Never return an empty result unless
       * the AI genuinely could not find products.
       */

      if (
        items.length === 0
      ) {

        return res.json({

          type:
            "question",

          message:
            "Ungalukku suitable selection build panna konjam more details venum. Budget evlo, and sound/colour preference enna? 😊",

          budget:
            budget,

          total:
            null,

          remaining:
            null,

          confidence:
            null,

          profile:
            null,

          items:
            []

        });
      }


      /*
       * Server-side budget enforcement.
       */

      if (budget) {

        items =
          fitSelectionToBudget(
            items,
            budget
          );
      }


      const total =
        calculateSelectionTotal(
          items
        );


      /*
       * Absolute safety check.
       */

      if (
        budget &&
        total > budget
      ) {

        return res.json({

          type:
            "question",

          message:
            `Indha selection ₹${Math.round(total)} varudhu, but budget ₹${Math.round(budget)}. Konjam budget increase pannalama illa quantity reduce pannalama?`,

          budget:
            budget,

          total:
            null,

          remaining:
            null,

          confidence:
            null,

          profile:
            null,

          items:
            []

        });
      }


      const remaining =
        budget
          ? Math.max(
              0,
              budget - total
            )
          : null;


      /*
       * Return server-authoritative
       * product information only through IDs.
       */

      return res.json({

        type:
          "result",

        message:
          aiData.message ||
          "Ungalukku suitable selection ready pannitten. 😊",

        budget:
          budget,

        total:
          total,

        remaining:
          remaining,

        confidence:
          aiData.confidence ||
          "Good",

        profile:
          aiData.profile ||
          "Personalised Diwali selection",

        items:
          items

      });


    } catch (error) {

      console.error(
        "REAL AI ERROR:",
        error
      );


      const status =
        error?.status &&
        Number.isInteger(
          Number(error.status)
        )
          ? Number(error.status)
          : 500;


      let message =
        "AI service-la temporary problem. Please try again.";


      if (
        status === 401
      ) {

        message =
          "OpenAI API key invalid or unavailable. Server .env check pannunga.";
      }


      if (
        status === 429
      ) {

        message =
          "AI usage limit reached. Konjam neram kazhichu try pannunga.";
      }


      if (
        error?.message &&
        /quota|billing/i.test(
          error.message
        )
      ) {

        message =
          "OpenAI account usage/billing limit issue. API account check pannunga.";
      }


      return res
        .status(status >= 400 && status < 600
          ? status
          : 500)
        .json({

          error:
            message

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

      const incomingItems =
        Array.isArray(
          req.body?.items
        )
          ? req.body.items
          : [];


      const items =
        validateAIItems(
          incomingItems
        );


      const total =
        calculateSelectionTotal(
          items
        );


      const detailedItems =
        items.map(
          item => {

            const product =
              getProductById(
                item.productId
              );


            return {

              productId:
                product.id,

              name:
                product.name,

              quantity:
                item.quantity,

              price:
                product.price,

              subtotal:
                product.price *
                item.quantity

            };
          }
        );


      return res.json({

        valid:
          detailedItems.length >
          0,

        items:
          detailedItems,

        total:
          total

      });


    } catch (error) {

      console.error(
        "Order validation error:",
        error
      );


      return res
        .status(500)
        .json({

          valid:
            false,

          error:
            "Order validation failed."

        });
    }
  }
);


/* =========================================================
   SPA FALLBACK
   ========================================================= */

app.get(
  "/",
  function (req, res) {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "index.html"
      )
    );
  }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  function () {

    console.log(
      "=========================================="
    );

    console.log(
      "  TAMILANDA CRACKERS — REAL AI"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Model: ${OPENAI_MODEL}`
    );

    console.log(
      `Products: ${PRODUCTS.length}`
    );

    console.log(
      `OpenAI configured: ${Boolean(openai)}`
    );

    console.log(
      "=========================================="
    );
  }
);
