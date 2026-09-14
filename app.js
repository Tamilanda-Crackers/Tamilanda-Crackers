/* =========================================================
   TAMILANDA CRACKERS — DIWALI 2026
   Main Application Script
   ========================================================= */

(function () {
    "use strict";

    /* =========================================================
       CONSTANTS & STATE
       ========================================================= */

    const CART_STORAGE_KEY = "tamilanda_cart_v1";
    const CHAT_STORAGE_KEY = "tamilanda_chat_v1";
    const AI_MODEL = "deepseek-chat";

    const WHATSAPP_NUMBERS = [
        "919025478790",
        "919363063571"
    ];

    let products = [];
    let cart = {};
    let conversation = [];

    let currentCategory = "all";
    let currentSearch = "";
    let currentSort = "recommended";

    let aiBusy = false;


    /* =========================================================
       DOM HELPER
       ========================================================= */

    const $ = (selector) => document.querySelector(selector);

    const $$ = (selector) => Array.from(
        document.querySelectorAll(selector)
    );


    /* =========================================================
       HTML ESCAPE
       ========================================================= */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       MONEY
       ========================================================= */

    function money(value) {

        const number = Number(value || 0);

        return "₹" + number.toLocaleString("en-IN");
    }


    /* =========================================================
       NUMBER
       ========================================================= */

    function number(value) {

        const n = Number(value);

        return Number.isFinite(n) ? n : 0;
    }


    /* =========================================================
       PRODUCT DATA LOADER
       ========================================================= */

    async function loadProducts() {

        try {

            if (
                window.TAMILANDA_PRODUCTS_PROMISE &&
                typeof window.TAMILANDA_PRODUCTS_PROMISE.then === "function"
            ) {

                try {
                    products = await window.TAMILANDA_PRODUCTS_PROMISE;
                } catch (e) {
                    console.warn("TAMILANDA_PRODUCTS_PROMISE rejected:", e);
                }

            }

            if (!Array.isArray(products) || !products.length) {
                if (Array.isArray(window.TAMILANDA_PRODUCTS) && window.TAMILANDA_PRODUCTS.length > 0) {
                    products = window.TAMILANDA_PRODUCTS;
                } else if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0) {
                    products = window.PRODUCTS;
                }
            }

            if (!Array.isArray(products) || !products.length) {
                const paths = ["products.json", "./products.json", "/products.json", "public/products.json"];
                for (const p of paths) {
                    try {
                        const response = await fetch(p, { cache: "no-store" });
                        if (response.ok) {
                            const data = await response.json();
                            if (Array.isArray(data) && data.length > 0) {
                                products = data;
                                break;
                            }
                        }
                    } catch (e) {}
                }
            }

            if (!Array.isArray(products) || !products.length) {
                console.error("Product data could not be retrieved from static files.");
            }

            products = (products || [])
                .map((product, index) => {

                    return {

                        id:
                            product.id ??
                            index + 1,

                        name:
                            product.name ??
                            "Unnamed Product",

                        category:
                            product.category ??
                            product.sourceCategory ??
                            "Other",

                        sourceCategory:
                            product.sourceCategory ??
                            product.category ??
                            "Other",

                        pack:
                            product.pack ??
                            "",

                        buy:
                            number(product.buy),

                        mrp:
                            number(
                                product.mrp ??
                                product.price
                            ),

                        price:
                            number(
                                product.price ??
                                product.sell ??
                                product.offerPrice
                            ),

                        profit:
                            number(product.profit),

                        margin:
                            number(product.margin),

                        tags:
                            Array.isArray(product.tags)
                                ? product.tags
                                : [],

                        image:
                            product.image ??
                            "",

                        savings:
                            number(product.savings),

                        discount:
                            number(product.discount),

                        audience:
                            Array.isArray(product.audience)
                                ? product.audience
                                : []

                    };

                })
                .filter(product => product.price > 0);


            updateHeroProductCount();

            renderCategories();

            renderProducts();

            renderCart();


            console.log(
                `Tamilanda: Loaded ${products.length} products.`
            );

        }

        catch (error) {

            console.error(
                "Product loading error:",
                error
            );

            const count = $("#resultCount");

            if (count) {
                count.textContent =
                    "Unable to load products.";
            }

        }

    }


    /* =========================================================
       HERO PRODUCT COUNT
       ========================================================= */

    function updateHeroProductCount() {

        const element = $("#heroProductCount");

        if (!element) {
            return;
        }

        element.textContent =
            products.length + "+";

    }


    /* =========================================================
       CATEGORY NORMALIZATION
       ========================================================= */

    function categoryKey(category) {

        return String(category || "")
            .trim()
            .toLowerCase();

    }


    /* =========================================================
       PRIMARY CATEGORY CLASSIFICATION
       ========================================================= */

    const PRIMARY_CATEGORIES = [
        { id: "all", label: "All Crackers", icon: "✨" },
        { id: "sound", label: "Sound Crackers", icon: "💥" },
        { id: "fountains", label: "Fountains & Pots", icon: "⛲" },
        { id: "sparklers", label: "Sparklers", icon: "⭐" },
        { id: "skyshots", label: "Sky Shots & Rockets", icon: "🚀" },
        { id: "chakkars", label: "Ground Chakkars", icon: "🎡" },
        { id: "kids", label: "Kids Special", icon: "🧒" },
        { id: "combos", label: "Combos & Gift Boxes", icon: "🎁" }
    ];

    function getPrimaryCategory(product) {
        if (!product) return "other";
        const cat = String(product.category || product.sourceCategory || "").toLowerCase();
        const name = String(product.name || "").toLowerCase();

        if (cat.includes("kid") || cat.includes("pop") || name.includes("kid") || name.includes("lighter") || name.includes("match")) return "kids";
        if (cat.includes("fountain") || cat.includes("flower") || cat.includes("cone") || cat.includes("pot") || name.includes("fountain") || name.includes("flower")) return "fountains";
        if (cat.includes("sparkler") || cat.includes("twinkling") || name.includes("sparkler") || name.includes("star")) return "sparklers";
        if (cat.includes("shot") || cat.includes("sky") || cat.includes("rocket") || name.includes("shot") || name.includes("rocket") || name.includes("display")) return "skyshots";
        if (cat.includes("chakkar") || cat.includes("wheel") || name.includes("chakkar") || name.includes("wheel")) return "chakkars";
        if (cat.includes("combo") || cat.includes("pack") || cat.includes("gift") || cat.includes("variety") || name.includes("combo") || name.includes("box")) return "combos";

        return "sound";
    }


    /* =========================================================
       CATEGORY FILTERS
       ========================================================= */

    function renderCategories() {

        const container = $("#categoryFilters");

        if (!container) {
            return;
        }

        const categoryCounts = new Map();
        PRIMARY_CATEGORIES.forEach(c => categoryCounts.set(c.id, 0));
        categoryCounts.set("all", products.length);

        products.forEach(product => {
            const primary = getPrimaryCategory(product);
            categoryCounts.set(primary, (categoryCounts.get(primary) || 0) + 1);
        });

        let html = "";
        PRIMARY_CATEGORIES.forEach(cat => {
            const count = categoryCounts.get(cat.id) || 0;
            if (count === 0 && cat.id !== "all") return;
            const isActive = currentCategory === cat.id ? "active" : "";

            html += `
                <button
                    type="button"
                    class="category-button ${isActive}"
                    data-category="${cat.id}"
                >
                    ${cat.icon} ${cat.label} (${count})
                </button>
            `;
        });

        container.innerHTML = html;

        $$("#categoryFilters .category-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        currentCategory =
                            button.dataset.category ||
                            "all";

                        $$("#categoryFilters .category-button")
                            .forEach(btn =>
                                btn.classList.remove(
                                    "active"
                                )
                            );

                        button.classList.add("active");

                        renderProducts();

                    }
                );

            });

    }


    /* =========================================================
       FILTER PRODUCTS
       ========================================================= */

    function getFilteredProducts() {

        let list = [...products];


        /*
         * Search
         */

        if (currentSearch) {

            const query =
                currentSearch.toLowerCase();

            list = list.filter(product => {

                const searchable = [

                    product.name,

                    product.category,

                    product.sourceCategory,

                    product.pack,

                    ...(product.tags || []),

                    ...(product.audience || [])

                ]
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(query);

            });

        }


        /*
         * Category
         */

        if (
            currentCategory &&
            currentCategory !== "all"
        ) {

            list = list.filter(product =>
                getPrimaryCategory(product) === currentCategory
            );

        }


        /*
         * Sorting
         */

        if (currentSort === "price-low") {

            list.sort(
                (a, b) =>
                    a.price - b.price
            );

        }

        else if (currentSort === "price-high") {

            list.sort(
                (a, b) =>
                    b.price - a.price
            );

        }

        else if (currentSort === "name") {

            list.sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    )
            );

        }


        return list;

    }


    /* =========================================================
       PRODUCT IMAGE
       ========================================================= */

    function productImage(product) {

        if (!product.image) {

            return `
                <div class="product-image-placeholder">
                    🎆
                </div>
            `;

        }


        return `

            <img
                src="${escapeHtml(product.image)}"
                alt="${escapeHtml(product.name)}"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >

            <div
                class="product-image-placeholder"
                style="display:none"
            >
                🎆
            </div>

        `;

    }


    /* =========================================================
       PRODUCT CARD
       ========================================================= */

    function productCard(product) {

        const quantity =
            getCartQuantity(product.id);

        const mrp =
            number(product.mrp);

        const price =
            number(product.price);


        let discountHtml = "";


        if (
            mrp > price &&
            mrp > 0
        ) {

            const discount =
                Math.round(
                    ((mrp - price) / mrp) * 100
                );

            discountHtml = `

                <span class="product-discount">
                    ${discount}% OFF
                </span>

            `;

        }


        return `

            <article
                class="product-card"
                data-product-id="${escapeHtml(product.id)}"
            >

                <div class="product-image">

                    ${discountHtml}

                    ${productImage(product)}

                </div>


                <div class="product-card-body">

                    <div class="product-category">
                        ${escapeHtml(product.category)}
                    </div>


                    <h3 class="product-name">
                        ${escapeHtml(product.name)}
                    </h3>


                    ${
                        product.pack
                            ? `
                                <div class="product-pack">
                                    ${escapeHtml(product.pack)}
                                </div>
                              `
                            : ""
                    }


                    <div class="product-price">

                        ${
                            mrp > price
                                ? `
                                    <span class="product-mrp">
                                        ${money(mrp)}
                                    </span>
                                  `
                                : ""
                        }

                        <strong>
                            ${money(price)}
                        </strong>

                    </div>


                    <div class="product-actions">

                        <div class="quantity-control">

                            <button
                                type="button"
                                class="qty-minus"
                                data-id="${escapeHtml(product.id)}"
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>

                            <span>
                                ${quantity}
                            </span>

                            <button
                                type="button"
                                class="qty-plus"
                                data-id="${escapeHtml(product.id)}"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>

                        </div>


                        <button
                            type="button"
                            class="add-cart-button"
                            data-id="${escapeHtml(product.id)}"
                        >
                            🛒 ADD
                        </button>

                    </div>

                </div>

            </article>

        `;

    }


    /* =========================================================
       RENDER PRODUCTS
       ========================================================= */

    function renderProducts() {

        const grid =
            $("#productGrid");

        const empty =
            $("#emptyProducts");

        const resultCount =
            $("#resultCount");


        if (!grid) {
            return;
        }


        const list =
            getFilteredProducts();


        if (resultCount) {

            resultCount.textContent =
                `${list.length} of ${products.length} products`;

        }


        if (!list.length) {

            grid.innerHTML = "";

            if (empty) {
                empty.hidden = false;
            }

            return;

        }


        if (empty) {
            empty.hidden = true;
        }


        grid.innerHTML =
            list.map(productCard).join("");


        bindProductButtons();

    }


    /* =========================================================
       BIND PRODUCT BUTTONS
       ========================================================= */

    function bindProductButtons() {

        $$(".add-cart-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        changeQuantity(
                            id,
                            1
                        );

                        button.classList.add("added");

                        setTimeout(() => {
                            button.classList.remove("added");
                        }, 500);

                    }
                );

            });


        $$(".qty-plus")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeQuantity(
                            button.dataset.id,
                            1
                        );

                    }
                );

            });


        $$(".qty-minus")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeQuantity(
                            button.dataset.id,
                            -1
                        );

                    }
                );

            });

    }


    /* =========================================================
       CART
       ========================================================= */

    function loadCart() {

        try {

            const saved =
                localStorage.getItem(
                    CART_STORAGE_KEY
                );

            if (!saved) {
                cart = {};
                return;
            }

            const parsed =
                JSON.parse(saved);

            cart =
                parsed &&
                typeof parsed === "object"
                    ? parsed
                    : {};

        }

        catch {

            cart = {};

        }

    }


    function saveCart() {

        try {

            localStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify(cart)
            );

        }

        catch (error) {

            console.warn(
                "Cart save failed:",
                error
            );

        }

    }


    function getCartQuantity(id) {

        return number(
            cart[String(id)] || 0
        );

    }


    function changeQuantity(id, amount) {

        const key =
            String(id);

        const product =
            products.find(
                item =>
                    String(item.id) === key
            );


        if (!product) {
            return;
        }


        const oldQuantity =
            getCartQuantity(key);

        const newQuantity =
            Math.max(
                0,
                oldQuantity + amount
            );


        if (newQuantity === 0) {

            delete cart[key];

        }

        else {

            cart[key] =
                newQuantity;

        }


        saveCart();

        renderProducts();

        renderCart();

    }


    function setQuantity(id, quantity) {

        const key =
            String(id);

        const qty =
            Math.max(
                0,
                Math.floor(number(quantity))
            );


        if (!qty) {

            delete cart[key];

        }

        else {

            cart[key] = qty;

        }


        saveCart();

        renderProducts();

        renderCart();

    }


    function cartEntries() {

        return Object.entries(cart)
            .map(([id, quantity]) => {

                const product =
                    products.find(
                        item =>
                            String(item.id) ===
                            String(id)
                    );

                if (!product) {
                    return null;
                }

                return {
                    product,
                    quantity: number(quantity)
                };

            })
            .filter(Boolean)
            .filter(entry =>
                entry.quantity > 0
            );

    }


    function cartTotal() {

        return cartEntries()
            .reduce(
                (total, entry) =>
                    total +
                    entry.product.price *
                    entry.quantity,
                0
            );

    }


    function cartCount() {

        return cartEntries()
            .reduce(
                (total, entry) =>
                    total +
                    entry.quantity,
                0
            );

    }


    /* =========================================================
       RENDER CART
       ========================================================= */

    function renderCart() {

        const container =
            $("#cartItems");

        const total =
            $("#cartTotal");

        const count =
            $("#cartCount");

        const mobileCount =
            $("#mobileCartCount");

        const minNotice =
            $("#minOrderNotice");

        const orderButton =
            $("#whatsappOrderButton");


        const entries =
            cartEntries();

        const currentTotal =
            cartTotal();

        const MIN_ORDER = 2500;


        if (count) {
            count.textContent =
                cartCount();
        }


        if (mobileCount) {
            mobileCount.textContent =
                cartCount();
        }


        if (total) {
            total.textContent =
                money(currentTotal);
        }

        if (minNotice) {
            if (currentTotal === 0) {
                minNotice.className = "min-order-cart-notice warning";
                minNotice.innerHTML = "⚡ <strong>MINIMUM ORDER VALUE: ₹2,500</strong>";
                if (orderButton) {
                    orderButton.disabled = true;
                    orderButton.style.opacity = "0.5";
                    orderButton.style.cursor = "not-allowed";
                }
            } else if (currentTotal < MIN_ORDER) {
                const diff = MIN_ORDER - currentTotal;
                minNotice.className = "min-order-cart-notice warning";
                minNotice.innerHTML = `⚠️ <strong>Minimum order is ₹2,500</strong><br>Add <strong>${money(diff)}</strong> more to place order via WhatsApp.`;
                if (orderButton) {
                    orderButton.disabled = true;
                    orderButton.style.opacity = "0.5";
                    orderButton.style.cursor = "not-allowed";
                }
            } else {
                minNotice.className = "min-order-cart-notice success";
                minNotice.innerHTML = `✅ <strong>Minimum order requirement met (${money(currentTotal)})!</strong><br>Ready to order on WhatsApp.`;
                if (orderButton) {
                    orderButton.disabled = false;
                    orderButton.style.opacity = "1";
                    orderButton.style.cursor = "pointer";
                }
            }
        }


        if (!container) {
            return;
        }


        if (!entries.length) {

            container.innerHTML = `

                <div class="cart-empty-inner">

                    <div>
                        🛒
                    </div>

                    <strong>
                        Your cart is empty
                    </strong>

                    <p>
                        Add some crackers to continue.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML =
            entries.map(entry => {

                const product =
                    entry.product;

                const quantity =
                    entry.quantity;

                return `

                    <div
                        class="cart-item"
                        data-cart-id="${escapeHtml(product.id)}"
                    >

                        <div class="cart-item-image">

                            ${
                                product.image
                                    ? `
                                        <img
                                            src="${escapeHtml(product.image)}"
                                            alt="${escapeHtml(product.name)}"
                                        >
                                      `
                                    : "🎆"
                            }

                        </div>


                        <div class="cart-item-info">

                            <strong>
                                ${escapeHtml(product.name)}
                            </strong>

                            <span>
                                ${money(product.price)}
                            </span>


                            <div class="cart-item-controls">

                                <button
                                    type="button"
                                    class="cart-qty-minus"
                                    data-id="${escapeHtml(product.id)}"
                                >
                                    −
                                </button>

                                <span>
                                    ${quantity}
                                </span>

                                <button
                                    type="button"
                                    class="cart-qty-plus"
                                    data-id="${escapeHtml(product.id)}"
                                >
                                    +
                                </button>

                                <button
                                    type="button"
                                    class="cart-remove"
                                    data-id="${escapeHtml(product.id)}"
                                >
                                    Remove
                                </button>

                            </div>

                        </div>


                        <strong class="cart-item-total">
                            ${money(
                                product.price *
                                quantity
                            )}
                        </strong>

                    </div>

                `;

            }).join("");


        $$(".cart-qty-minus")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeQuantity(
                            button.dataset.id,
                            -1
                        );

                    }
                );

            });


        $$(".cart-qty-plus")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeQuantity(
                            button.dataset.id,
                            1
                        );

                    }
                );

            });


        $$(".cart-remove")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        setQuantity(
                            button.dataset.id,
                            0
                        );

                    }
                );

            });

    }


    /* =========================================================
       CART OPEN / CLOSE
       ========================================================= */

    function openCart() {

        const overlay =
            $("#cartOverlay");

        if (!overlay) {
            return;
        }

        overlay.classList.add("open");

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

    }


    function closeCart() {

        const overlay =
            $("#cartOverlay");

        if (!overlay) {
            return;
        }

        overlay.classList.remove("open");

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

    }


    /* =========================================================
       NEW AI SELECT STATE & SCREEN MANAGER
       ========================================================= */

    let aiState = {
        currentScreen: "opening",
        selectedBudget: 2500,
        allocations: {
            colour: 0,
            sound: 0,
            rockets: 0,
            fountains: 0,
            sparklers: 0,
            multieffect: 0,
            variety: 0
        },
        currentSelection: null,
        sessionExcludedIds: new Set()
    };

    function showAiScreen(screenName) {
        aiState.currentScreen = screenName;

        const opening = $("#aiOpeningScreen");
        const budget = $("#aiBudgetScreen");
        const alloc = $("#aiAllocationScreen");
        const result = $("#aiResultScreen");

        if (opening) opening.style.display = screenName === "opening" ? "block" : "none";
        if (budget) budget.style.display = screenName === "budget" ? "block" : "none";
        if (alloc) alloc.style.display = screenName === "allocation" ? "block" : "none";
        if (result) result.style.display = screenName === "result" ? "block" : "none";

        const title = $("#aiModalTitle");
        if (title) {
            if (screenName === "opening") title.innerHTML = "BUILD YOUR <span>DIWALI.</span>";
            else if (screenName === "budget") title.innerHTML = "SELECT YOUR <span>BUDGET.</span>";
            else if (screenName === "allocation") {
                title.innerHTML = "SPLIT YOUR <span>BUDGET.</span>";
                updateAllocationUI();
            } else if (screenName === "result") title.innerHTML = "YOUR SELECTION <span>READY.</span>";
        }
    }

    function openAi() {
        const overlay = $("#aiOverlay");
        if (!overlay) return;

        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        showAiScreen("opening");
    }

    function closeAi() {
        const overlay = $("#aiOverlay");
        if (!overlay) return;

        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }

    function setAiBudget(amount) {
        const val = Math.max(2500, Number(amount) || 2500);
        aiState.selectedBudget = val;

        aiState.allocations = {
            colour: 0,
            sound: 0,
            rockets: 0,
            fountains: 0,
            sparklers: 0,
            multieffect: 0,
            variety: 0
        };

        const headerTitle = $("#allocationHeaderTitle");
        if (headerTitle) headerTitle.textContent = `🎯 How do you want to split your ${money(val)} budget?`;

        $$(".alloc-input").forEach(input => {
            input.value = 0;
        });

        showAiScreen("allocation");
    }

    function calculateAllocatedTotal() {
        let total = 0;
        $$(".alloc-input").forEach(input => {
            const cat = input.dataset.cat;
            const val = Math.max(0, Number(input.value) || 0);
            aiState.allocations[cat] = val;
            total += val;
        });
        return total;
    }

    function updateAllocationUI() {
        const totalBudget = aiState.selectedBudget;
        const totalSpent = calculateAllocatedTotal();
        const diff = totalBudget - totalSpent;

        const allocTotalBudget = $("#allocTotalBudget");
        const allocTotalSpent = $("#allocTotalSpent");
        const allocTotalRemaining = $("#allocTotalRemaining");
        const allocRemLabel = $("#allocRemLabel");
        const btnCreate = $("#btnCreateMySelection");
        const btnAutoBalance = $("#btnAutoBalance");

        if (allocTotalBudget) allocTotalBudget.textContent = money(totalBudget);
        if (allocTotalSpent) allocTotalSpent.textContent = money(totalSpent);

        if (diff < 0) {
            if (allocRemLabel) allocRemLabel.textContent = "Status";
            if (allocTotalRemaining) {
                allocTotalRemaining.textContent = `⚠️ Over by ${money(Math.abs(diff))}`;
                allocTotalRemaining.style.color = "#ef4444";
            }
            if (btnCreate) btnCreate.disabled = true;
            if (btnAutoBalance) btnAutoBalance.disabled = true;
        } else if (diff > 0) {
            if (allocRemLabel) allocRemLabel.textContent = "Remaining";
            if (allocTotalRemaining) {
                allocTotalRemaining.textContent = money(diff);
                allocTotalRemaining.style.color = "#f5bd45";
            }
            if (btnCreate) btnCreate.disabled = false;
            if (btnAutoBalance) btnAutoBalance.disabled = false;
        } else {
            if (allocRemLabel) allocRemLabel.textContent = "Status";
            if (allocTotalRemaining) {
                allocTotalRemaining.textContent = "✅ Fully Allocated";
                allocTotalRemaining.style.color = "#10b981";
            }
            if (btnCreate) btnCreate.disabled = false;
            if (btnAutoBalance) btnAutoBalance.disabled = true;
        }
    }

    function autoBalanceRemaining() {
        const totalBudget = aiState.selectedBudget;
        const currentSpent = calculateAllocatedTotal();
        let remaining = totalBudget - currentSpent;

        if (remaining <= 0) return;

        const catKeys = ["colour", "sound", "rockets", "fountains", "sparklers", "multieffect", "variety"];
        const perCatShare = Math.floor(remaining / catKeys.length / 50) * 50;

        if (perCatShare >= 50) {
            catKeys.forEach(cat => {
                aiState.allocations[cat] = (aiState.allocations[cat] || 0) + perCatShare;
                remaining -= perCatShare;
            });
        }

        if (remaining > 0) {
            aiState.allocations.variety = (aiState.allocations.variety || 0) + remaining;
        }

        $$(".alloc-input").forEach(input => {
            const cat = input.dataset.cat;
            input.value = aiState.allocations[cat] || 0;
        });

        updateAllocationUI();
    }

    async function triggerAiCombo(mode) {
        showAiScreen("result");
        let promptText = "";

        if (mode === "children2500") promptText = "₹2500 children combo with sparklers, fountains, ground chakkars and novelty items";
        else if (mode === "adult2500") promptText = "₹2500 adult combo with sound crackers, rockets, bombs and multishots";
        else if (mode === "family2500") promptText = "₹2500 family combo with balanced sparklers, fountains, rockets and sound";
        else if (mode === "allinone2500") promptText = "₹2500 all in one mixed combo with variety across all categories";

        await sendAiMessage(promptText);
    }

    async function triggerCustomSelection() {
        const totalBudget = aiState.selectedBudget;
        const spent = calculateAllocatedTotal();

        if (spent < totalBudget) {
            autoBalanceRemaining();
        }

        const allocSummary = Object.entries(aiState.allocations)
            .filter(([_, amt]) => amt > 0)
            .map(([cat, amt]) => `${cat}: ${money(amt)}`)
            .join(", ");

        const promptText = `Custom selection with ${money(totalBudget)} budget. Category allocations: ${allocSummary}`;

        showAiScreen("result");
        await sendAiMessage(promptText);
    }


    /* =========================================================
       AI CHAT STORAGE
       ========================================================= */

    function loadConversation() {

        try {

            const saved =
                localStorage.getItem(
                    CHAT_STORAGE_KEY
                );

            if (!saved) {
                conversation = [];
                return;
            }


            const parsed =
                JSON.parse(saved);


            if (Array.isArray(parsed)) {

                conversation =
                    parsed.slice(-12);

            }

            else {

                conversation = [];

            }

        }

        catch {

            conversation = [];

        }

    }


    function saveConversation() {

        try {

            localStorage.setItem(
                CHAT_STORAGE_KEY,
                JSON.stringify(
                    conversation.slice(-12)
                )
            );

        }

        catch {}

    }


    /* =========================================================
       AI CHAT UI
       ========================================================= */

    function addUserMessage(text) {

        const chat =
            $("#aiChat");

        if (!chat) {
            return;
        }


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "chat-message user-message";


        wrapper.innerHTML = `

            <div class="chat-bubble user-bubble">
                ${escapeHtml(text)}
            </div>

        `;


        chat.appendChild(wrapper);

        scrollAiChat();

    }


    function addAiMessage(text) {

        const chat =
            $("#aiChat");

        if (!chat) {
            return;
        }


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "chat-message ai-message";


        wrapper.innerHTML = `

            <div class="chat-avatar">
                ✨
            </div>

            <div class="chat-bubble ai-bubble">
                ${formatAiText(text)}
            </div>

        `;


        chat.appendChild(wrapper);

        scrollAiChat();

    }


    function addTypingMessage() {

        const chat =
            $("#aiChat");

        if (!chat) {
            return null;
        }


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "chat-message ai-message ai-typing";


        wrapper.innerHTML = `

            <div class="chat-avatar">
                ✨
            </div>

            <div class="chat-bubble ai-bubble">

                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>

            </div>

        `;


        chat.appendChild(wrapper);

        scrollAiChat();


        return wrapper;

    }


    function scrollAiChat() {

        const chat =
            $("#aiChat");

        if (!chat) {
            return;
        }

        requestAnimationFrame(() => {

            chat.scrollTop =
                chat.scrollHeight;

        });

    }


    function formatAiText(text) {

        let safe =
            escapeHtml(text || "");


        safe =
            safe.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );


        safe =
            safe.replace(
                /\n/g,
                "<br>"
            );


        return safe;

    }


    /* =========================================================
       PRODUCT CONTEXT FOR AI
       ========================================================= */

    function createProductContext() {

        return products.map(product => ({

            id: product.id,

            name: product.name,

            category: product.category,

            pack: product.pack,

            price: product.price,

            mrp: product.mrp,

            tags: product.tags,

            audience: product.audience

        }));

    }


    /* =========================================================
       AI SYSTEM PROMPT
       ========================================================= */

    function buildSystemPrompt() {

        return `
You are Tamilanda Crackers' AI shopping assistant.
You help customers choose products from the EXACT product catalogue provided by the website.

IMPORTANT BUSINESS RULES:
1. NEVER invent a product.
2. NEVER invent a price.
3. ONLY recommend product IDs that exist in the supplied catalogue.
4. NEVER exceed the customer's stated budget.
5. Use the OFFER PRICE / price field for calculations.
6. MRP is only for display/reference.
7. Prefer practical, value-for-money selections.
8. Understand Tamil, Tanglish and English.

RESPONSE FORMAT:
Return ONLY valid JSON.
`;

    }


    /* =========================================================
       EXTRACT AI RESPONSE TEXT
       ========================================================= */

    function extractPuterText(response) {

        if (!response) {
            return "";
        }


        if (
            response.message &&
            typeof response.message.content !== "undefined"
        ) {

            return String(
                response.message.content
            );

        }


        if (
            typeof response.content !== "undefined"
        ) {

            return String(
                response.content
            );

        }


        if (
            typeof response.text !== "undefined"
        ) {

            return String(
                response.text
            );

        }


        return String(response);

    }


    /* =========================================================
       CLEAN JSON
       ========================================================= */

    function extractJson(text) {

        if (!text) {
            return null;
        }


        let cleaned =
            String(text)
                .trim();


        cleaned =
            cleaned.replace(
                /^```(?:json)?\s*/i,
                ""
            );

        cleaned =
            cleaned.replace(
                /\s*```$/i,
                ""
            );


        try {

            return JSON.parse(cleaned);

        }

        catch {}


        const start =
            cleaned.indexOf("{");

        const end =
            cleaned.lastIndexOf("}");


        if (
            start !== -1 &&
            end !== -1 &&
            end > start
        ) {

            const possible =
                cleaned.slice(
                    start,
                    end + 1
                );


            try {

                return JSON.parse(
                    possible
                );

            }

            catch {}

        }


        return null;

    }


    /* =========================================================
       VALIDATE AI RESULT
       ========================================================= */

    function validateAiResult(result, userBudget) {

        if (!result) {
            return null;
        }


        if (
            result.type === "question"
        ) {

            return {

                type: "question",

                message:
                    String(
                        result.message ||
                        "Ungaloda budget sollunga."
                    ).slice(0, 600)

            };

        }


        if (
            result.type !== "result" ||
            !Array.isArray(result.items)
        ) {

            return null;

        }


        const validProducts =
            new Map(
                products.map(
                    product =>
                        [
                            String(product.id),
                            product
                        ]
                )
            );


        const items = [];


        for (
            const rawItem of result.items
        ) {

            if (!rawItem) {
                continue;
            }


            const product =
                validProducts.get(
                    String(rawItem.id)
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
                            number(
                                rawItem.quantity ??
                                rawItem.qty ??
                                1
                            )
                        )
                    )
                );


            items.push({

                id: product.id,

                quantity,

                reason:
                    String(
                        rawItem.reason ||
                        "Good match for your request."
                    ).slice(0, 240)

            });

        }


        if (!items.length) {
            return null;
        }


        let total = 0;


        items.forEach(item => {

            const product =
                validProducts.get(
                    String(item.id)
                );

            total +=
                product.price *
                item.quantity;

        });


        if (
            userBudget > 0 &&
            total > userBudget
        ) {

            const sorted =
                [...items].sort((a, b) => {

                    const pa =
                        validProducts.get(
                            String(a.id)
                        );

                    const pb =
                        validProducts.get(
                            String(b.id)
                        );

                    return (
                        pb.price -
                        pa.price
                    );

                });


            for (
                const item of sorted
            ) {

                const product =
                    validProducts.get(
                        String(item.id)
                    );


                while (
                    item.quantity > 0 &&
                    total > userBudget
                ) {

                    total -=
                        product.price;

                    item.quantity--;

                }

            }


            for (
                let i = items.length - 1;
                i >= 0;
                i--
            ) {

                if (
                    items[i].quantity <= 0
                ) {

                    items.splice(i, 1);

                }

            }

        }


        if (!items.length) {
            return null;
        }


        const remaining =
            Math.max(
                0,
                userBudget > 0
                    ? userBudget - total
                    : 0
            );


        return {

            type: "result",

            message:
                String(
                    result.message ||
                    "Ungalukkaga selection ready."
                ).slice(0, 1000),

            items,

            total,

            remaining,

            confidence:
                Math.max(
                    0,
                    Math.min(
                        1,
                        number(
                            result.confidence ??
                            0.8
                        )
                    )
                )

        };

    }


    /* =========================================================
       EXTRACT USER BUDGET & LOCAL AI BUILDER
       ========================================================= */

    let lastAiBudget = 2000;

    function extractBudget(text) {

        if (!text) {
            return lastAiBudget || 0;
        }

        const input =
            String(text)
                .toLowerCase()
                .replace(/,/g, "");

        let match =
            input.match(
                /\b(?:budget|under|within|around|upto|max)\s*(?:of|is|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k)?\b/
            );

        if (match) {
            let value = Number(match[1]);
            if (match[2] === "k") value *= 1000;
            if (value >= 200) {
                lastAiBudget = value;
                return value;
            }
        }

        match =
            input.match(
                /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(k)?/
            );

        if (match) {
            let value = Number(match[1]);
            if (match[2] === "k") value *= 1000;
            if (value >= 200) {
                lastAiBudget = value;
                return value;
            }
        }

        match =
            input.match(
                /\b(\d+(?:\.\d+)?)\s*k\b/
            );

        if (match) {
            let value = Number(match[1]) * 1000;
            if (value >= 200) {
                lastAiBudget = value;
                return value;
            }
        }

        match =
            input.match(
                /\b(\d{3,6})\s*(?:budget|rup(?:ee|ees)?|rs|ku|-ku|kku)?\b/
            );

        if (match) {
            const value = Number(match[1]);
            if (value >= 300 && value <= 100000) {
                lastAiBudget = value;
                return value;
            }
        }

        return lastAiBudget || 0;
    }


    function getReasonForProduct(product) {
        const pCat = getPrimaryCategory(product);
        if (pCat === "kids") return "🧒 Child-Safe & Fun";
        if (pCat === "fountains") return "⛲ Bright Visual Fountain";
        if (pCat === "sparklers") return "⭐ Family Sparkler";
        if (pCat === "skyshots") return "🚀 Night Aerial Display";
        if (pCat === "chakkars") return "🎡 Spinning Ground Wheel";
        if (pCat === "combos") return "🎁 Variety Combo Pack";
        if (pCat === "sound") return "💥 Festive Sound Cracker";
        return "✨ Selected for Your Budget";
    }

    let previousAiSelectedIds = new Set();

    function buildLocalSmartSelection(text, requestedBudget) {

        const budget =
            requestedBudget || lastAiBudget || 2000;

        const q =
            String(text || "").toLowerCase();

        // Audience detection
        const isKids =
            q.includes("kid") || q.includes("child") || q.includes("pillai") || q.includes("kutti") || q.includes("pasa") || q.includes("baby") || q.includes("children") || q.includes("pillaingalukku");

        const isAdult =
            q.includes("adult") || q.includes("periyavanga") || q.includes("periya") || q.includes("man") || q.includes("men") || q.includes("boy");

        const isFamily =
            q.includes("family") || q.includes("home") || q.includes("veedu") || q.includes("everyone");

        const isAllInOne =
            q.includes("all in one") || q.includes("everything") || q.includes("mix") || q.includes("full mix") || q.includes("complete") || q.includes("ella type") || q.includes("combination");

        // Preference modifiers
        const isLowSound =
            q.includes("sound kammi") || q.includes("noise kammi") || q.includes("sound vendam") || q.includes("noise vendam") || q.includes("less sound") || q.includes("no noise") || q.includes("silent") || q.includes("low noise") || q.includes("neighbors problem");

        const isHighSound =
            q.includes("sound venum") || q.includes("semma sound") || q.includes("loud") || q.includes("heavy sound") || q.includes("more sound") || q.includes("bomb") || q.includes("noise venum");

        const isVariety =
            q.includes("variety") || q.includes("different") || q.includes("vera") || q.includes("diversity") || q.includes("more variety");

        const isQuantity =
            q.includes("quantity") || q.includes("more quantity") || q.includes("quantity mukkiyam") || q.includes("more pieces") || q.includes("bulk");

        const isPremium =
            q.includes("premium") || q.includes("luxury") || q.includes("high end") || q.includes("expensive") || q.includes("top quality");

        const isChange =
            q.includes("change") || q.includes("different") || q.includes("vera") || q.includes("another") || q.includes("new") || q.includes("previous");

        const avail =
            Array.isArray(products) ? products.filter(p => p && p.price > 0) : [];

        if (!avail.length) {
            return null;
        }

        function shuffle(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        // Exclude pre-made combo boxes from AI selection and filter sound if low sound requested
        let candidateAvail = avail.filter(p => {
            const cat = getPrimaryCategory(p);
            if (cat === "combos") return false;
            if (isLowSound || (isKids && !isHighSound && !isAdult)) {
                if (cat === "sound") return false;
            }
            return true;
        });

        if (!candidateAvail.length) {
            candidateAvail = avail.filter(p => getPrimaryCategory(p) !== "combos");
        }

        // Group products by primary category
        const catMap = new Map();
        candidateAvail.forEach(p => {
            const cat = getPrimaryCategory(p);
            if (!catMap.has(cat)) catMap.set(cat, []);
            catMap.get(cat).push(p);
        });

        catMap.forEach((items, cat) => {
            if (isPremium) {
                items.sort((a, b) => b.price - a.price);
            } else if (isQuantity) {
                items.sort((a, b) => a.price - b.price);
            } else {
                catMap.set(cat, shuffle(items));
            }
        });

        let categoryKeys = Array.from(catMap.keys());
        if (!isPremium && !isQuantity) {
            categoryKeys = shuffle(categoryKeys);
        }

        // Audience category prioritization
        if (isKids) {
            categoryKeys.sort((a, b) => (a === "kids" || a === "sparklers" || a === "fountains" || a === "chakkars") ? -1 : 1);
        } else if (isAdult || isHighSound) {
            categoryKeys.sort((a, b) => (a === "sound" || a === "skyshots" || a === "combos") ? -1 : 1);
        } else if (isFamily || isAllInOne) {
            categoryKeys.sort((a, b) => (a === "combos" || a === "fountains" || a === "sparklers") ? -1 : 1);
        }

        // Collect candidate pool
        let candidatePool = [];
        let pass = 0;
        while (candidatePool.length < 60 && pass < 10) {
            pass++;
            for (const cat of categoryKeys) {
                const items = catMap.get(cat) || [];
                if (items[pass - 1]) {
                    const item = items[pass - 1];
                    if (isChange && previousAiSelectedIds.has(String(item.id)) && Math.random() < 0.8) {
                        continue;
                    }
                    candidatePool.push(item);
                }
            }
        }

        if (!candidatePool.length) candidatePool = shuffle(candidateAvail);

        let total = 0;
        const itemMap = new Map();

        // PASS 1: Pick initial items across categories
        for (const p of candidatePool) {
            if (total + p.price <= budget) {
                itemMap.set(String(p.id), { product: p, qty: 1 });
                total += p.price;
            }
        }

        // PASS 2: DYNAMIC BUDGET FILLER & QUANTITY ALLOCATION
        let itemsList = Array.from(itemMap.values());
        let attempts = 0;
        const maxQuantityPerItem = isVariety ? 1 : isQuantity ? 4 : 2;

        while (total < budget * 0.88 && attempts < 100) {
            attempts++;
            let progressMade = false;

            // Option A: Increase quantities of selected products up to maxQuantityPerItem
            if (!isVariety) {
                for (const entry of shuffle(itemsList)) {
                    if (entry.qty < maxQuantityPerItem && total + entry.product.price <= budget) {
                        entry.qty += 1;
                        total += entry.product.price;
                        progressMade = true;
                        if (total >= budget * 0.95) break;
                    }
                }
            }

            // Option B: Add new unselected items from available catalogue
            if (total < budget * 0.88) {
                for (const p of shuffle(candidateAvail)) {
                    if (!itemMap.has(String(p.id)) && total + p.price <= budget) {
                        itemMap.set(String(p.id), { product: p, qty: 1 });
                        total += p.price;
                        progressMade = true;
                        itemsList = Array.from(itemMap.values());
                        if (total >= budget * 0.95) break;
                    }
                }
            }

            if (!progressMade) break;
        }

        const selectedItems = Array.from(itemMap.values()).map(e => ({
            id: String(e.product.id),
            quantity: e.qty,
            reason: getReasonForProduct(e.product)
        }));

        const currentSelectedIds = new Set(selectedItems.map(i => i.id));
        previousAiSelectedIds = currentSelectedIds;

        let audienceLabel = isAdult ? "Adult (Sound & Display)" : isKids ? "Kids Special (Colour & Sparklers)" : isFamily ? "Family Pack" : "All-in-One Mix";

        let message = `✨ **Tamilanda AI Assistant:**\n\n`;
        if (isChange) {
            message += `I've refreshed your plan! Here is a **100% fresh, updated ${audienceLabel}** featuring **${selectedItems.length} distinct cracker varieties** curated for your **${money(budget)}** budget!`;
        } else if (isLowSound) {
            message += `Here is your customized **${money(budget)} Low-Noise ${audienceLabel}**! Focused on bright visual fountains, sparklers & ground chakkars!`;
        } else {
            message += `Here is your customized **${money(budget)} ${audienceLabel}**! Dynamically curated with **${selectedItems.length} distinct cracker varieties**!`;
        }

        return {
            type: "result",
            message,
            items: selectedItems,
            total,
            remaining: Math.max(0, budget - total),
            confidence: 0.98
        };
    }


    /* =========================================================
       AI RESULT CARD
       ========================================================= */

    function renderAiResult(result) {

        const chat =
            $("#aiChat");

        if (!chat) {
            return;
        }


        const messageWrapper =
            document.createElement("div");

        messageWrapper.className =
            "chat-message ai-message";


        const productHtml =
            result.items.map(item => {

                const product =
                    products.find(
                        p =>
                            String(p.id) ===
                            String(item.id)
                    );


                if (!product) {
                    return "";
                }


                return `

                    <div
                        class="ai-result-product"
                        data-ai-id="${escapeHtml(product.id)}"
                    >

                        <div class="ai-result-product-image">

                            ${
                                product.image
                                    ? `
                                        <img
                                            src="${escapeHtml(product.image)}"
                                            alt="${escapeHtml(product.name)}"
                                        >
                                      `
                                    : "🎆"
                            }

                        </div>


                        <div class="ai-result-product-info">

                            <strong>
                                ${escapeHtml(product.name)}
                            </strong>

                            <span>
                                Qty: ${item.quantity}
                            </span>

                            <small>
                                ${escapeHtml(item.reason)}
                            </small>

                        </div>


                        <strong>
                            ${money(
                                product.price *
                                item.quantity
                            )}
                        </strong>

                    </div>

                `;

            }).join("");


        messageWrapper.innerHTML = `

            <div class="chat-avatar">
                ✨
            </div>


            <div class="chat-bubble ai-bubble ai-result-bubble">

                <div class="ai-result-message">
                    ${formatAiText(result.message)}
                </div>


                <div class="ai-result-products">

                    ${productHtml}

                </div>


                <div class="ai-result-summary">

                    <div>
                        <span>Grand Total</span>
                        <strong>
                            ${money(result.total)}
                        </strong>
                    </div>

                </div>


                <div class="ai-result-actions">

                    <button
                        type="button"
                        class="ai-add-plan-button"
                    >
                        🛒 ADD THIS PLAN
                    </button>

                    <button
                        type="button"
                        class="ai-change-plan-button"
                    >
                        🔄 CHANGE PLAN
                    </button>

                </div>

            </div>

        `;


        chat.appendChild(
            messageWrapper
        );


        const addButton =
            messageWrapper.querySelector(
                ".ai-add-plan-button"
            );


        if (addButton) {

            addButton.addEventListener(
                "click",
                () => {

                    result.items.forEach(item => {

                        const existing =
                            getCartQuantity(
                                item.id
                            );

                        setQuantity(
                            item.id,
                            existing +
                            item.quantity
                        );

                    });


                    addAiMessage(
                        "Done 👍 Selection cart-la add pannitten. 🛒"
                    );

                    setTimeout(
                        openCart,
                        250
                    );

                }
            );

        }


        const changeButton =
            messageWrapper.querySelector(
                ".ai-change-plan-button"
            );


        if (changeButton) {

            changeButton.addEventListener(
                "click",
                () => {

                    const input =
                        $("#aiInput");

                    if (input) {

                        input.value =
                            "Previous selection change pannu. Different combination venum.";

                        input.focus();

                    }

                }
            );

        }


        scrollAiChat();

    }


    /* =========================================================
       SEND AI MESSAGE
       ========================================================= */

    async function sendAiMessage(textFromButton = null) {

        if (aiBusy) {
            return;
        }


        const input =
            $("#aiInput");


        const text =
            String(
                textFromButton ??
                (input ? input.value : "")
            ).trim();


        if (!text) {
            return;
        }


        if (input && !textFromButton) {
            input.value = "";
        }


        aiBusy = true;


        const sendButton =
            $("#aiSendButton");


        if (sendButton) {

            sendButton.disabled =
                true;

            sendButton.classList.add(
                "loading"
            );

        }


        addUserMessage(text);


        conversation.push({

            role: "user",

            content: text

        });


        saveConversation();


        const typing =
            addTypingMessage();


        let validated = null;
        const budget = extractBudget(text);

        /*
         * TIER 1: Server Gemini AI API (/api/ai/suggest)
         */
        try {
            const apiRes = await fetch("/api/ai/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: conversation.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (apiRes.ok) {
                const data = await apiRes.json();
                if (data && data.ok && data.result) {
                    validated = validateAiResult(data.result, budget);
                }
            }
        } catch (serverError) {
            console.warn("Server AI endpoint unavailable, using local smart builder:", serverError);
        }

        /*
         * TIER 2: Local Smart Engine Fallback
         */
        if (!validated) {
            validated = buildLocalSmartSelection(text, budget);
        }

        if (typing) {
            typing.remove();
        }

        if (!validated) {
            addAiMessage("Sorry 😕 Selection create panna mudiyala. Budget and preference once more sollunga.");
            aiBusy = false;
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.classList.remove("loading");
            }
            return;
        }

        if (validated.type === "question") {
            addAiMessage(validated.message);
            conversation.push({ role: "assistant", content: validated.message });
            saveConversation();
            aiBusy = false;
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.classList.remove("loading");
            }
            return;
        }

        /*
         * Result
         */
        addAiMessage(validated.message);
        renderAiResult(validated);
        conversation.push({ role: "assistant", content: JSON.stringify(validated) });
        saveConversation();

        aiBusy = false;

        if (sendButton) {
            sendButton.disabled = false;
            sendButton.classList.remove("loading");
        }

        if (input) {
            input.focus();
        }

    }


    /* =========================================================
       QUICK PROMPTS
       ========================================================= */

    function bindQuickPrompts() {

        $$(
            "[data-prompt]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const prompt =
                        button.dataset.prompt;

                    if (!prompt) {
                        return;
                    }

                    openAi();

                    sendAiMessage(
                        prompt
                    );

                }
            );

        });

    }


    /* =========================================================
       SEARCH
       ========================================================= */

    function bindSearch() {

        const input =
            $("#searchInput");


        if (input) {

            input.addEventListener(
                "input",
                () => {

                    currentSearch =
                        input.value
                            .trim();

                    renderProducts();

                }
            );

        }


        const clear =
            $("#clearSearch");


        if (clear) {

            clear.addEventListener(
                "click",
                () => {

                    if (input) {
                        input.value = "";
                    }

                    currentSearch = "";

                    renderProducts();

                }
            );

        }


        const sort =
            $("#sortSelect");


        if (sort) {

            sort.addEventListener(
                "change",
                () => {

                    currentSort =
                        sort.value;

                    renderProducts();

                }
            );

        }

    }


    /* =========================================================
       RESET FILTERS
       ========================================================= */

    function resetFilters() {

        currentCategory =
            "all";

        currentSearch =
            "";

        currentSort =
            "recommended";


        const search =
            $("#searchInput");

        if (search) {
            search.value = "";
        }


        const sort =
            $("#sortSelect");

        if (sort) {
            sort.value =
                "recommended";
        }


        $$("#categoryFilters .category-button")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                    "all"
                );

            });


        renderProducts();

    }


    /* =========================================================
       WHATSAPP ORDER
       ========================================================= */

    function orderWhatsApp() {

        const entries =
            cartEntries();


        if (!entries.length) {

            alert(
                "Cart is empty. Please add some products first."
            );

            return;

        }

        const total = cartTotal();
        const MIN_ORDER = 2500;

        if (total < MIN_ORDER) {
            alert(`Minimum order value is ₹2,500.\nPlease add ${money(MIN_ORDER - total)} more to your cart to proceed.`);
            return;
        }


        const lines = [];


        lines.push(
            "🧨 *TAMILANDA CRACKERS ORDER*"
        );

        lines.push("");

        lines.push(
            "Hello! I would like to order:"
        );

        lines.push("");


        entries.forEach((entry, index) => {

            const product =
                entry.product;

            lines.push(

                `${index + 1}. ${product.name} × ${entry.quantity} — ${money(
                    product.price *
                    entry.quantity
                )}`

            );

        });


        lines.push("");

        lines.push(
            `💰 *Total: ${money(cartTotal())}*`
        );

        lines.push("");

        lines.push(
            "Please confirm availability and delivery details."
        );


        const message =
            encodeURIComponent(
                lines.join("\n")
            );


        const phone =
            WHATSAPP_NUMBERS[0];


        const url =
            `https://wa.me/${phone}?text=${message}`;


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

    }


    /* =========================================================
       MOBILE MENU
       ========================================================= */

    function bindMobileMenu() {

        const menuButton =
            $("#mobileMenuButton");

        const mobileNav =
            $("#mobileNav");


        if (
            menuButton &&
            mobileNav
        ) {

            menuButton.addEventListener(
                "click",
                () => {

                    mobileNav.classList.toggle(
                        "open"
                    );

                }
            );

        }


        $$("#mobileNav a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileNav?.classList.remove(
                            "open"
                        );

                    }
                );

            });

    }


    /* =========================================================
       MODAL BACKDROP EVENTS
       ========================================================= */

    function bindModalBackdrops() {

        const cartOverlay =
            $("#cartOverlay");


        if (cartOverlay) {

            cartOverlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        cartOverlay
                    ) {

                        closeCart();

                    }

                }
            );

        }


        const aiOverlay =
            $("#aiOverlay");


        if (aiOverlay) {

            aiOverlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        aiOverlay
                    ) {

                        closeAi();

                    }

                }
            );

        }

    }


    /* =========================================================
       BUTTON BINDINGS
       ========================================================= */

    function bindButtons() {

        /*
         * Cart
         */

        $("#openCartButton")
            ?.addEventListener(
                "click",
                openCart
            );


        $("#openCartFromMobile")
            ?.addEventListener(
                "click",
                () => {

                    $("#mobileNav")
                        ?.classList.remove(
                            "open"
                        );

                    openCart();

                }
            );


        $("#mobileCartButton")
            ?.addEventListener(
                "click",
                openCart
            );


        $("#closeCartButton")
            ?.addEventListener(
                "click",
                closeCart
            );


        $("#whatsappOrderButton")
            ?.addEventListener(
                "click",
                orderWhatsApp
            );


        /*
         * AI
         */

        $("#heroAiButton")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#heroAiPreviewButton")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#openAiFromNav")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#openAiFromProducts")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#aiCtaButton")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#footerAiButton")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#footerAiLink")
            ?.addEventListener(
                "click",
                openAi
            );


        $("#openAiFromMobile")
            ?.addEventListener(
                "click",
                () => {

                    $("#mobileNav")
                        ?.classList.remove(
                            "open"
                        );

                    openAi();

                }
            );


        $("#closeAiButton")
            ?.addEventListener(
                "click",
                closeAi
            );

        // Opening Screen Combos
        $$(".ai-combo-card").forEach(card => {
            card.addEventListener("click", () => {
                const mode = card.dataset.mode;
                triggerAiCombo(mode);
            });
        });

        $("#btnTellBudget")?.addEventListener("click", () => {
            showAiScreen("budget");
        });

        $("#btnChooseManually")?.addEventListener("click", () => {
            showAiScreen("budget");
        });

        $("#btnBackToOpening")?.addEventListener("click", () => {
            showAiScreen("opening");
        });

        $("#btnBackToBudget")?.addEventListener("click", () => {
            showAiScreen("budget");
        });

        // Budget Pills
        $$(".ai-budget-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                const b = Number(pill.dataset.budget) || 2500;
                setAiBudget(b);
            });
        });

        // Custom Budget Apply
        $("#btnApplyCustomBudget")?.addEventListener("click", () => {
            const val = Number($("#customBudgetInput")?.value) || 2500;
            setAiBudget(val);
        });

        // Allocation Inputs
        $$(".alloc-input").forEach(input => {
            input.addEventListener("input", () => {
                updateAllocationUI();
            });
        });

        // Auto Balance
        $("#btnAutoBalance")?.addEventListener("click", () => {
            autoBalanceRemaining();
        });

        // Create Selection
        $("#btnCreateMySelection")?.addEventListener("click", () => {
            triggerCustomSelection();
        });


        /*
         * AI Send
         */

        $("#aiSendButton")
            ?.addEventListener(
                "click",
                () => sendAiMessage()
            );


        /*
         * Enter = send
         * Shift + Enter = newline
         */

        $("#aiInput")
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        sendAiMessage();

                    }

                }
            );


        /*
         * Reset
         */

        $("#resetFiltersButton")
            ?.addEventListener(
                "click",
                resetFilters
            );


        $("#emptyResetButton")
            ?.addEventListener(
                "click",
                resetFilters
            );

    }


    /* =========================================================
       KEYBOARD SHORTCUTS
       ========================================================= */

    function bindKeyboard() {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeAi();

                    closeCart();

                }

            }
        );

    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    async function init() {

        loadCart();

        loadConversation();

        bindButtons();

        bindSearch();

        bindMobileMenu();

        bindModalBackdrops();

        bindQuickPrompts();

        bindKeyboard();

        await loadProducts();

    }


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }

    else {

        init();

    }


    /* =========================================================
       OPTIONAL GLOBAL API
       ========================================================= */

    window.TamilandaCrackers = {

        openAi,

        closeAi,

        openCart,

        closeCart,

        renderProducts,

        renderCart,

        getProducts: () =>
            products,

        getCart: () =>
            cart

    };

})();
