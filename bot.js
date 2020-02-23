require('dotenv').config();

const Telegraf = require('telegraf');
const telegrafCommandParts = require('telegraf-command-parts');

const si = require('systeminformation');
const speedTest = require('speedtest-net');
const Loki = require('lokijs');

// Constructors
const bot = new Telegraf(process.env.BOT_TOKEN);
const db = new Loki('sandbox.db');

// Middlewares
bot.use(telegrafCommandParts());

// DB and command list
const users = db.addCollection('users');
const commands = ['/internet'];

function bytesToMegaBytes(bytes) {
  return (bytes / 1024 / 1024 * 8).toFixed(2);
}

bot.start((ctx) => {
  if (users) {
    ctx.reply('Welcome back {user}, you are already authenticated on this session');
  } else {
    ctx.reply('Hello, to access the bot please send me the /auth command followed by your token');
  }
});

bot.command('auth', (ctx) => {
  const { args } = ctx.contextState.command;
  const { id, username } = ctx.from;

  if (args === process.env.AUTH_TOKEN) {
    ctx.reply('User x allowed');
    // database.saveUserChat(ctx.from.id, ctx.chat.id);

    users.insert({ id, username });

    // broadcast to other people the new login
  } else {
    ctx.reply('Token not present');
  }

  // bot.telegram.sendMessage(ctx.update.message.from.id, 'sending unwanted chat');

  // authUsers.push('x');
});

bot.command('help', (ctx) => {
  commands.join('\n');
});

bot.command('internet', async (ctx) => {
  console.log('Received /internet command from', ctx.from.username);
  ctx.reply('Internet Data...');
  
  let message = [];

  try {
    const data = await speedTest({ acceptGdpr: true, acceptLicense: true });
    const {
      ping,
      download,
      upload,
      interface,
      packetLoss,
      timestamp,
    } = data;

    message = [
      `Bandwidth at ${timestamp}`,
      `Download: ${bytesToMegaBytes(download.bandwidth)}`,
      `Upload: ${bytesToMegaBytes(upload.bandwidth)}`,
      'Ping',
      `Latency: ${ping.latency}ms`,
      `Jitter: ${ping.jitter}ms`,
      `Packet Loss: ${packetLoss}%`,
      `IP: ${interface.externalIp}`,
    ];
  } catch (err) {
    ({ message } = err);
  } finally {
    console.log(message);
    ctx.reply(message.join('\n'));
  }

});


// Start bot instance.
bot.launch()
  .then(() => {
    console.log('Telegraf bot now listening for incoming messages.');
  })
  .catch((error) => {
    console.log(`Bot aborted because ${error}`);
  });