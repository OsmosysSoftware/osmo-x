# OsmoX Portal

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.9.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Documentation

- [Development Setup](docs/development-setup.md)

# Docker Deployment for Portal

## Prerequisites

Before deploying the Portal with Docker, ensure that you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

Ensure their versions are:

- **Docker:** Docker v26.1.2
- **Docker Compose:** Docker Compose v2.1.1

Create an `.env` file and set the following value:

```dotenv
SERVER_PORT=5000
```

## Steps for Docker Deployment

1. **Build and Run Containers:**

   Open a terminal in the root directory of your Angular project and execute the following commands:

   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **Access the Portal:**

   Once the containers are running, access the Portal by navigating to `http://localhost:5000/notifications` in your web browser. If you specified a different port in your `docker-compose.yml` file, adjust the port number accordingly.

3. **Stop the Containers:**

   To stop the running containers, use the following command:

   ```bash
   docker-compose down
   ```

## Additional Notes

- Customize the `docker-compose.yml` file if you need to adjust port mappings or other configurations.
- If your application relies on additional environment variables, you can set them in the `.env` file in the same directory as your `docker-compose.yml` file.

## Contributing

We welcome contributions from the community! If you're interested in contributing to the OsmoX, please take a moment to review our [Contribution Guidelines](../../CONTRIBUTING.md).

Your contributions help make our app even better. Whether you're a developer, designer, or just enthusiastic about enhancing user experiences, we'd love to have you on board.

Before you get started, please familiarize yourself with our guidelines to ensure a smooth collaboration process.

[Contribution Guidelines](../../CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
