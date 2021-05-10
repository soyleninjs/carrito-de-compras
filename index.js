// Api para el buscador
// http://www.omdbapi.com/?apikey=373e9458&s=guardians

// Api para un item concreto
// http://www.omdbapi.com/?apikey=373e9458&i=tt2015381

/* ============================================================================
  Variables
============================================================================== */

const apiKey = "373e9458";
window.cart = JSON.parse(window.localStorage.getItem("cart")) ?? [];
let search;
let totalPagesSearch = 1;
let page = 1;

// Templates
const fragment = document.createDocumentFragment();
const templateMovieCard = document.getElementById("template-movie-card")
  .content;
const templateMoviePopup = document.getElementById("template-movie-pop-up")
  .content;
const templateMessageError = document.getElementById("template-message-error")
  .content;
const templateCartItem = document.getElementById("template-cart-item").content;
const templateLoader = document.getElementById("template-loader").content;

// Containers
const cartProductsContainer = document.getElementById("cart-products");
const messageError = document.getElementById("message-error");
const moviesGrid = document.getElementById("movies-grid");
const searchContainer = document.getElementById("movies-search");
const searchForm = searchContainer.querySelector(".searchbar-form");
const searchInput = searchContainer.querySelector("#searchbar-input");
const searchButton = searchContainer.querySelector(".searchbar-button");

/* ============================================================================
  Init
============================================================================== */

// Load all System
document.addEventListener("DOMContentLoaded", () => {
  configFormSearch();
  configCartSystem();
  updateCartCount();
  getDataSearch("iron man", 1);
});

/* ============================================================================
  Utils
============================================================================== */

const updateCartCount = () => {
  const headerIconCount = document.querySelector(
    ".header-icon-cart-count-number"
  );
  let totalItems = 0;
  window.cart?.forEach((item, index) => {
    totalItems += item.quantity;
  });

  headerIconCount.textContent = totalItems;
};

const updateCartItems = () => {
  window.localStorage.setItem("cart", JSON.stringify(window.cart));
  updateCartCount();
};

// function called fo get result for a title search
const getDataSearch = async (title, showPage) => {
  search = title?.trim().replace(" ", "+").toLowerCase() ?? "Iron+man";
  const result = await window.fetch(
    `http://www.omdbapi.com/?apikey=${apiKey}&s=${search}&page=${showPage}`
  );

  if (result.status === 200) {
    return result.json();
  }

  throw new Error(
    `Fallo la petición!, el resultado regreso: ${result.status} ${result.statusText}`
  );
};

// function called fo get movie data pop up
const getDataMovie = async (idMovie) => {
  const result = await window.fetch(
    `http://www.omdbapi.com/?apikey=${apiKey}&i=${idMovie}`
  );

  if (result.status === 200) {
    return result.json();
  }

  throw new Error(
    `Fallo la petición!, el resultado regreso: ${result.status} ${result.statusText}`
  );
};

// remove contents of containers
const cleanContainers = () => {
  messageError.innerHTML = "";
  moviesGrid.innerHTML = "";
};

// function called for scroll for load more results
const infiniteScroll = () => {
  let lastMoviesRendered = true;

  const initScroll = () => {
    const scroll = window.scrollY;
    const documentHeight = document.body.getBoundingClientRect().height;
    const windowHeight = window.innerHeight;

    if (scroll >= documentHeight - windowHeight - 20) {
      if (page <= totalPagesSearch) {
        if (lastMoviesRendered) {
          lastMoviesRendered = false;
          renderLoader();
          getDataSearch(search, page).then((json) => {
            page++;
            renderResultsMovieCards(json.Search, false);
            removeLoader();

            lastMoviesRendered = true;
          });
        }
      }
    }
  };

  window.removeEventListener("scroll", initScroll);
  window.addEventListener("scroll", initScroll);
};

const closestParent = (element, classParent) => {
  let parent = element.parentNode;
  let parentWasFound = false;

  while (!parentWasFound) {
    if (parent.classList.contains(classParent)) {
      parentWasFound = true;
    } else {
      parent = parent.parentNode;
    }
  }

  return parent;
};

/* ============================================================================
  CONFIGS
============================================================================== */

// config Search bar
const configFormSearch = () => {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 1;

    getDataSearch(searchInput.value, page).then((json) => {
      if (json.Response === "True") {
        renderResultsMovieCards(json.Search, true);
        totalPagesSearch = Math.ceil(Number(json.totalResults) / 10);
        page++;
      } else {
        if (searchInput.value === "") {
          renderMessageError("Put a name of movie!");
        } else {
          renderMessageError(json.Error);
        }
      }
    });
  });
};

const configCartSystem = () => {
  // Constanates
  const cartContainer = document.getElementById("cart");
  const cartBtnClose = document.querySelectorAll("[data-btn-close-cart]");
  const headerCartButton = document.querySelector("[data-btn-open-cart]");
  const body = document.body;

  window.openCart = () => {
    cartContainer.classList.add("cart-is-visible");
    body.classList.add("remove-scroll");
  };

  window.closeCart = () => {
    body.classList.remove("remove-scroll");
    cartContainer.classList.add("cart-is-hidden");

    window.setTimeout(() => {
      cartContainer.classList.remove("cart-is-visible", "cart-is-hidden");
    }, 600);
  };

  window.addLoadingMinicart = () => {
    cartContainer.classList.add("loading-cart");
  };

  window.removeLoadingMinicart = () => {
    cartContainer.classList.remove("loading-cart");
  };

  // Buttons Header Open Minicart
  headerCartButton.addEventListener("click", window.openCart);

  // Buttons Close Minicart
  cartBtnClose.forEach((element) => {
    element.addEventListener("click", window.closeCart);
  });

  renderCartItems();
};

const configButtonsAddToCart = () => {
  const btnsAddToCart = document.querySelectorAll("[data-btn-add-to-cart]");

  btnsAddToCart.forEach((btn) => {
    const movieCard = closestParent(btn, "movie-card");

    if (!JSON.parse(movieCard.getAttribute("data-is-ready-btn-add-to-cart"))) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();

        // get data
        const movieId = movieCard.dataset.id;
        const movieTitle = movieCard.querySelector(".movie-card-info-title")
          .textContent;
        const moviePoster = movieCard
          .querySelector(".movie-card-image")
          .getAttribute("src");

        // set item cart data
        const itemCart = {
          movieId,
          movieTitle,
          moviePoster,
          quantity: 1,
        };

        // check if exist item in cart
        let isInCart = false;
        let isInCartIndex = 0;
        window.cart.every((item, index) => {
          if (item.movieId === movieId) {
            isInCart = true;
            isInCartIndex = index;
            return false;
          }
          return true;
        });

        // conditional for update item in cart or add
        if (isInCart) {
          window.cart[isInCartIndex].quantity += 1;
        } else {
          window.cart = [...window.cart, itemCart];
        }

        // set animation of added to cart in button
        this.classList.add("isAdd");
        window.setTimeout(() => {
          this.classList.remove("isAdd");
        }, 3000);

        // render and open cart
        updateCartItems();
        renderCartItems();
        // window.openCart();
      });

      movieCard.setAttribute("data-is-ready-btn-add-to-cart", true);
    }
  });
};

const configCardPopup = () => {
  const moviesCards = document.querySelectorAll(".movie-card");

  moviesCards.forEach((card) => {
    if (!JSON.parse(card.getAttribute("data-is-ready-pop-up"))) {
      card.addEventListener("click", function () {
        const movieCardId = this.dataset.id;

        getDataMovie(movieCardId).then((json) => {
          renderMoviePopup(json);
        });
      });
      card.setAttribute("data-is-ready-pop-up", true);
    }
  });
};

const configMoviePopupButtonAddToCart = () => {
  const btnAddToCart = document.querySelector(".movie-pop-up-info-btn");

  btnAddToCart.addEventListener("click", function (event) {
    event.stopPropagation();

    // get data
    const moviePopupCard = closestParent(this, "movie-pop-up-card");
    const movieId = moviePopupCard.dataset.id;
    const movieTitle = moviePopupCard.querySelector(".movie-pop-up-info-title")
      .textContent;
    const moviePoster = moviePopupCard
      .querySelector(".movie-pop-up-info-image")
      .getAttribute("src");

    // set item cart data
    const itemCart = {
      movieId,
      movieTitle,
      moviePoster,
      quantity: 1,
    };

    // check if exist item in cart
    let isInCart = false;
    let isInCartIndex = 0;
    window.cart.every((item, index) => {
      if (item.movieId === movieId) {
        isInCart = true;
        isInCartIndex = index;
        return false;
      }
      return true;
    });

    // conditional for update item in cart or add
    if (isInCart) {
      window.cart[isInCartIndex].quantity += 1;
    } else {
      window.cart = [...window.cart, itemCart];
    }

    // set animation of added to cart in button
    this.classList.add("isAdd");
    window.setTimeout(() => {
      this.classList.remove("isAdd");
    }, 3000);

    // render and open cart
    updateCartItems();
    renderCartItems();
    // window.openCart();
  });
};

const configCloseCardPopup = () => {
  const cardPopup = moviesGrid.querySelector(".movie-pop-up-card");
  const maskPopup = cardPopup.querySelector(".mask");

  maskPopup.addEventListener("click", () => {
    document.body.classList.remove("remove-scroll");
    cardPopup.parentNode.removeChild(cardPopup);
  });
};

const configBtnsDeleteItemsCart = () => {
  const btnsDeleteItemCart = document.querySelectorAll(
    "[data-delete-item-cart]"
  );

  btnsDeleteItemCart.forEach((btn) => {
    btn.addEventListener("click", function () {
      // get index of element in cart
      const itemCart = this.parentNode;
      const itemCartIndex = itemCart.dataset.index;

      // set animation of delete from cart
      itemCart.classList.add("cart-item-is-removing");

      window.setTimeout(() => {
        // Delete elemen from cart
        window.cart.splice(itemCartIndex, 1);

        // render and open cart
        updateCartItems();
        renderCartItems();
      }, 600);
    });
  });
};

const configQuantityButtonsItemCart = () => {
  const inputsQuantityItemCart = document.querySelectorAll(
    ".cart-item-info-quantity-input"
  );

  inputsQuantityItemCart.forEach((input) => {
    const itemCart = input.parentNode.parentNode.parentNode.parentNode;
    const itemCartIndex = itemCart.dataset.index;

    const minusButton = input.previousElementSibling;
    const plusButton = input.nextElementSibling;

    minusButton.addEventListener("click", () => {
      const $valorActual = input.value;
      if (+$valorActual > 1) {
        input.stepDown();
        window.cart[itemCartIndex].quantity -= 1;
        updateCartItems();
      }
    });

    plusButton.addEventListener("click", () => {
      input.stepUp();
      window.cart[itemCartIndex].quantity += 1;
      updateCartItems();
    });

    input.addEventListener("change", function () {
      window.cart[itemCartIndex].quantity = Number(this.value);
      updateCartItems();
    });

    input.addEventListener("blur", function () {
      if (this.value === "" || this.value === "0") {
        this.value = 1;
        window.cart[itemCartIndex].quantity = 1;
      } else {
        window.cart[itemCartIndex].quantity = Number(this.value);
      }
      updateCartItems();
    });
  });
};

/* ============================================================================
  RENDERS 
============================================================================== */

// function called for render all results in dom
const renderResultsMovieCards = (movies, newSearch = false) => {
  // contruct card
  movies.forEach((movie) => {
    templateMovieCard
      .querySelector(".movie-card")
      .setAttribute("data-id", movie.imdbID);

    templateMovieCard
      .querySelector(".movie-card")
      .setAttribute("data-is-ready-pop-up", false);

    templateMovieCard
      .querySelector(".movie-card")
      .setAttribute("data-is-ready-btn-add-to-cart", false);

    templateMovieCard.querySelector(".movie-card-info-title").textContent =
      movie.Title;
    templateMovieCard.querySelector(".movie-card-info-type").textContent =
      movie.Type;
    templateMovieCard.querySelector(".movie-card-info-year").textContent =
      movie.Year;

    if (movie.Poster === "N/A") {
      templateMovieCard
        .querySelector(".movie-card")
        .classList.add("movie-card-without-image");

      templateMovieCard
        .querySelector(".movie-card-image")
        .removeAttribute("src");
    } else {
      templateMovieCard
        .querySelector(".movie-card")
        .classList.remove("movie-card-without-image");
      templateMovieCard
        .querySelector(".movie-card-image")
        .setAttribute("src", movie.Poster);
    }

    const clone = templateMovieCard.cloneNode(true);
    fragment.append(clone);
  });

  // push to dom
  if (newSearch) {
    cleanContainers();
  }
  moviesGrid.append(fragment);
  configButtonsAddToCart();
  configCardPopup();
};

// Render Movie PopUp
const renderMoviePopup = (movie) => {
  templateMoviePopup
    .querySelector(".movie-pop-up-card")
    .setAttribute("data-id", movie.imdbID);
  templateMoviePopup
    .querySelector(".movie-pop-up-background-image")
    .setAttribute("src", movie.Poster);
  templateMoviePopup
    .querySelector(".movie-pop-up-info-image")
    .setAttribute("src", movie.Poster);
  templateMoviePopup.querySelector(".movie-pop-up-info-title").textContent =
    movie.Title;
  templateMoviePopup.querySelector(".movie-pop-up-info-year").textContent =
    movie.Year;
  templateMoviePopup.querySelector(".movie-pop-up-info-released").textContent =
    movie.Released;
  templateMoviePopup.querySelector(".movie-pop-up-info-runtime").textContent =
    movie.Runtime;
  templateMoviePopup.querySelector(".movie-pop-up-info-genre").textContent =
    movie.Genre;
  templateMoviePopup.querySelector(".movie-pop-up-info-director").textContent =
    movie.Director;
  templateMoviePopup.querySelector(".movie-pop-up-info-writer").textContent =
    movie.Writer;
  templateMoviePopup.querySelector(".movie-pop-up-info-actors").textContent =
    movie.Actors;
  templateMoviePopup.querySelector(".movie-pop-up-info-language").textContent =
    movie.Language;
  templateMoviePopup.querySelector(".movie-pop-up-info-plot").textContent =
    movie.Plot;
  templateMoviePopup.querySelector(".movie-pop-up-info-type").textContent =
    movie.Type;

  if (isNaN(Number(movie.Metascore) / 10)) {
    templateMoviePopup.querySelector(
      ".movie-pop-up-info-metascore"
    ).textContent = "No Calificada";
  } else {
    templateMoviePopup.querySelector(
      ".movie-pop-up-info-metascore"
    ).textContent = Number(movie.Metascore) / 10;
  }

  const clone = templateMoviePopup.cloneNode(true);
  fragment.append(clone);

  moviesGrid.append(fragment);
  document.body.classList.add("remove-scroll");
  configCloseCardPopup();
  configMoviePopupButtonAddToCart();
};

// render message with an error
const renderMessageError = (message) => {
  templateMessageError.querySelector(
    ".message-error-text"
  ).textContent = message;

  const clone = templateMessageError.cloneNode(true);
  fragment.append(clone);

  // push to dom
  cleanContainers();
  messageError.append(fragment);
};

// function called for render all cart items
const renderCartItems = () => {
  // contruct item cart
  if (window.cart.length == 0) {
    const templateNoProducts = `
      <div class="cart-no-products">
        <p class="cart-no-products-message">Carrito Vacio</p>
      </div> 
    `;
    cartProductsContainer.innerHTML = templateNoProducts;
  } else {
    window.cart.forEach((item, index) => {
      templateCartItem.querySelector(".cart-item-info-title").textContent =
        item.movieTitle;
      templateCartItem.querySelector(".cart-item-info-quantity-input").value =
        item.quantity;
      templateCartItem
        .querySelector(".cart-item")
        .setAttribute("data-id", item.movieId);
      templateCartItem
        .querySelector(".cart-item")
        .setAttribute("data-index", index);

      if (item.moviePoster) {
        templateCartItem
          .querySelector(".cart-item-image")
          .setAttribute("src", item.moviePoster);
      } else {
        templateCartItem
          .querySelector(".cart-item-image")
          .removeAttribute("src");
      }

      const clone = templateCartItem.cloneNode(true);
      fragment.append(clone);
    });

    // push to dom
    cartProductsContainer.innerHTML = "";
    cartProductsContainer.append(fragment);
    configBtnsDeleteItemsCart();
    configQuantityButtonsItemCart();
    infiniteScroll();
  }
};

const renderLoader = () => {
  const clone = templateLoader.cloneNode(true);
  fragment.append(clone);

  moviesGrid.append(fragment);
};

const removeLoader = () => {
  const loaderElement = moviesGrid.querySelector(".loader-component");
  loaderElement.parentNode.removeChild(loaderElement);
};
