import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  show(message: string, type: 'success' | 'error' = 'error', duration = 5000): void {
    const container = document.getElementById('toast-container') || this.createContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    const icon = type === 'success' ? 'check_circle' : 'error';
    
    toast.innerHTML = `
      <span class="material-symbols-outlined toast__icon" style="font-size: 20px;">${icon}</span>
      <span class="toast__message">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Remove toast after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        toast.remove();
        if (container.childNodes.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.maxWidth = '400px';
    container.style.width = 'calc(100% - 48px)';
    document.body.appendChild(container);
    return container;
  }
}
