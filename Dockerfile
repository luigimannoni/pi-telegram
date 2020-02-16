FROM node:alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install --quiet

COPY . .
CMD [ "node", "bot.js" ]