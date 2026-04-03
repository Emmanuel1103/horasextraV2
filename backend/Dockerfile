FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
# No package-lock.json in this folder; use npm install.
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
EXPOSE 4000
CMD ["node", "dist/index.js"]
