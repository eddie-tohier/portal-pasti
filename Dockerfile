# Build the static app
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty = call the API on the same origin (/int/*), proxied by nginx below.
ENV VITE_API_BASE_URL=
RUN npm run build

# Serve with nginx; API_PROXY_TARGET is substituted into the template at startup.
FROM nginx:1.27.5-alpine
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
