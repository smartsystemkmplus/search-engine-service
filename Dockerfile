FROM node:20.3.0-alpine

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build


EXPOSE 5022

CMD ["npm", "run", "start:prod"]
