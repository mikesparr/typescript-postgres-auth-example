import { Column, Entity, Index, PrimaryGeneratedColumn, JoinTable, ManyToMany } from "typeorm";
import { Goal } from "./goal.entity";
import { Segment } from "./segment.entity";
import { Environment, EnvironmentType } from "../../interfaces/environment.interface";
import Variant from "../../interfaces/variant.interface";

export enum FlagType {
  PRODUCT = "product",
  USER = "user",
}

/**
 * Data object with annotations to configure database in ORM
 */
@Entity()
export class Flag {

  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  public key: string;

  @Column()
  public name: string;

  @Column({ enum: FlagType, default: FlagType.USER })
  public type?: FlagType;

  @Column({ nullable: true })
  public description?: string;

  @Column({ nullable: true })
  public product?: string;

  @Column({ nullable: true })
  public story?: string;

  @Column({ nullable: true })
  public squad?: string;

  @Column({ default: true })
  public trackable?: boolean;

  @Column({ default: false })
  public enabled?: boolean;

  @Column({ default: true })
  public temporary?: boolean;

  @Column({ default: false })
  public archived?: boolean;

  /**
   * Optionally target specific users in addition to any
   * defined segments. If Environments found, however, it will
   * override globally-specified targets and segments
   */
  @Column({ type: "simple-array", nullable: true })
  public targetEmails?: string[];

  /**
   * Optionally override segments and targets by environment
   * If exists and environment detectable, find appropriate env
   * and override flag.targets and flag.segments accordingly
   */
  @Column({ type: "jsonb", nullable: true })
  public environments?: {[key: string]: Environment};

  /**
   * Add optional weights to variant distribution and goalIds
   * for tracking (additional segmentation). Weights should add to
   * 100 so 30 is served up 30%.
   *
   * If null, then true | false
   * If exist and weight null or 0, then equal distribution
   *
   * { "green": { name: "Green button", weight: 30, goalIds: [ "add-to-cart-green" ] } }
   * { "red": { name: "Red button", weight: 70, goalIds: [ "add-to-cart-red" ] } }
   *
   * In client code, you'd then check:
   * if (showFeature === "green") {
   *   return <Button style={color: "green"} />;
   * } else if (showFeature === "red") {
   *   return <Button style={color: "red"} />;
   * } else {
   *   // old code or omit
   * }
   */
  @Column({ type: "jsonb", nullable: true })
  public variants?: {[key: string]: Variant};

  // these are global to the flag hits, but we may also log variant-defined goal hits
  @ManyToMany((type) => Goal, (goal) => goal.flags)
  @JoinTable()
  public goals?: Goal[];

  @ManyToMany((type) => Segment, (segment) => segment.flags)
  @JoinTable()
  public segments?: Segment[];

}
