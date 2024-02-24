FROM node as builder
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"]
RUN ["npm", "install"]
RUN ["npm", "ci"]
COPY ["src/", "./src/"]

FROM node
WORKDIR /app/
COPY --from=builder /app/ ./
ENTRYPOINT ["node", "./src/gitops.js"]
