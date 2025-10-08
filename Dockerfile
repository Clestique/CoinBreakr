# Use Node.js base image
FROM node:22

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package files from the services directory
COPY services/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app code
COPY services/ .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
