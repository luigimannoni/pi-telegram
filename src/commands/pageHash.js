const axios = require('axios')
const md5 = require('md5')


module.exports = async (url) => {
  try {
    const response = await axios.get(url)
    const hash = md5(response.data)
    console.log(`${url} hash at ${new Date().toGMTString()}: ${hash}`)
    return hash
  } catch (err) {
    console.log(`Request to ${url} failed: \n${err}`)
    return false
  }
}
