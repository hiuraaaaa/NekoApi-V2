const axios = require('axios')

async function cosplayImage() {
  try {
    const r = await axios.get('https://api.nekolabs.web.id/random/cosplay', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Accept': 'application/json'
      },
      timeout: 10000
    })

    return {
      success: true,
      imageUrl: r.data
    }
  } catch (e) {
    return { 
      success: false, 
      error: e.message
    }
  }
}

module.exports = {
  name: "Cosplay",
  desc: "Random Cosplay Image",
  category: "Random",

  async run(req, res) {
    const result = await cosplayImage()

    if (result.success === false) {
      return res.status(500).json({
        status: false,
        error: result.error
      })
    }

    // Redirect langsung ke gambar
    res.redirect(result.imageUrl)
  }
}
