import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, humanError } from '../core/api.service';
import { ActionType, ACTION_LABELS, AssetDetails, MovementInput, NEXT_ACTION, STATUS_LABELS, User } from '../core/models';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './workflow.component.html'
})
export class WorkflowComponent implements OnChanges {
  @Input({ required: true }) asset!: AssetDetails;
  @Input({ required: true }) user!: User;
  @Output() readonly changed = new EventEmitter<void>();
  private readonly api = inject(ApiService);
  readonly actionLabels = ACTION_LABELS;
  readonly statusLabels = STATUS_LABELS;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly technicians = signal<User[]>([]);
  assignedTechId: number | null = null;
  collector = '';
  deliverer = '';
  notes = '';

  get action(): ActionType { return NEXT_ACTION[this.asset.status]; }
  get permitted(): boolean {
    if (this.action === 'send' || this.action === 'delivered') return true;
    if (this.user.role === 'admin') return true;
    return this.user.role === 'tech' && (this.action !== 'return' || this.asset.assigned_tech_id === this.user.id);
  }
  ngOnChanges(): void {
    this.error.set(''); this.success.set('');
    if (this.asset.status === 'at_hq' && this.technicians().length === 0) {
      void this.api.technicians().then(techs => this.technicians.set(techs))
        .catch(e => this.error.set(humanError(e)));
    }
  }
  async submit() {
    if (this.busy() || !this.permitted) return;
    this.error.set(''); this.success.set(''); this.busy.set(true);
    const input: MovementInput = {
      action: this.action, patrimony_number: this.asset.patrimony_number,
      version: this.asset.version, notes: this.notes.trim()
    };
    if (this.action === 'assign') {
      if (!this.assignedTechId) { this.error.set('Selecione um técnico responsável.'); this.busy.set(false); return; }
      input.assigned_tech_id = this.assignedTechId;
    }
    if (this.action === 'return') {
      input.collector = this.collector.trim(); input.deliverer = this.deliverer.trim();
    }
    try {
      await this.api.movement(input);
      this.notes = ''; this.collector = ''; this.deliverer = ''; this.assignedTechId = null;
      this.success.set('Movimentação registrada com sucesso.');
      this.changed.emit();
    } catch (e) { this.error.set(humanError(e)); }
    finally { this.busy.set(false); }
  }
  label(action: ActionType): string { return ACTION_LABELS[action]; }
  date(value: string): string { return new Date(value).toLocaleString('pt-BR'); }
}