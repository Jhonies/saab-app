FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Schema Prisma e geração do client
COPY prisma ./prisma
RUN npx prisma generate

# Código fonte
COPY . .

EXPOSE 3000

# Ao arrancar: aplica migrações pendentes e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node server.js"]
