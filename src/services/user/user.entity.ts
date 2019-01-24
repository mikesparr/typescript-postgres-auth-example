import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { Role } from "../role/role.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class User {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public firstName: string;

  @Column()
  public lastName: string;

  @Column({ nullable: true })
  public age: number;

  @Column()
  public email: string;

  @Column({ nullable: true })
  public password: string;

  @ManyToMany(type => Role, role => role.users)
  @JoinTable()
  roles: Role[];

}
