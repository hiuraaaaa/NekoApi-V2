const axios = require('axios');

module.exports = {
    name: "AnimeNSFW",
    desc: "Generate Anime NSFW Image",
    category: "Image",
    params: ["prompt", "ratio"],

    async run(req, res) {
        // Mengambil parameter dari query URL
        const { prompt, ratio } = req.query;

        // Validasi input
        if (!prompt) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'prompt' wajib diisi!"
            });
        }

        // Pastikan ratio terisi, jika tidak default ke 1:1
        const selectedRatio = ratio || "1:1";

        try {
            // Pemanggilan API dengan konfigurasi lengkap agar tidak 404
            const response = await axios.get('https://api.nekolabs.web.id/image.gen/wai-anime-nsfw', {
                params: { 
                    prompt: prompt, 
                    ratio: selectedRatio 
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                },
                timeout: 120000 // Tunggu sampai 2 menit
            });

            // Mengirimkan hasil sukses ke user
            res.status(200).json(response.data);

        } catch (error) {
            // Jika error 404 atau error lainnya
            if (error.response) {
                // Server merespon dengan status code di luar 2xx
                res.status(error.response.status).json({
                    status: false,
                    error: `API Error: ${error.response.status}`,
                    message: error.response.data || "Data tidak ditemukan"
                });
            } else {
                // Error koneksi atau timeout
                res.status(500).json({
                    status: false,
                    error: "Connection Error",
                    message: error.message
                });
            }
        }
    }
};
