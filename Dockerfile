# Step 1: Build React App
FROM node:alpine3.18 as build

WORKDIR /app 
COPY package.json . 
RUN npm install
COPY . .

# Pass Build Arguments
ARG VITE_APP_BASE_URL
ARG VITE_APP_BASE_URL_AUTH
ARG VITE_APP_X_API_Key
ARG VITE_APP_X_API_Key_AUTH

# Convert Build Arguments to Environments Variables
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL
ENV VITE_APP_BASE_URL_AUTH=$VITE_APP_BASE_URL_AUTH
ENV VITE_APP_X_API_Key=$VITE_APP_X_API_Key
ENV VITE_APP_X_API_Key_AUTH=$VITE_APP_X_API_Key_AUTH


RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:1.23-alpine

WORKDIR /usr/share/nginx/html
RUN rm -rf *

COPY --from=build /app/dist .

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]