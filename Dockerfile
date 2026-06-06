FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22-alpine AS runner

ARG PORT

ENV PORT=${PORT}

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/package*.json ./

CMD ["npm", "run", "start:dev"]

EXPOSE ${PORT}
