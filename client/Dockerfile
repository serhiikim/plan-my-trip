FROM node:20
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Define build-time arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL

# Set them as environment variables for Vite
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_API_URL=${VITE_API_URL}

# Build the app
RUN npm run build

# Serve the app (or switch to Nginx for production)
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]
