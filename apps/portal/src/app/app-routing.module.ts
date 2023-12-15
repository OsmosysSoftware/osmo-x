import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsComponent } from './views/notifications/notifications.component';
import { GraphQLModule } from './graphql/graphql.module';

const routes: Routes = [{ path: 'notifications', component: NotificationsComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes), GraphQLModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
