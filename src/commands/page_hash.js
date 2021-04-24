const axios = require('axios')
const md5 = require('md5')


const page_hash = async (url) => {
  try {
    const response = await axios.get(url)
    const hash = md5(response.data)
    return hash
  } catch (err){
    return false
  }
}

module.exports = page_hash
