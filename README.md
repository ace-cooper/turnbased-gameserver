# Turn-Based Game Server Prototype (WIP)

This project is a prototype for a core system of a battle server designed for a turn-based fighting game. It showcases the basics of a server that can handle real-time battles through WebSocket connections using socket.io. The architecture of the server is designed to be sufficiently decoupled, allowing it to run efficiently in a single API request.

## Features

- Real-time battle handling via WebSocket (socket.io).
- Decoupled battle logic capable of high-performance execution.
- Integrated API server for handling non-real-time game operations.
- Flexible project structure supporting the addition of new applications, such as a matchmaking server.
- Monorepo architecture for ease of development and scalability.

## Getting Started

### Prerequisites

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Node.js (v18.x): [Install Node.js](https://nodejs.org/)

### Initial Setup

1. Install Docker following the instructions for your OS:
   - [Docker for Mac](https://docs.docker.com/desktop/mac/install/)
   - [Docker for Windows](https://docs.docker.com/desktop/windows/install/)
   - [Docker for Linux](https://docs.docker.com/desktop/linux/install/)
2. Install Node.js (version 18.x).
3. Initialize the project by running:
   ```bash
   ./bin/init.sh
   ```

## Development Workflow

To start developing, follow these steps:

1. Start the required containers:
   ```bash
   ./bin/_start-containers.sh
   ```
2. Launch development servers:
   ```bash
   ./bin/_dev-servers.sh
   ```
3. Run tests:
   ```bash
   ./bin/_test-all.sh
   ```
4. Refresh all services:
   ```bash
   ./bin/_refresh-all.sh
   ```

## Stopping the Servers

To stop the servers and containers, execute:

1. Stop the servers:
   ```bash
   ./bin/_stop-servers.sh
   ```
2. Stop the Docker containers:
   ```bash
   ./bin/_stop-containers.sh
   ```

## Cleanup and Maintenance

For cleaning up the environment:

1. Clean all services:
   ```bash
   ./bin/_clean-all.sh
   ```
2. Prune all unused Docker resources:
   ```bash
   ./bin/_prune-all.sh
   ```

## Building and Extending

- Build individual applications using `./bin/build.sh` script.
- To create a new application within the project, run:
  ```bash
  ./bin/create-app.sh <app_name>
  ```

## Note

- This project is a proof of concept and is open for showcase purposes. It is not concerned with the monorepo versus multi-repo discussion but rather focuses on demonstrating a practical implementation of a game server system.
- The local API utilizes the PostgreSQL Docker image for database services. However, the battle server does not directly interact with the database.

