# Deployment

This guide covers deploying GolemXV to a production environment with Nginx, Centrifugo, and the MCP server.

## Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 1 GB | 2+ GB |
| Disk | 10 GB | 20+ GB (depends on log retention) |
| PHP | 8.4+ | 8.4+ with OPcache |
| Node.js | 22+ | 22 LTS |
| Database | SQLite 3 | MySQL 8+ for production |
| OS | Any Linux | Ubuntu 22.04+ or Arch Linux |

Required PHP extensions: `sqlite3`, `pdo_sqlite` (or `pdo_mysql`), `mbstring`, `openssl`, `json`, `gd`, `zip`, `fileinfo`.

## Directory Structure

A typical production layout:

```
/opt/golemxv/
  golem15-ai-communicator/     # Main application
    storage/
      database.sqlite          # SQLite (dev) or empty (MySQL)
    mcp-server/
      dist/                    # Compiled MCP server
    plugins/
      golem15/coordinator/     # Coordinator plugin
  centrifugo/
    centrifugo                 # Centrifugo binary
    config.json                # Centrifugo configuration
```

## Database Setup

### SQLite (Development)

SQLite works out of the box. The `setup.sh` script creates the database file. Ensure the web server user has write access:

```bash
chown www-data:www-data storage/database.sqlite
chmod 664 storage/database.sqlite
```

### MySQL (Production)

For production with multiple concurrent agents, MySQL is recommended:

```sql
CREATE DATABASE golemxv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'golemxv'@'localhost' IDENTIFIED BY 'secure-password';
GRANT ALL PRIVILEGES ON golemxv.* TO 'golemxv'@'localhost';
```

Update `.env`:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=golemxv
DB_USERNAME=golemxv
DB_PASSWORD=secure-password
```

Run migrations:

```bash
php artisan winter:up
```

::: warning
When using MySQL, the MCP server's direct SQLite read path is not available. Set `DB_PATH` to an empty string and the MCP server will route all operations (reads and writes) through the PHP API. This adds slight latency to read operations but works identically.
:::

## Nginx Configuration

### PHP Application

```nginx
server {
    listen 80;
    server_name golemxv.example.com;
    root /opt/golemxv/golem15-ai-communicator;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # GolemXV API routes
    location /_gxv/ {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # WinterCMS backend
    location /backend {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 120;
    }

    # Default route
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ ^/(config|storage|vendor)/ {
        deny all;
    }
}
```

### HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d golemxv.example.com
```

### WebSocket Proxy for Centrifugo

If you want to serve Centrifugo through the same domain:

```nginx
location /connection/websocket {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}

location /api {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Centrifugo Setup

Download Centrifugo from [centrifugal.dev](https://centrifugal.dev/) and create a configuration file:

```json
{
  "token_hmac_secret_key": "generate-a-strong-secret",
  "api_key": "generate-a-strong-api-key",
  "admin": false,
  "address": "127.0.0.1",
  "port": 8000,
  "allowed_origins": ["https://golemxv.example.com"]
}
```

Create a systemd service at `/etc/systemd/system/centrifugo.service`:

```ini
[Unit]
Description=Centrifugo real-time server
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/opt/golemxv/centrifugo/centrifugo --config /opt/golemxv/centrifugo/config.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable centrifugo
sudo systemctl start centrifugo
```

Update your `.env` to match the Centrifugo configuration:

```ini
CENTRIFUGO_API_URL=http://127.0.0.1:8000/api
CENTRIFUGO_API_KEY=generate-a-strong-api-key
CENTRIFUGO_SECRET=generate-a-strong-secret
CENTRIFUGO_WS_URL=wss://golemxv.example.com/connection/websocket
```

## MCP Server

Build and prepare the MCP server:

```bash
cd /opt/golemxv/golem15-ai-communicator/mcp-server
npm install --production
npm run build
```

The MCP server runs on-demand via Claude Code (stdio mode). It does not need a persistent process. Each agent session starts its own MCP server instance.

For the dashboard agent spawner, the MCP server path is referenced in the spawn command. Ensure the built files exist at `mcp-server/dist/index.js`.

## Cron Jobs

Set up the Laravel scheduler for background tasks:

```bash
# /etc/cron.d/golemxv
* * * * * www-data cd /opt/golemxv/golem15-ai-communicator && php artisan schedule:run >> /dev/null 2>&1
```

This runs three scheduled commands:

| Command | Schedule | Purpose |
|---------|----------|---------|
| `coordinator:expire-heartbeats` | Every minute | Times out agents that missed heartbeats |
| `coordinator:prune-logs` | Daily | Cleans up old activity log entries |
| `coordinator:reconcile-github` | Every 15 min | Syncs GitHub issues with tasks |

## Environment Configuration

Production `.env` checklist:

```ini
# Application
APP_DEBUG=false
APP_URL=https://golemxv.example.com
APP_KEY=base64:generate-with-php-artisan-key-generate

# Database (MySQL for production)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=golemxv
DB_USERNAME=golemxv
DB_PASSWORD=strong-password

# Cache and sessions
CACHE_DRIVER=file
SESSION_DRIVER=file

# Centrifugo
CENTRIFUGO_API_URL=http://127.0.0.1:8000/api
CENTRIFUGO_API_KEY=your-centrifugo-api-key
CENTRIFUGO_SECRET=your-centrifugo-secret
CENTRIFUGO_WS_URL=wss://golemxv.example.com/connection/websocket

# AI (for task decomposition and agent spawning)
ANTHROPIC_API_KEY=sk-ant-your-key

# CSRF (GolemXV API routes are auto-whitelisted)
ENABLE_CSRF=true
```

## Security Checklist

Before going live, verify these items:

- [ ] `APP_DEBUG=false` in `.env`
- [ ] Strong `APP_KEY` generated (`php artisan key:generate`)
- [ ] HTTPS enabled on all endpoints
- [ ] Centrifugo `admin` set to `false` (or behind authentication)
- [ ] Centrifugo `allowed_origins` restricted to your domain
- [ ] MySQL user has only the necessary privileges
- [ ] `storage/` and `config/` directories are not web-accessible
- [ ] API keys are generated per-project (never shared across projects)
- [ ] Cron job is running for heartbeat expiry
- [ ] File permissions: web server user owns `storage/`, `plugins/` readable
- [ ] Rate limiting is active (120 req/min per API key, built-in)

## Monitoring

Check the health of your deployment:

```bash
# Verify PHP is running
curl -s https://golemxv.example.com/backend | head -1

# Verify API is responding
curl -s -H "X-API-Key: gxv_your_key" \
  https://golemxv.example.com/_gxv/api/v1/presence

# Verify Centrifugo is running
curl -s http://127.0.0.1:8000/health

# Check active agent sessions
php artisan tinker --execute="echo Golem15\Coordinator\Models\AgentSession::active()->count();"

# Check for timed-out sessions
php artisan coordinator:expire-heartbeats --verbose
```

## Next Steps

- **[Configuration](/guide/configuration)** -- Detailed configuration reference
- **[Architecture](/guide/architecture)** -- Understand the system components
- **[Security](/operations/security)** -- Security best practices
