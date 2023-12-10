-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "battle";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "player";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "wallet";

-- CreateTable
CREATE TABLE "player"."Player" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "rp" INTEGER NOT NULL DEFAULT 100,
    "def" INTEGER NOT NULL DEFAULT 10,
    "atk" INTEGER NOT NULL DEFAULT 10,
    "str" INTEGER NOT NULL DEFAULT 10,
    "agi" INTEGER NOT NULL DEFAULT 10,
    "end" INTEGER NOT NULL DEFAULT 10,
    "luk" INTEGER NOT NULL DEFAULT 10,
    "accountId" VARCHAR NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player"."PlayerCredentials" (
    "id" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" VARCHAR NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "providerId" VARCHAR NOT NULL,
    "provider" VARCHAR NOT NULL,

    CONSTRAINT "PlayerCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player"."PlayerAccount" (
    "id" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PlayerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet"."PlayerWallet" (
    "id" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "playerId" VARCHAR NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR NOT NULL DEFAULT 'gold',

    CONSTRAINT "PlayerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet"."PlayerWalletOperation" (
    "id" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "walletId" VARCHAR NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR NOT NULL,
    "type" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL,
    "refCanonical" VARCHAR NOT NULL,
    "refId" VARCHAR NOT NULL,

    CONSTRAINT "PlayerWalletOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet"."PlayerWalletSnapshot" (
    "id" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "walletId" VARCHAR NOT NULL,
    "startBalance" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "currency" VARCHAR NOT NULL,
    "referenceDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerWalletSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle"."Battle" (
    "id" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" VARCHAR,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "player1Id" VARCHAR,
    "player2Id" VARCHAR,
    "winnerId" VARCHAR,
    "loserId" VARCHAR,
    "status" VARCHAR NOT NULL DEFAULT 'waiting',
    "log" JSONB[],

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "player"."Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_accountId_key" ON "player"."Player"("accountId");

-- CreateIndex
CREATE INDEX "Player_id_idx" ON "player"."Player"("id");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "player"."Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCredentials_accountId_key" ON "player"."PlayerCredentials"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCredentials_providerId_key" ON "player"."PlayerCredentials"("providerId");

-- CreateIndex
CREATE INDEX "PlayerCredentials_id_idx" ON "player"."PlayerCredentials"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCredentials_accountId_provider_key" ON "player"."PlayerCredentials"("accountId", "provider");

-- CreateIndex
CREATE INDEX "PlayerAccount_id_idx" ON "player"."PlayerAccount"("id");

-- CreateIndex
CREATE INDEX "PlayerWallet_id_idx" ON "wallet"."PlayerWallet"("id");

-- CreateIndex
CREATE INDEX "PlayerWallet_playerId_idx" ON "wallet"."PlayerWallet"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerWallet_playerId_currency_key" ON "wallet"."PlayerWallet"("playerId", "currency");

-- CreateIndex
CREATE INDEX "PlayerWalletOperation_id_idx" ON "wallet"."PlayerWalletOperation"("id");

-- CreateIndex
CREATE INDEX "PlayerWalletOperation_walletId_idx" ON "wallet"."PlayerWalletOperation"("walletId");

-- CreateIndex
CREATE INDEX "PlayerWalletSnapshot_id_idx" ON "wallet"."PlayerWalletSnapshot"("id");

-- CreateIndex
CREATE INDEX "PlayerWalletSnapshot_walletId_idx" ON "wallet"."PlayerWalletSnapshot"("walletId");

-- CreateIndex
CREATE INDEX "Battle_id_idx" ON "battle"."Battle"("id");

-- CreateIndex
CREATE INDEX "Battle_createdAt_idx" ON "battle"."Battle"("createdAt");

-- CreateIndex
CREATE INDEX "Battle_player1Id_idx" ON "battle"."Battle"("player1Id");

-- CreateIndex
CREATE INDEX "Battle_player2Id_idx" ON "battle"."Battle"("player2Id");

-- CreateIndex
CREATE INDEX "Battle_winnerId_idx" ON "battle"."Battle"("winnerId");

-- CreateIndex
CREATE INDEX "Battle_loserId_idx" ON "battle"."Battle"("loserId");

-- AddForeignKey
ALTER TABLE "player"."Player" ADD CONSTRAINT "Player_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "player"."PlayerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player"."PlayerCredentials" ADD CONSTRAINT "PlayerCredentials_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "player"."PlayerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet"."PlayerWallet" ADD CONSTRAINT "PlayerWallet_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet"."PlayerWalletOperation" ADD CONSTRAINT "PlayerWalletOperation_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"."PlayerWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet"."PlayerWalletSnapshot" ADD CONSTRAINT "PlayerWalletSnapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"."PlayerWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle"."Battle" ADD CONSTRAINT "Battle_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "player"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle"."Battle" ADD CONSTRAINT "Battle_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "player"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle"."Battle" ADD CONSTRAINT "Battle_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "player"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle"."Battle" ADD CONSTRAINT "Battle_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "player"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
