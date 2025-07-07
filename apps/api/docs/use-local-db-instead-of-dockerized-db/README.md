# Use local db instead of dockerized db

Set up `osmox-api` docker container to use local postgres database

## Description

- Override the existing Docker Compose file to exclude creation of the PostgreSQL container and its associated volume
- Utilize local PostgreSQL database as the data source for a Dockerized API

## Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/OsmosysSoftware/osmo-x.git
   cd osmo-x/apps/api/docs/use-local-db-instead-of-dockerized-db/
   ```

2. Create `docker-compose.override.yml` where `docker-compose.yml` exists and copy the contents of `docker-compose-override-script.txt` in it

   ```bash
   # copy script from .txt file and create override script in osmo-x/apps/api
   cp docker-compose-override-script.txt ../../docker-compose.override.yml
   ```

3. Go to `osmo-x/apps/api` and create `.env` file (if not already created)

   ```bash
   # In osmo-x/apps/api/docs/use-local-db-instead-of-dockerized-db/
   cd ../..
   # In osmo-x/apps/api
   cp .env.example .env
   ```

4. Update the `.env` variables to use postgres database on your local machine

   1. You need to set `DB_HOST` to your machine's IP address:
     - This is the IP address that other devices on your local network (including Docker containers) can use to reach your machine.
     - You can simply set `DB_HOST=host.docker.internal` on most setups.
     - If that does not work for your Docker engine, fall back to using the machine’s IP address:
   2. How to find your host IP:
     - **Windows:** Open Command Prompt/PowerShell, type `ipconfig`, look for IPv4 Address.
     - **macOS/Linux:** Open Terminal, type `ip addr`, look for your active network interface (e.g., en0, eth0, docker0) IP address.
   3. Update the `.env` variables:

   ```env
   # Database configuration
   DB_TYPE=postgres
   DB_HOST=<IP-ADDRESS-USED-TO-REACH-YOUR-HOST-MACHINE> # Value "host.docker.internal" should work on most setups
   DB_PORT=<POSTGRES-PORT-FOR-LOCAL-MACHINE> # Set the port used by postgres of your local machine
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   DB_NAME=your-database
   DB_DOCKER_PORT=5433 # IGNORE. Will not be used for current setup
   ```

5. Build and run the docker compose command

   ```bash
   # In osmo-x/apps/api
   docker compose up --build
   ```

6. To dockerize the application normally, remove the override file and build the containers again

   ```bash
   docker compose down -v
   rm docker-compose.override.yml
   # Update the .env variables accordingly
   docker compose up --build
   ```

   For more details, go through the [osmo-x production setup using docker](../production-setup.md#using-docker)

## References

- https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/
- https://docs.docker.com/reference/compose-file/merge/
