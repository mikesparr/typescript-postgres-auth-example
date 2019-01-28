import { User } from "../services/user/user.entity";

/**
 * Standard data access object (DAO) with 
 * basic CRUD methods
 */
interface Dao {
  getAll(user: User, params?: {[key: string]: any}): Promise<Object[] | Error>;
  getOne(user: User, id: string | number): Promise<Object | Error>;
  save(user: User, data: any): Promise<Object | Error>;
  remove(user: User, id: string | number): Promise<boolean | Error>;
}

export default Dao;
