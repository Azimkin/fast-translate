# Docker Deployment Guide

## Quick Start

### Build and Run with Docker Compose

```bash
# Build and start the container
docker compose up -d --build

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

### Build and Run with Docker

```bash
# Build the image
docker build -t fast-translate .

# Run the container
docker run -d \
  -p 4321:4321 \
  -e OLLAMA_API_ENDPOINT=http://host.docker.internal:11434 \
  --name fast-translate \
  fast-translate

# View logs
docker logs -f fast-translate

# Stop the container
docker stop fast-translate
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OLLAMA_API_ENDPOINT` | Yes | - | Ollama API endpoint URL |
| `OLLAMA_AUTH_TOKEN` | No | - | Bearer token for Ollama authentication |
| `PORT` | No | 4321 | Server port |
| `TRANSLATE_ALLOWED_ORIGINS` | No | * | CORS allowed origins (comma-separated) |

### Connecting to Ollama

#### Option 1: Ollama on Host Machine

```yaml
environment:
  - OLLAMA_API_ENDPOINT=http://host.docker.internal:11434
```

**Note:** For this to work on Linux, you may need to add `--add-host=host.docker.internal:host-gateway` to your docker run command.

#### Option 2: Ollama in Separate Container

```yaml
environment:
  - OLLAMA_API_ENDPOINT=http://ollama:11434
```

Update the `docker-compose.yml` to include the Ollama service:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    restart: unless-stopped

  fast-translate:
    # ... fast-translate config ...
    environment:
      - OLLAMA_API_ENDPOINT=http://ollama:11434

volumes:
  ollama-data:
```

## Available Models

The app works with any Ollama model. Recommended models for translation:

- `translategemma:latest` - Specialized for translations
- `llama3.2` - Good general purpose model
- `qwen3.5:4b` - Fast and efficient
- `mistral-small3.2:latest` - High quality translations

Pull models before using:

```bash
# On host machine
ollama pull translategemma:latest

# Or in Ollama container
docker exec -it ollama ollama pull translategemma:latest
```

## Health Check

The container includes a health check endpoint:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' fast-translate

# Or query the API directly
curl http://localhost:4321/api/health
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs

# Or for standalone container
docker logs fast-translate
```

### Can't connect to Ollama

1. Ensure Ollama is running: `curl http://localhost:11434/api/tags`
2. Check the endpoint URL in environment variables
3. For Docker, verify `host.docker.internal` is accessible

### CORS errors

Set `TRANSLATE_ALLOWED_ORIGINS` to your domain:

```yaml
environment:
  - TRANSLATE_ALLOWED_ORIGINS=https://yourdomain.com
```

## Production Deployment

### Security Recommendations

1. **Use specific CORS origins** instead of `*`
2. **Set up Ollama authentication** if exposed publicly
3. **Use a reverse proxy** (nginx, traefik) for SSL/TLS
4. **Limit container resources** in docker-compose.yml:

```yaml
services:
  fast-translate:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Example nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name translate.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Updating

```bash
# Rebuild and restart
docker compose up -d --build

# Or pull latest image and restart
docker compose pull
docker compose up -d
```
