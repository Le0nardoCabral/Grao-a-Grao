export type NovoPlanoInputDto = {
  nome: string;
  percentualBps: number;
  limiteCentavos: number;
  mensalidadeCentavos: number;
  minimoUsoCentavos: number;
  dobroAniversario: boolean;
  validadeDias: number;
};

export type AtualizacaoPlanoInputDto = Partial<NovoPlanoInputDto>;

export type FiltrosListagemPlanosDto = {
  pagina: number;
  limite: number;
  incluirInativos: boolean;
};

export type PlanoResponseDto = {
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

export type ListarPlanosResponseDto = {
  dados: PlanoResponseDto[];
  pagina: number;
  limite: number;
  total: number;
};
