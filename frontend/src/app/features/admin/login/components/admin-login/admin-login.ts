/** Yönetim paneli giriş ekranı. */
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { adminLoginAnimations } from '../../animations/admin-login.animations';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: '../../styles/admin-login.scss',
  animations: adminLoginAnimations,
})
export class AdminLogin {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  emailError(): string | null {
    return this.fieldMessage(this.form.controls.email, {
      required: 'E-posta gerekli.',
      email: 'Geçerli bir e-posta girin.',
    });
  }

  passwordError(): string | null {
    return this.fieldMessage(this.form.controls.password, {
      required: 'Şifre gerekli.',
    });
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { email, password, rememberMe } = this.form.getRawValue();

    this.auth.login({ email, password }, { portal: 'admin', rememberMe }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/admin/access-logs');
      },
      error: () => {
        this.loading.set(false);
        // Tek genel mesaj — e-posta/şifre ayrımı yok (enumeration engeli)
        this.errorMessage.set('Yetkisiz erişim veya hatalı bilgi.');
      },
    });
  }

  private fieldMessage(
    control: AbstractControl,
    messages: Record<string, string>
  ): string | null {
    if (!control.errors || !(control.touched || this.submitted())) {
      return null;
    }

    for (const key of Object.keys(messages)) {
      if (control.hasError(key)) {
        return messages[key];
      }
    }

    return null;
  }
}
