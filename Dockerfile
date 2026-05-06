# C-Work Next.js — жишээ image (MySQL орчны хувьсагч дамжуулна)
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Зураг/CV тогтвортой хадгалах: docker run -v cwork_uploads:/app/public/uploads ...
VOLUME ["/app/public/uploads"]

CMD ["npm", "run", "start"]
