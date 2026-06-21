# 🐳 Running Sankalai Backend with Docker

## Prerequisites

- Docker Desktop installed and running
- Windows 10/11

## Quick Start

### Option 1: Using Batch Scripts (Easiest)

```bash
# Start all services
docker-start.bat

# View logs
docker-logs.bat

# Stop all services
docker-stop.bat
```

### Option 2: Using Docker Compose Commands

```bash
# Start services in detached mode
docker-compose up -d

# Start services with logs
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Rebuild and start
docker-compose up --build -d
```

## Services

### PostgreSQL Database
- **Port:** 5432
- **Database:** sankalaai_db
- **Username:** postgres
- **Password:** postgres
- **Connection String:** `jdbc:postgresql://localhost:5432/sankalaai_db`

### Backend API
- **Port:** 8083
- **Base URL:** http://localhost:8083
- **Health Check:** http://localhost:8083/actuator/health (if actuator is enabled)

## Common Commands

```bash
# Check service status
docker-compose ps

# Restart a specific service
docker-compose restart backend
docker-compose restart postgres

# Rebuild backend after code changes
docker-compose up --build backend

# Remove all data (WARNING: This deletes the database)
docker-compose down -v

# Enter backend container shell
docker exec -it sankalai-backend sh

# Enter postgres container shell
docker exec -it sankalai-postgres psql -U postgres -d sankalaai_db

# View resource usage
docker stats
```

## Troubleshooting

### Port Already in Use

If you get a port conflict error:

```bash
# Find what's using the port
netstat -ano | findstr :8083
netstat -ano | findstr :5432

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Services Not Starting

```bash
# Check Docker is running
docker info

# View detailed logs
docker-compose logs

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Rebuild from Scratch

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild and start
docker-compose up --build -d
```

## Development Workflow

### Making Code Changes

1. Make your code changes
2. Rebuild and restart backend:
   ```bash
   docker-compose up --build backend -d
   ```

### Viewing Logs While Developing

```bash
docker-compose logs -f backend
```

### Database Changes

The database uses a persistent volume, so data persists across container restarts.

To reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

## Production Considerations

For production deployment, consider:

1. Use environment variables file (`.env`)
2. Change default passwords
3. Use secrets management
4. Enable SSL/TLS
5. Set up proper logging
6. Configure resource limits
7. Use orchestration (Kubernetes, Docker Swarm)

## Architecture

```
┌─────────────────────────────────────┐
│   Docker Compose Network            │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  PostgreSQL  │  │   Backend   │ │
│  │   :5432      │◄─┤   :8083     │ │
│  └──────────────┘  └─────────────┘ │
│         ▲                  ▲        │
│         │                  │        │
└─────────┼──────────────────┼────────┘
          │                  │
    (Volume Mount)      (Port Expose)
          │                  │
          ▼                  ▼
    postgres_data      localhost:8083
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Spring Boot with Docker](https://spring.io/guides/gs/spring-boot-docker/)
