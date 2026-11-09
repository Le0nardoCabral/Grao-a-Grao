import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("o projeto compila", () => {
  const resultado = spawnSync("npm run build", { shell: true, encoding: "utf8" });

  assert.ifError(resultado.error);
  assert.equal(resultado.status, 0, resultado.stdout + resultado.stderr);
});
