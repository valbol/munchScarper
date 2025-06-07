FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# copy package manifests + tsconfig
COPY package.json package-lock.json tsconfig.json ./

# installs both dependencies & devDependencies
RUN npm ci \
  && npm cache clean --force

# copy your source (tests are excluded by tsconfig)
COPY src ./src

RUN npm run build

### Release: only prod deps + compiled output
FROM node:18-alpine AS release
WORKDIR /usr/src/app

# copy only package manifests
COPY package.json package-lock.json ./

# install only production deps
RUN npm ci --omit=dev \
  && npm cache clean --force

# pull in compiled output
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["npm", "start"]
