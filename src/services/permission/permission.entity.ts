import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Role } from "../role/role.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Permission {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public resource: string;

  @Column()
  public action: string;

  @Column()
  public attributes: string;

  @ManyToOne(type => Role, role => role.permissions)
  role: Role

}