# Build the Angular app
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Serve it with nginx; /api and /openapi are proxied to the API container (see nginx.conf)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/takwene-front-end/browser /usr/share/nginx/html
EXPOSE 80
