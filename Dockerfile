FROM node:slim
WORKDIR /src
COPY . /src/
RUN npm i
RUN npm run build
EXPOSE 3000
CMD npm run start