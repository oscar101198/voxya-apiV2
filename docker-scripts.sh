#!/bin/bash

# Voxya API Docker Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Voxya API Docker Scripts${NC}"

case "$1" in
  "build")
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose build
    ;;
  "build-prod")
    echo -e "${YELLOW}Building production Docker images...${NC}"
    docker-compose -f docker-compose.prod.yml build
    ;;
  "up")
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose up -d
    ;;
  "up-prod")
    echo -e "${YELLOW}Starting production services...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    ;;
  "down")
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    ;;
  "down-prod")
    echo -e "${YELLOW}Stopping production services...${NC}"
    docker-compose -f docker-compose.prod.yml down
    ;;
  "restart")
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose restart
    ;;
  "logs")
    echo -e "${YELLOW}Showing logs...${NC}"
    docker-compose logs -f
    ;;
  "logs-prod")
    echo -e "${YELLOW}Showing production logs...${NC}"
    docker-compose -f docker-compose.prod.yml logs -f
    ;;
  "logs-api")
    echo -e "${YELLOW}Showing API logs...${NC}"
    docker-compose logs -f api
    ;;
  "logs-db")
    echo -e "${YELLOW}Showing database logs...${NC}"
    docker-compose logs -f postgres
    ;;
  "shell")
    echo -e "${YELLOW}Opening shell in API container...${NC}"
    docker-compose exec api sh
    ;;
  "db-shell")
    echo -e "${YELLOW}Opening PostgreSQL shell...${NC}"
    docker-compose exec postgres psql -U postgres -d voxya
    ;;
  "clean")
    echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
    docker-compose down -v
    docker system prune -f
    ;;
  "clean-prod")
    echo -e "${YELLOW}Cleaning up production containers and volumes...${NC}"
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
    ;;
  "dev")
    echo -e "${YELLOW}Starting development environment...${NC}"
    docker-compose up -d postgres redis
    echo -e "${GREEN}Database and Redis started. Run 'yarn start:dev' for development.${NC}"
    ;;
  *)
    echo -e "${RED}Usage: $0 {build|build-prod|up|up-prod|down|down-prod|restart|logs|logs-prod|logs-api|logs-db|shell|db-shell|clean|clean-prod|dev}${NC}"
    echo ""
    echo "Commands:"
    echo "  build      - Build development Docker images"
    echo "  build-prod - Build production Docker images"
    echo "  up         - Start all development services"
    echo "  up-prod    - Start all production services"
    echo "  down       - Stop all development services"
    echo "  down-prod  - Stop all production services"
    echo "  restart    - Restart all services"
    echo "  logs       - Show all development logs"
    echo "  logs-prod  - Show all production logs"
    echo "  logs-api   - Show API logs only"
    echo "  logs-db    - Show database logs only"
    echo "  shell      - Open shell in API container"
    echo "  db-shell   - Open PostgreSQL shell"
    echo "  clean      - Clean up development containers and volumes"
    echo "  clean-prod - Clean up production containers and volumes"
    echo "  dev        - Start only database and Redis for development"
    exit 1
    ;;
esac 