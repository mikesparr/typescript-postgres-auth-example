import { Column, Entity, Index, PrimaryGeneratedColumn, JoinTable, ManyToMany } from "typeorm";
import { Goal } from "../goal/goal.entity";
import { Rule } from "../rule/rule.entity";

enum ToggleType {
  PRODUCT = "product",
  USER = "user",
}

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Toggle {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public key: string;

  @Column()
  public name: string;

  @Column()
  public type: string;

  @Column({ nullable: true })
  public product: string;

  @Column({ nullable: true })
  public story: string;

  @Column({ nullable: true })
  public squad: string;

  @Column({ default: true })
  public trackable: boolean;

  @Column({ default: false })
  public enabled: boolean;

  @Column({ default: false })
  public deleted: boolean;

  @ManyToMany((type) => Goal, (goal) => goal.toggles)
  @JoinTable()
  public goals: Goal[];

  @ManyToMany((type) => Rule, (rule) => rule.toggles)
  @JoinTable()
  public rules: Rule[];

}
