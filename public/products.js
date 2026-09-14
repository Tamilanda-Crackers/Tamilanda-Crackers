/* =========================================================
   TAMILANDA CRACKERS
   Product Catalogue Loader
   ========================================================= */

(function () {
  "use strict";

  window.TAMILANDA_PRODUCTS = [];
  window.TAMILANDA_PRODUCTS_READY = false;

  window.TAMILANDA_PRODUCTS_PROMISE = fetch("/products.json", {
    method: "GET",
    cache: "no-cache"
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          "Unable to load product catalogue: HTTP " +
            response.status
        );
      }

      return response.json();
    })
    .then(function (products) {
      if (!Array.isArray(products)) {
        throw new Error("Product catalogue format is invalid.");
      }

      /*
       * Basic client-side validation.
       * The server remains the source of truth for AI recommendations.
       */
      var validProducts = products.filter(function (product) {
        return (
          product &&
          Number.isInteger(Number(product.id)) &&
          typeof product.name === "string" &&
          typeof product.category === "string" &&
          Number.isFinite(Number(product.price)) &&
          Number(product.price) >= 0
        );
      });

      window.TAMILANDA_PRODUCTS = validProducts;
      window.TAMILANDA_PRODUCTS_READY = true;

      /*
       * Backward compatibility:
       * Existing frontend code can use PRODUCTS directly.
       */
      window.PRODUCTS = validProducts;

      return validProducts;
    })
    .catch(function (error) {
      console.error(
        "Tamilanda product catalogue failed to load:",
        error
      );

      window.TAMILANDA_PRODUCTS = [];
      window.PRODUCTS = [];
      window.TAMILANDA_PRODUCTS_READY = false;

      throw error;
    });
})();
