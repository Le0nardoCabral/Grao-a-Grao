-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `senhaHash` VARCHAR(255) NOT NULL,
    `perfil` ENUM('ADMIN', 'ATENDENTE') NOT NULL DEFAULT 'ATENDENTE',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NULL,
    `telefone` VARCHAR(30) NULL,
    `dataNascimento` DATE NULL,
    `planoId` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cliente_email_key`(`email`),
    INDEX `Cliente_planoId_idx`(`planoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(80) NOT NULL,
    `percentualBps` INTEGER NOT NULL,
    `limiteCentavos` INTEGER NOT NULL,
    `minimoUsoCentavos` INTEGER NOT NULL DEFAULT 2000,
    `dobroAniversario` BOOLEAN NOT NULL DEFAULT false,
    `validadeDias` INTEGER NOT NULL DEFAULT 180,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Plano_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` TEXT NULL,
    `precoCentavos` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Produto_nome_key`(`nome`),
    INDEX `Produto_nome_idx`(`nome`),
    INDEX `Produto_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Compra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `valorBrutoCentavos` INTEGER NOT NULL,
    `cashbackUsadoCentavos` INTEGER NOT NULL DEFAULT 0,
    `valorPagoCentavos` INTEGER NOT NULL,
    `cashbackGeradoCentavos` INTEGER NOT NULL DEFAULT 0,
    `cashbackCortadoCentavos` INTEGER NOT NULL DEFAULT 0,
    `chaveIdempotencia` VARCHAR(64) COLLATE utf8mb4_0900_bin NOT NULL,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Compra_clienteId_criadaEm_idx`(`clienteId`, `criadaEm`),
    INDEX `Compra_usuarioId_criadaEm_idx`(`usuarioId`, `criadaEm`),
    UNIQUE INDEX `Compra_usuarioId_chaveIdempotencia_key`(`usuarioId`, `chaveIdempotencia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemCompra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compraId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `precoUnitarioCentavos` INTEGER NOT NULL,
    `subtotalCentavos` INTEGER NOT NULL,

    INDEX `ItemCompra_compraId_idx`(`compraId`),
    INDEX `ItemCompra_produtoId_idx`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoteCashback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `compraOrigemId` INTEGER NOT NULL,
    `valorOriginalCentavos` INTEGER NOT NULL,
    `saldoCentavos` INTEGER NOT NULL,
    `geradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `venceEm` DATETIME(3) NOT NULL,
    `status` ENUM('ATIVO', 'PARCIAL', 'CONSUMIDO', 'EXPIRADO') NOT NULL DEFAULT 'ATIVO',

    UNIQUE INDEX `LoteCashback_compraOrigemId_key`(`compraOrigemId`),
    INDEX `LoteCashback_clienteId_status_venceEm_idx`(`clienteId`, `status`, `venceEm`),
    INDEX `LoteCashback_clienteId_geradoEm_idx`(`clienteId`, `geradoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsoCashback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compraId` INTEGER NOT NULL,
    `loteId` INTEGER NOT NULL,
    `valorCentavos` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UsoCashback_compraId_idx`(`compraId`),
    INDEX `UsoCashback_loteId_idx`(`loteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_planoId_fkey` FOREIGN KEY (`planoId`) REFERENCES `Plano`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCompra` ADD CONSTRAINT `ItemCompra_compraId_fkey` FOREIGN KEY (`compraId`) REFERENCES `Compra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCompra` ADD CONSTRAINT `ItemCompra_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoteCashback` ADD CONSTRAINT `LoteCashback_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoteCashback` ADD CONSTRAINT `LoteCashback_compraOrigemId_fkey` FOREIGN KEY (`compraOrigemId`) REFERENCES `Compra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsoCashback` ADD CONSTRAINT `UsoCashback_compraId_fkey` FOREIGN KEY (`compraId`) REFERENCES `Compra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsoCashback` ADD CONSTRAINT `UsoCashback_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `LoteCashback`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

