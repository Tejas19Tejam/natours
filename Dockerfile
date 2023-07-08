# syntax=docker/dockerfile:1
   
FROM node:18.16.0
WORKDIR /app
COPY . .
RUN npm install 
CMD NODE_ENV=production nodemon server.js
EXPOSE 3000