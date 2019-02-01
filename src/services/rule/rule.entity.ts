import { Column, Entity, Index, PrimaryColumn, ManyToMany } from "typeorm";
import { Toggle } from "../toggle/toggle.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
@Index({ unique: true })
export class Rule {

  @PrimaryColumn()
  @Index({ unique: true })
  public id: string;

  @Column()
  public name: string;

  @Column()
  public owner: string;

  @Column({ type: "json", nullable: true })
  public included: any;

  @Column({ type: "json", nullable: true })
  public excluded: any;

  @Column({ default: false })
  public deleted: boolean;

  @ManyToMany((type) => Toggle, (toggle) => toggle.rules)
  public toggles: Toggle[];

}
