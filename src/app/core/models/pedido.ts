export type EstadoPedido =
  | 'CREADO'
  | 'ACEPTADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface ItemPedido {
  productoId: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario?: number;
}

export interface Pedido {
  id?: number;
  clienteUsername?: string;
  estado?: EstadoPedido;
  fechaCreacion?: string;
  items: ItemPedido[];
}

export const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  CREADO: ['ACEPTADO', 'CANCELADO'],
  ACEPTADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['DESPACHADO', 'CANCELADO'],
  DESPACHADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: []
};
