FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:22-alpine AS prod-deps

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pm2

COPY package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder   /app/dist         ./dist
COPY ecosystem.config.js entrypoint.sh ./

RUN chmod +x ./entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT ["./entrypoint.sh"]
