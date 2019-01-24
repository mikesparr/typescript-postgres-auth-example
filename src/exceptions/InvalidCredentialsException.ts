import HttpException from "./HttpException";

class InvalidCredentialsException extends HttpException {
  constructor() {
    super(401, `Email or password does not match our records`);
  }
}

export default InvalidCredentialsException;
