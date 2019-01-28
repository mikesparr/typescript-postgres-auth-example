import { Column, Entity, Index, PrimaryColumn, OneToMany, ManyToMany } from "typeorm";
import { Permission } from "../permission/permission.entity";
import { User } from "../user/user.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
//@Index(["id"], { unique: true })
export class Role {

  @PrimaryColumn()
  public id: string;

  @Column()
  public description: string;

  @OneToMany(type => Permission, permission => permission.role, {
    cascade: true
  })
  permissions: Permission[];

  @ManyToMany(type => User, user => user.roles)
  users: User[];

}