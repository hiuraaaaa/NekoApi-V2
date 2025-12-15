const axios = require("axios");

module.exports = {
  name: "TurboAI",
  desc: "Chat AI using theturbochat.com",
  category: "AI",
  params: ["text"],

  async run(req, res) {
    const text = req.query.text || req.body?.text;

    if (!text) {
      return res.status(400).json({
        status: false,
        error: "text is required"
      });
    }

    try {
      const response = await axios.post(
        "https://theturbochat.com/chat",
        {
          message: text,
          model: "gpt-3.5-turbo",
          language: "en"
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );

      const reply =
        response.data?.choices?.[0]?.message?.content;

      if (!reply) {
        return res.status(500).json({
          status: false,
          error: "Empty response from AI"
        });
      }

      res.status(200).json({
        status: true,
        input: text,
        reply: reply.trim()
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.response?.data || err.message
      });
    }
  }
};
