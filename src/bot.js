require('dotenv').config()

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const speedTest = require('speedtest-net')

// Custom commands
const pageHash = require('./commands/pageHash')

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
    lastChange: null,
    pageHash: null,
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
    '/status - report tracked url and last time the page has changed',
    '/internet - internet status'
  ].join('\n')

  return ctx.replyWithHTML(message, Extra.markup(
    Markup.keyboard([
      ['/track', '/stop'], 
      ['/status', '/internet'],
    ])
  ))
})


bot.command('status', (ctx) => {
  const {id} = ctx.update.message.from
  const message = [
    `Reporting is currently <b>${state[id].interval ? 'enabled' : 'disabled'}</b>`,
    ...(state[id].page ? [`URL monitored: ${state[id].page}`] : []),
    ...(state[id].lastChange ? [`Last change: ${state[id].lastChange}`] : []),
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
  state[id].pageHash = await pageHash(state[id].page)
  state[id].lastChange = new Date().toGMTString()

  // Start interval
  state[id].interval = setInterval(async () => {
    const hash = await pageHash(state[id].page)
    if (hash !== state[id].pageHash) {
      console.log(`Page changed for user ${id}, storing new hash`)
      state[id].pageHash = hash
      state[id].lastChange = new Date().toGMTString()
      
      return ctx.reply(`🚨 Page ${url} has changed! 🚨`)
    }
  }, 1000 * 60)
  return ctx.reply(`Tracking started, reporting ${url} changes every 60 seconds`)  
})

bot.command('stop', (ctx) => {
  const {id} = ctx.update.message.from

  clearInterval(state[id].interval)
  generateState(id)

  return ctx.reply('Tracking stopped')
})

bot.command('internet', async (ctx) => {
  ctx.reply('Starting internet report, wait for info')
  const message = await monitorPi()
  return ctx.replyWithHTML(message)
})

bot.launch()