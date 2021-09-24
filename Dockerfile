FROM node:16-alpine3.11
WORKDIR /app
COPY . .
RUN yarn
CMD [ "yarn","dev" ]