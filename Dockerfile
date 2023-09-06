FROM node:20-alpine

WORKDIR /app
COPY package.json .
RUN npm install
RUN npm run build
COPY . .

EXPOSE 5022

#CMD ["npm", "start"]
CMD [ "node", "dist/main" ]
