export type Role = 'admin' | 'tech' | 'user';
export type AssetStatus = 'available' | 'in_transit_hq' | 'at_hq' | 'in_repair' | 'in_transit_user';
export type ActionType = 'send' | 'receive' | 'assign' | 'return' | 'delivered';

export interface User { id: number; name: string; role: Role; }
export interface LoginResponse { token: string; user: User; }
export interface Asset {
  id: number; patrimony_number: string; device_type: string; model: string;
  current_location: string; home_location: string; status: AssetStatus; version: number;
  assigned_tech_id: number | null; tech_name: string | null;
}
export interface MovementLog {
  id: number; action_type: ActionType; from_location: string; to_location: string;
  handler_name: string; timestamp: string; collector: string | null;
  deliverer: string | null; notes: string | null;
}
export interface Ticket {
  id: number; status: 'open' | 'closed'; description: string;
  created_at: string; closed_at: string | null;
}
export interface AssetDetails extends Asset { logs: MovementLog[]; tickets: Ticket[]; }
export interface AssetInput {
  patrimony_number: string; device_type: string; model: string; current_location: string;
}
export interface UserInput { name: string; email: string; password: string; role: Role; }
export interface MovementInput {
  patrimony_number: string; version: number; action: ActionType; notes: string;
  assigned_tech_id?: number; collector?: string; deliverer?: string;
}
export const STATUS_LABELS: Record<AssetStatus, string> = {
  available: 'Na unidade', in_transit_hq: 'A caminho da sede',
  at_hq: 'Recebido na sede', in_repair: 'Em manutenção',
  in_transit_user: 'Voltando à unidade'
};
export const ACTION_LABELS: Record<ActionType, string> = {
  send: 'Enviar para a sede', receive: 'Confirmar recebimento',
  assign: 'Atribuir técnico', return: 'Enviar de volta',
  delivered: 'Confirmar entrega'
};
export const NEXT_ACTION: Record<AssetStatus, ActionType> = {
  available: 'send', in_transit_hq: 'receive',
  at_hq: 'assign', in_repair: 'return',
  in_transit_user: 'delivered'
};