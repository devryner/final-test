FROM node:22-alpine

ARG COMMIT_SHA=unknown
ENV APP_VERSION=${COMMIT_SHA}

WORKDIR /app

COPY package.json server.js ./

EXPOSE 3000

USER node

CMD ["node", "server.js"]
