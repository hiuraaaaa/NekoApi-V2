const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const gemini = {
    getNewCookie: async function () {
        const r = await fetch(
            "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c",
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
                body: "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
                method: "POST"
            }
        );
        const ck = r.headers.get("set-cookie");
        return ck.split("; ")[0];
    },

    ask: async function (prompt, previousId = null) {
        if (!prompt || typeof prompt !== "string") {
            throw new Error("Prompt tidak boleh kosong!");
        }

        let resumeArray = null;
        let cookie = null;

        if (previousId) {
            const s = Buffer.from(previousId, "base64").toString("utf8");
            const j = JSON.parse(s);
            resumeArray = j.newResumeArray;
            cookie = j.cookie;
        }

        const headers = {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "x-goog-ext-525001261-jspb": '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
            cookie: cookie || await this.getNewCookie()
        };

        const b = [[prompt], ["en-US"], resumeArray];
        const a = [null, JSON.stringify(b)];
        const body = new URLSearchParams({ "f.req": JSON.stringify(a) });

        const response = await fetch(
            "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c",
            {
                method: "POST",
                headers,
                body
            }
        );

        if (!response.ok) {
            throw new Error(response.status + " " + response.statusText);
        }

        const text = await response.text();
        const match = text.matchAll(/^\d+\n(.+?)\n/gm);
        const array = Array.from(match).reverse();
        const selectedArray = array[3][1];

        const realArray = JSON.parse(selectedArray);
        const parse1 = JSON.parse(realArray[0][2]);

        const newResumeArray = [...parse1[1], parse1[4][0][0]];
        const finalText = parse1[4][0][1][0].replace(/\*\*(.+?)\*\*/g, "*$1*");

        const id = Buffer.from(
            JSON.stringify({ newResumeArray, cookie: headers.cookie })
        ).toString("base64");

        return { text: finalText, id };
    }
};

module.exports = {
    name: "GeminiUnofficial",
    desc: "Chat dengan Google Gemini (Unofficial API by Wolep)",
    category: "AI",
    params: ["text", "id"],

    async run(req, res) {
        try {
            const { text, id } = req.query;

            if (!text) {
                return res.json({
                    status: false,
                    error: 'Parameter "text" wajib diisi.'
                });
            }

            const result = await gemini.ask(text, id || null);

            return res.json({
                status: true,
                query: text,
                result
            });
        } catch (err) {
            return res.json({
                status: false,
                error: err.message
            });
        }
    }
};
