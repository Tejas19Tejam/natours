# syntax=docker/dockerfile:1
   
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN NODE_ENV=production nodemon server.js
CMD ["node", "src/index.js"]
EXPOSE 3000