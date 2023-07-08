# syntax=docker/dockerfile:1
   
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN NODE_ENV=production nodemon server.js
CMD ["server.js"]
EXPOSE 3000