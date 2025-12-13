import{Column, Entity, PrimaryColumn} from "typeorm";
@Entity("minings")
export class MiningEntity{

    @PrimaryColumn()
    id:string;
    @Column()
    uid:string
    @Column()
    email:string
    @Column()
    min_created_at:number
    @Column()
    min_updated_at:number
    @Column()
    min_subscription_id:string
    @Column()
    hash_rate:string

}