FROM node:24-alpine

# npm в образе отстаёт от исправлений своих зависимостей (brace-expansion, undici)
RUN npm install -g npm@11 && npm cache clean --force \
    && apk add --no-cache git
