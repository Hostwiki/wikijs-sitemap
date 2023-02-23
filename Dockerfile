FROM node:19-alpine

LABEL maintainer = "hostwiki.com"

WORKDIR /wiki/sitemap

COPY package*.json ./

RUN npm ci install

COPY . .

EXPOSE 3012

CMD ["node", "server"]

