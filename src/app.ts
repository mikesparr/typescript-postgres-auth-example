import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import logger from "./config/logger";
import Route from "./interfaces/route.interface";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger.json";
import errorMiddleware from "./middleware/error.middleware";

class App {
  public app: express.Application;

  constructor(routes: Route[]) {
    this.app = express();

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
    this.initializeApiDocs();
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      logger.info(`App listening on the port ${process.env.PORT}`);
    });
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

  private initializeRoutes = (routes: Route[]) => {
    for (const route of routes) {
      const { action, controller, handler, method, path } = route;
  
      if (action && controller) {
        // handle response from Controller class method
        (this.app as any)[route.method](route.path, (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const result = (new (route.controller as any)())[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then((dbResult) => dbResult !== null && dbResult !== undefined ? res.send(dbResult) : undefined);
            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
      } else {
        // handle like any other middleware function
        (this.app as any)[method](path, handler);
      }
    }
  };
}

export default App;
