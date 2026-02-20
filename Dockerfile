FROM oven/bun:1-slim AS production

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV EXCALIDRAW_URL=http://localhost:3000

CMD ["bun", "src/server.ts"]

LABEL org.opencontainers.image.source="https://github.com/opencoredev/excalidraw-cli"
LABEL org.opencontainers.image.description="Excalidraw CLI - Control a live Excalidraw canvas from AI agents"
LABEL org.opencontainers.image.licenses="MIT"
