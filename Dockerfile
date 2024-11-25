FROM node:latest as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY ./ .
RUN npm run build

FROM nginx:latest
RUN mkdir /app
COPY --from=build-stage /app/dist/ui/ /app
COPY nginx.conf /etc/nginx/nginx.conf
USER nginx
