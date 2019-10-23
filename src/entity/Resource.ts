import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Vulnerability } from './Vulnerability';

@Entity()
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  description: string;
  @Column()
  url: string;
}
