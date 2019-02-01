import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { Flag } from "../flag/flag.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Goal {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public key: string;

  @Column()
  public name: string;

  @Column({ type: "bigint", default: 0 })
  public hits: number;

  @Column({ type: "bigint", default: 0 })
  public minHits: number;

  @Column({ type: "bigint", default: 0 })
  public maxHits: number;

  @Column({ type: "bigint", default: 0 })
  public uniqueUsers: number;

  @Column({ type: "bigint", default: 0 })
  public minUniqueUsers: number;

  @Column({ type: "bigint", default: 0 })
  public maxUniqueUsers: number;

  @Column({ nullable: true })
  public start: Date;

  @Column({ nullable: true })
  public stop: Date;

  @Column({ default: false })
  public deleted: boolean;

  @ManyToMany((type) => Flag, (flag) => flag.goals)
  public flags: Flag[];

}
