import { Pipe, PipeTransform } from '@angular/core';
import { DeliveryStatus } from '../../core/constants/notification';

@Pipe({ name: 'deliveryStatus', standalone: true })
export class DeliveryStatusPipe implements PipeTransform {
  transform(value: number): string {
    return DeliveryStatus[value] ?? `Unknown (${value})`;
  }
}
