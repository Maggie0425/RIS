import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RisIconRegistry } from './icons/ris-icon-registry';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(RisIconRegistry).register();
  }
}
