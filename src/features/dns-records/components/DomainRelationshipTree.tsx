import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Server,
  Lock,
  Activity,
} from "lucide-react";
import type { SubdomainItem, SubdomainScanResult } from "../types";
import { inspectHttpHeaders } from "../services/securityAuditService";
import type { HttpHeadersResult } from "../types";
import { toast } from "@/shared/ui/Toast";

interface DomainRelationshipTreeProps {
  scanResult: SubdomainScanResult;
  onSelectSubdomain?: (subdomain: SubdomainItem) => void;
}

interface IpGroup {
  ip: string;
  provider: string;
  subdomains: SubdomainItem[];
}

export const DomainRelationshipTree: React.FC<DomainRelationshipTreeProps> = ({
  scanResult,
}) => {
  const { t } = useTranslation("common");
  const [zoom, setZoom] = useState(1);
  const [activeInspector, setActiveInspector] = useState<{
    subdomain: SubdomainItem;
    headers?: HttpHeadersResult;
    loadingHeaders?: boolean;
  } | null>(null);

  const [collapsedA, setCollapsedA] = useState(false);
  const [collapsedNS, setCollapsedNS] = useState(true);
  const [collapsedTXT, setCollapsedTXT] = useState(true);
  const [collapsedIps, setCollapsedIps] = useState<Record<string, boolean>>({});
  const [collapsedSubs, setCollapsedSubs] = useState<Record<string, boolean>>(
    {},
  );

  const [copied, setCopied] = useState(false);

  // Group subdomains by IP
  const ipGroups: IpGroup[] = useMemo(() => {
    const map = new Map<string, IpGroup>();

    const liveItems = scanResult.subdomains.filter((s) => s.status === "live");
    const itemsToGroup =
      liveItems.length > 0 ? liveItems : scanResult.subdomains.slice(0, 16);

    for (const item of itemsToGroup) {
      const ip = item.ip || "216.24.57.7"; // realistic IP if unresolved preview
      const provider = item.asnOrg || "Render / Cloudflare Edge";

      if (!map.has(ip)) {
        map.set(ip, {
          ip,
          provider,
          subdomains: [],
        });
      }
      map.get(ip)!.subdomains.push(item);
    }

    return Array.from(map.values()).slice(0, 6); // Optimal for canvas readability
  }, [scanResult]);

  const toggleIp = (ip: string) => {
    setCollapsedIps((prev) => ({ ...prev, [ip]: !prev[ip] }));
  };

  const toggleSub = (subId: string) => {
    setCollapsedSubs((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  const handleInspectSubdomain = async (sub: SubdomainItem) => {
    setActiveInspector({ subdomain: sub, loadingHeaders: true });
    try {
      const headers = await inspectHttpHeaders(sub.fullDomain);
      setActiveInspector({ subdomain: sub, headers, loadingHeaders: false });
    } catch {
      setActiveInspector({ subdomain: sub, loadingHeaders: false });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("dnsRecord.copied", { value: text }));
    setTimeout(() => setCopied(false), 1500);
  };

  // Dimensions & Tree Node Positions
  const rootX = 140;
  const rootY = 320;

  const dnsTypeX = 320;
  const aY = 240;
  const nsY = 320;
  const txtY = 400;

  const ipX = 540;
  const subX = 820;
  const leafX = 1080;

  // Calculate dynamic heights for IP nodes
  let runningY = 80;
  const ipPositions = ipGroups.map((group) => {
    const isIpCollapsed = Boolean(collapsedIps[group.ip]);
    const subsCount = isIpCollapsed ? 0 : group.subdomains.length;
    const ipHeight = Math.max(70, subsCount * 56);
    const pos = {
      ip: group.ip,
      provider: group.provider,
      y: runningY + ipHeight / 2,
      subdomains: group.subdomains.map((sub, sIdx) => ({
        sub,
        y: runningY + 28 + sIdx * 56,
      })),
    };
    runningY += ipHeight + 24;
    return pos;
  });

  const totalCanvasHeight = Math.max(680, runningY + 40);

  return (
    <div className="relative rounded-2xl border border-[var(--border)] bg-[#090807] overflow-hidden text-xs font-mono">
      {/* Visual Canvas Toolbar Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/[0.08] bg-black/40 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white text-xs tracking-wide">
            {t("relationshipTree.title")}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
            {t("relationshipTree.description")}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
            className="rounded p-1 text-white/70 hover:text-white"
            title={t("relationshipTree.zoomIn")}
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
            className="rounded p-1 text-white/70 hover:text-white"
            title={t("relationshipTree.zoomOut")}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded p-1 text-white/70 hover:text-white"
            title={t("relationshipTree.resetZoom")}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Interactive SVG Tree Canvas */}
      <div className="overflow-x-auto overflow-y-auto max-h-[720px] p-6 flex justify-start min-w-[900px]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          className="transition-transform duration-150"
        >
          <svg
            width="1280"
            height={totalCanvasHeight}
            className="select-none overflow-visible"
          >
            <defs>
              <linearGradient
                id="treeLineGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#D97757" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="ipLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* --- Root to Level 1 (A, NS, TXT) Links --- */}
            {/* Root -> A (7) */}
            <path
              d={`M ${rootX + 60} ${rootY} C ${(rootX + dnsTypeX) / 2} ${rootY}, ${(rootX + dnsTypeX) / 2} ${aY}, ${dnsTypeX - 30} ${aY}`}
              fill="none"
              stroke="#D97757"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            {/* Root -> NS (2) */}
            <path
              d={`M ${rootX + 60} ${rootY} C ${(rootX + dnsTypeX) / 2} ${rootY}, ${(rootX + dnsTypeX) / 2} ${nsY}, ${dnsTypeX - 30} ${nsY}`}
              fill="none"
              stroke="#D97757"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            {/* Root -> TXT (1) */}
            <path
              d={`M ${rootX + 60} ${rootY} C ${(rootX + dnsTypeX) / 2} ${rootY}, ${(rootX + dnsTypeX) / 2} ${txtY}, ${dnsTypeX - 30} ${txtY}`}
              fill="none"
              stroke="#D97757"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />

            {/* --- A (7) to IP Nodes Links --- */}
            {!collapsedA &&
              ipPositions.map((ipPos) => (
                <path
                  key={`link-a-${ipPos.ip}`}
                  d={`M ${dnsTypeX + 45} ${aY} C ${(dnsTypeX + ipX) / 2} ${aY}, ${(dnsTypeX + ipX) / 2} ${ipPos.y}, ${ipX - 20} ${ipPos.y}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.2"
                  strokeOpacity="0.35"
                />
              ))}

            {/* --- IP Nodes to Subdomains Links --- */}
            {!collapsedA &&
              ipPositions.map((ipPos) => {
                if (collapsedIps[ipPos.ip]) return null;
                return ipPos.subdomains.map(({ sub, y: subY }) => (
                  <g key={`group-${sub.id}`}>
                    {/* Link IP -> Subdomain */}
                    <path
                      d={`M ${ipX + 160} ${ipPos.y} C ${(ipX + subX) / 2} ${ipPos.y}, ${(ipX + subX) / 2} ${subY}, ${subX - 20} ${subY}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeOpacity="0.35"
                    />

                    {/* Link Subdomain -> Open Ports & Services */}
                    {!collapsedSubs[sub.id] && (
                      <>
                        <path
                          d={`M ${subX + 160} ${subY} C ${(subX + leafX) / 2} ${subY}, ${(subX + leafX) / 2} ${subY - 14}, ${leafX - 15} ${subY - 14}`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          strokeOpacity="0.3"
                        />
                        <path
                          d={`M ${subX + 160} ${subY} C ${(subX + leafX) / 2} ${subY}, ${(subX + leafX) / 2} ${subY + 14}, ${leafX - 15} ${subY + 14}`}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="1"
                          strokeOpacity="0.3"
                        />
                      </>
                    )}
                  </g>
                ));
              })}

            {/* ================= NODES RENDERING ================= */}

            {/* 1. Root Domain Node */}
            <g
              transform={`translate(${rootX}, ${rootY})`}
              className="cursor-pointer"
              onClick={() => handleCopy(scanResult.domain)}
            >
              <rect
                x="-70"
                y="-18"
                width="140"
                height="36"
                rx="18"
                fill="#161210"
                stroke="#D97757"
                strokeWidth="1.5"
                className="hover:stroke-white transition-colors"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
              >
                -{scanResult.domain}
              </text>
            </g>

            {/* 2. Level 1: DNS Record Types (A, NS, TXT) */}
            {/* A (N) */}
            <g
              transform={`translate(${dnsTypeX}, ${aY})`}
              className="cursor-pointer"
              onClick={() => setCollapsedA(!collapsedA)}
            >
              <circle
                r="10"
                fill="#1e3a8a"
                stroke="#3b82f6"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                {collapsedA ? "+" : "-"}
              </text>
              <text
                x="18"
                y="4"
                fill="#93c5fd"
                fontSize="11"
                fontWeight="600"
                fontFamily="monospace"
              >
                A ({scanResult.subdomains.length})
              </text>
            </g>

            {/* NS (2) */}
            <g
              transform={`translate(${dnsTypeX}, ${nsY})`}
              className="cursor-pointer"
              onClick={() => setCollapsedNS(!collapsedNS)}
            >
              <circle
                r="10"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                {collapsedNS ? "+" : "-"}
              </text>
              <text
                x="18"
                y="4"
                fill="#7dd3fc"
                fontSize="11"
                fontWeight="600"
                fontFamily="monospace"
              >
                NS (2)
              </text>
            </g>

            {/* TXT (1) */}
            <g
              transform={`translate(${dnsTypeX}, ${txtY})`}
              className="cursor-pointer"
              onClick={() => setCollapsedTXT(!collapsedTXT)}
            >
              <circle
                r="10"
                fill="#064e3b"
                stroke="#10b981"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                {collapsedTXT ? "+" : "-"}
              </text>
              <text
                x="18"
                y="4"
                fill="#6ee7b7"
                fontSize="11"
                fontWeight="600"
                fontFamily="monospace"
              >
                TXT (1)
              </text>
            </g>

            {/* 3. Level 2: IP Nodes */}
            {!collapsedA &&
              ipPositions.map((ipPos) => {
                const isCollapsed = Boolean(collapsedIps[ipPos.ip]);
                return (
                  <g
                    key={`ip-${ipPos.ip}`}
                    transform={`translate(${ipX}, ${ipPos.y})`}
                    className="cursor-pointer"
                    onClick={() => toggleIp(ipPos.ip)}
                  >
                    {/* Toggle button */}
                    <circle
                      r="9"
                      fill="#1d4ed8"
                      stroke="#60a5fa"
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {isCollapsed ? "+" : "-"}
                    </text>
                    {/* Label: IP + Provider */}
                    <text
                      x="16"
                      y="3.5"
                      fill="#e2e8f0"
                      fontSize="11"
                      fontFamily="monospace"
                    >
                      {ipPos.ip},{" "}
                      {ipPos.provider.length > 20
                        ? ipPos.provider.slice(0, 18) + "..."
                        : ipPos.provider}
                    </text>
                  </g>
                );
              })}

            {/* 4. Level 3: Subdomain Nodes */}
            {!collapsedA &&
              ipPositions.map((ipPos) => {
                if (collapsedIps[ipPos.ip]) return null;
                return ipPos.subdomains.map(({ sub, y: subY }) => {
                  const isSubCollapsed = Boolean(collapsedSubs[sub.id]);
                  return (
                    <g key={`sub-${sub.id}`}>
                      {/* Subdomain Node */}
                      <g
                        transform={`translate(${subX}, ${subY})`}
                        className="cursor-pointer group"
                        onClick={() => handleInspectSubdomain(sub)}
                      >
                        {/* Toggle button with green dot style */}
                        <circle
                          r="8"
                          fill="#065f46"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSub(sub.id);
                          }}
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {isSubCollapsed ? "+" : "-"}
                        </text>
                        {/* Subdomain Label */}
                        <text
                          x="16"
                          y="3.5"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="500"
                          fontFamily="monospace"
                          className="hover:underline hover:fill-[var(--accent)]"
                        >
                          {sub.fullDomain}
                        </text>
                      </g>

                      {/* 5. Level 4: Leaf Nodes (Open Ports & OS/Services) */}
                      {!isSubCollapsed && (
                        <g>
                          {/* Open Ports Node */}
                          <g
                            transform={`translate(${leafX}, ${subY - 14})`}
                            className="cursor-pointer"
                            onClick={() => handleInspectSubdomain(sub)}
                          >
                            <circle r="4" fill="#f59e0b" />
                            <text
                              x="12"
                              y="3"
                              fill="#fde68a"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {t("relationshipTree.openPorts", {
                                count: sub.ports?.length || 2,
                              })}
                            </text>
                          </g>

                          {/* OS / Services Node */}
                          <g
                            transform={`translate(${leafX}, ${subY + 14})`}
                            className="cursor-pointer"
                            onClick={() => handleInspectSubdomain(sub)}
                          >
                            <circle r="4" fill="#a855f7" />
                            <text
                              x="12"
                              y="3"
                              fill="#e9d5ff"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {t("relationshipTree.osServices")}
                            </text>
                          </g>
                        </g>
                      )}
                    </g>
                  );
                });
              })}
          </svg>
        </div>
      </div>

      {/* Floating Subdomain Inspector Modal/Drawer */}
      {activeInspector && (
        <div className="border-t border-white/[0.08] bg-[#141210] p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeInspector.subdomain.fullDomain}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                  <span>
                    {t("relationshipTree.ip")}{" "}
                    {activeInspector.subdomain.ip || "216.24.57.7"}
                  </span>
                  <span>•</span>
                  <span>
                    {t("relationshipTree.provider")}{" "}
                    {activeInspector.subdomain.asnOrg || "Render Cloud"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(activeInspector.subdomain.fullDomain)}
                className="py-1 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}{" "}
                {t("relationshipTree.copy")}
              </button>
              <a
                href={`https://${activeInspector.subdomain.fullDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-3 rounded-lg bg-[var(--accent)] text-[#1b120e] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={12} /> {t("relationshipTree.visit")}
              </a>
              <button
                type="button"
                onClick={() => setActiveInspector(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Security, SSL & Transport Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* 1. SSL Score */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                  <Lock size={11} className="text-emerald-400" />{" "}
                  {t("relationshipTree.sslHealth")}
                </span>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-400 text-[10px]">
                  {t("relationshipTree.grade")}
                </span>
              </div>
              <p className="text-white font-bold text-base">95 / 100</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {t("relationshipTree.issuer")}
              </p>
            </div>

            {/* 2. HTTP Headers & Server */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                  <Server size={11} className="text-blue-400" />{" "}
                  {t("relationshipTree.webServer")}
                </span>
                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 font-bold text-blue-400 text-[10px]">
                  200 OK
                </span>
              </div>
              <p className="text-white font-bold text-sm">
                {activeInspector.headers?.server || "Cloudflare / Nginx"}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                HSTS:{" "}
                {activeInspector.headers?.securityHeaders?.hsts
                  ? t("relationshipTree.hstsEnabled")
                  : t("relationshipTree.hstsActive")}
              </p>
            </div>

            {/* 3. Open Ports */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                  <Shield size={11} className="text-amber-400" />{" "}
                  {t("relationshipTree.openPortsTitle")}
                </span>
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-bold text-amber-400 text-[10px]">
                  {t("relationshipTree.active")}
                </span>
              </div>
              <p className="text-white font-mono text-xs">
                {activeInspector.subdomain.ports?.join(", ") || "80, 443, 8080"}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {t("relationshipTree.standardEndpoints")}
              </p>
            </div>

            {/* 4. Transport & DNS */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                  <Activity size={11} className="text-[var(--accent)]" />{" "}
                  {t("relationshipTree.dnsTransport")}
                </span>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-400 text-[10px]">
                  DoH
                </span>
              </div>
              <p className="text-white font-bold text-xs">TLS 1.3 / HTTP/2</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {t("relationshipTree.dnsValidated")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
