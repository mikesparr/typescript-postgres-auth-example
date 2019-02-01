import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { Toggle } from "../toggle/toggle.entity";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Segment {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public key: string;

  @Column()
  public name: string;

  @Column({ type: "jsonb", nullable: true })
  public included: any;

  @Column({ type: "jsonb", nullable: true })
  public excluded: any;

  @Column({ default: false })
  public deleted: boolean;

  @ManyToMany((type) => Toggle, (toggle) => toggle.segments)
  public toggles: Toggle[];

}
