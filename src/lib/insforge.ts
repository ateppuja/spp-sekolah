import prisma from "./prisma";

/**
 * InsForge Database & Platform Helper
 * Provides a unified abstraction bridging Next.js, Prisma ORM, and InsForge Agent-Native BaaS.
 */
export interface InsForgeConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class InsForgeClient {
  private config: InsForgeConfig;

  constructor(config: InsForgeConfig = {}) {
    this.config = config;
  }

  // Database accessor directly backed by high performance relational layer
  get db() {
    return prisma;
  }

  // Health check helper
  async checkHealth(): Promise<{ status: "ok" | "degraded" | "down"; timestamp: string }> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch (e) {
      return { status: "down", timestamp: new Date().toISOString() };
    }
  }
}

export const insforge = new InsForgeClient();
export default insforge;
