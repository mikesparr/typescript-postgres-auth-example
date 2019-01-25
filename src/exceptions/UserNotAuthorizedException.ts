import HttpException from "./HttpException";

class UserNotAuthorizedException extends HttpException {
  constructor(id: string | number, action: string, resource: string) {
    super(403, `User with id ${id} not allowed to ${action} resource ${resource}`);
  }
}

export default UserNotAuthorizedException;
