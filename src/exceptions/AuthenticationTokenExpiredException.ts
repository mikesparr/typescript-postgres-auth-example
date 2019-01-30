import HttpException from "./HttpException";

class AuthenticationTokenExpiredException extends HttpException {
  constructor() {
    super(401, "Authentication token expired. Please check email for new token");
  }
}

export default AuthenticationTokenExpiredException;
