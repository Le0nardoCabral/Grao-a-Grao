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
