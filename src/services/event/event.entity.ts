import { User } from "../user/user.entity";

/**
 * Data object with annotations to configure database in ORM
 */
export class Event {

  public id?: string;

  public action: string;

  public resource: string;

  public verb: string;

  public actor: User;

  public object: {[key: string]: any};

  public target?: {[key: string]: any};

  public timestamp: number;

  public published?: Date;

}

export default Event;
