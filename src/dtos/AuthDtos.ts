export type LoginInputDto = {
  email: string;
  senha: string;
};

export type LoginResponseDto = {
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: "ADMIN" | "ATENDENTE";
  };
};

export type RegistrarUsuarioInputDto = LoginInputDto & { nome: string };
export type RegistrarUsuarioResponseDto = {
  id: number;
  nome: string;
  email: string;
  perfil: "ATENDENTE";
  ativo: boolean;
};
