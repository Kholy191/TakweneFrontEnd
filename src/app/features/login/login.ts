import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ignoreHandledError } from '../../shared/ignore-handled-error';
import { DEMO_ACCOUNTS, DemoAccount } from './demo-accounts';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Button, InputText],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly demoAccounts = DEMO_ACCOUNTS;
  protected readonly signingIn = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.signingIn.set(true);
    this.auth
      .login(email, password)
      .pipe(finalize(() => this.signingIn.set(false)), ignoreHandledError())
      .subscribe(() => void this.router.navigateByUrl('/tracks'));
  }

  // Fills the form with a seeded account and signs in straight away.
  protected loginAs(account: DemoAccount): void {
    this.form.setValue({ email: account.email, password: account.password });
    this.submit();
  }
}
