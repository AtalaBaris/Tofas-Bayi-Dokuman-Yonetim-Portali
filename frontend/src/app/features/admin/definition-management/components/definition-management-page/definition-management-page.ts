import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ConfirmDialog } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { BrandService } from '../../../../../core/services/brand.service';
import { CategoryService } from '../../../../../core/services/category.service';
import { DealerService } from '../../../../../core/services/dealer.service';
import { UserAdminService } from '../../../../../core/services/user-admin.service';
import type { BrandDto, DealerDto } from '../../../../../core/models/definition.models';
import { DefinitionTable, type DefinitionRowTarget } from '../definition-table/definition-table';
import {
  DefinitionDrawer,
  type DefinitionDrawerSavePayload,
  type DefinitionEditTarget,
} from '../definition-drawer/definition-drawer';
import { definitionManagementAnimations } from '../../animations/definition-management.animations';
import {
  DEFINITION_LABELS,
  isDefinitionSection,
  mapBrand,
  mapCategory,
  mapDealer,
  mapUser,
  type DefinitionSection,
  type DefinitionUser,
  type SimpleDefinitionItem,
} from '../../models/definition-management.model';

@Component({
  selector: 'app-definition-management-page',
  imports: [DefinitionTable, DefinitionDrawer, ConfirmDialog],
  templateUrl: './definition-management-page.html',
  styleUrl: '../../styles/definition-management-page.scss',
  animations: definitionManagementAnimations,
})
export class DefinitionManagementPage {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(UserAdminService);
  private readonly dealersApi = inject(DealerService);
  private readonly brandsApi = inject(BrandService);
  private readonly categoriesApi = inject(CategoryService);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly search = signal('');
  readonly drawerOpen = signal(false);
  readonly editTarget = signal<DefinitionEditTarget>(null);
  readonly confirmOpen = signal(false);
  readonly pendingDelete = signal<DefinitionRowTarget | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly listError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  readonly allUsers = signal<DefinitionUser[]>([]);
  readonly allDealers = signal<SimpleDefinitionItem[]>([]);
  readonly allBrands = signal<SimpleDefinitionItem[]>([]);
  readonly allCategories = signal<SimpleDefinitionItem[]>([]);
  readonly dealerOptions = signal<DealerDto[]>([]);
  readonly brandOptions = signal<BrandDto[]>([]);

  readonly section = computed<DefinitionSection>(() => {
    const value = this.params().get('section');
    return isDefinitionSection(value) ? value : 'users';
  });

  readonly title = computed(() => DEFINITION_LABELS[this.section()]);
  readonly searchPlaceholder = computed(() => `${this.title()} içinde ara...`);

  readonly confirmTitle = computed(() => {
    const pending = this.pendingDelete();
    if (!pending) {
      return 'Kaydı sil';
    }
    return `"${pending.item.name}" pasife alınsın mı?`;
  });

  readonly confirmMessage = computed(() => {
    const labels: Record<DefinitionSection, string> = {
      users: 'Kullanıcı soft delete ile pasife alınır; listede Pasif olarak kalır.',
      dealers: 'Bayi soft delete ile pasife alınır; listede Pasif olarak kalır.',
      brands: 'Marka soft delete ile pasife alınır; listede Pasif olarak kalır.',
      categories: 'Kategori soft delete ile pasife alınır; listede Pasif olarak kalır.',
    };
    return labels[this.section()];
  });

  readonly users = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('tr-TR');
    const list = this.allUsers();
    if (!query) {
      return list;
    }
    return list.filter((user) =>
      [user.name, user.email, user.roleLabel, user.dealer].some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(query)
      )
    );
  });

  readonly items = computed(() => {
    const section = this.section();
    if (section === 'users') {
      return [];
    }
    const query = this.search().trim().toLocaleLowerCase('tr-TR');
    const list = this.listForSection(section)();
    return query
      ? list.filter((item) =>
          `${item.name} ${item.detail}`.toLocaleLowerCase('tr-TR').includes(query)
        )
      : list;
  });

  constructor() {
    effect(() => {
      this.section();
      this.reload();
    });
  }

  openDrawer(): void {
    this.editTarget.set(null);
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editTarget.set(null);
    this.formError.set(null);
  }

  onEdit(target: DefinitionRowTarget): void {
    this.editTarget.set(target);
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  saveDefinition(payload: DefinitionDrawerSavePayload): void {
    this.saving.set(true);
    this.formError.set(null);

    const done = {
      next: () => {
        this.saving.set(false);
        this.closeDrawer();
        this.reload();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.formError.set(this.readError(err));
      },
    };

    if (payload.section === 'users') {
      if (payload.id == null) {
        this.usersApi
          .create({
            name: payload.name,
            email: payload.email,
            password: payload.password,
            role: payload.role,
            dealerId: payload.dealerId,
          })
          .subscribe({
            next: (created) => {
              if (payload.active) {
                done.next();
                return;
              }
              this.usersApi
                .update(created.id, {
                  name: payload.name,
                  role: payload.role,
                  dealerId: payload.dealerId,
                  isActive: false,
                })
                .subscribe(done);
            },
            error: done.error,
          });
      } else {
        this.usersApi
          .update(payload.id, {
            name: payload.name,
            role: payload.role,
            dealerId: payload.dealerId,
            isActive: payload.active,
          })
          .subscribe(done);
      }
      return;
    }

    if (payload.section === 'dealers') {
      if (payload.id == null) {
        this.dealersApi
          .create({
            name: payload.name,
            code: payload.code,
            brandIds: payload.brandIds,
          })
          .subscribe({
            next: (created) => {
              if (payload.active) {
                done.next();
                return;
              }
              this.dealersApi
                .update(created.id, {
                  name: payload.name,
                  code: payload.code,
                  isActive: false,
                  brandIds: payload.brandIds,
                })
                .subscribe(done);
            },
            error: done.error,
          });
      } else {
        this.dealersApi
          .update(payload.id, {
            name: payload.name,
            code: payload.code,
            isActive: payload.active,
            brandIds: payload.brandIds,
          })
          .subscribe(done);
      }
      return;
    }

    if (payload.section === 'brands') {
      if (payload.id == null) {
        this.brandsApi.create({ name: payload.name, code: payload.code }).subscribe({
          next: (created) => {
            if (payload.active) {
              done.next();
              return;
            }
            this.brandsApi
              .update(created.id, {
                name: payload.name,
                code: payload.code,
                isActive: false,
              })
              .subscribe(done);
          },
          error: done.error,
        });
      } else {
        this.brandsApi
          .update(payload.id, {
            name: payload.name,
            code: payload.code,
            isActive: payload.active,
          })
          .subscribe(done);
      }
      return;
    }

    if (payload.id == null) {
      this.categoriesApi
        .create({ name: payload.name, description: payload.description })
        .subscribe({
          next: (created) => {
            if (payload.active) {
              done.next();
              return;
            }
            this.categoriesApi
              .update(created.id, {
                name: payload.name,
                description: payload.description,
                isActive: false,
              })
              .subscribe(done);
          },
          error: done.error,
        });
    } else {
      this.categoriesApi
        .update(payload.id, {
          name: payload.name,
          description: payload.description,
          isActive: payload.active,
        })
        .subscribe(done);
    }
  }

  onToggleActive(target: DefinitionRowTarget): void {
    const nextActive = !target.item.active;

    if (target.kind === 'user') {
      this.usersApi
        .update(target.item.id, {
          name: target.item.name,
          role: target.item.role,
          dealerId: target.item.dealerId,
          isActive: nextActive,
        })
        .subscribe({
          next: () => this.reload(),
          error: (err) => this.listError.set(this.readError(err)),
        });
      return;
    }

    const section = this.section();
    if (section === 'dealers') {
      this.dealersApi
        .update(target.item.id, {
          name: target.item.name,
          code: target.item.code ?? '',
          isActive: nextActive,
          brandIds: target.item.brandIds ?? [],
        })
        .subscribe({
          next: () => this.reload(),
          error: (err) => this.listError.set(this.readError(err)),
        });
      return;
    }

    if (section === 'brands') {
      this.brandsApi
        .update(target.item.id, {
          name: target.item.name,
          code: target.item.code ?? '',
          isActive: nextActive,
        })
        .subscribe({
          next: () => this.reload(),
          error: (err) => this.listError.set(this.readError(err)),
        });
      return;
    }

    if (section === 'categories') {
      this.categoriesApi
        .update(target.item.id, {
          name: target.item.name,
          description: target.item.description ?? '',
          isActive: nextActive,
        })
        .subscribe({
          next: () => this.reload(),
          error: (err) => this.listError.set(this.readError(err)),
        });
    }
  }

  onDeleteRequest(target: DefinitionRowTarget): void {
    this.pendingDelete.set(target);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const pending = this.pendingDelete();
    if (!pending) {
      return;
    }

    const done = {
      next: () => {
        this.closeConfirm();
        this.reload();
      },
      error: (err: unknown) => {
        this.listError.set(this.readError(err));
        this.closeConfirm();
      },
    };

    if (pending.kind === 'user') {
      this.usersApi.remove(pending.item.id).subscribe(done);
      return;
    }

    const section = this.section();
    if (section === 'dealers') {
      this.dealersApi.remove(pending.item.id).subscribe(done);
    } else if (section === 'brands') {
      this.brandsApi.remove(pending.item.id).subscribe(done);
    } else if (section === 'categories') {
      this.categoriesApi.remove(pending.item.id).subscribe(done);
    }
  }

  private reload(): void {
    this.loading.set(true);
    this.listError.set(null);

    forkJoin({
      users: this.usersApi.list(),
      dealers: this.dealersApi.list(),
      brands: this.brandsApi.list(),
      categories: this.categoriesApi.list(),
    }).subscribe({
      next: ({ users, dealers, brands, categories }) => {
        this.allUsers.set(users.map(mapUser));
        this.allDealers.set(dealers.map(mapDealer));
        this.allBrands.set(brands.map(mapBrand));
        this.allCategories.set(categories.map(mapCategory));
        this.dealerOptions.set(dealers);
        this.brandOptions.set(brands);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.listError.set(this.readError(err));
      },
    });
  }

  private listForSection(section: Exclude<DefinitionSection, 'users'>) {
    switch (section) {
      case 'dealers':
        return this.allDealers;
      case 'brands':
        return this.allBrands;
      case 'categories':
        return this.allCategories;
    }
  }

  private readError(err: unknown): string {
    // errorInterceptor düz { status, message } fırlatır; HttpErrorResponse nadiren gelir.
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = String((err as { message: unknown }).message).trim();
      if (msg) {
        return msg;
      }
    }
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body?.message) {
        return String(body.message);
      }
      if (err.status === 401) {
        return 'Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.';
      }
      if (err.status === 403) {
        return 'Bu işlem için Admin yetkisi gerekli.';
      }
      if (err.status === 0) {
        return 'API’ye ulaşılamadı. Backend çalışıyor mu?';
      }
      return `İşlem başarısız (HTTP ${err.status}).`;
    }
    return 'Beklenmeyen bir hata oluştu.';
  }
}
