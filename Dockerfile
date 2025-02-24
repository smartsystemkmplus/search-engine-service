#FROM node:20.3.0-alpine
FROM public.ecr.aws/docker/library/node:20.3.0-alpine

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build


EXPOSE 5022

CMD ["npm", "run", "start:prod"]
