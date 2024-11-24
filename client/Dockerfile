FROM node:20
WORKDIR /app
# Copy package files
COPY package*.json ./
RUN npm install
# Copy the rest of the code
COPY . .
# Build the app
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]