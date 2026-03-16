FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build


FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD npx prisma migrate deploy && npm run start:prod
