let posts = require("../db/posts.json");
const path = require("path");
const fs = require("fs");

const index = (req, res) => {
    res.format({
        html: () => {
            let html = "<div>";
            html += `
                <div>
                    <a href="/">Torna alla home</a>
                </div>
                `;
            posts.forEach((post) => {
                html += `
                        <div>
                            <img width="400px" src="/${post.image}"/>
                            <h2>${post.title}</h2>
                            <p>${post.content}</p>
                            <a href="/posts/${post.slug}">Visualizza post</a>
                        </div>
                    `;
                post.tags.forEach((tag) => (html += `<span>#${tag}</span>`));
            });
            html += "</div";
            res.send(html);
        },
        json: () => {
            res.json({
                data: posts,
                count: posts.length,
            });
        },
    });
};
const show = (req, res) => {
    const slug = req.params.slug;
    const reqPost = posts.find((post) => post.slug === slug);

    res.format({
        html: () => {
            if (reqPost) {
                res.send(`
                <div>
                    <h3>${reqPost.title}</h3>
                    <img width="200" src=${`/${reqPost.image}`} />
                    <p><strong>Ingredienti</strong>: ${reqPost.tags
                        .map((tag) => `<span class="tag">#${tag}</span>`)
                        .join(" ")}</p>
                    <a href="/posts/${reqPost.slug
                    }/download">Scarica immagine</a>
                </div>
                `);
            } else {
                res.status(404).send(`Post non trovato!`);
            }
        },
        json: () => {
            if (reqPost) {
                res.json({
                    ...reqPost,
                    image_url: `http://${req.headers.host}/${reqPost.image}`,
                    image_download_url: `http://${req.headers.host}/${reqPost.slug}/download`,
                });
            } else {
                res.status(404).json({
                    error: "Not Found",
                    description: `Non esiste un post con slug ${slug}`,
                });
            }
        },
    });
};

const updatePost = (newPost) => {
    const filePath = path.join(__dirname, "../db/posts.json");
    fs.writeFileSync(filePath, JSON.stringify(newPost));
    posts = newPost;
};

const deletePublicFile = (fileName) => {
    const filePath = path.join(__dirname, "../public", "imgs", "posts", fileName);
    fs.unlinkSync(filePath);
};

const createSlug = (name) => {
    const slug = name.replace(" ", "-").toLowerCase().replaceAll("/", "");
    const slugs = posts.map((post) => post.slug);
    let counter = 1;
    while (slugs.includes(slug)) {
        slug = `${slug}-${counter}`;
        counter++;
    }

    return slug;
};

const create = (req, res) => {
    const { title, slug, content, tags } = req.body;

    if (
        !title ||
        title.replaceAll("/", "").trim().length === 0 ||
        !slug ||
        !content ||
        !tags
    ) {
        req.file?.filename && deletePublicFile(req.file.filename);
        return res.status(400).send("Some data is missing.");
    } else if (!req.file || !req.file.mimetype.includes("image")) {
        req.file?.filename && deletePublicFile(req.file.filename);
        return res.status(400).send("Image is missing or it is not an image file.");
    }

    const newSlug = createSlug(title);

    const newPost = {
        title,
        slug: newSlug,
        content,
        image: req.file?.filename || "",
        tags: tags.split(",").map((tag) => tag.trim()),
    };

    updatePost([...posts, newPost]);

    res.send(
        `Nuovo Post con titolo ${newPost.title} creato! Aggiunto con slug ${newPost.slug}`
    );
};

const destroy = (req, res) => {
    const {slug} = req.params;
    const eliminatePost = posts.find((post) => post.slug === slug);
    if(!eliminatePost){
        return res.status(404).send("Post non trovato!");
    }

    deletePublicFile(eliminatePost.image);
    updatePost(posts.filter((post) => post.slug !== eliminatePost.slug));
    res.send(`Post con slug ${slug} eliminato!`);
};

const downloadImg = (req, res) => {
    const slug = decodeURIComponent(req.params.slug);
    const reqPost = posts.find((post) => post.slug === slug);
    const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "imgs",
        "posts",
        `${slug}.jpeg`
    );

    res.download(imagePath);
};



module.exports = {
    index,
    show,
    create,
    destroy,
    downloadImg,
};
