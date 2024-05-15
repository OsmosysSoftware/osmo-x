import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../providers.service';
import { firstValueFrom } from 'rxjs';

export interface KapsystemData {
    SMSText: string;
    GSM: string;
}

@Injectable()
export class SmsKapsystemService {
    private apiUrl;
    private username;
    private password;
    private senderId;

    constructor(
        private httpService: HttpService,
        private readonly providersService: ProvidersService
    ) {}

    async assignKAPSystemValues(providerId: number): Promise<void> {
        const smsKapsystemConfig = await this.providersService.getConfigById(providerId);
        this.apiUrl = smsKapsystemConfig.KAP_SMS_ACCOUNT_API_URL as string
        this.username = smsKapsystemConfig.KAP_SMS_ACCOUNT_USERNAME as string;
        this.password = smsKapsystemConfig.KAP_SMS_ACCOUNT_PASSWORD as string;
        this.senderId = smsKapsystemConfig.KAP_SMS_ACCOUNT_SENDER_ID as string;
    }

    async sendMessage(body: KapsystemData, providerId: number): Promise<any> {
        await this.assignKAPSystemValues(providerId);

        function objToQueryString(obj: KapsystemData ): string {
            let queryString = ""
            for (let key in obj) {
                if (queryString != "") {
                    queryString += "&";
                }
                queryString += (key + "=" + encodeURIComponent(obj[key]));
            }
            return queryString;
        }

        this.apiUrl = this.apiUrl + `?username=${this.username}&password=${this.password}&sender=${this.senderId}&` + objToQueryString(body);
        const response = await this.httpService.get(this.apiUrl).toPromise();
        // const res = firstValueFrom(response);
        console.log('Api url ' + this.apiUrl + '\nRESSSSSSSSSSSSSSSS: ', response.data + '\nMessage' + body.SMSText)
        return response.data
    }
}
