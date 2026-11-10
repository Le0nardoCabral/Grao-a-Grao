ALTER TABLE `Plano` ADD COLUMN `mensalidadeCentavos` INTEGER NULL;
UPDATE `Plano` SET `mensalidadeCentavos` = 0 WHERE `mensalidadeCentavos` IS NULL;
ALTER TABLE `Plano` MODIFY COLUMN `mensalidadeCentavos` INTEGER NOT NULL;
