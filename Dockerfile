# syntax=docker/dockerfile:1
   
FROM node:18.16.0
WORKDIR /app
COPY package.json .
RUN npm install 
CMD ["node","server.js"]
EXPOSE 8000