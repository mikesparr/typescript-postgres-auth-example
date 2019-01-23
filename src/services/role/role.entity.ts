import { Column, Entity, PrimaryColumn, OneToMany, ManyToMany } from "typeorm";
import { Permission } from "../permission/permission.entity";
import { User } from "../user/user.entity";

@Entity()
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