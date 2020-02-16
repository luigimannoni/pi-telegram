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
const commands = [
  '/cpu',
  '/internet',
];


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

bot.command('cpu', (ctx) => {
  ctx.reply('CPU Data...');
  function cb(data) {
    console.log(data);
    ctx.reply(data);
  }

  si.system(cb);
  si.bios(cb);
  si.baseboard(cb);
  si.chassis(cb);
  si.cpu(cb);
  si.cpuTemperature(cb);
  si.cpuCurrentspeed(cb);
  si.mem(cb);
  si.osInfo(cb);
  si.fullLoad(cb);
  // si.processes(cb);
  si.processLoad(cb);
  // si.services(cb);
  // si.networkStats(cb);
  // si.networkConnections(cb);
  si.networkInterfaces(cb);
  si.dockerInfo(cb);
  si.dockerContainers(cb);
  // si.networkInterfaces(cb);
  // si.networkInterfaces(cb);

});

bot.command('internet', (ctx) => {
  ctx.reply('Internet Data...');

  const test = speedTest({ maxTime: 5000 });
 
  test.on('data', data => {
    ctx.reply(data);
    console.log(data);
  });       
});


// Start bot instance.
bot.launch()
  .then(() => {
    console.log('Telegraf bot now listening for incoming messages.');
  })
  .catch((error) => {
    console.log(`Bot aborted because ${error}`);
  });