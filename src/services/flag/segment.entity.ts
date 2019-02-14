import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { Flag } from "./flag.entity";
import { Rule, RuleType } from "../../interfaces/rule.interface";

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Segment {

  @PrimaryGeneratedColumn("uuid")
  public id?: string;

  @Column({ unique: true })
  public key: string;

  @Column()
  public name: string;

  // email addresses of user
  @Column({ type: "simple-array", nullable: true })
  public included?: string[];

  // email addresses of user
  @Column({ type: "simple-array", nullable: true })
  public excluded?: string[];

  /**
   * {type: "user", expression: 'country == "US"'}
   * NOTE: single quotes around value so double quote within for lexer
   */
  @Column({ type: "jsonb", nullable: true })
  public rules?: Rule[];

  @Column({ default: false })
  public archived?: boolean;

  @ManyToMany((type) => Flag, (flag) => flag.segments)
  @JoinTable()
  public flags?: Flag[];

}
