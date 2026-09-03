### Stage 0: Build ###
FROM node:24 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# npm ci installs exactly what package-lock.json pins, so the image gets the
# same Angular 22 / Optimus v2 tree that was tested locally. npm install would
# be free to re-resolve and drift.
RUN npm ci

COPY . .

RUN npm run build:prod

### Stage 1: Run ###
FROM nginx:latest AS ngi

ARG APP_NAME

ENV APP_PATH=/usr/src/app/dist/${APP_NAME}/browser

COPY --from=builder $APP_PATH /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && mkdir -p /runtime-config

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
