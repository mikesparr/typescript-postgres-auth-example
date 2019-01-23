import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { Role } from "../role/role.entity";

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public firstName: string;

  @Column()
  public lastName: string;

  @Column()
  public age: number;

  @ManyToMany(type => Role, role => role.users)
  @JoinTable()
  roles: Role[];

}
