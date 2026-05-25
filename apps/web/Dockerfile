FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY apps/web/package.json apps/web/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source
COPY apps/web/ .

# Expose port
EXPOSE 3000

# Run dev server
CMD ["npm", "run", "dev"]