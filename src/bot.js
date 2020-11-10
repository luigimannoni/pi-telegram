require('dotenv').config()

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const speedTest = require('speedtest-net')

function bytesToMegaBytes(bytes) {
  return (bytes / 1024 / 1024 * 8).toFixed(2)
}

const monitorPi = async () => {
  const start = Date.now()
  try {
    const data = await speedTest({ acceptGdpr: true, acceptLicense: true })
    const {
      ping,
      download,
      upload,
      interface,
      timestamp,
    } = data
    const end = Date.now()
    
    const message = [
      `<b>Bandwidth at ${timestamp}</b>`,
      `<b>Download</b>: ${bytesToMegaBytes(download.bandwidth)}MB`,
      `<b>Upload</b>: ${bytesToMegaBytes(upload.bandwidth)}MB`,
      `<b>Ping Latency</b>: ${ping.latency}ms`,
      `<b>Ping Jitter</b>: ${ping.jitter}ms`,
      `<b>IP</b>: ${interface.externalIp}`,
      `Benchmark ran in ${end - start} ms`
    ]

    return message.join('\n')
  } catch (err) {
    return err
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN)
const state = {
  interval: false
}

bot.use(Telegraf.log())

bot.command('report', (ctx) => {
  const message = `Reporting is currently <b>${state.interval ? 'enabled' : 'disabled'}</b>`
  return ctx.replyWithHTML(message, Extra.markup(
    Markup.keyboard([
      ['/start 60', '/start 120', '/start 240'], 
      ['/stop'],
      ['/manual']
    ])
  ))
})

bot.hears(/\/start (\d+)/, (ctx) => {
  const timing = ctx.match[1]

  if (timing < 30) {
    return ctx.reply('Report not started, interval cannot be less than 30 minutes')  
  } else {
    state.interval = setInterval(async () => {
      const message = await monitorPi()
      return ctx.replyWithHTML(message)
    }, 1000 * 60 * timing)
    return ctx.reply(`Reporting started, reporting every ${timing} minutes`)  
  }
})

bot.command('stop', (ctx) => {
  clearInterval(state.interval)
  state.interval = false
  return ctx.reply('Reporting stopped')
})

bot.command('manual', async (ctx) => {
  ctx.reply('Starting manual report, wait for info')
  const message = await monitorPi()
  return ctx.replyWithHTML(message)
})

bot.launch()