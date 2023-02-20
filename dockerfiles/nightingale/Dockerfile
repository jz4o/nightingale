FROM node:18.14.1-alpine

WORKDIR /usr/src

RUN apk upgrade && \
    apk update && \
    apk add --no-cache \
    gcc \
    g++ \
    make \
    python3

COPY package.json package-lock.json ./
RUN npm install

