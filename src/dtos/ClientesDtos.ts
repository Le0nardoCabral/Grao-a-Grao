export type CriarClienteInputDto = {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  dataNascimento?: Date | null;
  planoId: number;
};

export type FiltrosListagemClientesDto = {
  page: number;
  limit: number;
  busca?: string;
  planoId?: number;
  ativo?: boolean;
};

export type PlanoClienteDto = {
  id: number;
  nome: string;
  percentualBps: number;
  limiteCentavos: number;
  mensalidadeCentavos: number;
  minimoUsoCentavos: number;
  dobroAniversario: boolean;
  validadeDias: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ClienteResponseDto = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  dataNascimento: Date | null;
  planoId: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  plano: PlanoClienteDto;
};

export type ListarClientesResponseDto = {
  clientes: ClienteResponseDto[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
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
