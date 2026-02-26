import { Pipe, PipeTransform } from '@angular/core';
import { ChannelType } from '../../core/constants/notification';

@Pipe({ name: 'channelType', standalone: true })
export class ChannelTypePipe implements PipeTransform {
  transform(value: number): string {
    return ChannelType[value] ?? `Unknown (${value})`;
  }
}
