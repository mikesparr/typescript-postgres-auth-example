/**
 * Edges in graph (aka relation) that contain bi-directional
 * relations and metadata (aka properties) as needed
 */
import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany } from "typeorm";

@Entity()
@Index("idx_unique_relations", ["relation", "sourceId", "sourceType", "targetId", "targetType"], { unique: true })
export class Relation {

  @PrimaryGeneratedColumn("uuid")
  public id?: string;

  @Column()
  public relation: string;

  @Column({nullable: true})
  public name?: string;

  @Column()
  public sourceType: string;

  @Column()
  public sourceId: string;

  @Column()
  public targetType: string;

  @Column()
  public targetId: string;

  @Column({type: "jsonb", nullable: true})
  public properties?: {[key: string]: any};

  @Column()
  public created?: Date;

  @Column({nullable: true})
  public modified?: Date;

  @Column({default: false})
  public archived?: boolean;

}
