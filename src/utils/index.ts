import { NextFunction, Request, Response, Router } from "express";

type Wrapper = ((router: Router) => void);

export const applyMiddleware = (
  middlewareWrappers: Wrapper[],
  router: Router,
) => {
  for (const wrapper of middlewareWrappers) {
    wrapper(router);
  }
};

type Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

/* tslint:disable-next-line */
type Route = {
  action?: string;
  path: string;
  method: string;
  handler?: Handler | Handler[];
  controller?: any;
};

export const applyRoutes = (routes: Route[], router: Router) => {
  for (const route of routes) {
    const { action, controller, handler, method, path } = route;

    if (action && controller) {
      // handle response from Controller class method
      (router as any)[route.method](route.path, (req: Request, res: Response, next: NextFunction) => {
          const result = (new (route.controller as any)())[route.action](req, res, next);
          if (result instanceof Promise) {
              result.then((dbResult) => dbResult !== null && dbResult !== undefined ? res.send(dbResult) : undefined);

          } else if (result !== null && result !== undefined) {
              res.json(result);
          }
      });
    } else {
      // handle like any other middleware function
      (router as any)[method](path, handler);
    }
  }
};
