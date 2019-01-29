import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";

import { getPlaces } from "./provider/OpenCageDataProvider";

/**
 * Example external API interaction searching geo service
 */
class SearchController implements Controller {
  public path: string = "/search";
  public router: Router = Router();
  private resource: string = "search";

  constructor() {
    // TODO: figure out Dto pattern for querystrings for validation (q length > 3)
    this.router.get(this.path, authenticationMiddleware, this.getPlacesByName);
  }

  // TODO: add DAO layer and Event Emitter and tests
  private getPlacesByName = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { q } = request.query;

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const places: {[key: string]: any} = await getPlaces(q);

      if (!places) {
        next(new RecordsNotFoundException(this.resource));
      } else {
        response.send(permission.filter(places));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }
}

export default SearchController;
