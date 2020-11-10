# π Telegram 🤖

A lightweight internet speed monitor/Telegram bot for the Raspberry Pi. Uses [telegraf](https://github.com/telegraf/telegraf) and Ookla's [speedtest.net](https://www.speedtest.net) service

## Purpose

Initially I have coded the bot to keep a costant eye on the flaky speeds my ISP provides to know when I can shout at them on Twitter. Also serves as a internet monitor to troubleshoot if my Pi is still online when I am out from home and can't connect on the VPN. 

## Quick start

1. Create a bot using the instructions on the [official Telegram FAQs](https://core.telegram.org/bots), after speaking to @BotFather you'll get a Token which can be set up as a `BOT_TOKEN` env variable.
  - If you're running on a restricted environment the project uses dotenv to override env vars. Copy the  `.env.template` file and rename it as `.env`, afterwards add the token after `BOT_TOKEN=`

2. Run `npm install && npm start` as usual if you want to launch the node script locally. (Requires node 13 and above)

3. `npm run docker` to launch a docker container, useful if you want your Raspberry Pi tidy and with automated restarts on reboots/failures. Mind that Docker will add extra overhead and takes extra disk space.
