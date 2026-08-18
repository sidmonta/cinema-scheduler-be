FROM node:25-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

FROM base AS dev
CMD ["npx", "tsx", "watch", "src/app.ts"]
