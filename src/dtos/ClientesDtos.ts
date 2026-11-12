export type CriarClienteInputDto = {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  dataNascimento?: Date | null;
  planoId: number;
};

export type AtualizarClienteInputDto = {
  nome?: string;
  email?: string | null;
  telefone?: string | null;
  dataNascimento?: Date | null;
};

export type FiltrosListagemClientesDto = {
  pagina: number;
  limite: number;
  incluirInativos: boolean;
};

export type BuscarClienteInputDto = {
  id: number;
  incluirInativos: boolean;
};

export type DesativarClienteInputDto = { id: number };
export type DesativarClienteResponseDto = void;
export type ReativarClienteInputDto = { id: number };
export type ExtratoClienteInputDto = { id: number; incluirInativos: boolean };

export type ClienteResponseDto = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  plano: { id: number; nome: string };
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type CriarClienteResponseDto = ClienteResponseDto;
export type BuscarClienteResponseDto = ClienteResponseDto;
export type AtualizarClienteResponseDto = ClienteResponseDto;
export type ReativarClienteResponseDto = ClienteResponseDto;
export type TrocarPlanoResponseDto = ClienteResponseDto;

export type ListarClientesResponseDto = {
  dados: ClienteResponseDto[];
  pagina: number;
  limite: number;
  total: number;
};

export type ExtratoClienteResponseDto = {
  clienteId: number;
  saldoDisponivelCentavos: number;
  lotesAVencer: Array<{
    id: number;
    saldoCentavos: number;
    venceEm: Date;
  }>;
  movimentos: Array<{
    tipo: "CREDITO" | "USO" | "EXPIRACAO";
    valorCentavos: number;
    ocorreuEm: Date;
    compraId: number | null;
    loteId: number;
  }>;
};

export type TrocarPlanoInputDto = {
  planoId: number;
};

