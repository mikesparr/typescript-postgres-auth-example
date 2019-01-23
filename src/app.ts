import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import logger from "./config/logger";
import Controller from "./interfaces/controller.interface";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger.json";
import errorMiddleware from "./middleware/error.middleware";

class App {
  public app: express.Application;

  constructor(controllers: Controller[]) {
    this.app = express();

    this.initializeSecurity();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
    this.initializeApiDocs();
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      logger.info(`App listening on the port ${process.env.PORT}`);
    });
  }

  private initializeSecurity() {
    this.app.use(helmet.noCache());
    this.app.use(helmet.frameguard());
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.hsts());
    this.app.use(helmet.ieNoOpen());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.xssFilter());
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(compression());
  }

  private initializeApiDocs() {
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

}

export default App;
