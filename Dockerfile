FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN bun i

COPY . .

EXPOSE 3000

CMD ['bun', 'run', 'dev']
