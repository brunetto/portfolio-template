const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");

// prendo i titoli dalle cartelle, 
// rimuovendo eventuali numeri iniziali e trattini, 
// e mettendo in maiuscolo la prima lettera di ogni parola
function formatTitle(slug) {
    return slug
        .replace(/^\d+-/, "")   // rimuove il numero iniziale
        .replace(/-/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());
}

async function processImages(galleries) {
    return Promise.all(
        galleries.map(async (gallery) => {

            const photos = await Promise.all(
                gallery.photos.map(async (src) => {

                    const metadata = await Image(src, {
                        widths: [400, 800, 1200, 1600],
                        formats: ["webp", "jpeg"],
                        outputDir: "./_site/img/",
                        urlPath: "/img/"
                    });

                    const largest = metadata.jpeg.at(-1);

                    return {
                        src: largest.url,
                        width: largest.width,
                        height: largest.height,
                        html: Image.generateHTML(metadata, {
                            alt: gallery.title,
                            loading: "lazy",
                            decoding: "async"
                        })
                    };
                })
            );

            return {
                ...gallery,
                photos
            };
        })
    );
}

async function processGalleryFromDir(dirPath) {
    const base = path.join(process.cwd(), dirPath);

    if (!fs.existsSync(base)) {
        return null;
    }

    const files = fs.readdirSync(base)
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .map(file => path.join(dirPath, file));

    const gallery = {
        name: path.basename(dirPath),
        title: formatTitle(path.basename(dirPath)),
        photos: files
    };

    const processed = await processImages([gallery]);
    return processed[0];
}

async function processPageGalleries() {
    const pagesBase = path.join(process.cwd(), "assets/pages");

    if (!fs.existsSync(pagesBase)) {
        return {};
    }

    const pageDirs = fs.readdirSync(pagesBase)
        .filter(name => fs.statSync(path.join(pagesBase, name)).isDirectory());

    const result = {};

    for (const pageName of pageDirs) {
        const pagePath = path.join(pagesBase, pageName);

        const galleryDirs = fs.readdirSync(pagePath)
            .filter(name => fs.statSync(path.join(pagePath, name)).isDirectory());

        result[pageName] = {};

        for (const galleryName of galleryDirs) {
            const gallery = await processGalleryFromDir(`assets/pages/${pageName}/${galleryName}`);

            if (gallery) {
                result[pageName][galleryName] = gallery;
            }
        }
    }

    return result;
}

module.exports = function (eleventyConfig) {
    // aggiungo il plugin per generare la sitemap
    eleventyConfig.addPlugin(require("@quasibit/eleventy-plugin-sitemap"), {
        sitemap: {
            hostname: "https://biemmezeta.com"
        }
    });

    // copio le immagini e gli script nella cartella di output
    eleventyConfig.addPassthroughCopy({
        "node_modules/photoswipe/dist/photoswipe-lightbox.esm.js": "js/photoswipe/photoswipe-lightbox.esm.js",
        "node_modules/photoswipe/dist/photoswipe.esm.js": "js/photoswipe/photoswipe.esm.js",
        "node_modules/photoswipe/dist/photoswipe.css": "js/photoswipe/photoswipe.css"
    });
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/robots.txt");
    eleventyConfig.addPassthroughCopy("src/favicon.ico");

    // aggiungo un dato globale con il timestamp di build, 
    // così posso forzare il refresh delle immagini in cache
    eleventyConfig.addGlobalData("build", () => {
        return {
            time: Date.now()
        };
    });

    eleventyConfig.addGlobalData("heroImages", () => {
        const heroDir = "./assets/hero";
        const files = fs.readdirSync(heroDir)
            .filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        return files.map(file => `/assets/hero/${file}`);

    });

    // aggiungo un dato globale con una funzione che restituisce 
    // un'immagine random dalla cartella hero, 
    // escludendo l'ultima mostrata finché non vengono mostrate tutte le altre
    eleventyConfig.addGlobalData("randomHero", () => {
        const heroDir = "./assets/hero";
        const files = fs.readdirSync(heroDir)
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
        const random = files[Math.floor(Math.random() * files.length)];

        return `/assets/hero/${random}`;

    });

    eleventyConfig.addGlobalData("galleries", async () => {

        const base = path.join(process.cwd(), "assets/wall");

        if (!fs.existsSync(base)) {
            return [];
        }

        const raw = fs.readdirSync(base)
            .filter(name =>
                fs.statSync(path.join(base, name)).isDirectory()
            )
            .map(category => {
                const folder = path.join(base, category);
                const photos = fs.readdirSync(folder)
                    .filter(file =>
                        /\.(jpg|jpeg|png|webp)$/i.test(file)
                    )
                    .map(file => `assets/wall/${category}/${file}`);

                return {
                    name: category,
                    title: formatTitle(category),
                    photos
                };
            });

        return await processImages(raw);
    });

    eleventyConfig.addGlobalData("getGalleryFromDir", () => {
        return processGalleryFromDir;
    });

    eleventyConfig.addGlobalData("pageGalleries", async () => {
        return await processPageGalleries();
    });

    return {
        dir: {
            input: "src",
            output: "_site"
        }
    };
};
