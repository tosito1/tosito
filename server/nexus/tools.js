/**
 * tools.js — Wrapper de herramientas de red avanzadas
 * nmap · arp-scan · Metasploit Framework (auxiliary/scanner)
 */
"use strict";

const { exec } = require("child_process");
const path = require("path");
const db = require("./database");

// ── Constantes ────────────────────────────────────────────────────────────────
const SUBNET = process.env.SUBNET || "192.168.1.0/24";

const MSF_MODULES = [
    { id: "smb_ms17_010",   module: "auxiliary/scanner/smb/smb_ms17_010",   name: "EternalBlue (MS17-010 / WannaCry)", category: "SMB" },
    { id: "smb_version",    module: "auxiliary/scanner/smb/smb_version",     name: "SMB Version Scanner",              category: "SMB" },
    { id: "ssh_version",    module: "auxiliary/scanner/ssh/ssh_version",     name: "SSH Version Scanner",              category: "SSH" },
    { id: "ftp_anon",       module: "auxiliary/scanner/ftp/anonymous",       name: "FTP Anonymous Login",              category: "FTP" },
    { id: "http_version",   module: "auxiliary/scanner/http/http_version",   name: "HTTP Version Scanner",             category: "HTTP" },
    { id: "http_title",     module: "auxiliary/scanner/http/title",          name: "HTTP Title Scanner",               category: "HTTP" },
    { id: "vnc_none_auth",  module: "auxiliary/scanner/vnc/vnc_none_auth",   name: "VNC No-Auth Check",                category: "VNC" },
    { id: "rdp_scanner",    module: "auxiliary/scanner/rdp/rdp_scanner",     name: "RDP Scanner",                      category: "RDP" },
    { id: "mysql_empty",    module: "auxiliary/scanner/mysql/mysql_login",   name: "MySQL Empty Password",             category: "DB" },
    { id: "postgres_login", module: "auxiliary/scanner/postgres/postgres_login", name: "PostgreSQL Default Creds",     category: "DB" },
    { id: "telnet_version", module: "auxiliary/scanner/telnet/telnet_version", name: "Telnet Version Scanner",         category: "Telnet" },
    { id: "snmp_login",     module: "auxiliary/scanner/snmp/snmp_login",     name: "SNMP Community Scanner",          category: "SNMP" },
    { id: "open_proxy",     module: "auxiliary/scanner/http/open_proxy",     name: "Open Proxy Check",                 category: "HTTP" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function execPromise(cmd, timeout = 120000) {
    return new Promise((resolve, reject) => {
        const proc = exec(cmd, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            resolve({ stdout: stdout || "", stderr: stderr || "", exitCode: err ? err.code : 0, error: err });
        });
    });
}

function parseNmapOutput(raw) {
    const ports = [];
    const lines = raw.split("\n");
    let hostname = "";
    let os = "";

    for (const line of lines) {
        // Hostname
        if (line.includes("Nmap scan report for")) {
            const m = line.match(/for (.+)$/);
            if (m) hostname = m[1].replace(/\s*\(.*\)/, "").trim();
        }
        // OS
        if (line.includes("OS details:") || line.includes("Running:")) {
            os = line.replace(/^.*?:\s*/, "").trim();
        }
        // Ports: "22/tcp open  ssh     OpenSSH 8.9..."
        const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(open|filtered|closed)\s+(\S+)\s*(.*)?$/);
        if (portMatch) {
            ports.push({
                port:     parseInt(portMatch[1]),
                protocol: portMatch[2],
                state:    portMatch[3],
                service:  portMatch[4],
                version:  portMatch[5] ? portMatch[5].trim() : "",
            });
        }
    }
    return { hostname, os, ports };
}

// ── nmap ──────────────────────────────────────────────────────────────────────
async function nmapScan(target, mode = "quick") {
    const modes = {
        quick: `-sV -T4 --top-ports 100 --open`,
        deep:  `-sV -O -T4 -p- --open`,
        vuln:  `-sV -T4 --script=vuln --open`,
        ping:  `-sn`,
    };
    const flags = modes[mode] || modes.quick;
    const cmd = `nmap ${flags} ${target} 2>&1`;

    console.log(`[nmap] Running: ${cmd}`);
    const timeout = mode === "deep" ? 300000 : 120000;
    const { stdout, stderr, exitCode } = await execPromise(cmd, timeout);
    const parsed = parseNmapOutput(stdout);

    const result = {
        tool: "nmap",
        target,
        mode,
        timestamp: new Date().toISOString(),
        raw: stdout,
        parsed,
        exitCode,
    };

    await saveToolResult(result);
    return result;
}

// ── arp-scan ──────────────────────────────────────────────────────────────────
async function arpScan(subnet = SUBNET) {
    const cmd = `arp-scan ${subnet} 2>&1`;
    console.log(`[arp-scan] Running: ${cmd}`);
    const { stdout, exitCode } = await execPromise(cmd, 60000);

    // Parse output: "192.168.1.1   aa:bb:cc:dd:ee:ff   Manufacturer"
    const devices = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
        const m = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f:]{17})\s*(.*)?$/i);
        if (m) {
            devices.push({ ip: m[1], mac: m[2].toLowerCase(), vendor: m[3] ? m[3].trim() : "" });
        }
    }

    // Parse stats
    const statsMatch = stdout.match(/(\d+) packets received.+?(\d+) hosts? responded/s);
    const stats = statsMatch ? { packets: parseInt(statsMatch[1]), hosts: parseInt(statsMatch[2]) } : {};

    const result = {
        tool: "arp-scan",
        target: subnet,
        mode: "localnet",
        timestamp: new Date().toISOString(),
        raw: stdout,
        parsed: { devices, stats },
        exitCode,
    };

    await saveToolResult(result);
    return result;
}

// ── Metasploit ────────────────────────────────────────────────────────────────
async function msfScan(moduleId, rhosts, extraOptions = {}) {
    const modInfo = MSF_MODULES.find(m => m.id === moduleId);
    if (!modInfo) throw new Error(`Módulo MSF desconocido: ${moduleId}`);

    // Build msfconsole command
    const opts = Object.entries(extraOptions).map(([k, v]) => `set ${k} ${v}`).join("; ");
    const rcmd = [
        `use ${modInfo.module}`,
        `set RHOSTS ${rhosts}`,
        `set THREADS 4`,
        opts,
        `run`,
        `exit`,
    ].filter(Boolean).join("; ");

    const cmd = `msfconsole -q -x "${rcmd}" 2>&1`;
    console.log(`[msf] Running module: ${modInfo.module} against ${rhosts}`);

    const { stdout, exitCode } = await execPromise(cmd, 180000);

    // Parse for "Vulnerable" / "Not vulnerable" / "+" indicators
    const vulnerable = [];
    const notVulnerable = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
        if (line.includes("- Vulnerable") || line.includes("[+]") || line.includes("appears to be vulnerable")) {
            vulnerable.push(line.trim());
        }
        if (line.includes("is NOT vulnerable") || line.includes("[-]")) {
            notVulnerable.push(line.trim());
        }
    }

    const result = {
        tool: "metasploit",
        target: rhosts,
        mode: moduleId,
        moduleName: modInfo.name,
        moduleFullPath: modInfo.module,
        timestamp: new Date().toISOString(),
        raw: stdout,
        parsed: {
            vulnerable,
            notVulnerable,
            isVulnerable: vulnerable.length > 0,
            summary: vulnerable.length > 0
                ? `Vulnerabilidades detectadas: ${vulnerable.length}`
                : "No se detectaron vulnerabilidades con este módulo.",
        },
        exitCode,
    };

    await saveToolResult(result);
    return result;
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function saveToolResult(result) {
    try {
        await db.saveToolResult({
            tool:      result.tool,
            target:    result.target,
            mode:      result.mode,
            summary:   result.parsed?.summary || result.parsed?.ports?.length + " ports" || "",
            raw:       result.raw,
            timestamp: result.timestamp,
        });
    } catch (e) {
        console.error("[tools] DB save error:", e.message);
    }
}

async function getToolResults(limit = 50) {
    return db.getToolResults(limit);
}

module.exports = {
    nmapScan,
    arpScan,
    msfScan,
    getToolResults,
    MSF_MODULES,
};