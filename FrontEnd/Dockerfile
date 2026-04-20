FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8081
# Keep EXPO variables just in case
ENV EXPO_PUBLIC_API_URL=http://37.59.111.34:5002
ENV EXPO_PUBLIC_USER_API_URL=http://37.59.111.34:3001
CMD ["npx", "expo", "start", "--no-dev", "--port", "8081"]
