import { Column, Entity, Index, PrimaryColumn, ManyToMany } from "typeorm";
import { Toggle } from "../toggle/toggle.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Goal {

  @PrimaryColumn()
  public id: string;

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

  @ManyToMany((type) => Toggle, (toggle) => toggle.goals)
  public toggles: Toggle[];

}
