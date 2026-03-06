### Stage 0: Build ###
FROM node:20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g @angular/cli

RUN npm install

COPY . .

RUN npm run build:prod

### Stage 1: Run ###
FROM nginx:latest AS ngi

ARG APP_NAME

ENV APP_PATH=/usr/src/app/dist/${APP_NAME}/browser

COPY --from=builder $APP_PATH /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
