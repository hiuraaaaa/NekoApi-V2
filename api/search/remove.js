const axios = require("axios");

async function webpilotStream(q, threadId = "", bearer = "null") {
  try {
    const r = await axios.post(
      "https://api.webpilotai.com/rupee/v1/search",
      { q: q, threadId: threadId || "" },
      {
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
          Accept: "application/json,text/plain,*/*,text/event-stream",
          "Content-Type": "application/json",
          authorization: `Bearer ${bearer}`,
          origin: "https://www.webpilot.ai",
        },
        timeout: 120000, // 2 menit timeout
      }
    );

    let text = "";
    const src = [];

    return await new Promise((done, reject) => {
      r.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          if (line.startsWith("data:")) {
            const raw = line.slice(5).trim();
            try {
              const j = JSON.parse(raw);
              // collect main streamed text
              if (j.type === "data" && j.data && j.data.content && !j.data.section_id) {
                text += j.data.content;
              }
              // collect "using_internet" sources
              if (j.action === "using_internet" && j.data) {
                src.push(j.data);
              }
            } catch (e) {
              // ignore JSON parse errors for lines that aren't JSON
            }
          }
        }
      });

      r.data.on("end", () => {
        done({ text: text.trim(), source: src });
      });

      r.data.on("error", (err) => {
        reject(err);
      });
    });
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

module.exports = {
  name: "WebPilotSearch",
  desc: "Query WebPilot.ai streaming search and return combined text + sources",
  category: "Scraper",
  params: ["q", "threadId", "bearer"],

  async run(req, res) {
    try {
      const q = (req.query.q || req.body?.q || "").toString().trim();
      const threadId = (req.query.threadId || req.body?.threadId || "") .toString();
      // optionally allow passing bearer token (default "null")
      const bearer = (req.query.bearer || req.body?.bearer || "null").toString();

      if (!q) {
        return res.status(400).json({ status: false, error: 'Parameter "q" wajib diisi' });
      }

      const result = await webpilotStream(q, threadId, bearer);

      if (result?.error) {
        return res.status(500).json({ status: false, error: result.error });
      }

      return res.json({
        status: true,
        query: q,
        result: {
          text: result.text,
          source: result.source, // array of source objects (may be empty)
        },
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message || String(err) });
    }
  },
};
