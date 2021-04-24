const axios = require('axios')
const md5 = require('md5')


const page_hash = async (url) => {
  try {
    const timestamp = new Date().getTime()
    const response = await axios.get(`${url}?v_cache=${timestamp}`)
    const hash = md5(response.data)
    return hash
  } catch (err){
    return false
  }
}

module.exports = page_hash
