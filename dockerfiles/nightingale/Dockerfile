FROM node:20.11.0-alpine

WORKDIR /usr/src

RUN apk upgrade && \
    apk update && \
    apk add --no-cache \
    gcc \
    git \
    g++ \
    make \
    python3

COPY package.json package-lock.json ./
RUN npm install

