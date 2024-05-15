import { IsNotEmpty, isNotEmpty } from "class-validator";

export class KapsystemDataDto {
    // @IsNotEmpty()
    // sender: string;

    @IsNotEmpty()
    SMSText: string;

    @IsNotEmpty()
    GSM: string;
}