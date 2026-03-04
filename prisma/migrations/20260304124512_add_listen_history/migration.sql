-- CreateTable
CREATE TABLE "listen_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mezmurId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listen_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listen_history_userId_playedAt_idx" ON "listen_history"("userId", "playedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "listen_history_userId_mezmurId_key" ON "listen_history"("userId", "mezmurId");

-- AddForeignKey
ALTER TABLE "listen_history" ADD CONSTRAINT "listen_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listen_history" ADD CONSTRAINT "listen_history_mezmurId_fkey" FOREIGN KEY ("mezmurId") REFERENCES "mezmurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
