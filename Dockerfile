FROM node:alpine

RUN apk add --update --no-cache --virtual .gyp \
        python \
        make \
        g++

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install --quiet

RUN apk del .gyp

COPY ./src .
CMD [ "node", "bot.js" ]