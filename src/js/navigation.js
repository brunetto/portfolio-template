window.addEventListener("DOMContentLoaded", () => {
    /* HERO RANDOMICO:
    carico tutte le immagini dalla cartella "photos/hero" e ne scelgo una a caso da mostrare come sfondo del hero.
    per evitare di mostrare sempre la stessa immagine, salvo l'ultima scelta in sessionStorage e la escludo dalle 
    scelte successive finché non vengono mostrate tutte le altre. */
    function randomHero() {
        const hero = document.getElementById("hero");
        if (!hero) return;

        const images = window.heroImages || [];
        if (!images.length) return;


        let last = sessionStorage.getItem("lastHero");
        let next;

        do {
            next = images[Math.floor(Math.random() * images.length)];
        } while (images.length > 1 && next === last);

        sessionStorage.setItem("lastHero", next);
        hero.style.backgroundImage = `url(${next})`;
    }

    randomHero();

    /* SCROLL HINT:
    aggiungo un hint per invitare l'utente a scrollare, 
    che scompare quando si scrolla oltre i 100px */
    const scrollHint = document.getElementById("scroll-hint");

    if (scrollHint) {
        scrollHint.addEventListener("click", () => {
            document.getElementById("content-start")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    /* NAVBAR CHE CAMBIA QUANDO SCORRO:
    aggiungo una classe "scrolled" alla navbar quando l'utente scrolla oltre i 100px, 
    e la rimuovo quando torna in cima */
    const nav = document.querySelector(".categories");
    if (nav) {
        window.addEventListener("scroll", () => {

            if (window.scrollY > 100) {
                nav.classList.add("scrolled");
            } else {
                nav.classList.remove("scrolled");
            }
        });
    }

    /* SEZIONE ATTIVA NELLA NAVBAR:
    evidenzio il link della navbar 
    corrispondente alla sezione attualmente visibile,
    basandomi sulla distanza tra la parte superiore 
    della sezione e la posizione dello scroll */

    const sections = document.querySelectorAll(".section");
    const navLinks = document.querySelectorAll(".nav-link");
    if (sections.length && navLinks.length) {

        let ticking = false;

        function updateActiveSection() {

            let currentSection = null;
            let minDistance = Infinity;

            sections.forEach(section => {

                const rect = section.getBoundingClientRect();
                const distance = Math.abs(rect.top - 80); // 80px ≈ navbar

                if (distance < minDistance) {
                    minDistance = distance;
                    currentSection = section;
                }

            });

            if (!currentSection) return;

            const id = currentSection.getAttribute("id");

            navLinks.forEach(link => {

                link.classList.remove("active");

                if (link.getAttribute("href") === "#" + id) {
                    link.classList.add("active");
                }

            });

        }

        // window.addEventListener("scroll", updateActiveSection);
        window.addEventListener("scroll", () => {
            if (!ticking) {

                window.requestAnimationFrame(() => {
                    updateActiveSection();
                    ticking = false;
                });

                ticking = true;

            }

        });

        window.addEventListener("load", updateActiveSection);
    }
    const yearEl = document.getElementById("year");
    if (yearEl) {
        const currentYear = new Date().getFullYear();
        if (yearEl.textContent != currentYear) {
            yearEl.textContent = currentYear;
        }
    }
});