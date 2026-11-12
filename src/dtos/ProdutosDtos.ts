export type CriarProdutoInputDto = {
  nome: string;
  descricao?: string | null;
  precoCentavos: number;
};

export type AtualizarProdutoInputDto = {
  nome?: string;
  descricao?: string | null;
  precoCentavos?: number;
};

export type FiltrosListagemProdutosDto = {
  incluirInativos: boolean;
};

export type ProdutoResponseDto = {
  id: number;
  nome: string;
  descricao: string | null;
  precoCentavos: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ListarProdutosResponseDto = ProdutoResponseDto[];
