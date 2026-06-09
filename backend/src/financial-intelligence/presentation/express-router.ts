import express, { Request, Response } from "express";
import {
  createFinancialHealthEngine,
  getFinancialIntelligenceCatalogStats,
  getFinancialIntelligenceRules,
  mapLegacyDataToSnapshot,
} from "../index";
import { AnalysisPeriod, SupportedLocale } from "../domain/types";

interface Dependencies {
  loadData: () => Record<string, unknown>;
  findCurrentUser: (
    req: Request,
    loadData: Dependencies["loadData"],
    data?: Record<string, unknown>,
  ) => Record<string, unknown> | null;
}

const VALID_PERIODS = new Set<AnalysisPeriod>([
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);
const VALID_LOCALES = new Set<SupportedLocale>(["vi", "en"]);

function resolveLocale(value: unknown): SupportedLocale {
  const locale = String(value || "vi") as SupportedLocale;
  return VALID_LOCALES.has(locale) ? locale : "vi";
}

function disableReportCaching(res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization, Cookie");
}

export function createFinancialHealthRoutes(dependencies: Dependencies) {
  const router = express.Router();
  const engine = createFinancialHealthEngine();

  router.get("/", (req: Request, res: Response) => {
    disableReportCaching(res);
    const data = dependencies.loadData();
    const user = dependencies.findCurrentUser(req, dependencies.loadData, data);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const requestedPeriod = String(
      req.query.period || "monthly",
    ) as AnalysisPeriod;
    const period = VALID_PERIODS.has(requestedPeriod)
      ? requestedPeriod
      : "monthly";
    const locale = resolveLocale(req.query.locale || req.query.language);
    return res.json(
      engine.analyze(mapLegacyDataToSnapshot(data, user), period, locale),
    );
  });

  router.get("/catalog", (_req: Request, res: Response) => {
    res.json(getFinancialIntelligenceCatalogStats());
  });

  router.get("/rules", (_req: Request, res: Response) => {
    res.json({ rules: getFinancialIntelligenceRules() });
  });

  router.post("/simulate", (req: Request, res: Response) => {
    disableReportCaching(res);
    const requestedPeriod = req.body?.period as AnalysisPeriod;
    const period = VALID_PERIODS.has(requestedPeriod)
      ? requestedPeriod
      : "monthly";
    const locale = resolveLocale(req.body?.locale);
    return res.json(engine.analyze(req.body.snapshot, period, locale));
  });

  return router;
}
