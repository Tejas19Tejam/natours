# syntax=docker/dockerfile:1
   
FROM node:18.16.0
WORKDIR /app
COPY package.json .
RUN npm install 
CMD NODE_ENV=production npm run server.js
EXPOSE 3000