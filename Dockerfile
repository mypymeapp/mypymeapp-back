# Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Instala dependencias primero
COPY package.json package-lock.json ./
RUN npm ci --only=production

# copia el resto y build
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main.js"]
