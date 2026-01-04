FROM node:22.14.0-alpine

WORKDIR /usr/src

RUN apk upgrade && \
    apk update && \
    apk add --no-cache \
    gcc \
    git \
    g++ \
    make \
    py3-pip \
    python3

ENV PYTHON_VIRTUAL_ENV=/opt/venv
ENV PATH="$PYTHON_VIRTUAL_ENV/bin:$PATH"
RUN python -m venv $PYTHON_VIRTUAL_ENV && \
    pip install --no-cache-dir yt-dlp

COPY package.json package-lock.json ./
RUN npm install

