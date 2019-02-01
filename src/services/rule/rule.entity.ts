import { Column, Entity, Index, PrimaryColumn, ManyToMany } from "typeorm";
import { Toggle } from "../toggle/toggle.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Rule {

  @PrimaryColumn()
  public id: string;

  @Column()
  public name: string;

  @Column()
  public owner: string;

  @Column({ type: "jsonb", nullable: true })
  public included: any;

  @Column({ type: "jsonb", nullable: true })
  public excluded: any;

  @Column({ default: false })
  public deleted: boolean;

  @ManyToMany((type) => Toggle, (toggle) => toggle.rules)
  public toggles: Toggle[];

}
