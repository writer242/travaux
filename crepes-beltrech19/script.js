// ---------- Utilitaires ----------
const fmtCFA = (n) => `${Number(n).toLocaleString('fr-FR')} CFA`;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// ---------- Éléments ----------
const cartEl = $('#cart');
const cartItemsEl = $('#cartItems');
const cartTotalEl = $('#cartTotal');
const closeCartBtn = $('#closeCart');
const cartToggleBtn = $('#cartToggle');
const toast = $('#toast');
const timeSelect = $('#time');
const checkoutBtn = $('#checkoutBtn');
const mobileBtn = $('#mobileBtn');
const navLinks = $('#navLinks');
const themeToggle = $('#themeToggle');
const installButtonMobile = $('#install-button-mobile');
const installContainer = $('#install-container');
const splashScreen = $('#splash-screen');
const deliveryCheck = $('#deliveryCheck');
const deliveryAddress = $('#deliveryAddress');

// ---------- État ----------
let cart = JSON.parse(localStorage.getItem('belt_cart') || '[]');
let deferredPrompt = null;

// ---------- Gestion du thème ----------
function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('belt_theme', mode);

    // Mettre à jour l'icône du bouton de thème
    const icon = $('i', themeToggle);
    if (icon) {
        icon.className = mode === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
}

function loadTheme() {
    const saved = localStorage.getItem('belt_theme') || 'light';
    setTheme(saved);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(current === 'light' ? 'dark' : 'light');
    });
}

// ---------- Animation de démarrage ----------
function setupSplashScreen() {
    if (!splashScreen) return;

    // Bloquer le scroll pendant l'affichage
    document.body.style.overflow = 'hidden';

    // S'assurer que l'élément est visible au départ
    splashScreen.style.display = 'flex';
    splashScreen.style.opacity = '1';

    // Force un reflow pour fiabiliser la transition
    // (utile si le style initial vient d'être appliqué)
    // eslint-disable-next-line no-unused-expressions
    splashScreen.offsetHeight;

    // Après 3s, lancer le fade-out
    setTimeout(() => {
        splashScreen.style.opacity = '0';

        const finish = () => {
            splashScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        // Fin normale via l'événement de transition
        splashScreen.addEventListener('transitionend', finish, { once: true });

        // ✅ Fallback si aucune transition n'est détectée (CSS manquant, etc.)
        setTimeout(() => {
            if (getComputedStyle(splashScreen).display !== 'none') finish();
        }, 1200);
    }, 3000);
}

// ---------- Génération des options d'heure ----------
function generateTimeOptions() {
    if (!timeSelect) {
        console.error("Element timeSelect non trouvé");
        return;
    }

    // Vider le select
    timeSelect.innerHTML = '';

    // Option par défaut
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choisir une heure';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    timeSelect.appendChild(defaultOption);

    // 08:00 → 19:55 par pas de 5 minutes
    for (let h = 8; h <= 19; h++) {
        for (let m = 0; m < 60; m += 5) {
            const hour = h.toString().padStart(2, '0');
            const min = m.toString().padStart(2, '0');
            const value = `${hour}:${min}`;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            timeSelect.appendChild(option);
        }
    }

    console.log("Options d'heure générées avec succès");
}

// ---------- Toast ----------
function showToast(msg = 'Produit ajouté au panier') {
    if (!toast) return;

    toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
}

// ---------- Gestion du panier ----------
function renderCart() {
    if (!cartItemsEl || !cartTotalEl) return;

    if (!cart.length) {
        cartItemsEl.className = 'empty';
        cartItemsEl.innerHTML = 'Votre panier est vide';
        cartTotalEl.textContent = fmtCFA(0);
        return;
    }

    cartItemsEl.className = '';
    cartItemsEl.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img src="${item.img}" alt="${item.name}">
          <div>
            <div class="ci-title">${item.name}</div>
            <div class="ci-meta">${item.qty} × ${fmtCFA(item.price)}</div>
            <div class="ci-actions" data-id="${item.id}">
              <button class="qty-btn minus">−</button>
              <button class="qty-btn plus">+</button>
              <button class="remove">Retirer</button>
            </div>
          </div>
          <div><strong>${fmtCFA(item.price * item.qty)}</strong></div>
        `;
        cartItemsEl.appendChild(row);
    });

    cartTotalEl.textContent = fmtCFA(total);
    localStorage.setItem('belt_cart', JSON.stringify(cart));
}

// ---------- Gestion de la livraison ----------
if (deliveryCheck && deliveryAddress) {
    deliveryCheck.addEventListener('change', () => {
        deliveryAddress.style.display = deliveryCheck.checked ? 'block' : 'none';
        if (!deliveryCheck.checked) deliveryAddress.value = '';
    });
}

// ---------- Ouvrir/Fermer panier ----------
function openCart() {
    if (cartEl) cartEl.classList.add('open');
}

function closeCart() {
    if (cartEl) cartEl.classList.remove('open');
}

if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCart);
}

if (cartToggleBtn) {
    cartToggleBtn.addEventListener('click', () => {
        if (cartEl) cartEl.classList.toggle('open');
    });
}

// Fab panier visible seulement <992px
function syncCartFab() {
    if (!cartToggleBtn) return;

    const showFab = window.innerWidth <= 992;
    cartToggleBtn.style.display = showFab ? 'flex' : 'none';
}

// ---------- Menu mobile ----------
if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => navLinks.classList.toggle('show'));
}

$$('#navLinks a').forEach(a => {
    a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id && id.startsWith('#')) {
            e.preventDefault();
            if (navLinks) navLinks.classList.remove('show');
            const target = document.querySelector(id);
            if (target) {
                const y = target.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    });
});

// ---------- Actions panier ----------
if (cartItemsEl) {
    cartItemsEl.addEventListener('click', (e) => {
        const wrap = e.target.closest('.ci-actions');
        if (!wrap) return;
        const id = wrap.dataset.id;
        const item = cart.find(i => i.id === id);
        if (!item) return;

        if (e.target.classList.contains('minus')) {
            item.qty = Math.max(1, item.qty - 1);
        } else if (e.target.classList.contains('plus')) {
            item.qty += 1;
        } else if (e.target.classList.contains('remove')) {
            cart = cart.filter(i => i.id !== id);
        }
        renderCart();
    });
}

// ---------- Ajouter au panier ----------
function addToCart({ id, name, price, img, qty }) {
    const exist = cart.find(i => i.id === id);
    if (exist) {
        exist.qty += qty;
    } else {
        cart.push({ id, name, price: Number(price), img, qty: Number(qty) });
    }
    renderCart();
    showToast();
}

$$('.card').forEach(card => {
    const minus = $('.minus', card);
    const plus = $('.plus', card);
    const input = $('input[type="number"]', card);
    const addBtn = $('.add', card);

    if (minus && input) {
        minus.addEventListener('click', () => input.value = Math.max(1, Number(input.value) - 1));
    }

    if (plus && input) {
        plus.addEventListener('click', () => input.value = Number(input.value) + 1);
    }

    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            addToCart({
                id: addBtn.dataset.id,
                name: addBtn.dataset.name,
                price: addBtn.dataset.price,
                img: addBtn.dataset.img,
                qty: Number(input.value || 1)
            });
        });
    }
});

// ---------- Validation commande ----------
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        const name = $('#name')?.value.trim();
        const phone = $('#phone')?.value.trim();
        const date = $('#date')?.value;
        const time = $('#time')?.value;
        const deliveryChecked = deliveryCheck?.checked;
        const deliveryAddr = deliveryAddress?.value.trim();

        if (!cart.length) {
            alert('Votre panier est vide.');
            return;
        }
        if (!name || !phone || !date || !time) {
            alert('Veuillez compléter le formulaire.');
            return;
        }
        if (deliveryChecked && !deliveryAddr) {
            alert('Veuillez saisir une adresse de livraison.');
            return;
        }

        const recap = cart.map(i => `• ${i.qty} × ${i.name} (${fmtCFA(i.price * i.qty)})`).join('%0A');
        const total = cartTotalEl?.textContent || '0 CFA';

        let msg =
            `Commande%20Beltrech19%0A` +
            `Nom:%20${encodeURIComponent(name)}%0A` +
            `Téléphone:%20${encodeURIComponent(phone)}%0A` +
            `Retrait:%20${encodeURIComponent(date)}%20à%20${encodeURIComponent(time)}%0A`;

        if (deliveryChecked && deliveryAddr) {
            msg += `Lieu%20de%20livraison:%20${encodeURIComponent(deliveryAddr)}%0A`;
        }

        msg += `%0AArticles:%0A${recap}%0A%0A` +
            `Total:%20${encodeURIComponent(total)}%0A` +
            `Merci%20!`;

        const phoneWhats = '242069737400';
        const url = `https://wa.me/${phoneWhats}?text=${msg}`;
        window.open(url, '_blank');

        cart = [];
        renderCart();
        closeCart();
    });
}

// ---------- Animation compteurs ----------
function animateCounters() {
    const counters = document.querySelectorAll(".kpi strong");
    
    if (counters.length === 0) {
        console.log("Aucun compteur trouvé");
        return;
    }

    counters.forEach(counter => {
        const targetText = counter.textContent.trim();
        let targetValue, isPercent, isMinutes, isPlus, isRating;

        if (targetText.includes("%")) {
            targetValue = parseFloat(targetText);
            isPercent = true;
        } else if (targetText.includes("min")) {
            targetValue = parseFloat(targetText);
            isMinutes = true;
        } else if (targetText.startsWith("+")) {
            targetValue = parseFloat(targetText.substring(1));
            isPlus = true;
        } else if (targetText.includes("/")) {
            targetValue = parseFloat(targetText);
            isRating = true;
        } else {
            targetValue = parseFloat(targetText);
        }

        // Reset à 0
        if (isPercent) {
            counter.textContent = "0%";
        } else if (isMinutes) {
            counter.textContent = "0 min";
        } else if (isPlus) {
            counter.textContent = "+0";
        } else if (isRating) {
            counter.textContent = "0.0/5";
        } else {
            counter.textContent = "0";
        }

        const duration = 2000;
        const steps = 100;
        const increment = targetValue / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                current = targetValue;
                clearInterval(timer);
            }

            if (isPercent) {
                counter.textContent = Math.round(current) + "%";
            } else if (isMinutes) {
                counter.textContent = Math.round(current) + " min";
            } else if (isPlus) {
                counter.textContent = "+" + Math.round(current);
            } else if (isRating) {
                counter.textContent = current.toFixed(1) + "/5";
            } else {
                counter.textContent = Math.round(current);
            }
        }, duration / steps);
    });
}

// ---------- Service Worker ----------
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker enregistré', reg))
                .catch(err => console.log('Erreur Service Worker', err));
        });
    }
}

// ---------- Installation PWA ----------
function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installContainer) installContainer.style.display = 'block';
        console.log('beforeinstallprompt fired - l\'app peut être installée');
    });

    function installApp() {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('L\'utilisateur a accepté l\'installation');
            } else {
                console.log('L\'utilisateur a refusé l\'installation');
            }
            deferredPrompt = null;
            if (installContainer) installContainer.style.display = 'none';
        });
    }

    if (installButtonMobile) {
        installButtonMobile.addEventListener('click', installApp);
    }

    window.addEventListener('appinstalled', () => {
        console.log('L\'application a été installée avec succès');
        if (installContainer) installContainer.style.display = 'none';
        deferredPrompt = null;
    });
}

// ---------- Initialisation ----------
function init() {
    loadTheme();
    generateTimeOptions();
    renderCart();
    syncCartFab();
    window.addEventListener('resize', syncCartFab);
    registerServiceWorker();
    setupPWAInstall();
    setupSplashScreen();

    // Démarrer les animations après le splash (~3.2s)
    setTimeout(animateCounters, 3200);
}

// Démarrer l'application
document.addEventListener("DOMContentLoaded", init);
