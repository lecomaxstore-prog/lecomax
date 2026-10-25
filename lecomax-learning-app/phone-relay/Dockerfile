FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.cjs internet.cjs viewer.html viewer.js viewer.css internet-viewer.html internet-viewer.js ./
ENV BIND_HOST=0.0.0.0 PORT=8091
USER node
EXPOSE 8091
CMD ["node", "server.cjs"]
