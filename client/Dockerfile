FROM node:20
WORKDIR /app

# Copy package files first
COPY package*.json ./
RUN npm install

# Copy everything (including .env)
COPY . .

# Build the app (it will now have access to .env during build)
RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]