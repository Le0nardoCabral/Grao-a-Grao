export type ItemCompraInputDto = {
  produtoId: number;
  quantidade: number;
};

export type CriarCompraInputDto = {
  clienteId: number;
  itens: ItemCompraInputDto[];
  cashbackSolicitadoCentavos?: number;
};

export type IdempotencyKeyInputDto = string;

export type CompraResponseDto = {
  id: number;
  clienteId: number;
  usuarioId: number;
  valorBrutoCentavos: number;
  cashbackUsadoCentavos: number;
  valorPagoCentavos: number;
  cashbackGeradoCentavos: number;
  cashbackCortadoCentavos: number;
  criadaEm: Date;
  itens: Array<{
    produtoId: number;
    quantidade: number;
    precoUnitarioCentavos: number;
    subtotalCentavos: number;
  }>;
};

export type CriarCompraResponseDto = {
  compra: CompraResponseDto;
  cashbackCalculadoCentavos: number;
  cashbackCortadoCentavos: number;
  saldoDisponivelCentavos: number;
  limiteAtingido: boolean;
  motivoCashbackNaoGerado: "LIMITE_DO_PLANO_ATINGIDO" | "VALOR_ARREDONDADO_PARA_ZERO" | null;
  mensagemLimite: string | null;
};

export type CriarCompraResultadoDto = CriarCompraResponseDto & {
  repetida: boolean;
};
