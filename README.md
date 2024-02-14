# Turn-Based Game Server Prototype (WIP)

This project is a prototype for a core system of a battle server designed for a turn-based fighting game. It showcases the basics of a server that can handle real-time battles through WebSocket connections using socket.io. The server architecture is designed to be sufficiently decoupled, allowing it to run efficiently in different contexts, such as within a single API request or as a dedicated app instance.

## Features

- Real-time battle handling via WebSocket (socket.io).
- Decoupled battle logic for high-performance execution.
- Integrated API server for handling non-real-time game operations.
- Flexible project structure supporting new application additions, like a matchmaking server.
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

1. Launch the servers:
   ```bash
   ./bin/start.sh
   ```

## Stopping the Servers

To stop the servers and containers, execute:

1. Stop the Docker containers:
   ```bash
   ./bin/stop-containers.sh
   ```
or

2. Refresh all services:
   ```bash
   ./bin/refresh.sh
   ```

## Cleanup and Maintenance

For cleaning up the environment:

1. Prune all unused Docker resources:
   ```bash
   ./bin/prune-all.sh
   ```

## Building and Extending

- To build individual applications, use the `./bin/build.sh` script.
- To create a new application within the project, run:
  ```bash
  ./bin/create-app.sh <app_name>
  ```

## ToDo

- Implement simple player CRUD operations in the API.
- Develop a simple matchmaking server/app that will be triggered by a queue (RabbitMQ?) to run battle instances.
- Utilize the existing Redis cache layer in the core, incorporating a consistent hashing approach, particularly in the API server.

## Note

- This project is a proof of concept and is open for showcase purposes. It is not concerned with the monorepo versus multi-repo discussion but rather focuses on demonstrating a practical implementation of a game server system.
- The local API utilizes the PostgreSQL Docker image for database services. However, the battle server does not directly interact with the database.
- The API does not currently use libraries like `routing-controllers` to create basic features, as the goal was to implement these features manually for fun. However, for time-saving purposes, such libraries might be incorporated in the future.
