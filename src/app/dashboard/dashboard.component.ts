import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Usuario, User } from '../model/user';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public user: User;
  public loadingDados: Boolean = false;
  constructor(public api: ApiService) {
    // this.user = api.getUserDados;
    api.user.subscribe(user => {
      if (user) {
        this.user = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        };
        this.loadingDados = true;
      }
    });
  }

  ngOnInit() {
  }

}
