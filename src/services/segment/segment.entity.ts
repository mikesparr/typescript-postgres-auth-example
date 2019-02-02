import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { Flag } from "../flag/flag.entity";

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

  @Column({ type: "simple-array", nullable: true })
  public included: number[] | string[];

  @Column({ type: "simple-array", nullable: true })
  public excluded: number[];

  @Column({ type: "jsonb", nullable: true })
  public rules: any;

  @Column({ default: false })
  public deleted: boolean;

  @ManyToMany((type) => Flag, (flag) => flag.segments)
  public flags: Flag[];

}
