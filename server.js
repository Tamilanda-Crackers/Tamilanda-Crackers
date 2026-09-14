"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");

const PRODUCTS_FILE = path.join(
    __dirname,
    "products.json"
);


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

let products = [];

try {

    if (fs.existsSync(PRODUCTS_FILE)) {

        products =
            JSON.parse(
                fs.readFileSync(
                    PRODUCTS_FILE,
                    "utf8"
                )
            );

    }

}
catch (error) {

    console.error(
        "Unable to load products.json:",
        error
    );

    products = [];

}


console.log(
    `Loaded ${products.length} products.`
);

console.log(
    "AI: Puter.js + DeepSeek"
);


/* =========================================================
   EXPRESS CONFIG
   ========================================================= */

app.disable("x-powered-by");

app.use(
    express.json({
        limit: "1mb"
    })
);


/* =========================================================
   SECURITY / CACHE HEADERS
   ========================================================= */

app.use(
    (req, res, next) => {

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        res.setHeader(
            "X-Frame-Options",
            "SAMEORIGIN"
        );

        res.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );

        next();

    }
);


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            ok: true,

            service:
                "Tamilanda Crackers",

            ai:
                "Puter.js + DeepSeek",

            products:
                products.length,

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   PRODUCT API
   ========================================================= */

app.get(
    "/api/products",
    (req, res) => {

        res.json(products);

    }
);


/* =========================================================
   ORDER VALIDATION
   ========================================================= */

app.post(
    "/api/order/validate",
    (req, res) => {

        try {

            const body =
                req.body || {};

            const items =
                Array.isArray(body.items)
                    ? body.items
                    : [];


            if (!items.length) {

                return res.status(400).json({

                    ok: false,

                    error:
                        "Cart is empty."

                });

            }


            const productMap =
                new Map(
                    products.map(
                        product => [
                            String(product.id),
                            product
                        ]
                    )
                );


            const validatedItems = [];

            let total = 0;


            for (
                const item of items
            ) {

                const product =
                    productMap.get(
                        String(item.id)
                    );


                if (!product) {

                    return res.status(400).json({

                        ok: false,

                        error:
                            `Invalid product ID: ${item.id}`

                    });

                }


                const quantity =
                    Math.max(
                        1,
                        Math.min(
                            99,
                            Math.floor(
                                Number(
                                    item.quantity
                                ) || 0
                            )
                        )
                    );


                const lineTotal =
                    Number(product.price || 0) *
                    quantity;


                total += lineTotal;


                validatedItems.push({

                    id:
                        product.id,

                    name:
                        product.name,

                    quantity,

                    price:
                        Number(
                            product.price || 0
                        ),

                    lineTotal

                });

            }


            return res.json({

                ok: true,

                items:
                    validatedItems,

                total

            });

        }

        catch (error) {

            console.error(
                "Order validation error:",
                error
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
   STATIC WEBSITE
   ========================================================= */

app.use(
    express.static(
        PUBLIC_DIR,
        {
            extensions: [
                "html"
            ],

            maxAge:
                process.env.NODE_ENV ===
                "production"
                    ? "1h"
                    : 0
        }
    )
);


/* =========================================================
   SPA / WEBSITE FALLBACK
   ========================================================= */

app.get(
    "*",
    (req, res, next) => {

        /*
         * Never replace API 404 responses
         * with index.html.
         */

        if (
            req.path.startsWith(
                "/api/"
            )
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
   404 API
   ========================================================= */

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            ok: false,

            error:
                "API endpoint not found."

        });

    }
);


/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
    (error, req, res, next) => {

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
    () => {

        console.log(
            `Tamilanda Crackers running on port ${PORT}`
        );

        console.log(
            `Public directory: ${PUBLIC_DIR}`
        );

    }
);
