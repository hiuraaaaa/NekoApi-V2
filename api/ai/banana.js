const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

module.exports = {
    name: "PhotoEditorGhibli",
    desc: "Transform uploaded image using PhotoEditorAI (Ghibli style)",
    category: "AI-Image",
    params: ["prompt", "image"],

    async run(req, res) {
        try {
            const { prompt } = req.query;
            const file = req.files?.image;

            if (!file)
                return res.status(400).json({
                    success: false,
                    error: 'Image file is required. Use form-data: image=<file>'
                });

            // Simpan sementara
            const tempPath = "./temp-upload-" + Date.now() + ".jpg";
            await file.mv(tempPath);

            // ====== CREATE JOB ======
            const form = new FormData();
            form.append("model_name", "seedream");
            form.append("edit_type", "style_transfer");
            form.append("prompt", prompt || "Turn this into a Ghibli illustration");
            form.append("target_images", fs.createReadStream(tempPath));

            const job = await axios.post(
                "https://api.photoeditorai.io/pe/photo-editor/create-job",
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        "Product-Code": "067003",
                        "Product-Serial": "vj6o8n",
                    }
                }
            );

            const jobId = job.data.result.job_id;

            // ====== CHECK STATUS ======
            async function check() {
                const r = await axios.get(
                    `https://api.photoeditorai.io/pe/photo-editor/get-job/${jobId}`,
                    {
                        headers: {
                            "Product-Code": "067003",
                            "Product-Serial": "vj6o8n",
                        }
                    }
                );
                return r.data.result;
            }

            let status;
            do {
                status = await check();
                await new Promise((r) => setTimeout(r, 3000));
            } while (status.status !== 2);

            const imageURL = status.output[0];

            // ====== CLEANUP ======
            fs.unlinkSync(tempPath);

            return res.status(200).json({
                success: true,
                job_id: jobId,
                output_url: imageURL,
                prompt: prompt || "Turn this into a Ghibli illustration"
            });

        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.response?.data || err.message
            });
        }
    }
};
