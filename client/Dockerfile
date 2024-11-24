FROM node:20
WORKDIR /app
# Copy package files
COPY package*.json ./
RUN npm install
# Copy the rest of the code
COPY . .

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build the app
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]