import { NextFunction, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import addSearchParams from "../../middleware/search.middleware";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { Formatter } from "../../utils/formatter";

import SearchDao from "./search.dao";

/**
 * Example external API interaction searching geo service
 */
class SearchController implements Controller {
  public path: string = "/search";
  public router: Router = Router();

  private fmt: Formatter = new Formatter();
  private searchDao: SearchDao = new SearchDao();

  constructor() {
    this.router.get(this.path, authenticationMiddleware, addSearchParams, this.getPlacesByName);
  }

  private getPlacesByName = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { q } = request.query; // TODO: use searchParams like others

    try {
      const {data, total} = await this.searchDao.getPlacesByName(request.user, q);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK", total));
    } catch (error) {
      next(error);
    }
  }
}

export default SearchController;
