/* =========================================================
   TAMILANDA CRACKERS
   Product Catalogue Loader
   ========================================================= */

(function () {
  "use strict";

  window.TAMILANDA_PRODUCTS = [];
  window.TAMILANDA_PRODUCTS_READY = false;

  /*
   * products.json is stored at the server root.
   * Load it through the server API.
   */
  window.TAMILANDA_PRODUCTS_PROMISE = fetch("/api/products", {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
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
        throw new Error(
          "Product catalogue format is invalid."
        );
      }

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

      if (!validProducts.length) {
        throw new Error(
          "Product catalogue is empty."
        );
      }

      window.TAMILANDA_PRODUCTS = validProducts;
      window.TAMILANDA_PRODUCTS_READY = true;

      /*
       * Backward compatibility.
       * Existing app.js code can use PRODUCTS.
       */
      window.PRODUCTS = validProducts;

      console.info(
        "Tamilanda product catalogue loaded:",
        validProducts.length,
        "products"
      );

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
