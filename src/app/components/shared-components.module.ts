import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { LoadingComponent } from './loading/loading.component';
import { LoginButtonComponent } from './login-button/login-button.component';
import { LogoutButtonComponent } from './logout-button/logout-button.component';
import { AuthenticationButtonComponent } from './authentication-button/authentication-button.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { AppMaterialModule } from '../app-material.module';

@NgModule({
  declarations: [
    LoadingComponent,
    LoginButtonComponent,
    LogoutButtonComponent,
    AuthenticationButtonComponent,
    NavBarComponent,
   ],
  imports: [
    CommonModule,
    AppMaterialModule,
    RouterModule,
  ],
  exports: [
    LoadingComponent,
    LoginButtonComponent,
    LogoutButtonComponent,
    AuthenticationButtonComponent,
    NavBarComponent,
  ]
})
export class SharedComponentsModule {}
