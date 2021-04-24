require('dotenv').config()

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const speedTest = require('speedtest-net')

// Custom commands
const page_hash = require('./commands/page_hash')

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
    return 'Speedtest currently unavailable'
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN)
const state = {}

const generateState = (id) => {
  state[id] = {
    interval: false,
    page: null,
  }
}

bot.use(Telegraf.log())

bot.hears(/\/start|hello/i, (ctx) => {
  const {id, first_name} = ctx.update.message.from
  state[id] = {
    interval: false,
    page: null,
  }

  const message = [
    `Hello, ${first_name}, periodic reporting is <b>${state[id].interval ? 'enabled' : 'disabled'}</b>`,
    'Available commands:',
    '',
    '/track [url] - start monitoring URL address',
    '/stop - stops monitoring',
    '/report - reports last time checked and next time',
    '/internet - internet status'
  ].join('\n')

  return ctx.replyWithHTML(message, Extra.markup(
    Markup.keyboard([
      ['/track', '/stop'], 
      ['/report', '/internet'],
    ])
  ))
})


bot.command('report', (ctx) => {
  const {id} = ctx.update.message.from
  const message = [
    `Reporting is currently <b>${state[id].interval ? 'enabled' : 'disabled'}</b>`,
    ...(state[id].page ? [`URL monitored: ${state[id].page}`] : []),
  ].join('\n')

  return ctx.replyWithHTML(message)
})

bot.hears(/\/track (.+)/, async (ctx) => {
  const {id} = ctx.update.message.from
  if (!state[id]) {
    generateState(id)
  }
  
  const url = ctx.match[1]
  state[id].page = url

  // Store initial hash
  state[id].pageHash = await page_hash(state[id].page)

  // Start interval
  state[id].interval = setInterval(async () => {
    const hash = await page_hash(state[id].page)
    if (hash !== state[id].pageHash) {
      return ctx.reply(`🚨 Page ${url} has changed! 🚨`)
    }
  }, 1000 * 60)
  return ctx.reply(`Reporting started, reporting ${url} every 5 minutes`)  
})

bot.command('stop', (ctx) => {
  const {id} = ctx.update.message.from

  clearInterval(state[id].interval)
  state[id].interval = false
  state[id].page = null
  return ctx.reply('Reporting stopped')
})

bot.command('internet', async (ctx) => {
  ctx.reply('Starting internet report, wait for info')
  const message = await monitorPi()
  return ctx.replyWithHTML(message)
})

bot.launch()