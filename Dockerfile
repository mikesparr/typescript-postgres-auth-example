# Using multi-stage build (supported Docker 17 and later)
# Original image 225MB and now 71MB

# ------ Stage 1 (build) --------
FROM node:alpine AS assets

# Create app directory
WORKDIR /usr/src/app

# Copy source code to image
COPY . .

# Add compile dependencies (since Alpine doesn't have python to compile libs)
RUN apk update && \
    apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install \
    && apk del build-dependencies

# Create ./dist folder for deploy later
RUN npm run build

# ------ Stage 2 (release) ------
FROM node:10-alpine AS release
WORKDIR /usr/src/app
COPY --from=assets /usr/src/app/dist ./dist

# Expose port 3000 and start app
EXPOSE 3000
CMD [ "npm", "start" ]
