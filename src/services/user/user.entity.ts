import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
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

  @Column()
  public email: string;

  @Column({ nullable: true })
  public password?: string;

  @Column({ nullable: true })
  public avatar?: string;

  @Column({ nullable: true })
  public country?: string;

  @Column({ nullable: true })
  public timeZone?: string;

  @Column({ nullable: true })
  public language?: string;

  @Column({ nullable: true })
  public ip?: string;

  @Column({ nullable: true })
  public age?: number;

  public surrogateEnabled?: boolean;

  public surrogatePrincipal?: User;

  @ManyToMany((type) => Role, (role) => role.users)
  public roles?: Role[];

}
