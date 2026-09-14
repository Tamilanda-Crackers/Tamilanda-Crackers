/* =========================================================
   TAMILANDA CRACKERS
   REAL AI E-COMMERCE FRONTEND
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let PRODUCTS = [];
let filteredProducts = [];

let activeCategory = "all";
let searchTerm = "";
let sortMode = "default";

let cart = loadCart();

let aiConversation = [];
let lastAIResult = null;

let currentProductQuantities = {};

const WHATSAPP_NUMBERS = [
  "919025478790",
  "919363063571"
];


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => Array.from(
  document.querySelectorAll(selector)
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {

  bindEvents();

  updateCartUI();

  try {

    if (
      window.TAMILANDA_PRODUCTS_PROMISE &&
      typeof window.TAMILANDA_PRODUCTS_PROMISE.then === "function"
    ) {
      PRODUCTS = await window.TAMILANDA_PRODUCTS_PROMISE;
    } else {

      const response = await fetch("/products.json", {
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error(
          "Product catalogue could not be loaded."
        );
      }

      PRODUCTS = await response.json();
    }

    if (!Array.isArray(PRODUCTS)) {
      throw new Error(
        "Product catalogue is not an array."
      );
    }

    PRODUCTS = PRODUCTS
      .filter(isValidProduct)
      .map(normalizeProduct);

    filteredProducts = [...PRODUCTS];

    buildCategories();

    renderProducts();

  } catch (error) {

    console.error(
      "Tamilanda initialization error:",
      error
    );

    showCatalogueError();
  }
}


/* =========================================================
   PRODUCT VALIDATION
   ========================================================= */

function isValidProduct(product) {

  return (
    product &&
    Number.isInteger(Number(product.id)) &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    Number.isFinite(Number(product.price))
  );
}


function normalizeProduct(product) {

  return {
    ...product,

    id: Number(product.id),

    buy: Number(product.buy || 0),

    mrp: Number(product.mrp || product.price || 0),

    price: Number(product.price || 0),

    profit: Number(product.profit || 0),

    margin: Number(product.margin || 0),

    discount: Number(product.discount || 0),

    savings: Number(product.savings || 0),

    tags: Array.isArray(product.tags)
      ? product.tags
      : [],

    audience: Array.isArray(product.audience)
      ? product.audience
      : []
  };
}


/* =========================================================
   EVENT BINDINGS
   ========================================================= */

function bindEvents() {

  /* Search */

  const searchInput = $("#searchInput");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        searchTerm = this.value
          .trim()
          .toLowerCase();

        const clearButton = $("#clearSearch");

        if (clearButton) {
          clearButton.hidden =
            searchTerm.length === 0;
        }

        renderProducts();
      }
    );
  }


  /* Clear search */

  const clearSearch = $("#clearSearch");

  if (clearSearch) {

    clearSearch.addEventListener(
      "click",
      function () {

        if (searchInput) {
          searchInput.value = "";
        }

        searchTerm = "";

        this.hidden = true;

        renderProducts();
      }
    );
  }


  /* Sort */

  const sortSelect = $("#sortSelect");

  if (sortSelect) {

    sortSelect.addEventListener(
      "change",
      function () {

        sortMode = this.value;

        renderProducts();
      }
    );
  }


  /* Category buttons */

  const categoryFilters = $("#categoryFilters");

  if (categoryFilters) {

    categoryFilters.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            ".category-button"
          );

        if (!button) return;

        activeCategory =
          button.dataset.category || "all";

        $$(".category-button")
          .forEach((item) => {
            item.classList.toggle(
              "active",
              item === button
            );
          });

        renderProducts();
      }
    );
  }


  /* Product grid */

  const productGrid = $("#productGrid");

  if (productGrid) {

    productGrid.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest("button");

        if (!button) return;

        const productId =
          Number(button.dataset.productId);

        if (!productId) return;


        if (
          button.classList.contains(
            "product-quantity-minus"
          )
        ) {

          changeProductQuantity(
            productId,
            -1
          );

          return;
        }


        if (
          button.classList.contains(
            "product-quantity-plus"
          )
        ) {

          changeProductQuantity(
            productId,
            1
          );

          return;
        }


        if (
          button.classList.contains(
            "add-cart-button"
          )
        ) {

          addToCart(
            productId,
            getProductPageQuantity(productId)
          );
        }

      }
    );
  }


  /* Cart open */

  const openCartButton =
    $("#openCartButton");

  if (openCartButton) {

    openCartButton.addEventListener(
      "click",
      openCart
    );
  }


  /* Cart close */

  const closeCartButton =
    $("#closeCartButton");

  if (closeCartButton) {

    closeCartButton.addEventListener(
      "click",
      closeCart
    );
  }


  const cartOverlay =
    $("#cartOverlay");

  if (cartOverlay) {

    cartOverlay.addEventListener(
      "click",
      function (event) {

        if (event.target === cartOverlay) {
          closeCart();
        }
      }
    );
  }


  /* Cart item controls */

  const cartItems =
    $("#cartItems");

  if (cartItems) {

    cartItems.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest("button");

        if (!button) return;

        const id =
          Number(button.dataset.productId);

        if (!id) return;


        if (
          button.classList.contains(
            "cart-minus"
          )
        ) {

          updateCartQuantity(id, -1);

          return;
        }


        if (
          button.classList.contains(
            "cart-plus"
          )
        ) {

          updateCartQuantity(id, 1);

          return;
        }


        if (
          button.classList.contains(
            "cart-remove"
          )
        ) {

          removeFromCart(id);
        }

      }
    );
  }


  /* WhatsApp */

  const whatsappOrderButton =
    $("#whatsappOrderButton");

  if (whatsappOrderButton) {

    whatsappOrderButton.addEventListener(
      "click",
      orderViaWhatsApp
    );
  }


  /* AI buttons */

  [
    "#heroAiButton",
    "#heroAiPreviewButton",
    "#openAiFromNav",
    "#openAiFromProducts",
    "#aiCtaButton",
    "#footerAiButton",
    "#openAiFromMobile"
  ]
    .forEach((selector) => {

      const element = $(selector);

      if (element) {

        element.addEventListener(
          "click",
          openAI
        );
      }
    });


  /* AI close */

  const closeAiButton =
    $("#closeAiButton");

  if (closeAiButton) {

    closeAiButton.addEventListener(
      "click",
      closeAI
    );
  }


  const aiOverlay =
    $("#aiOverlay");

  if (aiOverlay) {

    aiOverlay.addEventListener(
      "click",
      function (event) {

        if (event.target === aiOverlay) {
          closeAI();
        }
      }
    );
  }


  /* AI send */

  const aiSendButton =
    $("#aiSendButton");

  if (aiSendButton) {

    aiSendButton.addEventListener(
      "click",
      sendAIMessage
    );
  }


  /* AI input */

  const aiInput =
    $("#aiInput");

  if (aiInput) {

    aiInput.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendAIMessage();
        }
      }
    );
  }


  /* AI quick prompts */

  const aiQuickPrompts =
    $("#aiQuickPrompts");

  if (aiQuickPrompts) {

    aiQuickPrompts.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest("button");

        if (!button) return;

        const prompt =
          button.dataset.prompt;

        if (!prompt) return;

        const input = $("#aiInput");

        if (input) {
          input.value = prompt;
          input.focus();
        }

        sendAIMessage();
      }
    );
  }


  /* AI result actions */

  const aiChat =
    $("#aiChat");

  if (aiChat) {

    aiChat.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest("button");

        if (!button) return;


        if (
          button.classList.contains(
            "ai-add-plan"
          )
        ) {

          addAIPlanToCart();

          return;
        }


        if (
          button.classList.contains(
            "ai-change-plan"
          )
        ) {

          const input =
            $("#aiInput");

          if (input) {
            input.focus();
          }

          return;
        }

      }
    );
  }


  /* Reset filters */

  const resetFiltersButton =
    $("#resetFiltersButton");

  if (resetFiltersButton) {

    resetFiltersButton.addEventListener(
      "click",
      function () {

        activeCategory = "all";
        searchTerm = "";
        sortMode = "default";

        if (searchInput) {
          searchInput.value = "";
        }

        if (sortSelect) {
          sortSelect.value = "default";
        }

        $$(".category-button")
          .forEach((button, index) => {
            button.classList.toggle(
              "active",
              index === 0
            );
          });

        renderProducts();
      }
    );
  }


  /* Mobile menu */

  const mobileMenuButton =
    $("#mobileMenuButton");

  const mobileNav =
    $("#mobileNav");

  if (
    mobileMenuButton &&
    mobileNav
  ) {

    mobileMenuButton.addEventListener(
      "click",
      function () {

        const open =
          mobileNav.classList.toggle(
            "open"
          );

        mobileNav.setAttribute(
          "aria-hidden",
          String(!open)
        );

        mobileMenuButton.setAttribute(
          "aria-expanded",
          String(open)
        );
      }
    );


    mobileNav
      .querySelectorAll("a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          function () {

            mobileNav.classList.remove(
              "open"
            );

            mobileNav.setAttribute(
              "aria-hidden",
              "true"
            );

            mobileMenuButton.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      });
  }


  /* Escape key */

  document.addEventListener(
    "keydown",
    function (event) {

      if (event.key !== "Escape") {
        return;
      }

      closeCart();
      closeAI();
    }
  );
}


/* =========================================================
   CATEGORIES
   ========================================================= */

function buildCategories() {

  const container =
    $("#categoryFilters");

  if (!container) return;

  const categories = [
    ...new Set(
      PRODUCTS
        .map(
          (product) =>
            product.category
        )
        .filter(Boolean)
    )
  ]
    .sort(
      (a, b) =>
        a.localeCompare(b)
    );


  container.innerHTML = "";


  const allButton =
    document.createElement("button");

  allButton.type = "button";

  allButton.className =
    "category-button active";

  allButton.dataset.category = "all";

  allButton.textContent = "All";

  container.appendChild(allButton);


  categories.forEach(
    (category) => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "category-button";

      button.dataset.category =
        category;

      button.textContent =
        category;

      container.appendChild(button);
    }
  );
}


/* =========================================================
   PRODUCT FILTERING
   ========================================================= */

function getVisibleProducts() {

  let result = [...PRODUCTS];


  /* Category */

  if (activeCategory !== "all") {

    result =
      result.filter(
        (product) =>
          product.category ===
          activeCategory
      );
  }


  /* Search */

  if (searchTerm) {

    result =
      result.filter(
        (product) => {

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

          return searchable.includes(
            searchTerm
          );
        }
      );
  }


  /* Sort */

  switch (sortMode) {

    case "low":

      result.sort(
        (a, b) =>
          a.price - b.price
      );

      break;


    case "high":

      result.sort(
        (a, b) =>
          b.price - a.price
      );

      break;


    case "az":

      result.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

      break;


    default:
      break;
  }


  return result;
}


/* =========================================================
   PRODUCT RENDER
   ========================================================= */

function renderProducts() {

  const grid =
    $("#productGrid");

  const empty =
    $("#emptyProducts");

  const resultCount =
    $("#resultCount");

  if (!grid) return;


  filteredProducts =
    getVisibleProducts();


  if (resultCount) {

    resultCount.textContent =
      `${filteredProducts.length} products`;
  }


  if (filteredProducts.length === 0) {

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
    filteredProducts
      .map(
        renderProductCard
      )
      .join("");
}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function renderProductCard(product) {

  const quantity =
    getProductPageQuantity(
      product.id
    );


  const image =
    product.image
      ? `
        <img
          class="product-image"
          src="${escapeAttribute(product.image)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.hidden=false;"
        >

        <div
          class="product-image-placeholder"
          hidden
        >
          🎆
        </div>
      `
      : `
        <div class="product-image-placeholder">
          🎆
        </div>
      `;


  const discount =
    Number(product.discount || 0);


  const discountBadge =
    discount > 0
      ? `
        <div class="product-discount">
          ${Math.round(discount)}% OFF
        </div>
      `
      : "";


  return `
    <article
      class="product-card"
      data-product-id="${product.id}"
    >

      <div class="product-image-wrap">

        ${image}

        ${discountBadge}

        <div class="product-category">
          ${escapeHTML(product.category)}
        </div>

      </div>


      <div class="product-content">

        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>

        <div class="product-pack">
          ${escapeHTML(product.pack || "Diwali Special")}
        </div>


        <div class="product-prices">

          <span class="product-mrp">
            ₹${formatMoney(product.mrp)}
          </span>

          <strong class="product-price">
            ₹${formatMoney(product.price)}
          </strong>

        </div>


        <div class="product-actions">

          <div class="quantity-control">

            <button
              type="button"
              class="product-quantity-minus"
              data-product-id="${product.id}"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>
              ${quantity}
            </span>

            <button
              type="button"
              class="product-quantity-plus"
              data-product-id="${product.id}"
              aria-label="Increase quantity"
            >
              +
            </button>

          </div>


          <button
            type="button"
            class="add-cart-button"
            data-product-id="${product.id}"
          >
            🛒 Add to Cart
          </button>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   PRODUCT PAGE QUANTITY
   ========================================================= */

function getProductPageQuantity(
  productId
) {

  const quantity =
    Number(
      currentProductQuantities[
        productId
      ]
    );

  return quantity > 0
    ? quantity
    : 1;
}


function changeProductQuantity(
  productId,
  change
) {

  const current =
    getProductPageQuantity(
      productId
    );

  const next =
    Math.max(
      1,
      Math.min(
        99,
        current + change
      )
    );


  currentProductQuantities[
    productId
  ] = next;


  renderProducts();
}


/* =========================================================
   CART
   ========================================================= */

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "tamilanda_cart"
      );

    if (!saved) {
      return {};
    }

    const parsed =
      JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return {};
    }

    return parsed;

  } catch (error) {

    console.warn(
      "Cart restore failed:",
      error
    );

    return {};
  }
}


function saveCart() {

  try {

    localStorage.setItem(
      "tamilanda_cart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.warn(
      "Cart save failed:",
      error
    );
  }
}


function addToCart(
  productId,
  quantity = 1
) {

  const product =
    getProductById(productId);

  if (!product) return;


  const safeQuantity =
    Math.max(
      1,
      Math.min(
        99,
        Number(quantity) || 1
      )
    );


  cart[productId] =
    Math.min(
      99,
      Number(cart[productId] || 0) +
        safeQuantity
    );


  saveCart();

  updateCartUI();

  showAddedFeedback(
    productId
  );
}


function updateCartQuantity(
  productId,
  change
) {

  const current =
    Number(
      cart[productId] || 0
    );

  const next =
    current + change;


  if (next <= 0) {

    delete cart[productId];

  } else {

    cart[productId] =
      Math.min(
        99,
        next
      );
  }


  saveCart();

  updateCartUI();
}


function removeFromCart(
  productId
) {

  delete cart[productId];

  saveCart();

  updateCartUI();
}


function getCartItems() {

  return Object.entries(cart)
    .map(
      ([id, quantity]) => {

        const product =
          getProductById(
            Number(id)
          );

        if (!product) {
          return null;
        }

        return {
          product,
          quantity: Number(quantity)
        };
      }
    )
    .filter(Boolean);
}


function getCartTotal() {

  return getCartItems()
    .reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );
}


function getCartCount() {

  return getCartItems()
    .reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
}


/* =========================================================
   CART UI
   ========================================================= */

function updateCartUI() {

  const count =
    getCartCount();

  const total =
    getCartTotal();


  const countElement =
    $("#cartCount");

  if (countElement) {
    countElement.textContent =
      String(count);
  }


  const totalElement =
    $("#cartTotal");

  if (totalElement) {
    totalElement.textContent =
      `₹${formatMoney(total)}`;
  }


  renderCartItems();
}


function renderCartItems() {

  const container =
    $("#cartItems");

  if (!container) return;


  const items =
    getCartItems();


  if (items.length === 0) {

    container.innerHTML = `
      <div class="cart-empty">

        <div>
          🛒
        </div>

        <h3>
          Your cart is empty
        </h3>

        <p>
          Add some crackers to start your order.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(
        (item) => {

          const product =
            item.product;

          const subtotal =
            product.price *
            item.quantity;


          const image =
            product.image
              ? `
                <img
                  class="cart-item-image"
                  src="${escapeAttribute(product.image)}"
                  alt="${escapeAttribute(product.name)}"
                  loading="lazy"
                >
              `
              : `
                <div class="cart-item-image"></div>
              `;


          return `
            <div
              class="cart-item"
              data-product-id="${product.id}"
            >

              ${image}

              <div class="cart-item-info">

                <div class="cart-item-name">
                  ${escapeHTML(product.name)}
                </div>

                <div class="cart-item-price">
                  ₹${formatMoney(subtotal)}
                </div>


                <div class="cart-item-controls">

                  <button
                    type="button"
                    class="cart-minus"
                    data-product-id="${product.id}"
                  >
                    −
                  </button>

                  <span>
                    ${item.quantity}
                  </span>

                  <button
                    type="button"
                    class="cart-plus"
                    data-product-id="${product.id}"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    class="cart-remove"
                    data-product-id="${product.id}"
                    title="Remove"
                  >
                    ×
                  </button>

                </div>

              </div>

            </div>
          `;
        }
      )
      .join("");
}


/* =========================================================
   CART DRAWER
   ========================================================= */

function openCart() {

  const overlay =
    $("#cartOverlay");

  if (!overlay) return;

  overlay.hidden = false;

  document.body.classList.add(
    "modal-open"
  );
}


function closeCart() {

  const overlay =
    $("#cartOverlay");

  if (!overlay) return;

  overlay.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   WHATSAPP ORDER
   ========================================================= */

function orderViaWhatsApp() {

  const items =
    getCartItems();

  if (items.length === 0) {

    alert(
      "Your cart is empty."
    );

    return;
  }


  let message =
    "🎆 *TAMILANDA CRACKERS — DIWALI ORDER* 🎆\n\n";


  items.forEach(
    (item, index) => {

      const product =
        item.product;

      const subtotal =
        product.price *
        item.quantity;


      message +=
        `${index + 1}. ${product.name}\n`;

      message +=
        `   Qty: ${item.quantity}\n`;

      message +=
        `   Price: ₹${formatMoney(product.price)}\n`;

      message +=
        `   Subtotal: ₹${formatMoney(subtotal)}\n\n`;
    }
  );


  message +=
    `*Total: ₹${formatMoney(getCartTotal())}*\n\n`;

  message +=
    "Please confirm stock availability and order details. 🙏";


  const number =
    WHATSAPP_NUMBERS[0];


  const url =
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`;


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================================================
   REAL AI
   ========================================================= */

function openAI() {

  const overlay =
    $("#aiOverlay");

  if (!overlay) return;


  overlay.hidden = false;

  document.body.classList.add(
    "modal-open"
  );


  const input =
    $("#aiInput");

  if (input) {

    setTimeout(
      () => input.focus(),
      150
    );
  }
}


function closeAI() {

  const overlay =
    $("#aiOverlay");

  if (!overlay) return;


  overlay.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   AI MESSAGE
   ========================================================= */

async function sendAIMessage() {

  const input =
    $("#aiInput");

  const sendButton =
    $("#aiSendButton");


  if (!input) return;


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  if (message.length > 1000) {

    addAIMessage(
      "assistant",
      "Message romba long-ah irukku. Konjam short-ah sollunga 😊"
    );

    return;
  }


  input.value = "";

  addAIMessage(
    "user",
    message
  );


  aiConversation.push({
    role: "user",
    content: message
  });


  setAISendingState(
    true
  );


  const typingId =
    showAITyping();


  try {

    const apiBase =
      getAPIBase();


    const response =
      await fetch(
        `${apiBase}/api/ai/suggest`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            message,

            conversation:
              aiConversation.slice(-12),

            products:
              buildAIProductContext(),

            cart:
              getCartForAI()

          })
        }
      );


    removeAITyping(
      typingId
    );


    if (!response.ok) {

      let errorMessage =
        "AI request failed.";

      try {

        const errorData =
          await response.json();

        if (
          errorData &&
          errorData.error
        ) {
          errorMessage =
            errorData.error;
        }

      } catch (_) {
        /* Ignore invalid error JSON */
      }


      throw new Error(
        errorMessage
      );
    }


    const data =
      await response.json();


    handleAIResponse(
      data
    );


  } catch (error) {

    removeAITyping(
      typingId
    );


    console.error(
      "REAL AI error:",
      error
    );


    addAIMessage(
      "assistant",
      `AI connection-la problem irukku. ${escapeHTML(error.message || "Please try again.")}`
    );

  } finally {

    setAISendingState(
      false
    );
  }
}


/* =========================================================
   AI RESPONSE
   ========================================================= */

function handleAIResponse(
  data
) {

  if (!data) {

    addAIMessage(
      "assistant",
      "AI response empty-ah vandhirukku. Again try pannunga."
    );

    return;
  }


  if (
    data.type === "question"
  ) {

    const text =
      data.message ||
      data.question ||
      "Konjam more details sollunga 😊";


    aiConversation.push({
      role: "assistant",
      content: text
    });


    addAIMessage(
      "assistant",
      text
    );


    return;
  }


  if (
    data.type === "result"
  ) {

    lastAIResult =
      normalizeAIResult(
        data
      );


    const text =
      data.message ||
      data.summary ||
      buildDefaultAIResultMessage(
        lastAIResult
      );


    aiConversation.push({
      role: "assistant",
      content: text
    });


    addAIMessage(
      "assistant",
      text
    );


    addAIResultCard(
      lastAIResult
    );


    return;
  }


  /* Some backends may return result directly */

  if (
    Array.isArray(
      data.products
    ) ||
    Array.isArray(
      data.items
    ) ||
    Array.isArray(
      data.selection
    )
  ) {

    lastAIResult =
      normalizeAIResult(
        {
          ...data,
          type: "result"
        }
      );


    const text =
      data.message ||
      data.summary ||
      buildDefaultAIResultMessage(
        lastAIResult
      );


    aiConversation.push({
      role: "assistant",
      content: text
    });


    addAIMessage(
      "assistant",
      text
    );


    addAIResultCard(
      lastAIResult
    );

    return;
  }


  addAIMessage(
    "assistant",
    "AI response format puriyala. Please try again."
  );
}


/* =========================================================
   NORMALIZE AI RESULT
   ========================================================= */

function normalizeAIResult(
  data
) {

  const rawItems =
    Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.selection)
          ? data.selection
          : [];


  const items =
    rawItems
      .map(
        (item) => {

          const productId =
            Number(
              item.productId ??
              item.id ??
              item.product_id
            );


          const product =
            getProductById(
              productId
            );


          if (!product) {
            return null;
          }


          const quantity =
            Math.max(
              1,
              Math.min(
                99,
                Number(
                  item.quantity ??
                  item.qty ??
                  1
                )
              )
            );


          return {
            productId:
              product.id,

            quantity,

            reason:
              item.reason ||
              item.why ||
              "Recommended for your preference."
          };
        }
      )
      .filter(Boolean);


  const calculatedTotal =
    items.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );


  return {

    items,

    total:
      Number.isFinite(
        Number(data.total)
      )
        ? Number(data.total)
        : calculatedTotal,

    remaining:
      Number.isFinite(
        Number(data.remaining)
      )
        ? Number(data.remaining)
        : null,

    confidence:
      data.confidence ||
      null,

    profile:
      data.profile ||
      null,

    message:
      data.message ||
      data.summary ||
      ""
  };
}


/* =========================================================
   AI RESULT CARD
   ========================================================= */

function addAIResultCard(
  result
) {

  const chat =
    $("#aiChat");

  if (!chat) return;


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "ai-message assistant";


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    "✦";


  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";


  bubble.innerHTML =
    buildAIResultHTML(
      result
    );


  wrapper.appendChild(
    avatar
  );

  wrapper.appendChild(
    bubble
  );

  chat.appendChild(
    wrapper
  );


  scrollAIChatToBottom();
}


function buildAIResultHTML(
  result
) {

  const total =
    result.items.reduce(
      (sum, item) =>
        sum +
        item.product.price *
          item.quantity,
      0
    );


  const remaining =
    result.remaining !== null
      ? result.remaining
      : null;


  const profile =
    result.profile
      ? String(
          result.profile
        )
      : "Personalised selection";


  const confidence =
    result.confidence
      ? String(
          result.confidence
        )
      : "";


  const productsHTML =
    result.items
      .map(
        (item) => {

          const product =
            item.product;


          const subtotal =
            product.price *
            item.quantity;


          const image =
            product.image
              ? `
                <img
                  class="ai-result-product-image"
                  src="${escapeAttribute(product.image)}"
                  alt="${escapeAttribute(product.name)}"
                  loading="lazy"
                >
              `
              : `
                <div class="ai-result-product-image"></div>
              `;


          return `
            <div class="ai-result-product">

              ${image}

              <div class="ai-result-product-info">

                <div class="ai-result-product-name">
                  ${escapeHTML(product.name)}
                </div>

                <div class="ai-result-product-reason">
                  ${escapeHTML(item.reason)}
                </div>

              </div>


              <div class="ai-result-product-right">

                <div class="ai-result-product-qty">
                  ×${item.quantity}
                </div>

                <div class="ai-result-product-price">
                  ₹${formatMoney(subtotal)}
                </div>

              </div>

            </div>
          `;
        }
      )
      .join("");


  return `
    <div class="ai-result-card">

      <div class="ai-result-summary">

        <div class="ai-result-summary-top">

          <h3>
            Your AI Selection
          </h3>

          <div class="ai-result-total">
            ₹${formatMoney(total)}
          </div>

        </div>


        <div class="ai-result-meta">

          <span>
            ${escapeHTML(profile)}
          </span>

          ${
            remaining !== null
              ? `
                <span>
                  ₹${formatMoney(Math.max(0, remaining))} remaining
                </span>
              `
              : ""
          }

          ${
            confidence
              ? `
                <span>
                  Confidence: ${escapeHTML(confidence)}
                </span>
              `
              : ""
          }

        </div>

      </div>


      <div class="ai-result-products">

        ${productsHTML}

      </div>


      <div class="ai-result-actions">

        <button
          type="button"
          class="ai-add-plan"
        >
          🛒 Add This Plan
        </button>

        <button
          type="button"
          class="ai-change-plan"
        >
          ✨ Change Plan
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   ADD AI PLAN TO CART
   ========================================================= */

function addAIPlanToCart() {

  if (
    !lastAIResult ||
    !Array.isArray(
      lastAIResult.items
    )
  ) {

    return;
  }


  let addedCount = 0;


  lastAIResult.items
    .forEach(
      (item) => {

        const product =
          getProductById(
            item.productId
          );

        if (!product) {
          return;
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


        cart[product.id] =
          Math.min(
            99,
            Number(
              cart[product.id] || 0
            ) + quantity
          );


        addedCount += quantity;
      }
    );


  saveCart();

  updateCartUI();


  addAIMessage(
    "assistant",
    `Done! 🎆 ${addedCount} item${addedCount === 1 ? "" : "s"} AI plan cart-la add pannitten. Cart open panni order continue pannalaam.`
  );
}


/* =========================================================
   AI PRODUCT CONTEXT
   ========================================================= */

function buildAIProductContext() {

  /*
   * The browser sends a compact catalogue context.
   * The backend still validates IDs/prices from its own
   * products.json and remains the source of truth.
   */

  return PRODUCTS.map(
    (product) => ({

      id:
        product.id,

      name:
        product.name,

      category:
        product.category,

      pack:
        product.pack || "",

      price:
        product.price,

      mrp:
        product.mrp,

      tags:
        product.tags || [],

      audience:
        product.audience || []

    })
  );
}


function getCartForAI() {

  return getCartItems()
    .map(
      (item) => ({

        productId:
          item.product.id,

        name:
          item.product.name,

        quantity:
          item.quantity,

        price:
          item.product.price

      })
    );
}


/* =========================================================
   AI API BASE
   ========================================================= */

function getAPIBase() {

  const configured =
    window.TAMILANDA_API_BASE;


  if (
    typeof configured === "string"
  ) {

    return configured
      .trim()
      .replace(/\/+$/, "");
  }


  return "";
}


/* =========================================================
   AI UI HELPERS
   ========================================================= */

function addAIMessage(
  role,
  text
) {

  const chat =
    $("#aiChat");

  if (!chat) return;


  const message =
    document.createElement("div");

  message.className =
    `ai-message ${role}`;


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    role === "user"
      ? "You"
      : "✦";


  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";


  bubble.innerHTML =
    formatAIText(
      text
    );


  message.appendChild(
    avatar
  );

  message.appendChild(
    bubble
  );


  chat.appendChild(
    message
  );


  scrollAIChatToBottom();
}


function formatAIText(
  text
) {

  const safe =
    escapeHTML(
      String(text || "")
    );


  return safe
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    )
    .replace(
      /\n/g,
      "<br>"
    );
}


function showAITyping() {

  const chat =
    $("#aiChat");

  if (!chat) return null;


  const id =
    `ai-typing-${Date.now()}`;


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "ai-message assistant";

  wrapper.id =
    id;


  wrapper.innerHTML = `
    <div class="message-avatar">
      ✦
    </div>

    <div class="message-bubble">

      <div class="ai-typing">

        <span></span>
        <span></span>
        <span></span>

      </div>

    </div>
  `;


  chat.appendChild(
    wrapper
  );


  scrollAIChatToBottom();


  return id;
}


function removeAITyping(
  id
) {

  if (!id) return;


  const element =
    document.getElementById(
      id
    );


  if (element) {
    element.remove();
  }
}


function setAISendingState(
  sending
) {

  const button =
    $("#aiSendButton");

  const input =
    $("#aiInput");


  if (button) {

    button.disabled =
      sending;

    button.style.opacity =
      sending
        ? "0.55"
        : "1";
  }


  if (input) {

    input.disabled =
      sending;
  }
}


function scrollAIChatToBottom() {

  const chat =
    $("#aiChat");

  if (!chat) return;


  requestAnimationFrame(
    () => {

      chat.scrollTop =
        chat.scrollHeight;
    }
  );
}


/* =========================================================
   AI DEFAULT TEXT
   ========================================================= */

function buildDefaultAIResultMessage(
  result
) {

  if (
    !result ||
    !result.items ||
    result.items.length === 0
  ) {

    return "I couldn't build a selection from the current catalogue. Konjam budget/preferences change panni try pannunga.";
  }


  const total =
    result.items.reduce(
      (sum, item) =>
        sum +
        item.product.price *
          item.quantity,
      0
    );


  return (
    `Ungalukku ₹${formatMoney(total)}-ku ` +
    `${result.items.length} different products ` +
    `select pannirukken. கீழே details பாருங்க 😊`
  );
}


/* =========================================================
   CATALOGUE ERROR
   ========================================================= */

function showCatalogueError() {

  const grid =
    $("#productGrid");

  const resultCount =
    $("#resultCount");


  if (resultCount) {
    resultCount.textContent =
      "Catalogue unavailable";
  }


  if (grid) {

    grid.innerHTML = `
      <div class="catalog-loading">

        <div style="font-size:32px;">
          ⚠️
        </div>

        <p>
          Product catalogue load ஆகவில்லை.
          Please refresh the page.
        </p>

      </div>
    `;
  }
}


/* =========================================================
   PRODUCT HELPERS
   ========================================================= */

function getProductById(
  productId
) {

  const id =
    Number(productId);

  return PRODUCTS.find(
    (product) =>
      product.id === id
  ) || null;
}


/* =========================================================
   FEEDBACK
   ========================================================= */

function showAddedFeedback(
  productId
) {

  const buttons =
    $$(
      `.add-cart-button[data-product-id="${productId}"]`
    );


  buttons.forEach(
    (button) => {

      const original =
        button.innerHTML;


      button.classList.add(
        "added"
      );

      button.textContent =
        "✓ Added";


      setTimeout(
        () => {

          button.classList.remove(
            "added"
          );

          button.innerHTML =
            original;

        },
        1000
      );
    }
  );
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatMoney(
  value
) {

  const number =
    Number(value || 0);


  if (
    Number.isInteger(number)
  ) {

    return number.toLocaleString(
      "en-IN"
    );
  }


  return number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );
}


/* =========================================================
   SECURITY HELPERS
   ========================================================= */

function escapeHTML(
  value
) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );
}


/* =========================================================
   END
   ========================================================= */
