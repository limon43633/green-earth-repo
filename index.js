
    /* ====== API endpoints ====== */
    const API_ALL = "https://openapi.programming-hero.com/api/plants";
    const API_CATEGORIES = "https://openapi.programming-hero.com/api/categories";
    const API_BY_CAT = (id) => `https://openapi.programming-hero.com/api/category/${id}`;
    const API_DETAIL = (id) => `https://openapi.programming-hero.com/api/plant/${id}`;
    
    /* ====== DOM refs ====== */
    const categoryList = document.getElementById("category-list");
    const grid = document.getElementById("card-grid");
    const loader = document.getElementById("loader");
    const cartList = document.getElementById("cart-list");
    const cartTotalEl = document.getElementById("cart-total");
    const treeModal = document.getElementById("tree-modal");
    const modalBody = document.getElementById("modal-body");
    
    /* ====== State ====== */
    let activeCategoryId = "all";
    let cart = []; // {id, name, price}
    
    /* ====== Utils ====== */
    const showLoader = (v) => loader.classList.toggle("hidden", !v);
    const money = (n) => "৳" + Number(n || 0);
    
    /* ====== Category load & render ====== */
    async function loadCategories() {
  const res = await fetch(API_CATEGORIES);
  const data = await res.json();

  // “All Trees” first
  renderCategoryButton({ id: "all", category: "All Trees" }, true);

  (data?.categories || []).forEach((c) => {
    //  category_name 
    renderCategoryButton({ id: c.id, category: c.category_name });
  });

  // initial load
  loadPlants("all");
}

    
    function renderCategoryButton(cat, makeActive = false) {
      const btn = document.createElement("button");
      btn.className =
        "w-full btn btn-sm justify-start normal-case rounded-md";
      btn.dataset.id = cat.id;
      btn.textContent = cat.category;
    
      btn.addEventListener("click", () => {
        setActiveCategory(cat.id, btn);
        loadPlants(cat.id);
      });
    
      categoryList.appendChild(btn);
      if (makeActive) setActiveCategory(cat.id, btn);
    }
    
    function setActiveCategory(id, el) {
      activeCategoryId = id;
      // remove old active
      [...categoryList.children].forEach((b) =>
        b.classList.remove("btn-success", "text-white")
      );
      // set new active
      el.classList.add("btn-success", "text-white");
    }
    
    /* ====== Plants load & render ====== */
    async function loadPlants(categoryId = "all") {
      showLoader(true);
      grid.innerHTML = "";
    
      try {
        const url = categoryId === "all" ? API_ALL : API_BY_CAT(categoryId);
        const res = await fetch(url);
        const data = await res.json();
        const plants = data?.plants || data?.category?.plants || [];
    
        if (!plants.length) {
          grid.innerHTML =
            `<div class="col-span-full text-center text-gray-500">No trees found.</div>`;
        } else {
          plants.forEach(renderCard);
        }
      } catch (e) {
        grid.innerHTML =
          `<div class="col-span-full text-center text-error">Failed to load trees.</div>`;
      } finally {
        showLoader(false);
      }
    }
    
    function renderCard(item) {
      const { id, name, description, price, category, image } = item;
    
      const card = document.createElement("div");
      card.className = "card bg-white shadow rounded-xl";
    
      card.innerHTML = `
        <figure class="bg-gray-100 h-40 overflow-hidden rounded-t-xl">
          <img src="${image || ''}" alt="${name}" class="h-full w-full object-cover">
        </figure>
        <div class="card-body">
          <h3 class="font-semibold cursor-pointer hover:underline text-base" data-name="${id}">${name}</h3>
          <p class="text-sm text-gray-600 line-clamp-2">${description || ""}</p>
    
          <div class="flex items-center justify-between mt-2">
            <span class="badge badge-success badge-outline">${category || "Tree"}</span>
            <span class="font-semibold">${money(price)}</span>
          </div>
    
          <div class="card-actions mt-4">
            <button class="btn btn-success w-full" data-add="${id}">Add to Cart</button>
          </div>
        </div>
      `;
    
      // open modal on name click
      card.querySelector(`[data-name="${id}"]`).addEventListener("click", () => openDetails(id));
    
      // add to cart
      card.querySelector(`[data-add="${id}"]`).addEventListener("click", () => {
        addToCart({ id, name, price: Number(price) || 0 });
      });
    
      grid.appendChild(card);
    }
    
    /* ====== Modal (details) ====== */
    async function openDetails(id) {
      try {
        modalBody.innerHTML = `<div class="flex justify-center py-6"><span class="loading loading-spinner loading-lg"></span></div>`;
        treeModal.showModal();
    
        const res = await fetch(API_DETAIL(id));
        const data = await res.json();
        const p = data?.plant || {};
    
        modalBody.innerHTML = `
          <div class="grid md:grid-cols-2 gap-5">
            <img src="${p.image || ''}" alt="${p.name}" class="w-full h-64 object-cover rounded-xl bg-gray-100"/>
            <div>
              <h3 class="text-2xl font-semibold mb-2">${p.name || ""}</h3>
              <p class="text-sm text-gray-600 mb-3">${p.description || ""}</p>
              <div class="space-y-2 text-sm">
                <div><span class="font-semibold">Category:</span> ${p.category || "-"}</div>
                <div><span class="font-semibold">Price:</span> ${money(p.price)}</div>
                ${p.origin ? `<div><span class="font-semibold">Origin:</span> ${p.origin}</div>` : ""}
                ${p.climate ? `<div><span class="font-semibold">Climate:</span> ${p.climate}</div>` : ""}
              </div>
              <button class="btn btn-success mt-4" id="modal-add">Add to Cart</button>
            </div>
          </div>
        `;
    
        document.getElementById("modal-add")?.addEventListener("click", () => {
          addToCart({ id: p.id, name: p.name, price: Number(p.price) || 0 });
        });
      } catch {
        modalBody.innerHTML = `<p class="text-error">Failed to load details.</p>`;
      }
    }
    
    /* ====== Cart ====== */
    function addToCart(item) {
      // push as individual line-items (same as sample UI x1 each)
      cart.push(item);
      renderCart();
    }
    
    function removeFromCart(index) {
      cart.splice(index, 1);
      renderCart();
    }
    
    function renderCart() {
      cartList.innerHTML = "";
      let total = 0;
    
      cart.forEach((it, idx) => {
        total += it.price;
        const li = document.createElement("li");
        li.className = "flex items-center justify-between bg-green-50 rounded-lg px-3 py-2";
        li.innerHTML = `
          <div class="text-sm">
            <div class="font-medium">${it.name}</div>
            <div class="opacity-70">${money(it.price)} × 1</div>
          </div>
          <button class="btn btn-xs btn-ghost" aria-label="remove">✕</button>
        `;
        li.querySelector("button").addEventListener("click", () => removeFromCart(idx));
        cartList.appendChild(li);
      });
    
      cartTotalEl.textContent = money(total);
    }
    
    /* ====== Init ====== */
    document.addEventListener("DOMContentLoaded", () => {
      loadCategories();
    });
    