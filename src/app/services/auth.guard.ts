import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

// Services
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  usuario: any;

  constructor (
    private authService: AuthService,
    private database: DatabaseService,
    private router: Router) {
    }
  canActivate () {
    return this.authService.isLogin ()
      .then (async (user: firebase.User) => {
        if (user) {
            let usuario: any = await this.database.get_usuario_to_promise (user.uid);
            // if (usuario.tipo === 1) {
            //   return true;
            // } else {
            //   return false;
            // }
            return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      });
  }
}
