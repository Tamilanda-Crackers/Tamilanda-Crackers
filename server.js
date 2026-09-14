const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const PRODUCTS_FILE = path.join(__dirname, "products.json");

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

let products = [];

try {
  const rawProducts = fs.readFileSync(PRODUCTS_FILE, "utf8");
  products = JSON.parse(rawProducts);

  if (!Array.isArray(products)) {
    throw new Error("products.json must contain an array.");
  }

  console.log(`Loaded ${products.length} products.`);
} catch (error) {
  console.error("Failed to load products.json:");
  console.error(error);

  process.exit(1);
}

/* =========================================================
   AI INFO
   ========================================================= */

console.log("AI: Puter.js + DeepSeek");

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Tamilanda Crackers",
    products: products.length,
    ai: "Puter.js + DeepSeek"
  });
});

/* =========================================================
   PRODUCTS API
   ========================================================= */

app.get("/api/products", (req, res) => {
  res.json(products);
});

/* =========================================================
   ORDER VALIDATION
   ========================================================= */

app.post("/api/order/validate", (req, res) => {
  try {
    const items = req.body && req.body.items;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid order items."
      });
    }

    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const productId = Number(item.id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
          ok: false,
          error: "Invalid product ID."
        });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          ok: false,
          error: "Invalid quantity."
        });
      }

      const product = products.find(
        (p) => Number(p.id) === productId
      );

      if (!product) {
        return res.status(400).json({
          ok: false,
          error: `Product ${productId} not found.`
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          ok: false,
          error: `Invalid price for product ${productId}.`
        });
      }

      const lineTotal = price * quantity;

      total += lineTotal;

      validatedItems.push({
        id: product.id,
        name: product.name,
        quantity,
        price,
        lineTotal
      });
    }

    res.json({
      ok: true,
      items: validatedItems,
      total
    });
  } catch (error) {
    console.error("Order validation error:", error);

    res.status(500).json({
      ok: false,
      error: "Unable to validate order."
    });
  }
});

/* =========================================================
   STATIC FRONTEND
   ========================================================= */

app.use(express.static(PUBLIC_DIR));

/* =========================================================
   FRONTEND FALLBACK
   IMPORTANT:
   Express 5 does NOT support app.get("*", ...)
   ========================================================= */

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

/* =========================================================
   API 404
   ========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint not found."
  });
});

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    ok: false,
    error: "Internal server error."
  });
});

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {
  console.log(`Tamilanda Crackers running on port ${PORT}`);
});
