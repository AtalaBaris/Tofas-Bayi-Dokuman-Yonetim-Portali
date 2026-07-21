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
  initials,
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
  /** Drawer'ı geçici olarak başka section'da açmak için (ör. bayiden kullanıcı ekleme). */
  readonly forcedDrawerSection = signal<DefinitionSection | null>(null);
  readonly userCreatePreset = signal<{ role: string; dealerId: number } | null>(null);
  readonly confirmOpen = signal(false);
  readonly pendingDelete = signal<DefinitionRowTarget | null>(null);
  /** Bayi “Pasif Yap” onayı (kalıcı silmeden ayırt etmek için). */
  readonly pendingDealerPassivate = signal<SimpleDefinitionItem | null>(null);
  /** Son aktif kullanıcı silinmek istenince: yeni kullanıcı eklemeye yönlendir. */
  readonly recoveryDealerId = signal<number | null>(null);
  readonly recoveryUserName = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly listError = signal<string | null>(null);
  readonly listSuccess = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  /** Bayi kullanıcıları yan paneli. */
  readonly dealerUsersTarget = signal<SimpleDefinitionItem | null>(null);

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
  readonly drawerSection = computed(
    () => this.forcedDrawerSection() ?? this.section()
  );

  readonly confirmTitle = computed(() => {
    const recoveryId = this.recoveryDealerId();
    if (recoveryId != null) {
      const name = this.recoveryUserName();
      return name
        ? `"${name}" bu bayinin son aktif kullanıcısı`
        : 'Son aktif kullanıcı kaldırılamaz';
    }
    const passivate = this.pendingDealerPassivate();
    if (passivate) {
      return `"${passivate.name}" bayisi pasife alınsın mı?`;
    }
    const pending = this.pendingDelete();
    if (!pending) {
      return 'Kaydı sil';
    }
    if (pending.kind === 'user') {
      return `"${pending.item.name}" kalıcı silinsin mi?`;
    }
    if (pending.kind === 'item' && this.section() === 'dealers') {
      return `"${pending.item.name}" kalıcı silinsin mi?`;
    }
    return `"${pending.item.name}" pasife alınsın mı?`;
  });

  readonly confirmMessage = computed(() => {
    if (this.recoveryDealerId() != null) {
      const dealerId = this.recoveryDealerId()!;
      const count = this.countDealerUsers(dealerId);
      const dealerName =
        this.allDealers().find((d) => d.id === dealerId)?.name ?? 'bu bayi';
      return `Tek kullanıcıyı silerseniz bayi kullanıcıssız kalır. Yeni kullanıcı ekleyebilir veya “${dealerName}” bayisini ve bağlı ${count} kullanıcıyı kalıcı silebilirsiniz.`;
    }
    const passivate = this.pendingDealerPassivate();
    if (passivate) {
      const count = this.countDealerUsers(passivate.id);
      return `Bayi pasife alınır; bağlı ${count} bayi kullanıcısı da birlikte pasife alınır. Listeden tamamen kaldırmak için “Sil” kullanın.`;
    }
    const pending = this.pendingDelete();
    if (pending?.kind === 'user') {
      return `“${pending.item.name}” kullanıcısı veritabanından kalıcı olarak silinecek. Pasife almak için menüden “Pasif Yap”ı kullanın.`;
    }
    if (pending?.kind === 'item' && this.section() === 'dealers') {
      const count = this.countDealerUsers(pending.item.id);
      return `“${pending.item.name}” bayisi kalıcı silinecek. Bu işleme bağlı ${count} kullanıcı da veritabanından kalıcı olarak silinir. Pasife almak için menüden “Pasif Yap”ı kullanın.`;
    }
    const labels: Record<DefinitionSection, string> = {
      users: 'Kullanıcı soft delete ile pasife alınır; listede Pasif olarak kalır.',
      dealers: 'Bayi soft delete ile pasife alınır; listede Pasif olarak kalır.',
      brands: 'Marka soft delete ile pasife alınır; listede Pasif olarak kalır.',
      categories: 'Kategori soft delete ile pasife alınır; listede Pasif olarak kalır.',
    };
    return labels[this.section()];
  });

  readonly confirmLabel = computed(() => {
    if (this.recoveryDealerId() != null) {
      return 'Bayiyi Kalıcı Sil';
    }
    if (this.pendingDealerPassivate()) {
      return 'Pasife Al';
    }
    if (
      this.pendingDelete()?.kind === 'user' ||
      (this.pendingDelete()?.kind === 'item' && this.section() === 'dealers')
    ) {
      return 'Kalıcı Sil';
    }
    return 'Pasife Al';
  });

  readonly confirmSecondaryLabel = computed(() =>
    this.recoveryDealerId() != null ? 'Yeni Kullanıcı Ekle' : null
  );

  readonly confirmAcknowledgeLabel = computed(() => {
    if (this.recoveryDealerId() != null) {
      return 'Bayi silindiğinde bağlı kullanıcıların da kalıcı olarak silineceğini okudum ve onaylıyorum.';
    }
    if (this.pendingDelete()?.kind === 'item' && this.section() === 'dealers') {
      return 'Bayi silindiğinde bağlı kullanıcıların da kalıcı olarak silineceğini okudum ve onaylıyorum.';
    }
    if (this.pendingDelete()?.kind === 'user') {
      return 'Bu kullanıcının kalıcı olarak silineceğini okudum ve onaylıyorum.';
    }
    return null;
  });

  readonly confirmDanger = computed(() => true);

  readonly confirmShowHint = computed(() => this.recoveryDealerId() == null);

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
          `${item.name} ${item.detail} ${item.code ?? ''} ${(item.brandNames ?? []).join(' ')}`
            .toLocaleLowerCase('tr-TR')
            .includes(query)
        )
      : list;
  });

  readonly dealerUsersPanelUsers = computed(() => {
    const dealer = this.dealerUsersTarget();
    if (!dealer) {
      return [];
    }
    return this.allUsers()
      .filter((user) => user.dealerId === dealer.id && user.role === 'DealerUser')
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  });

  readonly initials = initials;

  constructor() {
    effect(() => {
      this.section();
      this.reload();
    });
  }

  openDrawer(): void {
    this.editTarget.set(null);
    this.forcedDrawerSection.set(null);
    this.userCreatePreset.set(null);
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  openAddUserForDealer(dealer: SimpleDefinitionItem): void {
    this.editTarget.set(null);
    this.forcedDrawerSection.set('users');
    this.userCreatePreset.set({ role: 'DealerUser', dealerId: dealer.id });
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  openDealerUsers(dealer: SimpleDefinitionItem): void {
    this.dealerUsersTarget.set(dealer);
  }

  closeDealerUsers(): void {
    this.dealerUsersTarget.set(null);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editTarget.set(null);
    this.forcedDrawerSection.set(null);
    this.userCreatePreset.set(null);
    this.formError.set(null);
  }

  onEdit(target: DefinitionRowTarget): void {
    this.forcedDrawerSection.set(null);
    this.userCreatePreset.set(null);
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
            initialUser: payload.initialUser!,
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
        this.brandsApi
          .create({
            name: payload.name,
            code: payload.code,
            badgeLabel: payload.badgeLabel,
            badgeColor: payload.badgeColor,
          })
          .subscribe({
            next: (created) => {
              if (payload.active) {
                done.next();
                return;
              }
              this.brandsApi
                .update(created.id, {
                  name: payload.name,
                  code: payload.code,
                  badgeLabel: payload.badgeLabel,
                  badgeColor: payload.badgeColor,
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
            badgeLabel: payload.badgeLabel,
            badgeColor: payload.badgeColor,
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
      if (!nextActive && this.isLastActiveDealerUser(target.item)) {
        this.openLastUserRecovery(target.item);
        return;
      }

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
      // Pasife alma: kullanıcılar da cascade soft-delete — onay diyaloğu.
      if (!nextActive) {
        this.recoveryDealerId.set(null);
        this.recoveryUserName.set(null);
        this.pendingDealerPassivate.set(target.item);
        this.pendingDelete.set(null);
        this.confirmOpen.set(true);
        return;
      }

      this.dealersApi
        .update(target.item.id, {
          name: target.item.name,
          code: target.item.code ?? '',
          isActive: true,
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
          badgeLabel: target.item.badgeLabel,
          badgeColor: target.item.badgeColor,
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
    if (target.kind === 'user' && this.isLastActiveDealerUser(target.item)) {
      this.openLastUserRecovery(target.item);
      return;
    }

    this.listSuccess.set(null);
    this.recoveryDealerId.set(null);
    this.recoveryUserName.set(null);
    this.pendingDealerPassivate.set(null);
    this.pendingDelete.set(target);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
    this.pendingDealerPassivate.set(null);
    this.recoveryDealerId.set(null);
    this.recoveryUserName.set(null);
  }

  confirmDelete(): void {
    const recoveryDealerId = this.recoveryDealerId();
    if (recoveryDealerId != null) {
      const dealerName =
        this.allDealers().find((d) => d.id === recoveryDealerId)?.name ?? 'Bayi';
      const userCount = this.countDealerUsers(recoveryDealerId);
      this.dealersApi.remove(recoveryDealerId).subscribe({
        next: () => {
          this.closeConfirm();
          this.setListSuccess(
            `“${dealerName}” kalıcı silindi. Bağlı ${userCount} kullanıcı da silindi.`
          );
          this.reload();
        },
        error: (err) => {
          this.listError.set(this.readError(err));
          this.closeConfirm();
        },
      });
      return;
    }

    const passivate = this.pendingDealerPassivate();
    if (passivate) {
      const userCount = this.countDealerUsers(passivate.id);
      this.dealersApi
        .update(passivate.id, {
          name: passivate.name,
          code: passivate.code ?? '',
          isActive: false,
          brandIds: passivate.brandIds ?? [],
        })
        .subscribe({
          next: () => {
            this.closeConfirm();
            this.setListSuccess(
              `“${passivate.name}” pasife alındı. Bağlı ${userCount} kullanıcı da pasife alındı.`
            );
            this.reload();
          },
          error: (err) => {
            this.listError.set(this.readError(err));
            this.closeConfirm();
          },
        });
      return;
    }

    const pending = this.pendingDelete();
    if (!pending) {
      return;
    }

    if (pending.kind === 'user') {
      this.usersApi.remove(pending.item.id).subscribe({
        next: () => {
          this.closeConfirm();
          this.setListSuccess(`“${pending.item.name}” kalıcı silindi.`);
          this.reload();
        },
        error: (err: unknown) => {
          this.listError.set(this.readError(err));
          this.closeConfirm();
        },
      });
      return;
    }

    const section = this.section();
    if (section === 'dealers') {
      const userCount = this.countDealerUsers(pending.item.id);
      this.dealersApi.remove(pending.item.id).subscribe({
        next: () => {
          this.closeConfirm();
          this.setListSuccess(
            `“${pending.item.name}” kalıcı silindi. Bağlı ${userCount} kullanıcı da silindi.`
          );
          this.reload();
        },
        error: (err: unknown) => {
          this.listError.set(this.readError(err));
          this.closeConfirm();
        },
      });
      return;
    }

    const done = {
      next: () => {
        this.closeConfirm();
        this.setListSuccess(`“${pending.item.name}” pasife alındı.`);
        this.reload();
      },
      error: (err: unknown) => {
        this.listError.set(this.readError(err));
        this.closeConfirm();
      },
    };

    if (section === 'brands') {
      this.brandsApi.remove(pending.item.id).subscribe(done);
    } else if (section === 'categories') {
      this.categoriesApi.remove(pending.item.id).subscribe(done);
    }
  }

  confirmSecondary(): void {
    const recoveryDealerId = this.recoveryDealerId();
    if (recoveryDealerId == null) {
      return;
    }
    const dealer =
      this.allDealers().find((d) => d.id === recoveryDealerId) ??
      ({
        id: recoveryDealerId,
        name: '',
        detail: '',
        active: true,
      } satisfies SimpleDefinitionItem);
    this.closeConfirm();
    this.openAddUserForDealer(dealer);
  }

  private openLastUserRecovery(user: DefinitionUser): void {
    if (user.dealerId == null) {
      return;
    }
    this.pendingDelete.set(null);
    this.pendingDealerPassivate.set(null);
    this.recoveryDealerId.set(user.dealerId);
    this.recoveryUserName.set(user.name);
    this.confirmOpen.set(true);
  }

  private isLastActiveDealerUser(user: DefinitionUser): boolean {
    if (!user.active || user.role !== 'DealerUser' || user.dealerId == null) {
      return false;
    }
    return !this.allUsers().some(
      (other) =>
        other.id !== user.id &&
        other.active &&
        other.role === 'DealerUser' &&
        other.dealerId === user.dealerId
    );
  }

  private countDealerUsers(dealerId: number): number {
    return this.allUsers().filter(
      (user) => user.dealerId === dealerId && user.role === 'DealerUser'
    ).length;
  }

  private setListSuccess(message: string): void {
    this.listError.set(null);
    this.listSuccess.set(message);
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
