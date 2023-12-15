import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NotificationsComponent } from './views/notifications/notifications.component';
import { NotificationsService } from './views/notifications/notifications.service';
import { JsonDialogComponent } from './views/notifications/json-dialog/json-dialog.component';
import { PrimeNgModule } from './primeng.module';

@NgModule({
  declarations: [AppComponent, NotificationsComponent, JsonDialogComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, PrimeNgModule, HttpClientModule],
  providers: [NotificationsService],
  bootstrap: [AppComponent],
})
export class AppModule {}
