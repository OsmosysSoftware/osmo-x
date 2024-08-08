import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NotificationsComponent } from './views/notifications/notifications.component';
import { NotificationsService } from './views/notifications/notifications.service';
import { JsonDialogComponent } from './views/notifications/json-dialog/json-dialog.component';
import { PrimeNgModule } from './primeng.module';
import { LoginComponent } from './auth/login/login.component';
import { CalendarModule } from 'primeng/calendar';

@NgModule({
  declarations: [AppComponent, NotificationsComponent, JsonDialogComponent, LoginComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    PrimeNgModule,
    HttpClientModule,
    CalendarModule,
  ],
  providers: [NotificationsService, MessageService],
  bootstrap: [AppComponent],
})
export class AppModule {}
