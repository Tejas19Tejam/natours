# syntax=docker/dockerfile:1
   
FROM node
WORKDIR . /app
COPY package.json .
RUN npm install 
CMD ["node","/app/server.js"]
EXPOSE 8000