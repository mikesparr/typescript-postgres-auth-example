/**
 * Nodes in graph that contain bi-directional
 * relations and metadata as needed
 */
import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToMany } from "typeorm";

@Entity()
export class Node {

  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  public type: string;

  @Column()
  public ref?: string; // external record ID

  @Column({nullable: true})
  public name?: string;

  @Column({type: "text", nullable: true})
  public content?: string;

  @Column({type: "jsonb", nullable: true})
  public properties?: {[key: string]: any};

  @Column()
  public created: Date;

  @Column({nullable: true})
  public modified?: Date;

  @Column({default: false})
  public archived?: boolean;

  @Column({default: 1})
  public sort?: number;

}
