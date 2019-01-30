import HttpException from "./HttpException";

class WrongAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, "Token invalid or expired");
  }
}

export default WrongAuthenticationTokenException;
