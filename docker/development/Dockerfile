FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pm2

# 复制主机构建产物
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
COPY --chown=node:node public ./public
COPY --chown=node:node .env ./.env

#确保 cache 目录权限正确
RUN mkdir -p .next/cache && chown -R node:node .next

USER node
EXPOSE 3000

CMD HOSTNAME="0.0.0.0" node server.js