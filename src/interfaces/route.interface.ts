import { NextFunction, Request, Response, Router } from "express";

type Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

export default interface Route {
  action?: string;
  path: string;
  method: string;
  handler?: Handler | Handler[];
  controller?: any;
};
