import assert from "node:assert/strict";
import test from "node:test";
import { validarDestinoBanco } from "../scripts/ValidarDestinoBanco.js";

test("aceita o banco local de desenvolvimento para o seed", () => {
  assert.doesNotThrow(() =>
    validarDestinoBanco(
      "mysql://grao:local@db:3306/grao_a_grao",
      "desenvolvimento",
    ),
  );
});

test("aceita o banco local de teste para migrations", () => {
  assert.doesNotThrow(() =>
    validarDestinoBanco(
      "mysql://grao:local@localhost:3306/grao_a_grao_teste",
      "teste",
    ),
  );
});

test("recusa hosts remotos", () => {
  assert.throws(
    () =>
      validarDestinoBanco(
        "mysql://grao:local@banco-remoto.example:3306/grao_a_grao",
        "qualquer",
      ),
    /Banco bloqueado/,
  );
});

test("recusa bancos que não fazem parte dos destinos permitidos", () => {
  assert.throws(
    () =>
      validarDestinoBanco(
        "mysql://grao:local@localhost:3306/defaultdb",
        "qualquer",
      ),
    /Banco bloqueado/,
  );
});

test("permite executar a carga de teste no banco local isolado", () => {
  assert.doesNotThrow(() =>
    validarDestinoBanco(
      "mysql://grao:local@localhost:3306/grao_a_grao_teste",
      "teste",
    ),
  );
});
