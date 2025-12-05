const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  name: "GoogleImageSearch",
  desc: "Scrape images from Google Images (fixed version)",
  category: "Scraper",
  params: ["query", "max", "safe"],

  async run(req, res) {
    try {
      const { query, max, safe } = req.query;

      if (!query)
        return res.status(400).json({
          status: false,
          error: 'Parameter "query" wajib diisi',
        });

      const MAX = Math.min(parseInt(max || "20"), 100);
      const safeSearch = safe === "off" ? "off" : "active";

      const response = await axios.get("https://www.google.com/search", {
        params: { tbm: "isch", q: query, safe: safeSearch },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const urls = new Set();

      // Ambil <img src>
      $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http")) urls.add(src);
      });

      // Ambil data-src
      $("img").each((_, el) => {
        const src = $(el).attr("data-src");
        if (src && src.startsWith("http")) urls.add(src);
      });

      // Ambil data-iurl (full res)
      $("img").each((_, el) => {
        const src = $(el).attr("data-iurl");
        if (src && src.startsWith("http")) urls.add(src);
      });

      // Ambil dari script JSON Google
      const scripts = [];
      $("script").each((_, el) => {
        const txt = $(el).html();
        if (txt && txt.includes("AF_initDataCallback")) scripts.push(txt);
      });

      for (const script of scripts) {
        const matches = script.match(/https?:\/\/[^"]+\.(jpg|png|jpeg)/gi);
        if (matches) {
          for (const u of matches) urls.add(u);
        }
      }

      const result = [...urls].slice(0, MAX);

      // RETURN CLEAN (tanpa statusCode / creator)
      return res.json({
        status: true,
        query,
        count: result.length,
        safeSearch: safeSearch !== "off",
        images: result,
      });

    } catch (err) {
      return res.json({
        status: false,
        error: err.message,
      });
    }
  },
};
