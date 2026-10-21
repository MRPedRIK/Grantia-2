import { Component, EventEmitter, OnDestroy, Output, signal } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-scanner',
  standalone: true,
  templateUrl: './scanner.component.html'
})
export class ScannerComponent implements OnDestroy {
  @Output() readonly scanned = new EventEmitter<string>();
  readonly active = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  private scanner?: Html5Qrcode;
  private destroyed = false;
  private accepted = false;

  toggle(): void {
    if (this.active()) void this.stop();
    else void this.start();
  }
  private async start(): Promise<void> {
    if (this.loading() || this.active() || this.destroyed) return;
    this.loading.set(true);
    this.error.set('');
    this.accepted = false;
    try {
      if (!window.isSecureContext) throw new Error('A câmera requer HTTPS. Use a busca manual ou abra por HTTPS.');
      this.scanner ??= new Html5Qrcode('camera-reader');
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decodedText: string) => {
          if (this.accepted || !decodedText.trim()) return;
          this.accepted = true;
          void this.stop().then(() => {
            if (!this.destroyed) this.scanned.emit(decodedText.trim());
          });
        },
        () => {}
      );
      if (this.destroyed) await this.stop();
      else if (!this.accepted) this.active.set(true);
    } catch (error) {
      if (!this.destroyed) this.error.set(error instanceof Error ? error.message : 'Não foi possível acessar a câmera.');
    } finally {
      if (!this.destroyed) this.loading.set(false);
    }
  }
  private async stop(): Promise<void> {
    try {
      if (this.scanner?.isScanning) await this.scanner.stop();
    } catch {
      if (!this.destroyed) this.error.set('Não foi possível encerrar a câmera.');
    } finally {
      if (!this.destroyed) this.active.set(false);
    }
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.scanner?.isScanning) void this.scanner.stop().catch(() => {});
  }
}