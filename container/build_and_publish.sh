#!/bin/bash

rm -rf app
mkdir app
mkdir app/node_modules

cp -r ../node_modules/koa \
      ../node_modules/koa-gzip \
      ../node_modules/koa-logger \
      ../node_modules/koa-parse-json \
      ../node_modules/koa-route \
      ../node_modules/lodash \
      ../node_modules/minimist \
      ../node_modules/mkdirp \
      ../node_modules/promise-callback \
      ../node_modules/ss-problem \
      ../node_modules/uuid \
      ./app/node_modules/

cp -r ../.dist ./app

sudo docker build -t blakelapierre/ssp-server .
sudo docker push blakelapierre/ssp-server