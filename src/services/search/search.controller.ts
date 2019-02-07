import { NextFunction, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
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
    // TODO: figure out Dto pattern for querystrings for validation (q length > 3)
    this.router.get(this.path, authenticationMiddleware, this.getPlacesByName);
  }

  private getPlacesByName = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { q } = request.query;

    try {
      const data: any = await this.searchDao.getPlacesByName(request.user, q);
      response.send(this.fmt.formatResponse(data, 0, "OK"));
    } catch (error) {
      next(error);
    }
  }
}

export default SearchController;
