import { User } from "../services/user/user.entity";

/**
 * Standard data access object (DAO) with
 * basic CRUD methods
 */
interface Dao {
  getAll(user: User, params?: {[key: string]: any}): Promise<object[] | Error>;
  getOne(user: User, id: string | number): Promise<object | Error>;
  save(user: User, data: any): Promise<object | Error>;
  remove(user: User, id: string | number): Promise<boolean | Error>;
}

export default Dao;
