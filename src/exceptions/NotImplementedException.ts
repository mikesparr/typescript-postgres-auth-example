import HttpException from "./HttpException";

class NotImplementedException extends HttpException {
  constructor(methodName: string) {
    super(404, `Method ${methodName} is not implemented`);
  }
}

export default NotImplementedException;
