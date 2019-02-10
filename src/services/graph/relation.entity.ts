/**
 * Edges in graph (aka relation) that contain bi-directional
 * relations and metadata as needed
 */
import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany } from "typeorm";

@Entity()
export class Relation {

  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  public relation: string;

  @Column({nullable: true})
  public label: string;

  @Column()
  public sourceType: string;

  @Column()
  public sourceId: string;

  @Column()
  public targetType: string;

  @Column()
  public targetId: string;

  @Column({type: "jsonb", nullable: true})
  public meta: {[key: string]: any};

  @Column()
  public created: Date;

  @Column({nullable: true})
  public modified: Date;

  @Column({default: true})
  public enabled: boolean;

}
