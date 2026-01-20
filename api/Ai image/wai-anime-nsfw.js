const axios = require('axios');

async function genImage(prompt, ratio) {
    try {
        const r = await axios.get('https://api.nekolabs.web.id/image.gen/wai-anime-nsfw', {
            params: { prompt, ratio },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                'Accept': 'application/json'
            },
            // Timeout 2 menit (120 detik) karena proses generate gambar AI cukup berat
            timeout: 120000 
        });
        return r.data;
    } catch (e) {
        return { success: false, error: e.message };
    }
}

module.exports = {
    name: "AnimeNSFW",
    desc: "Generate Anime NSFW Image (Support 1:1, 9:16, 16:9)",
    category: "Image",
    params: ["prompt", "ratio", "apikey"],

    async run(req, res) {
        const { prompt, ratio, apikey } = req.query;
        const validKey = "lumina";
        const supportedRatios = ["1:1", "9:16", "16:9"];

        // 1. Validasi Prompt
        if (!prompt) {
            return res.status(400).json({
                status: false,
                error: "Parameter 'prompt' wajib diisi."
            });
        }

        // 2. Validasi Ratio
        let selectedRatio = ratio || "1:1";
        if (!supportedRatios.includes(selectedRatio)) {
            return res.status(400).json({
                status: false,
                error: `Ratio '${selectedRatio}' tidak didukung. Gunakan: ${supportedRatios.join(", ")}`
            });
        }

        // 3. Logika APIKEY Opsional (Priority Mode)
        const isPriority = apikey === validKey;

        // Jalankan fungsi generate
        const result = await genImage(prompt, selectedRatio);

        if (!result.success) {
            return res.status(500).json({
                status: false,
                error: "Gagal membuat gambar. Server mungkin sedang sibuk.",
                detail: result.error
            });
        }

        // 4. Response Akhir
        res.status(200).json({
            status: true,
            creator: "Lumina",
            mode: isPriority ? "Priority Mode (High Speed Cluster)" : "Free Mode",
            result: result.result, // URL Gambar
            metadata: {
                prompt: prompt,
                ratio: selectedRatio,
                responseTime: result.responseTime,
                timestamp: result.timestamp
            }
        });
    }
};
