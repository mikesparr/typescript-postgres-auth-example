import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { Flag } from "./flag.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Goal {

  @PrimaryGeneratedColumn("uuid")
  public id?: string;

  @Column({ unique: true })
  public key: string;

  @Column()
  public name: string;

  @Column({ type: "bigint", default: 0 })
  public hits?: number;

  @Column({ type: "bigint", default: 0 })
  public uniqueUsers?: number;

  @Column({ type: "bigint", default: 0 })
  public targetHits?: number;

  @Column({ type: "bigint", default: 0 })
  public targetUniqueUsers?: number;

  @Column({ nullable: true })
  public start?: Date;

  @Column({ nullable: true })
  public stop?: Date;

  @Column({ default: false })
  public archived?: boolean;

  @ManyToMany((type) => Flag, (flag) => flag.goals)
  @JoinTable()
  public flags?: Flag[];

}
