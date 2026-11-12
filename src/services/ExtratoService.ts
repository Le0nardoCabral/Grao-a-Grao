import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { ExtratoRepository } from "../repositories/ExtratoRepository.js";
import { adicionarDiasEmBrasilia } from "./CashbackDateService.js";
import type { ExtratoClienteResponseDto } from "../dtos/ClientesDtos.js";

type ClienteExtrato = { id: number; ativo: boolean };
type LoteAVencer = { id: number; saldoCentavos: number; venceEm: Date };
type Credito = {
  id: number;
  compraOrigemId: number;
  valorOriginalCentavos: number;
  geradoEm: Date;
};
type Uso = {
  id: number;
  compraId: number;
  loteId: number;
  valorCentavos: number;
  criadoEm: Date;
};
type Expiracao = { id: number; saldoCentavos: number; venceEm: Date };

export type ExtratoRepositoryPort = {
  buscarCliente(clienteId: number): Promise<ClienteExtrato | null>;
  buscarSaldoDisponivel(clienteId: number, agora: Date): Promise<number>;
  buscarLotesAVencer(clienteId: number, agora: Date, limite: Date): Promise<LoteAVencer[]>;
  buscarCreditosRecentes(clienteId: number): Promise<Credito[]>;
  buscarUsosRecentes(clienteId: number): Promise<Uso[]>;
  buscarExpiracoesRecentes(clienteId: number, agora: Date): Promise<Expiracao[]>;
};

type Movimento = {
  tipo: "CREDITO" | "USO" | "EXPIRACAO";
  valorCentavos: number;
  ocorreuEm: Date;
  compraId: number | null;
  loteId: number;
  origemId: number;
};

export class ExtratoService {
  constructor(private readonly repository: ExtratoRepositoryPort = new ExtratoRepository()) {}

  async executar(clienteId: number, incluirInativos: boolean, agora = new Date()): Promise<ExtratoClienteResponseDto> {
    const cliente = await this.repository.buscarCliente(clienteId);
    if (!cliente || (!cliente.ativo && !incluirInativos)) {
      throw new AppError(ErrorMessages.CLIENT_NOT_FOUND, 404, "CLIENT_NOT_FOUND");
    }

    const limiteLotesAVencer = adicionarDiasEmBrasilia(agora, 30);
    const [saldoDisponivelCentavos, lotesAVencer, creditos, usos, expiracoes] = await Promise.all([
      this.repository.buscarSaldoDisponivel(clienteId, agora),
      this.repository.buscarLotesAVencer(clienteId, agora, limiteLotesAVencer),
      this.repository.buscarCreditosRecentes(clienteId),
      this.repository.buscarUsosRecentes(clienteId),
      this.repository.buscarExpiracoesRecentes(clienteId, agora),
    ]);

    const movimentos: Movimento[] = [
      ...creditos.map((credito) => ({
        tipo: "CREDITO" as const,
        valorCentavos: credito.valorOriginalCentavos,
        ocorreuEm: credito.geradoEm,
        compraId: credito.compraOrigemId,
        loteId: credito.id,
        origemId: credito.id,
      })),
      ...usos.map((uso) => ({
        tipo: "USO" as const,
        valorCentavos: uso.valorCentavos,
        ocorreuEm: uso.criadoEm,
        compraId: uso.compraId,
        loteId: uso.loteId,
        origemId: uso.id,
      })),
      ...expiracoes.map((expiracao) => ({
        tipo: "EXPIRACAO" as const,
        valorCentavos: expiracao.saldoCentavos,
        ocorreuEm: expiracao.venceEm,
        compraId: null,
        loteId: expiracao.id,
        origemId: expiracao.id,
      })),
    ]
      .sort((first, second) => {
        const porData = second.ocorreuEm.getTime() - first.ocorreuEm.getTime();
        if (porData !== 0) return porData;
        const prioridade = { CREDITO: 0, USO: 1, EXPIRACAO: 2 };
        return prioridade[first.tipo] - prioridade[second.tipo] || second.origemId - first.origemId;
      })
      .slice(0, 50);

    return {
      clienteId,
      saldoDisponivelCentavos,
      lotesAVencer,
      movimentos: movimentos.map(({ origemId: _origemId, ...movimento }) => movimento),
    };
  }
}
