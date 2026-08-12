import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface SystemStatus {
  id: number;
  serviceName: string;
  message: string;
}

@Component({
  selector: 'app-root',
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly statuses = signal<SystemStatus[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    this.http.get<SystemStatus[]>('http://localhost:8080/api/status').subscribe({
      next: (statuses) => {
        this.statuses.set(statuses);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Cannot reach the RIS backend. Check that Spring Boot and PostgreSQL are running.');
        this.loading.set(false);
      },
    });
  }
}
