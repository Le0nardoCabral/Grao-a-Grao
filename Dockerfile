FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npm run prisma:generate
COPY tsconfig.json ./
COPY src ./src

FROM base AS development
COPY tests ./tests
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/src/Server.js"]
