# Use an official node runtime as a parent image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app for production
RUN npm run build

# Install serve to serve the build directory
RUN npm install -g serve

# Command to run the app
CMD ["serve", "-s", "build", "-l", "5000"]

# Expose the port the app runs on
EXPOSE 5000
