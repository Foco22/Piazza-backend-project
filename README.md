# Piazza API - Backend

This is the backend for the Piazza Project, a social platform.

## Description

The main objective of this project is to provide services for the Piazza Project, which contains the different APIs and models for the application. The main services are:

1. **Users Services**: Contains the services for login, register and authenticate a user.
2. **Interactions Services**: Contains all the services for creating a post, comments, disliking or liking a post, etc.


## Project Structure

```
cam-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── postController.js    # Post CRUD and interactions
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   └── validation.js        # Input validation rules
│   ├── models/
│   │   ├── User.js              # User schema and model
│   │   ├── Post.js              # Post schema with expiration
│   │   └── Interaction.js       # Like/dislike/comment interactions
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   └── postRoutes.js        # Post and interaction endpoints
│   ├── utils/
│   │   └── generateToken.js     # JWT token generator
│   └── server.js                # Express app configuration
├── kubernetes/
│   ├── configmap.yaml           # Kubernetes ConfigMap
│   ├── deployment.yaml          # Kubernetes Deployment (3 replicas)
│   └── service.yaml             # LoadBalancer Service
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline for VM deployment
├── Dockerfile                   # Docker image configuration
├── .dockerignore
├── .env                         # Environment variables (local dev)
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher) OR Docker
- MongoDB (running locally or connection string)

## Installation & Setup

This project can be installed in the following ways:

### Option 1: Run with Node.js (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Edit the `.env` file with your settings:
   ```env
   # Server Configuration
   NODE_ENV=production
   PORT=5000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/piazza
   # Or use MongoDB Atlas for production:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chamaleon?retryWrites=true&w=majority

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_characters
   JWT_EXPIRE=7d

   # Docker Registry Configuration (Required for CI/CD)
   DOCKER_USERNAME=your_docker_hub_username
   DOCKER_PASSWORD=your_docker_hub_password_or_access_token

   # VM Deployment Configuration (Required for CI/CD)
   VM_HOST=your_vm_ip_address_or_hostname
   VM_USERNAME=your_vm_ssh_username
   VM_SSH_PORT=22
   VM_SSH_KEY=your_private_ssh_key_content
   ```

3. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   sudo systemctl start mongod
   # Or
   mongod
   ```

4. **Run the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

### Option 2: Run with Docker

1. **Build the Docker image:**
   ```bash
   docker build -t piazza-api .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e NODE_ENV='production' \
     -e PORT=5000 \
     -e MONGODB_URI='your-mongodb-uri' \
     -e JWT_SECRET='your-jwt-secret' \
     -e JWT_EXPIRE='7d' \
     -e DOCKER_USERNAME='your-docker-username' \
     -e DOCKER_PASSWORD='your-docker-password' \
     -e VM_HOST='your-vm-host' \
     -e VM_USERNAME='your-vm-username' \
     -e VM_SSH_PORT='22' \
     -e VM_SSH_KEY='your-ssh-key' \
     --name piazza-api \
     piazza-api
   ```

   **Note:** Docker and VM environment variables are only needed if you're using the CI/CD pipeline. For local development, you only need:
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e NODE_ENV='production' \
     -e PORT=5000 \
     -e MONGODB_URI='your-mongodb-uri' \
     -e JWT_SECRET='your-jwt-secret' \
     -e JWT_EXPIRE='7d' \
     --name piazza-api \
     piazza-api
   ```

3. **Check container status:**
   ```bash
   docker ps
   docker logs piazza-api
   ```

4. **Stop and remove container:**
   ```bash
   docker stop piazza-api
   docker rm piazza-api
   ```

### Option 3: Run with Docker Compose (Recommended)

Docker Compose will automatically set up MongoDB, Mongo Express, and the API together.

1. **Create environment file:**

   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your settings:
   ```env
   # Server Configuration
   NODE_ENV=production
   PORT=5000

   # MongoDB Configuration - Local Docker
   MONGODB_URI=mongodb://admin:admin123@mongodb:27017/chamaleon?authSource=admin

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_characters
   JWT_EXPIRE=7d

   # MongoDB Local Configuration
   MONGO_ROOT_PASSWORD=admin123
   MONGO_EXPRESS_PASSWORD=admin123
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Check services status:**
   ```bash
   docker-compose ps
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f piazza-api
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

**Services Access:**
- **API**: http://localhost:5000
- **Mongo Express**: http://localhost:8081 (admin/admin123)
- **MongoDB**: localhost:27017
