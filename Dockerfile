FROM node:20.3.0-alpine

WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./
RUN npm install
RUN npm run build
COPY . .

EXPOSE 5022

CMD ["npm", "run", "start:prod"]
