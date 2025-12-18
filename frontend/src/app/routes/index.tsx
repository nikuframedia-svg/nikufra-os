/**
 * Routes - Mapeamento de rotas por módulo
 * Segue o contrato UI_CONTRACTS.md rigorosamente
 */

import { Route, Routes } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load modules
const ProdPlanOverview = lazy(() => import('../../app/modules/prodplan/pages/Overview'));
const ProdPlanOrders = lazy(() => import('../../app/modules/prodplan/pages/Orders'));
const ProdPlanOrderDetail = lazy(() => import('../../app/modules/prodplan/pages/OrderDetail'));
const ProdPlanSchedule = lazy(() => import('../../app/modules/prodplan/pages/Schedule'));
const ProdPlanBottlenecks = lazy(() => import('../../app/modules/prodplan/pages/Bottlenecks'));
const ProdPlanRiskQueue = lazy(() => import('../../app/modules/prodplan/pages/RiskQueue'));

const SmartInventoryOverview = lazy(() => import('../../app/modules/smartinventory/pages/Overview'));
const SmartInventoryWIP = lazy(() => import('../../app/modules/smartinventory/pages/WIP'));
const SmartInventoryWIPMass = lazy(() => import('../../app/modules/smartinventory/pages/WIPMass'));
const SmartInventoryGelcoat = lazy(() => import('../../app/modules/smartinventory/pages/Gelcoat'));
const SmartInventoryMaterialYield = lazy(() => import('../../app/modules/smartinventory/pages/MaterialYield'));
const SmartInventoryDueRisk = lazy(() => import('../../app/modules/smartinventory/pages/DueRisk'));

const WhatIfSimulate = lazy(() => import('../../app/modules/whatif/pages/Simulate'));

const QualityOverview = lazy(() => import('../../app/modules/quality/pages/Overview'));
const QualityByPhase = lazy(() => import('../../app/modules/quality/pages/ByPhase'));
const QualityRisk = lazy(() => import('../../app/modules/quality/pages/Risk'));

const MLPredictLeadtime = lazy(() => import('../../app/modules/ml/pages/PredictLeadtime'));
const MLExplainLeadtime = lazy(() => import('../../app/modules/ml/pages/ExplainLeadtime'));
const MLTrain = lazy(() => import('../../app/modules/ml/pages/Train'));

const OpsIngestion = lazy(() => import('../../app/modules/ops/pages/Ingestion'));
const OpsDataContract = lazy(() => import('../../app/modules/ops/pages/DataContract'));
const OpsFeatureGates = lazy(() => import('../../app/modules/ops/pages/FeatureGates'));
const OpsPerformance = lazy(() => import('../../app/modules/ops/pages/Performance'));
const OpsHealth = lazy(() => import('../../app/modules/ops/pages/Health'));
const OpsReleaseGate = lazy(() => import('../../app/modules/ops/pages/ReleaseGate'));

const ChatPage = lazy(() => import('../../app/modules/chat/pages/Chat'));

export function AppRoutes() {
  return (
    <Routes>
      {/* PRODPLAN */}
      <Route path="/prodplan/overview" element={<ProdPlanOverview />} />
      <Route path="/prodplan/orders" element={<ProdPlanOrders />} />
      <Route path="/prodplan/orders/:ofId" element={<ProdPlanOrderDetail />} />
      <Route path="/prodplan/schedule" element={<ProdPlanSchedule />} />
      <Route path="/prodplan/bottlenecks" element={<ProdPlanBottlenecks />} />
      <Route path="/prodplan/risk-queue" element={<ProdPlanRiskQueue />} />

      {/* SMARTINVENTORY */}
      <Route path="/smartinventory/overview" element={<SmartInventoryOverview />} />
      <Route path="/smartinventory/wip-explorer" element={<SmartInventoryWIP />} />
      <Route path="/smartinventory/wip-mass" element={<SmartInventoryWIPMass />} />
      <Route path="/smartinventory/gelcoat" element={<SmartInventoryGelcoat />} />
      <Route path="/smartinventory/material-yield" element={<SmartInventoryMaterialYield />} />
      <Route path="/smartinventory/due-risk" element={<SmartInventoryDueRisk />} />

      {/* WHAT-IF */}
      <Route path="/whatif/simulate" element={<WhatIfSimulate />} />

      {/* QUALITY */}
      <Route path="/quality/overview" element={<QualityOverview />} />
      <Route path="/quality/by-phase" element={<QualityByPhase />} />
      <Route path="/quality/risk" element={<QualityRisk />} />

      {/* ML/R&D */}
      <Route path="/ml/predict/leadtime" element={<MLPredictLeadtime />} />
      <Route path="/ml/explain/leadtime" element={<MLExplainLeadtime />} />
      <Route path="/ml/train" element={<MLTrain />} />

      {/* OPS */}
      <Route path="/ops/ingestion" element={<OpsIngestion />} />
      <Route path="/ops/data-contract" element={<OpsDataContract />} />
      <Route path="/ops/feature-gates" element={<OpsFeatureGates />} />
      <Route path="/ops/performance" element={<OpsPerformance />} />
      <Route path="/ops/health" element={<OpsHealth />} />
      <Route path="/ops/release-gate" element={<OpsReleaseGate />} />

      {/* CHAT */}
      <Route path="/chat" element={<ChatPage />} />

      {/* Default redirect to PRODPLAN overview */}
      <Route path="/" element={<ProdPlanOverview />} />
    </Routes>
  );
}

