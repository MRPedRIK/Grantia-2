import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/auth.service';
import { ApiService, humanError } from './core/api.service';
import { AssetDetails, AssetInput, UserInput } from './core/models';
import { ScannerComponent } from './components/scanner.component';
import { WorkflowComponent } from './components/workflow.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, ScannerComponent, WorkflowComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly asset = signal<AssetDetails | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly busy = signal(false);
  readonly online = signal(navigator.onLine);
  readonly tab = signal<'scan'|'assets'|'users'>('scan');
  email = ''; password = ''; searchTerm = '';
  newAsset: AssetInput = { patrimony_number: '', device_type: '', model: '', current_location: '' };
  newUser: UserInput = { name: '', email: '', password: '', role: 'user' };

  @HostListener('window:online') onOnline() { this.online.set(true); }
  @HostListener('window:offline') onOffline() { this.online.set(false); }

  private clearMessages() { this.error.set(''); this.notice.set(''); }
  async login() {
    this.clearMessages(); this.busy.set(true);
    try { await this.auth.login(this.email.trim(), this.password); this.password = ''; }
    catch (e) { this.error.set(humanError(e)); }
    finally { this.busy.set(false); }
  }
  logout() {
    this.auth.logout(); this.asset.set(null); this.tab.set('scan'); this.clearMessages();
  }
  changeTab(tab: 'scan'|'assets'|'users') {
    this.tab.set(tab); this.clearMessages();
  }
  async lookup(value: string) {
    if (!value.trim()) return;
    this.clearMessages(); this.busy.set(true); this.searchTerm = value.trim();
    try { this.asset.set(await this.api.asset(value)); }
    catch (e) { this.asset.set(null); this.error.set(humanError(e)); }
    finally { this.busy.set(false); }
  }
  async registerAsset() {
    this.clearMessages(); this.busy.set(true);
    try {
      const patrimony = this.newAsset.patrimony_number.trim();
      await this.api.createAsset(this.newAsset);
      this.newAsset = { patrimony_number: '', device_type: '', model: '', current_location: '' };
      this.tab.set('scan');
      this.asset.set(await this.api.asset(patrimony));
      this.notice.set('Equipamento cadastrado com sucesso.');
    } catch (e) { this.error.set(humanError(e)); }
    finally { this.busy.set(false); }
  }
  async registerUser() {
    this.clearMessages(); this.busy.set(true);
    try {
      await this.api.createUser(this.newUser);
      this.newUser = { name: '', email: '', password: '', role: 'user' };
      this.notice.set('Pessoa cadastrada com sucesso.');
    } catch (e) { this.error.set(humanError(e)); }
    finally { this.busy.set(false); }
  }
  async refreshAsset() {
    const asset = this.asset();
    if (asset) await this.lookup(asset.patrimony_number);
  }
}