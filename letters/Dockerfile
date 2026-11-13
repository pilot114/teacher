FROM node:24-alpine

# npm в образе отстаёт от исправлений своих зависимостей (brace-expansion, undici);
# часть отстаёт даже в свежем npm@11 — подменяем их внутри npm исправленными версиями
# в пределах тех же мажорных (undici — для node-gyp, ^6.25.0; ip-address — для socks, ^10.1.1)
ARG NPM_PATCHES="undici@6.29.1 ip-address@10.7.4"
RUN npm install -g npm@11 \
    && cd /usr/local/lib/node_modules/npm/node_modules \
    && for spec in $NPM_PATCHES; do \
        name="${spec%@*}"; \
        mkdir /tmp/pack && npm pack "$spec" --pack-destination /tmp/pack --silent \
        && rm -rf "$name" && mkdir "$name" \
        && tar -xzf /tmp/pack/*.tgz -C "$name" --strip-components=1 \
        && rm -rf /tmp/pack || exit 1; \
    done \
    && npm cache clean --force \
    && apk add --no-cache git
