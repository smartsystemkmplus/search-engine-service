FROM node:20-alpine

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 5022

CMD ["npm", "start"]
