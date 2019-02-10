import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm";
import { Role } from "./role.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Permission {

  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  public resource: string;

  @Column()
  public action: string;

  @Column()
  public attributes: string;

  @ManyToOne((type) => Role, (role) => role.permissions, {
    onDelete: "CASCADE",
  })
  public role: Role;

}
