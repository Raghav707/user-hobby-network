# User Hobby Network (Cybernauts Development Assignment)

This project implements a full-stack application to manage users, their hobbies, and their relationships, visualized as a dynamic graph using React Flow.

## Project Structure

* `/backend`: Node.js (Express + TypeScript) API server and PostgreSQL database logic.
* `/frontend`: React (TypeScript + Vite) client application for visualization.

## Prerequisites

* [Node.js](https://nodejs.org/) (v20.x LTS recommended)
* [pnpm](https://pnpm.io/installation) (v9.x or later recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for running the PostgreSQL database)
* [Git](https://git-scm.com/)

## Backend Setup

1.  **Navigate to the backend folder:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Set up environment variables:**
    * Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    * Edit the `.env` file and replace the placeholder `DATABASE_URL` with your actual PostgreSQL connection string if it's different from the default Docker setup.
4.  **Start the PostgreSQL database using Docker:**
    * Make sure Docker Desktop is running.
    * Run the following command in your terminal (this only needs to be done once):
        ```bash
        docker run -d --name user-hobby-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_USER=myuser -e POSTGRES_DB=mydb -p 5432:5432 postgres:16
        ```
    * You can check if the container is running with `docker ps`.
5.  **Initialize the database tables:**
    * Run the initialization script:
        ```bash
        node --loader ts-node/esm init-db.ts
        ```
    * You should see a success message: "✅ Tables created successfully!".
6.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    * The server will be running at `http://localhost:3001` (or the port specified in `.env`).
    * API documentation is available at `http://localhost:3001/api-docs` when the server is running.

## Backend Testing

1.  **Navigate to the backend folder:**
    ```bash
    cd backend
    ```
2.  **Run the tests:**
    ```bash
    pnpm test
    ```
    * All tests should pass.

## Frontend Setup (To Be Added)

*(Instructions for setting up and running the React frontend will be added here once developed.)*

```bash
# Example commands (will be finalized later)
# cd ../frontend
# pnpm install
# pnpm dev