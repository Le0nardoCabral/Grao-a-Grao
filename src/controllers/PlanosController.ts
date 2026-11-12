import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/ErrorCodes.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { PlanosService } from "../services/PlanosService.js";
import type {
  AtualizacaoPlanoInputDto,
  FiltrosListagemPlanosDto,
  ListarPlanosResponseDto,
  NovoPlanoInputDto,
  PlanoResponseDto,
} from "../dtos/PlanosDtos.js";

const service = new PlanosService();

export class PlanosController {
  static criar: RequestHandler = async (request, response) => {
    const plano: PlanoResponseDto = await service.criar(request.body as NovoPlanoInputDto);
    response.status(201).json(plano);
  };

  static listar: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError(
        ErrorMessages.INACTIVE_PLANS_ADMIN_ONLY,
        ErrorCodes.FORBIDDEN,
        "FORBIDDEN",
      );
    }

    const filtros: FiltrosListagemPlanosDto = {
      pagina: Number(request.query.pagina ?? 1),
      limite: Number(request.query.limite ?? 20),
      incluirInativos,
    };
    const saida: ListarPlanosResponseDto = await service.listar(filtros);
    response.status(200).json(saida);
  };

  static buscarPorId: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError(
        ErrorMessages.INACTIVE_PLANS_ADMIN_ONLY,
        ErrorCodes.FORBIDDEN,
        "FORBIDDEN",
      );
    }

    const plano: PlanoResponseDto = await service.buscarPorId(
      Number(request.params.id),
      incluirInativos,
    );
    response.status(200).json(plano);
  };

  static atualizar: RequestHandler = async (request, response) => {
    const plano: PlanoResponseDto = await service.atualizar(
      Number(request.params.id),
      request.body as AtualizacaoPlanoInputDto,
    );
    response.status(200).json(plano);
  };

  static excluir: RequestHandler = async (request, response) => {
    await service.desativar(Number(request.params.id));
    response.status(204).send();
  };

  static reativar: RequestHandler = async (request, response) => {
    const plano: PlanoResponseDto = await service.reativar(Number(request.params.id));
    response.status(200).json(plano);
  };
}
