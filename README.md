# Skyrim - Shortest Path Finder

## Technologies Used

- **Database**: MongoDB
- **Backend**: FastAPI
- **Frontend**: React
- **Deployment**: Docker

## Prerequisites

- Docker and Docker Compose installed on your machine.
- h_da VPN connection to access the database and Keycloak instance.

## Setup Instructions

1. **Clone the repository**
    ```sh
    git clone https://code.fbi.h-da.de/bpse-sose24/group-1
    cd group1
    ```

2. **Configure environment variables**

    Ensure you have an `.env` file in the root directory with the required environment variables. Here is a sample `.env` file:

    ```env
    KEYCLOAK_URL=https://your-keycloak-url
    ```
    In our case we have a provided .env.development file.

3. **Start the application**

    Run the following command to start the application using Docker Compose:

    ```sh
    docker compose -f docker-compose.dev.yml up
    ```

    This command will build and start the FastAPI backend and the React frontend. Both services will automatically reload if you make changes to the code.

4. **Access the application**

    - **Frontend**: Open your browser and navigate to `http://localhost:3000`
    - **Backend**: The FastAPI documentation is available at `http://localhost:4243/docs`

## Development Workflow

- **Auto-reload**: The Docker setup is configured with auto-reload. Any changes made in the `backend` or `frontend` directories will trigger a rebuild and restart of the respective services.
- **VPN Requirement**: Ensure you are connected to the VPN to access the database and Keycloak instance.

## Troubleshooting

- **VPN Connection**: If you cannot connect to the database or Keycloak, check your VPN connection.
- **Docker Issues**: If you encounter issues with Docker, try rebuilding the images with:
    ```sh
    docker compose -f docker-compose.dev.yml build
    ```