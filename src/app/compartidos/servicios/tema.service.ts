import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemaService {
  isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem('dark-theme');
    if (saved === 'true') {
      this.isDark.set(true);
      document.body.classList.add('dark-theme');
    }
  }

  toggle() {
    this.isDark.set(!this.isDark());
    if (this.isDark()) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('dark-theme', 'true');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('dark-theme', 'false');
    }
  }
}
