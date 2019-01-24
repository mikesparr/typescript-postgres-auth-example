import HttpException from "./HttpException";

class AuthenticationTokenExpiredException extends HttpException {
  constructor() {
    super(401, "Authentication token expired");
  }
}

export default AuthenticationTokenExpiredException;
