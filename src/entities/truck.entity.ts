import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('trucks')
@Index(['truckNumber'], { unique: true })
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ===============================
  // BASIC TRUCK DETAILS
  // ===============================

  @Column({ length: 20 })
  truckNumber: string;

  @Column()
  ownerName: string;

  @Column({ length: 15 })
  ownerContactNumber: string;

  @Column()
  driverName: string;
  @Column({ length: 15 })
  driverContactNumber: string;

  @Column({ default: 0 })
  claimCount: number;

  // ===============================
  // ADDRESS / ROUTE
  // ===============================

  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  officeAddress: string[] | null;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  route: string[] | null;

  // ===============================
  // DOCUMENTS
  // ===============================

  @Column({ type: 'varchar', length: 255, nullable: true })
  permit: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  licence: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  challan: string | null;

  // ===============================
  // RELATION
  // ===============================

  @OneToMany(() => Invoice, (invoice) => invoice.truck)
  invoices: Invoice[];

  // ===============================
  // SYSTEM
  // ===============================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
