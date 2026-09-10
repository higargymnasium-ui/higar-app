import React, { useState, useEffect, useMemo } from "react";
import { listRows, createRow, updateRow, deleteRow, uploadImage } from "./api.js";
import {
  Home, Boxes, Wrench, AlertTriangle, Search, Plus, MapPin, Bell,
  Calendar, X, ChevronRight, ChevronDown, Camera, Clock, CheckCircle2,
  User, LogOut, ClipboardList, ClipboardCheck, Settings, Trash2, Download, RefreshCw,
} from "lucide-react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500&display=swap');
`;

const C = {
  dark: "#1B1B19",
  cream: "#F4F0E7",
  frame: "#E7E2D5",
  surface: "#FFFFFF",
  ink: "#232320",
  muted: "#8C8676",
  border: "#EAE4D6",
  accent: "#AE9573",
  accentDeep: "#7C6440",
  accentBg: "#EFE7D9",
  green: "#4C8C5B",
  greenBg: "#E4F0E6",
  red: "#C1443C",
  redBg: "#F8E4E2",
  purple: "#6B5B95",
  purpleBg: "#E5E1F0",
};

const BODY = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const f = (family, extra) => ({ fontFamily: family, ...extra });

const CATEGORIES_SEED = ["Cardio", "Beban Bebas", "Kekuatan", "Aksesoris"];
const BRANCH_LOCATIONS_SEED = {
  "HIGAR Gym Andi Djemma": ["Lt.1 - Area Cardio", "Lt.1 - Area Beban Bebas", "Lt.2 - Ruang Kekuatan", "Gudang Aksesoris"],
  "HIGAR CPI": ["Lt.1 - Area Gym", "Lt.2 - Ruang Hyrox", "Lt.2 - Ruang SPIN", "Lt.2 - Ruang Studio"],
  "HIGAR Studio": ["Lt.1 - Area Cardio", "Lt.1 - Area Beban Bebas", "Lt.2 - Ruang Kekuatan", "Gudang Aksesoris"],
  "HIGAR Pilates": ["Lt.1 - Area Cardio", "Lt.1 - Area Beban Bebas", "Lt.2 - Ruang Kekuatan", "Gudang Aksesoris"],
};
const BRANCHES = Object.keys(BRANCH_LOCATIONS_SEED);

// Zona yang mengandung kata ini dianggap checklist Mingguan (biasanya alat kecil/aksesoris),
// zona lainnya otomatis checklist Harian.
function getChecklistFreq(loc) {
  return /Gudang|Aksesoris|Studio/i.test(loc) ? "Mingguan" : "Harian";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(isoStart, isoEnd) {
  const d1 = new Date(isoStart + "T00:00:00");
  const d2 = new Date(isoEnd + "T00:00:00");
  return Math.round((d2 - d1) / 86400000);
}
// Checklist Harian dianggap "selesai" hanya kalau dikerjakan HARI INI.
// Checklist Mingguan dianggap "selesai" kalau dikerjakan dalam 7 hari terakhir.
// Otomatis reset sendiri tiap hari/minggu tanpa perlu campur tangan manual.
function isChecklistDone(lastDoneISO, freq) {
  if (!lastDoneISO) return false;
  const diff = daysBetween(lastDoneISO, todayISO());
  if (freq === "Mingguan") return diff >= 0 && diff < 7;
  return diff === 0;
}
function formatIndoDate(iso) {
  if (!iso) return "Belum pernah";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

const ROLES = {
  staff_maintenance: { label: "Staff Maintenance", desc: "Cek alat & update maintenance" },
  supervisor: { label: "Supervisor", desc: "Verifikasi laporan, akses semua cabang" },
  manager: { label: "Manager", desc: "Akses penuh semua cabang" },
};

const seedChecklistStatus = {
  "Lt.1 - Area Cardio": { lastDone: "2026-08-01" },
  "Lt.1 - Area Beban Bebas": { lastDone: "2026-07-31" },
  "Lt.2 - Ruang Kekuatan": { lastDone: "2026-07-30" },
  "Gudang Aksesoris": { lastDone: "2026-07-22" },
  "Lt.1 - Area Gym": { lastDone: "2026-08-01" },
  "Lt.2 - Ruang Hyrox": { lastDone: "2026-07-27" },
  "Lt.2 - Ruang SPIN": { lastDone: "2026-07-29" },
  "Lt.2 - Ruang Studio": { lastDone: "2026-07-28" },
};

const seedUsers = [
  { id: "U-001", name: "Dimas Pratama", email: "dimas@higar.id", password: "dimas123", role: "staff_maintenance", branch: "HIGAR Gym Andi Djemma", aktif: true },
  { id: "U-002", name: "Budi Santoso", email: "budi@higar.id", password: "budi123", role: "staff_maintenance", branch: "HIGAR CPI", aktif: true },
  { id: "U-003", name: "Sari Wulandari", email: "sari@higar.id", password: "sari123", role: "supervisor", branch: "Semua Cabang", aktif: true },
  { id: "U-004", name: "Andi Kurniawan", email: "andi@higar.id", password: "andi123", role: "manager", branch: "Semua Cabang", aktif: true },
];

const seedAssets = [
  { id: "A-0001", name: "Treadmill NordicTrack X22i", cat: "Cardio", loc: "Lt.1 - Area Cardio", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "12 Jun 2026", nextM: "12 Sep 2026", value: "Rp 85.000.000" },
  { id: "A-0002", name: "Rowing Machine Concept2", cat: "Cardio", loc: "Lt.1 - Area Cardio", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "02 Jul 2026", nextM: "02 Okt 2026", value: "Rp 22.000.000" },
  { id: "A-0003", name: "Leg Press Machine", cat: "Kekuatan", loc: "Lt.2 - Ruang Kekuatan", branch: "HIGAR Gym Andi Djemma", status: "rusak", lastM: "18 Mei 2026", nextM: "Segera", value: "Rp 45.000.000" },
  { id: "A-0004", name: "Lat Pulldown Cable", cat: "Kekuatan", loc: "Lt.1 - Area Gym", branch: "HIGAR CPI", status: "perbaikan", lastM: "20 Jul 2026", nextM: "20 Okt 2026", value: "Rp 30.000.000" },
  { id: "A-0005", name: "Dumbbell Set 2-40kg", cat: "Beban Bebas", loc: "Lt.1 - Area Gym", branch: "HIGAR CPI", status: "aktif", lastM: "01 Jul 2026", nextM: "01 Jan 2027", value: "Rp 18.000.000" },
  { id: "A-0006", name: "Kettlebell 16kg", cat: "Aksesoris", loc: "Gudang Aksesoris", branch: "HIGAR Studio", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 4.200.000", qty: 8 },
  { id: "A-0007", name: "Resistance Band Set", cat: "Aksesoris", loc: "Gudang Aksesoris", branch: "HIGAR Studio", status: "hilang", lastM: "-", nextM: "-", value: "Rp 800.000", qty: 10 },
  { id: "A-0008", name: "Reformer Pilates Bed", cat: "Kekuatan", loc: "Lt.1 - Area Beban Bebas", branch: "HIGAR Pilates", status: "aktif", lastM: "25 Jun 2026", nextM: "25 Sep 2026", value: "Rp 38.000.000" },
  { id: "A-0009", name: "Spin Bike Keiser M3i", cat: "Cardio", loc: "Lt.1 - Area Cardio", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "25 Jun 2026", nextM: "25 Sep 2026", value: "Rp 38.000.000" },
  { id: "A-0010", name: "Elliptical Cross-Trainer", cat: "Cardio", loc: "Lt.1 - Area Cardio", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "05 Jul 2026", nextM: "05 Okt 2026", value: "Rp 27.000.000" },
  { id: "A-0011", name: "Stairmaster StepMill", cat: "Cardio", loc: "Lt.1 - Area Gym", branch: "HIGAR CPI", status: "perbaikan", lastM: "10 Jul 2026", nextM: "10 Okt 2026", value: "Rp 32.000.000" },
  { id: "A-0012", name: "Assault Air Bike", cat: "Cardio", loc: "Lt.2 - Ruang Hyrox", branch: "HIGAR CPI", status: "aktif", lastM: "08 Jul 2026", nextM: "08 Okt 2026", value: "Rp 15.500.000" },
  { id: "A-0013", name: "Smith Machine", cat: "Kekuatan", loc: "Lt.2 - Ruang Kekuatan", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "14 Jun 2026", nextM: "14 Sep 2026", value: "Rp 40.000.000" },
  { id: "A-0014", name: "Cable Crossover Machine", cat: "Kekuatan", loc: "Lt.2 - Ruang Kekuatan", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "22 Jun 2026", nextM: "22 Sep 2026", value: "Rp 42.000.000" },
  { id: "A-0015", name: "Chest Press Machine", cat: "Kekuatan", loc: "Lt.1 - Area Gym", branch: "HIGAR CPI", status: "aktif", lastM: "03 Jul 2026", nextM: "03 Okt 2026", value: "Rp 28.000.000" },
  { id: "A-0016", name: "Seated Row Machine", cat: "Kekuatan", loc: "Lt.1 - Area Gym", branch: "HIGAR CPI", status: "rusak", lastM: "11 Mei 2026", nextM: "Segera", value: "Rp 26.000.000" },
  { id: "A-0017", name: "Hack Squat Machine", cat: "Kekuatan", loc: "Lt.2 - Ruang Kekuatan", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "19 Jun 2026", nextM: "19 Sep 2026", value: "Rp 36.000.000" },
  { id: "A-0018", name: "Barbell Olympic 20kg", cat: "Beban Bebas", loc: "Lt.1 - Area Beban Bebas", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "01 Jul 2026", nextM: "01 Jan 2027", value: "Rp 3.500.000", qty: 12 },
  { id: "A-0019", name: "Weight Plate Set (Bumper)", cat: "Beban Bebas", loc: "Lt.2 - Ruang Hyrox", branch: "HIGAR CPI", status: "aktif", lastM: "01 Jul 2026", nextM: "01 Jan 2027", value: "Rp 21.000.000" },
  { id: "A-0020", name: "Adjustable Bench", cat: "Beban Bebas", loc: "Lt.1 - Area Beban Bebas", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "01 Jul 2026", nextM: "01 Jan 2027", value: "Rp 6.500.000" },
  { id: "A-0021", name: "EZ Curl Bar", cat: "Beban Bebas", loc: "Lt.1 - Area Gym", branch: "HIGAR CPI", status: "aktif", lastM: "01 Jul 2026", nextM: "01 Jan 2027", value: "Rp 2.100.000", qty: 5 },
  { id: "A-0022", name: "Yoga Mat Premium", cat: "Aksesoris", loc: "Gudang Aksesoris", branch: "HIGAR Studio", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 3.000.000", qty: 20 },
  { id: "A-0023", name: "Foam Roller", cat: "Aksesoris", loc: "Gudang Aksesoris", branch: "HIGAR Studio", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 1.400.000", qty: 15 },
  { id: "A-0024", name: "Medicine Ball 6kg", cat: "Aksesoris", loc: "Gudang Aksesoris", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 2.800.000", qty: 6 },
  { id: "A-0025", name: "Jump Rope", cat: "Aksesoris", loc: "Lt.2 - Ruang Studio", branch: "HIGAR CPI", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 900.000", qty: 12 },
  { id: "A-0026", name: "Battle Rope 12m", cat: "Aksesoris", loc: "Gudang Aksesoris", branch: "HIGAR Gym Andi Djemma", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 1.800.000", qty: 4 },
  { id: "A-0027", name: "Reformer Pilates Bed (2)", cat: "Kekuatan", loc: "Lt.1 - Area Beban Bebas", branch: "HIGAR Pilates", status: "aktif", lastM: "25 Jun 2026", nextM: "25 Sep 2026", value: "Rp 38.000.000" },
  { id: "A-0028", name: "Pilates Cadillac Frame", cat: "Kekuatan", loc: "Lt.2 - Ruang Kekuatan", branch: "HIGAR Pilates", status: "aktif", lastM: "27 Jun 2026", nextM: "27 Sep 2026", value: "Rp 55.000.000" },
  { id: "A-0029", name: "Pilates Wunda Chair", cat: "Kekuatan", loc: "Lt.2 - Ruang Kekuatan", branch: "HIGAR Pilates", status: "perbaikan", lastM: "22 Jul 2026", nextM: "22 Okt 2026", value: "Rp 24.000.000" },
  { id: "A-0030", name: "Treadmill Life Fitness T5", cat: "Cardio", loc: "Lt.1 - Area Cardio", branch: "HIGAR Pilates", status: "aktif", lastM: "09 Jul 2026", nextM: "09 Okt 2026", value: "Rp 78.000.000" },
  { id: "A-0031", name: "Sled Push Sled", cat: "Kekuatan", loc: "Lt.2 - Ruang Hyrox", branch: "HIGAR CPI", status: "aktif", lastM: "12 Jul 2026", nextM: "12 Okt 2026", value: "Rp 9.500.000" },
  { id: "A-0032", name: "Wall Ball 9kg", cat: "Aksesoris", loc: "Lt.2 - Ruang Hyrox", branch: "HIGAR CPI", status: "aktif", lastM: "12 Jul 2026", nextM: "12 Okt 2026", value: "Rp 1.100.000", qty: 10 },
  { id: "A-0033", name: "Spin Bike Schwinn IC4", cat: "Cardio", loc: "Lt.2 - Ruang SPIN", branch: "HIGAR CPI", status: "aktif", lastM: "18 Jul 2026", nextM: "18 Okt 2026", value: "Rp 24.000.000" },
  { id: "A-0034", name: "Spin Bike Schwinn IC4 (2)", cat: "Cardio", loc: "Lt.2 - Ruang SPIN", branch: "HIGAR CPI", status: "perbaikan", lastM: "05 Jul 2026", nextM: "05 Okt 2026", value: "Rp 24.000.000" },
  { id: "A-0035", name: "Sound System Studio", cat: "Aksesoris", loc: "Lt.2 - Ruang Studio", branch: "HIGAR CPI", status: "aktif", lastM: "01 Jul 2026", nextM: "01 Okt 2026", value: "Rp 12.000.000", qty: 1 },
  { id: "A-0036", name: "Yoga Mat Studio", cat: "Aksesoris", loc: "Lt.2 - Ruang Studio", branch: "HIGAR CPI", status: "aktif", lastM: "15 Jun 2026", nextM: "15 Des 2026", value: "Rp 3.000.000", qty: 18 },
];

const seedDamage = [
  { id: "L-021", asset: "A-0003 · Leg Press Machine", reporter: "Dimas (Trainer)", date: "26 Jul 2026", desc: "Kabel seling putus, alat tidak bisa dipakai.", status: "dilaporkan" },
  { id: "L-020", asset: "A-0004 · Lat Pulldown Cable", reporter: "Sari (Front Desk)", date: "20 Jul 2026", desc: "Pegangan bar longgar, bunyi berdecit.", status: "diperbaiki" },
  { id: "L-019", asset: "A-0007 · Resistance Band Set", reporter: "Budi (Trainer)", date: "14 Jul 2026", desc: "3 unit tidak ditemukan saat checklist mingguan.", status: "diverifikasi" },
  { id: "L-022", asset: "A-0016 · Seated Row Machine", reporter: "Rio (Trainer)", date: "24 Jul 2026", desc: "Bantalan duduk sobek, per kabel mulai berkarat.", status: "dilaporkan" },
  { id: "L-023", asset: "A-0011 · Stairmaster StepMill", reporter: "Wulan (Front Desk)", date: "21 Jul 2026", desc: "Motor bergetar tidak wajar saat kecepatan tinggi.", status: "diverifikasi" },
  { id: "L-024", asset: "A-0029 · Pilates Wunda Chair", reporter: "Sinta (Instruktur)", date: "23 Jul 2026", desc: "Pegas kaki kendur, perlu penggantian pegas.", status: "diperbaiki" },
];

const statusStyle = {
  aktif: { bg: C.greenBg, fg: C.green, label: "Aktif" },
  rusak: { bg: C.redBg, fg: C.red, label: "Rusak" },
  perbaikan: { bg: C.accentBg, fg: C.accentDeep, label: "Perbaikan" },
  hilang: { bg: "#ECE9E2", fg: C.muted, label: "Hilang" },
  terjual: { bg: C.purpleBg, fg: C.purple, label: "Terjual" },
  write_off: { bg: "#E0DCD3", fg: C.muted, label: "Dihapuskan" },
};
const damageStatusStyle = {
  dilaporkan: { bg: C.redBg, fg: C.red, label: "Dilaporkan" },
  diverifikasi: { bg: C.accentBg, fg: C.accentDeep, label: "Diverifikasi" },
  diperbaiki: { bg: C.greenBg, fg: C.green, label: "Diperbaiki" },
};

const NAV_ITEMS = (damageCount, canManage) => [
  { key: "home", label: "Home", icon: Home },
  { key: "assets", label: "Aset", icon: Boxes },
  { key: "checklist", label: "Ceklis", icon: ClipboardCheck },
  { key: "maintenance", label: "Servis", icon: Wrench },
  { key: "damage", label: "Kerusakan", icon: AlertTriangle, badge: damageCount },
  ...(canManage ? [{ key: "settings", label: "Pengaturan", icon: Settings }] : []),
  { key: "profile", label: "Profil", icon: User },
];

function Pill({ status }) {
  const s = statusStyle[status];
  return (
    <span style={{ ...f(BODY), background: s.bg, color: s.fg, fontSize: 11, fontWeight: 600 }} className="px-2.5 py-1 rounded-full whitespace-nowrap">
      {s.label}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ ...f(BODY), color: C.ink, fontSize: 12, fontWeight: 600 }} className="mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function StatChip({ label, value, tone }) {
  const color = tone === "warn" ? C.accentDeep : tone === "bad" ? C.red : C.ink;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-3.5">
      <div style={{ ...f(BODY), color: C.muted, fontSize: 11, fontWeight: 500 }} className="mb-1">{label}</div>
      <div style={{ ...f(BODY), color, fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function AssetRow({ asset, onClick }) {
  const s = statusStyle[asset.status];
  return (
    <button
      onClick={onClick}
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${s.fg}` }}
      className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div style={{ ...f(BODY), color: C.ink, fontSize: 14, fontWeight: 700 }} className="truncate mb-0.5">
          {asset.name}{asset.qty ? <span style={{ color: C.accentDeep, fontWeight: 600 }}> × {asset.qty}</span> : null}
        </div>
        <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }} className="flex items-center gap-1 mb-1.5">
          <MapPin size={11} /> {asset.loc}
        </div>
        <div style={{ ...f(MONO), color: C.muted, fontSize: 10 }}>{asset.id}</div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Pill status={asset.status} />
        <ChevronRight size={16} color={C.muted} />
      </div>
    </button>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{ background: C.accentBg }} className="w-8 h-8 rounded-xl flex items-center justify-center">
        <Icon size={15} color={C.accentDeep} />
      </div>
      <div style={{ ...f(BODY), color: C.ink, fontSize: 16, fontWeight: 700 }}>{title}</div>
    </div>
  );
}

function BottomNav({ tab, setTab, damageCount, canManage }) {
  const items = NAV_ITEMS(damageCount, canManage);
  return (
    <div style={{ background: C.surface, borderTop: `1px solid ${C.border}` }} className="flex items-stretch shrink-0">
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button key={it.key} onClick={() => setTab(it.key)} className="flex-1 flex flex-col items-center gap-1 py-2 relative">
            <it.icon size={18} color={active ? C.accentDeep : "#B3AD9E"} />
            <span style={{ ...f(BODY), fontSize: 9, fontWeight: active ? 700 : 500, color: active ? C.accentDeep : "#B3AD9E" }}>{it.label}</span>
            {it.badge > 0 && (
              <span style={{ background: C.red, color: "#fff", ...f(BODY) }} className="absolute top-0.5 right-[22%] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SideNav({ tab, setTab, damageCount, session, onLogout, canManage }) {
  const items = NAV_ITEMS(damageCount, canManage);
  return (
    <div style={{ background: C.dark }} className="flex flex-col w-60 shrink-0">
      <div className="px-5 pt-6 pb-5">
        <div style={{ ...f(BODY), color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: "0.18em" }}>HIGAR</div>
        <div style={{ ...f(BODY), color: "#A9A69C", fontSize: 11 }} className="mt-0.5">Asset & Equipment</div>
      </div>
      <div className="flex-1 px-3 space-y-1">
        {items.map((it) => {
          const active = tab === it.key;
          return (
            <button
              key={it.key} onClick={() => setTab(it.key)}
              style={{ background: active ? "rgba(174,149,115,0.18)" : "transparent", color: active ? C.accent : "#A9A69C" }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative"
            >
              <it.icon size={17} />
              <span className="flex-1 text-left">{it.label}</span>
              {it.badge > 0 && (
                <span style={{ background: C.red, color: "#fff", ...f(BODY) }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">{it.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="p-3">
        <div style={{ background: "rgba(255,255,255,0.06)" }} className="rounded-xl p-3 mb-2">
          <div style={{ ...f(BODY), color: "#fff", fontSize: 13, fontWeight: 700 }}>{session.name}</div>
          <div style={{ ...f(BODY), color: C.accent, fontSize: 11, fontWeight: 600 }}>{ROLES[session.role].label}</div>
        </div>
        <button onClick={onLogout} style={{ color: "#A9A69C" }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium">
          <LogOut size={14} /> Keluar
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, isDesktop, usersList }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      setError("Isi email dan sandi terlebih dahulu.");
      return;
    }
    const user = usersList.find(
      (u) =>
        String(u.email || "").trim().toLowerCase() === email.trim().toLowerCase() &&
        String(u.password || "").trim() === password.trim()
    );
    if (!user) {
      setError("Email atau sandi salah.");
      return;
    }
    if (!user.aktif) {
      setError("Akun ini sudah dinonaktifkan. Hubungi Manager.");
      return;
    }
    setError("");
    onLogin({ name: user.name, role: user.role, branch: user.branch });
  };

  const formInner = (
    <>
      <Field label="Email">
        <input
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cth. dimas@higar.id"
          type="email"
          style={{ ...f(BODY), border: `1px solid ${C.border}` }}
          className="w-full rounded-xl px-3.5 py-3 text-sm bg-white outline-none"
        />
      </Field>
      <div className="h-4" />
      <Field label="Sandi">
        <input
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan sandi"
          type="password"
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          style={{ ...f(BODY), border: `1px solid ${C.border}` }}
          className="w-full rounded-xl px-3.5 py-3 text-sm bg-white outline-none"
        />
      </Field>

      {error && (
        <div style={{ background: C.redBg, color: C.red, ...f(BODY) }} className="rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-3">
          {error}
        </div>
      )}

      <div className="h-6" />
      <button
        onClick={handleSubmit}
        style={{ background: C.dark, color: "#fff" }}
        className="w-full py-3.5 rounded-xl text-sm font-bold"
      >
        Masuk
      </button>
    </>
  );

  if (isDesktop) {
    return (
      <div className="flex w-full h-full">
        <div style={{ background: C.dark }} className="w-[42%] shrink-0 flex flex-col justify-center px-10">
          <div style={{ ...f(BODY), color: "#fff", fontSize: 34, fontWeight: 800, letterSpacing: "0.14em" }}>HIGAR</div>
          <div style={{ ...f(BODY), color: "#A9A69C", fontSize: 14 }} className="mt-2 mb-8 max-w-xs">Asset & Equipment Management — pantau, rawat, dan lindungi peralatan di setiap cabang.</div>
          {BRANCHES.map((b) => (
            <div key={b} style={{ ...f(BODY), color: "#7C7A70", fontSize: 12 }} className="flex items-center gap-2 mb-1.5"><MapPin size={12} /> {b}</div>
          ))}
        </div>
        <div style={{ background: C.cream }} className="flex-1 flex items-center justify-center overflow-y-auto py-8">
          <div style={{ width: 380 }}>{formInner}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.dark }} className="w-full h-full flex flex-col justify-end">
      <div className="px-6 pt-10 pb-2">
        <div style={{ ...f(BODY), color: "#fff", fontSize: 30, fontWeight: 800, letterSpacing: "0.18em" }}>HIGAR</div>
        <div style={{ ...f(BODY), color: "#A9A69C", fontSize: 13 }} className="mt-1">Asset & Equipment Management</div>
      </div>
      <div style={{ background: C.cream }} className="rounded-t-[2rem] px-5 pt-6 pb-6 flex-1 overflow-y-auto">
        {formInner}
      </div>
    </div>
  );
}

function Sheet({ title, subtitle, onClose, children, isDesktop, wide }) {
  if (isDesktop) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,20,18,0.5)" }}>
        <div style={{ background: C.cream, width: wide ? 560 : 480, maxHeight: "85%" }} className="rounded-2xl overflow-y-auto">
          <div style={{ background: C.cream }} className="sticky top-0 flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <div style={{ ...f(BODY), color: C.ink, fontSize: 17, fontWeight: 800 }}>{title}</div>
              {subtitle && <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ background: "#fff" }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              <X size={16} color={C.ink} />
            </button>
          </div>
          <div className="px-6 pb-6">{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(20,20,18,0.5)" }}>
      <div style={{ background: C.cream, maxHeight: "88%" }} className="rounded-t-[1.75rem] overflow-y-auto">
        <div style={{ background: C.cream }} className="sticky top-0 flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <div style={{ ...f(BODY), color: C.ink, fontSize: 16, fontWeight: 800 }}>{title}</div>
            {subtitle && <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: "#fff" }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <X size={16} color={C.ink} />
          </button>
        </div>
        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}

function AssetDetailSheet({ asset, onClose, isDesktop, onStartRepair, onReportDamage, damageList, canSwitchBranch, isManager, onChangeStatus, onDeleteAsset, onDuplicate, onUpdatePhoto }) {
  const [newPhoto, setNewPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  if (!asset) return null;
  const history = damageList.filter((d) => d.asset.startsWith(asset.id + " "));
  const isBroken = ["rusak", "perbaikan", "hilang"].includes(asset.status);

  const statusOptions = [
    { key: "aktif", label: "Aktif" },
    { key: "rusak", label: "Rusak" },
    { key: "perbaikan", label: "Perbaikan" },
    { key: "hilang", label: "Hilang" },
    { key: "terjual", label: "Terjual" },
    { key: "write_off", label: "Dihapuskan" },
  ];

  const detailRows = [["Lokasi", asset.loc], ["Cabang", asset.branch], ["Kategori", asset.cat]];
  if (asset.qty) detailRows.push(["Jumlah Unit", `${asset.qty} unit`]);
  detailRows.push(["Maintenance Terakhir", asset.lastM], ["Maintenance Berikutnya", asset.nextM], ["Nilai Aset", asset.value]);

  const photoForPicker = newPhoto || (asset.photoUrl ? { preview: asset.photoUrl } : null);

  return (
    <Sheet title={asset.id} onClose={onClose} isDesktop={isDesktop}>
      {!canSwitchBranch && asset.photoUrl && (
        <img
          src={asset.photoUrl} alt={asset.name}
          className="w-full h-40 object-cover rounded-2xl mb-4"
          style={{ border: `1px solid ${C.border}` }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div style={{ ...f(BODY), color: C.ink, fontSize: 20, fontWeight: 800 }} className="mb-1">
        {asset.name}{asset.qty ? <span style={{ color: C.accentDeep }}> × {asset.qty} unit</span> : null}
      </div>
      <div className="mb-4"><Pill status={asset.status} /></div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-4 space-y-3">
        {detailRows.map(([l, v]) => (
          <div key={l} className="flex items-center justify-between">
            <span style={{ ...f(BODY), color: C.muted, fontSize: 12 }}>{l}</span>
            <span style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      {isBroken ? (
        <button onClick={() => onStartRepair(asset)} style={{ background: C.green, color: "#fff" }} className="w-full py-3 rounded-xl text-sm font-bold">
          Tandai Sudah Diperbaiki
        </button>
      ) : asset.status === "aktif" ? (
        <button onClick={() => onReportDamage(asset)} style={{ background: C.dark, color: "#fff" }} className="w-full py-3 rounded-xl text-sm font-bold">
          Lapor Kerusakan untuk Aset Ini
        </button>
      ) : null}

      {canSwitchBranch && (
        <div className="mt-5">
          <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }} className="mb-2.5">
            {asset.photoUrl ? "Ganti Foto Aset" : "Tambah Foto Aset"}
          </div>
          <PhotoPicker
            photo={photoForPicker}
            isUploading={uploadingPhoto}
            onSelect={(file) => setNewPhoto({ file, preview: URL.createObjectURL(file) })}
          />
          {newPhoto && (
            <button
              onClick={async () => {
                setUploadingPhoto(true);
                await onUpdatePhoto(asset.id, newPhoto.file);
                setUploadingPhoto(false);
                setNewPhoto(null);
              }}
              disabled={uploadingPhoto}
              style={{ background: C.dark, color: "#fff", opacity: uploadingPhoto ? 0.7 : 1 }}
              className="w-full py-2.5 rounded-xl text-xs font-bold mt-2"
            >
              {uploadingPhoto ? "Menyimpan..." : "Simpan Foto"}
            </button>
          )}
        </div>
      )}

      {canSwitchBranch && (
        <button
          onClick={() => onDuplicate(asset)}
          style={{ border: `1.5px dashed ${C.accent}`, color: C.accentDeep, ...f(BODY) }}
          className="w-full py-2.5 rounded-xl text-xs font-bold mt-2 flex items-center justify-center gap-1.5"
        >
          <Plus size={13} /> Duplikat Aset (untuk unit identik lainnya)
        </button>
      )}

      {canSwitchBranch && (
        <div className="mt-5">
          <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }} className="mb-2.5">Ubah Status Aset</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {statusOptions.map((s) => (
              <button key={s.key} onClick={() => onChangeStatus(asset.id, s.key)}
                style={{
                  background: asset.status === s.key ? statusStyle[s.key].bg : C.surface,
                  color: asset.status === s.key ? statusStyle[s.key].fg : C.ink,
                  border: `1.5px solid ${asset.status === s.key ? statusStyle[s.key].fg : C.border}`,
                  ...f(BODY),
                }}
                className="py-2 rounded-lg text-xs font-bold"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isManager && (
        <button
          onClick={() => { if (window.confirm(`Hapus permanen "${asset.name}"? Tindakan ini tidak bisa dibatalkan.`)) onDeleteAsset(asset.id); }}
          style={{ background: C.redBg, color: C.red, ...f(BODY) }}
          className="w-full py-2.5 rounded-xl text-xs font-bold mt-2 flex items-center justify-center gap-1.5"
        >
          <Trash2 size={13} /> Hapus Aset Permanen
        </button>
      )}


      {history.length > 0 && (
        <div className="mt-5">
          <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }} className="mb-3">Riwayat Kerusakan & Perbaikan</div>
          <div className="relative pl-5">
            <div style={{ background: C.border }} className="absolute left-[5px] top-1 bottom-1 w-px" />
            <div className="space-y-4">
              {history.map((d) => {
                const s = damageStatusStyle[d.status];
                return (
                  <div key={d.id} className="relative">
                    <div style={{ background: s.fg }} className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full" />
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ ...f(BODY), color: C.ink, fontSize: 12, fontWeight: 700 }}>{d.date}</span>
                      <span style={{ background: s.bg, color: s.fg, ...f(BODY), fontSize: 9, fontWeight: 700 }} className="px-2 py-0.5 rounded-full uppercase">{s.label}</span>
                    </div>
                    <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }} className="mb-0.5">{d.desc}</div>
                    <div style={{ ...f(MONO), color: C.muted, fontSize: 10 }}>{d.reporter}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function RepairSheet({ asset, onClose, onSubmit, isDesktop }) {
  const [note, setNote] = useState("");
  const [cost, setCost] = useState("");
  return (
    <Sheet title="Tandai Sudah Diperbaiki" subtitle={`${asset.id} · ${asset.name}`} onClose={onClose} isDesktop={isDesktop}>
      <div className="space-y-4">
        <Field label="Catatan Perbaikan">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: kabel seling sudah diganti baru"
            style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-3 text-sm bg-white h-24 resize-none" />
        </Field>
        <Field label="Biaya Perbaikan (Rp, opsional)">
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="250.000"
            style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-3 text-sm bg-white" />
        </Field>
        <button onClick={() => onSubmit({ note, cost })} style={{ background: C.green, color: "#fff" }} className="w-full py-3.5 rounded-xl text-sm font-bold">
          Tandai Selesai Diperbaiki
        </button>
      </div>
    </Sheet>
  );
}

function PhotoPicker({ photo, onSelect, isUploading }) {
  const inputRef = React.useRef(null);
  return (
    <div>
      <input
        ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const file = e.target.files[0]; if (file) onSelect(file); e.target.value = ""; }}
      />
      {photo ? (
        <div className="relative">
          <img src={photo.preview} alt="Preview foto" className="w-full h-32 object-cover rounded-xl" style={{ border: `1px solid ${C.border}` }} />
          <button type="button" onClick={() => inputRef.current?.click()}
            style={{ background: C.dark, color: "#fff", ...f(BODY) }} className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg text-xs font-bold">
            Ganti Foto
          </button>
        </div>
      ) : (
        <button
          type="button" onClick={() => inputRef.current?.click()}
          style={{ border: `1.5px dashed ${C.border}`, color: C.muted }}
          className="w-full rounded-xl py-6 flex flex-col items-center gap-1 text-xs"
        >
          <Camera size={20} /> {isUploading ? "Mengunggah foto..." : "Ketuk untuk ambil / unggah foto"}
        </button>
      )}
    </div>
  );
}

function ReportDamageSheet({ onClose, assets, isDesktop, onSubmit, presetAssetId, canSwitchBranch }) {
  const [assetId, setAssetId] = useState(presetAssetId || assets[0]?.id || "");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet title="Lapor Kerusakan" onClose={onClose} isDesktop={isDesktop}>
      <div className="space-y-4">
        <Field label="Pilih Aset">
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-3 text-sm bg-white">
            {assets.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}
          </select>
        </Field>
        <Field label="Deskripsi Kerusakan">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Contoh: pegangan bar longgar, bunyi berdecit"
            style={{ ...f(BODY), border: `1px solid ${C.border}` }}
            className="w-full rounded-xl px-3.5 py-3 text-sm bg-white h-24 resize-none" />
        </Field>
        <Field label="Foto (opsional)">
          <PhotoPicker photo={photo} isUploading={submitting} onSelect={(file) => setPhoto({ file, preview: URL.createObjectURL(file) })} />
        </Field>
        <button
          onClick={async () => {
            if (!assetId || !desc.trim() || submitting) return;
            setSubmitting(true);
            await onSubmit({ assetId, desc, photoFile: photo?.file });
            setSubmitting(false);
          }}
          disabled={submitting}
          style={{ background: C.dark, color: "#fff", opacity: submitting ? 0.7 : 1 }} className="w-full py-3.5 rounded-xl text-sm font-bold"
        >
          {submitting ? "Mengirim..." : "Kirim Laporan"}
        </button>
      </div>
    </Sheet>
  );
}

function AddAssetSheet({ onClose, onSave, defaultBranch, isManager, isDesktop, categoriesList, branchLocations, duplicateFrom }) {
  const initialBranch = duplicateFrom?.branch || (defaultBranch === "Semua Cabang" ? BRANCHES[0] : defaultBranch);
  const [form, setForm] = useState({
    name: duplicateFrom?.name || "",
    cat: duplicateFrom?.cat || categoriesList[0],
    branch: initialBranch,
    loc: duplicateFrom?.loc || branchLocations[initialBranch][0],
    tglBeli: "", harga: duplicateFrom?.rawHarga || "", supplier: duplicateFrom?.supplier || "", garansi: "",
    qty: duplicateFrom?.qty ? String(duplicateFrom.qty) : "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setBranch = (e) => {
    const branch = e.target.value;
    setForm({ ...form, branch, loc: branchLocations[branch][0] });
  };
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet title={duplicateFrom ? "Duplikat Aset" : "Tambah Aset Baru"} subtitle={duplicateFrom ? `Berdasarkan ${duplicateFrom.id}` : undefined} onClose={onClose} isDesktop={isDesktop}>
      <div className="space-y-4">
        <Field label="Nama Alat">
          <input value={form.name} onChange={set("name")} placeholder="Contoh: Treadmill NordicTrack X22i"
            style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-3 text-sm bg-white" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <select value={form.cat} onChange={set("cat")} style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-3 text-sm bg-white">
              {categoriesList.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Cabang">
            <select value={form.branch} onChange={setBranch} disabled={!isManager}
              style={{ ...f(BODY), border: `1px solid ${C.border}`, opacity: isManager ? 1 : 0.6 }} className="w-full rounded-xl px-3 py-3 text-sm bg-white">
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Lokasi / Zona">
          <select value={form.loc} onChange={set("loc")} style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-3 text-sm bg-white">
            {branchLocations[form.branch].map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Jumlah Unit (opsional)">
          <input type="number" min="1" value={form.qty} onChange={set("qty")} placeholder="Kosongkan kalau cuma 1 unit"
            style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-3 text-sm bg-white" />
          <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }} className="mt-1.5">
            Isi kalau ini alat kecil dengan banyak unit sejenis (misal 8 kettlebell). Checklist akan cek berdasarkan jumlah, bukan kondisi satu-satu. Untuk alat besar (treadmill, mesin), biarkan kosong &mdash; pakai tombol "Duplikat" di kartu aset kalau ada beberapa unit identik.
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal Beli">
            <input type="date" value={form.tglBeli} onChange={set("tglBeli")} style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-3 text-sm bg-white" />
          </Field>
          <Field label="Harga (Rp)">
            <input value={form.harga} onChange={set("harga")} placeholder="15.000.000" style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-3 text-sm bg-white" />
          </Field>
        </div>
        <Field label="Supplier">
          <input value={form.supplier} onChange={set("supplier")} placeholder="Contoh: PT Fitness Prima" style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-3 text-sm bg-white" />
        </Field>
        <Field label="Foto Alat (opsional)">
          <PhotoPicker photo={photo} isUploading={submitting} onSelect={(file) => setPhoto({ file, preview: URL.createObjectURL(file) })} />
        </Field>
        <button
          onClick={async () => {
            if (!form.name.trim() || submitting) return;
            setSubmitting(true);
            await onSave({ ...form, photoFile: photo?.file });
            setSubmitting(false);
          }}
          disabled={submitting}
          style={{ background: C.dark, color: "#fff", opacity: submitting ? 0.7 : 1 }} className="w-full py-3.5 rounded-xl text-sm font-bold"
        >
          {submitting ? "Menyimpan..." : "Simpan Aset"}
        </button>
      </div>
    </Sheet>
  );
}

function ChecklistCard({ loc, freq, status, count, onStart }) {
  const done = isChecklistDone(status?.lastDone, freq);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${done ? C.green : C.accent}` }} className="rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div style={{ ...f(BODY), color: C.ink, fontSize: 14, fontWeight: 700 }} className="mb-0.5">{loc}</div>
          <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>{count} alat terdaftar</div>
        </div>
        <span style={{ background: C.accentBg, color: C.accentDeep, ...f(BODY), fontSize: 10, fontWeight: 700 }} className="px-2 py-1 rounded-full whitespace-nowrap">{freq}</span>
      </div>
      <div className="flex items-center justify-between">
        <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }} className="flex items-center gap-1">
          <Clock size={11} /> Terakhir: {formatIndoDate(status?.lastDone)}
        </div>
        {done ? (
          <span style={{ color: C.green, ...f(BODY), fontSize: 12, fontWeight: 700 }} className="flex items-center gap-1"><CheckCircle2 size={13} /> Sudah dicek</span>
        ) : (
          <button onClick={onStart} style={{ background: C.dark, color: "#fff", ...f(BODY) }} className="px-3.5 py-1.5 rounded-full text-xs font-bold">
            Mulai Checklist
          </button>
        )}
      </div>
    </div>
  );
}

function ChecklistSheet({ loc, freq, assetsHere, onClose, onSubmit, isDesktop }) {
  const [results, setResults] = useState(() =>
    assetsHere.map((a) => ({
      id: a.id, name: a.name, cat: a.cat, qty: a.qty ?? null,
      condition: a.qty ? null : "baik",
      foundQty: a.qty ?? "",
      note: "",
    }))
  );
  const update = (id, patch) => setResults((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const markAllGood = () => {
    onSubmit(
      assetsHere.map((a) => ({
        id: a.id, name: a.name, cat: a.cat, qty: a.qty ?? null,
        condition: "baik",
        foundQty: a.qty ?? "",
        note: "",
      }))
    );
  };

  const conditions = [
    { key: "baik", label: "Baik", color: C.green, bg: C.greenBg },
    { key: "rusak", label: "Rusak", color: C.red, bg: C.redBg },
    { key: "hilang", label: "Hilang", color: C.muted, bg: "#ECE9E2" },
  ];

  const missingNotes = results.some((r) => {
    if (r.qty) return r.foundQty !== "" && Number(r.foundQty) < r.qty && !r.note.trim();
    return r.condition !== "baik" && !r.note.trim();
  });

  return (
    <Sheet title={`Checklist ${freq}`} subtitle={loc} onClose={onClose} isDesktop={isDesktop} wide>
      <button
        onClick={markAllGood}
        style={{ background: C.greenBg, color: C.green, border: `1.5px solid ${C.green}` }}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-2"
      >
        <CheckCircle2 size={16} /> Semua Alat Kondisinya Baik — Selesaikan Sekarang
      </button>
      <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }} className="text-center mb-4">
        atau tinjau satu per satu di bawah kalau ada yang bermasalah
      </div>
      <div className="space-y-3 mb-5">
        {results.map((r) => {
          const needsNote = r.qty
            ? (r.foundQty !== "" && Number(r.foundQty) < r.qty)
            : (r.condition !== "baik");
          return (
          <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-3.5">
            <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }} className="mb-2.5">{r.name}</div>
            {r.qty ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div style={{ ...f(BODY), color: C.muted, fontSize: 10 }} className="mb-1">SEHARUSNYA</div>
                  <div style={{ background: C.cream, ...f(BODY), color: C.ink, fontWeight: 700 }} className="rounded-lg px-3 py-2 text-sm">{r.qty} unit</div>
                </div>
                <div className="flex-1">
                  <div style={{ ...f(BODY), color: C.muted, fontSize: 10 }} className="mb-1">DITEMUKAN</div>
                  <input type="number" value={r.foundQty} onChange={(e) => update(r.id, { foundQty: e.target.value })}
                    style={{ ...f(BODY), border: `1px solid ${r.foundQty !== "" && Number(r.foundQty) < r.qty ? C.red : C.border}` }}
                    className="w-full rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {conditions.map((c) => (
                  <button key={c.key} onClick={() => update(r.id, { condition: c.key })}
                    style={{ background: r.condition === c.key ? c.bg : C.cream, color: r.condition === c.key ? c.color : C.muted, border: `1.5px solid ${r.condition === c.key ? c.color : C.border}`, ...f(BODY) }}
                    className="flex-1 py-2 rounded-lg text-xs font-bold">
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {needsNote && (
              <div className="mt-2.5">
                <div style={{ ...f(BODY), color: C.red, fontSize: 10, fontWeight: 700 }} className="mb-1">CATATAN (WAJIB DIISI)</div>
                <textarea
                  value={r.note} onChange={(e) => update(r.id, { note: e.target.value })}
                  placeholder="Jelaskan kondisi kerusakan/kehilangannya..."
                  style={{ ...f(BODY), border: `1px solid ${!r.note.trim() ? C.red : C.border}` }}
                  className="w-full rounded-lg px-3 py-2 text-xs bg-white h-16 resize-none"
                />
              </div>
            )}
          </div>
          );
        })}
      </div>
      {missingNotes && (
        <div style={{ background: C.redBg, color: C.red, ...f(BODY) }} className="rounded-xl px-3.5 py-2.5 text-xs font-semibold mb-3">
          Isi catatan untuk semua alat yang rusak/hilang sebelum menyelesaikan checklist.
        </div>
      )}
      <button
        onClick={() => { if (!missingNotes) onSubmit(results); }}
        disabled={missingNotes}
        style={{ background: missingNotes ? C.border : C.dark, color: missingNotes ? C.muted : "#fff" }}
        className="w-full py-3.5 rounded-xl text-sm font-bold"
      >
        Selesaikan Checklist ({results.length} item)
      </button>
    </Sheet>
  );
}

export default function HigarApp() {
  const [device, setDevice] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"
  );

  useEffect(() => {
    const handleResize = () => setDevice(window.innerWidth < 768 ? "mobile" : "desktop");
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("Semua");
  const [locFilter, setLocFilter] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportPreset, setReportPreset] = useState(null);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetList, setAssetList] = useState(seedAssets);
  const [damageList, setDamageList] = useState(seedDamage);
  const [checklistStatus, setChecklistStatus] = useState(seedChecklistStatus);
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [repairTarget, setRepairTarget] = useState(null);
  const [branchView, setBranchView] = useState("Semua Cabang");
  const [usersList, setUsersList] = useState(seedUsers);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES_SEED);
  const [branchLocations, setBranchLocations] = useState(BRANCH_LOCATIONS_SEED);
  const [dataSource, setDataSource] = useState("dummy"); // "dummy" | "sheets"
  const [idMaps, setIdMaps] = useState({ branchIdByName: {}, catIdByName: {}, locIdByName: {}, nextLocSeq: 1, nextCatSeq: 1 });

  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadFromSheets = React.useCallback(async () => {
    setLoadingData(true);
    setLoadError("");
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [branchRows, locRows, catRows, assetRows, damageRows, userRows, checkRows] = await Promise.all([
        listRows("Branches"),
        listRows("Locations"),
        listRows("Categories"),
        listRows("Assets"),
        listRows("Damage_Reports"),
        listRows("Users"),
        listRows("Inventory_Checks"),
      ]);

      // Kalau VITE_API_URL belum diisi, listRows() mengembalikan null → tetap pakai data contoh
      if (!assetRows) {
        setLoadingData(false);
        return;
      }

      const branchNameById = {};
      const branchIdByName = {};
      (branchRows || []).forEach((b) => { branchNameById[b.id] = b.nama; branchIdByName[b.nama] = b.id; });

      const locNameById = {};
      const locIdByName = {};
      let maxLocSeq = 0;
      (locRows || []).forEach((l) => {
        locNameById[l.id] = l.nama_zona;
        locIdByName[`${branchNameById[l.branch_id]}||${l.nama_zona}`] = l.id;
        const num = parseInt(String(l.id).replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxLocSeq) maxLocSeq = num;
      });

      const catNameById = {};
      const catIdByName = {};
      let maxCatSeq = 0;
      (catRows || []).forEach((c) => {
        catNameById[c.id] = c.nama;
        catIdByName[c.nama] = c.id;
        const num = parseInt(String(c.id).replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxCatSeq) maxCatSeq = num;
      });

      setIdMaps({
        branchIdByName, catIdByName, locIdByName,
        nextLocSeq: maxLocSeq + 1, nextCatSeq: maxCatSeq + 1,
      });

      // Bangun status checklist dari Inventory_Checks (bukan lagi lokal per-browser),
      // supaya "sudah dicek hari ini" konsisten untuk semua staff, di device manapun.
      const newChecklistStatus = {};
      (checkRows || []).forEach((r) => {
        const locName = locNameById[r.location_id];
        if (!locName) return;
        const dateStr = String(r.tanggal || "").slice(0, 10);
        if (!dateStr) return;
        if (!newChecklistStatus[locName] || dateStr > newChecklistStatus[locName].lastDone) {
          newChecklistStatus[locName] = { lastDone: dateStr };
        }
      });
      setChecklistStatus(newChecklistStatus);

      const mappedAssets = assetRows.map((r) => ({
        id: r.id,
        name: r.nama,
        cat: catNameById[r.category_id] || r.category_id || "",
        loc: locNameById[r.location_id] || r.location_id || "",
        branch: branchNameById[r.branch_id] || r.branch_id || "",
        status: r.status || "aktif",
        lastM: r.lastM || "-",
        nextM: r.nextM || "-",
        value: r.harga || "-",
        qty: r.qty && !isNaN(Number(r.qty)) ? Number(r.qty) : undefined,
        photoUrl: r.foto_url || "",
      }));

      const assetNameById = {};
      mappedAssets.forEach((a) => { assetNameById[a.id] = a.name; });

      const mappedDamage = (damageRows || []).map((r) => ({
        id: r.id,
        asset: `${r.asset_id} · ${assetNameById[r.asset_id] || ""}`,
        reporter: r.reporter_id || "-",
        date: r.tanggal_lapor || "-",
        desc: r.deskripsi || "",
        status: r.status || "dilaporkan",
        photoUrl: r.foto_url || "",
      }));

      setAssetList(mappedAssets);
      setDamageList(mappedDamage);

      // Susun ulang branchLocations dari data Sheets (kalau ada)
      if (branchRows && locRows) {
        const rebuilt = {};
        branchRows.forEach((b) => { rebuilt[b.nama] = []; });
        locRows.forEach((l) => {
          const bname = branchNameById[l.branch_id];
          if (bname) {
            if (!rebuilt[bname]) rebuilt[bname] = [];
            rebuilt[bname].push(l.nama_zona);
          }
        });
        setBranchLocations(rebuilt);
      }
      if (catRows && catRows.length) {
        setCategoriesList(catRows.map((c) => c.nama));
      }
      if (userRows && userRows.length) {
        const mappedUsers = userRows.map((u) => ({
          id: String(u.id ?? ""),
          name: String(u.nama ?? ""),
          email: String(u.email ?? ""),
          password: String(u.password ?? ""),
          role: String(u.role ?? ""),
          branch: String(u.branch ?? ""),
          aktif: u.aktif === true || u.aktif === "TRUE" || u.aktif === "true" || u.aktif === 1,
        }));
        setUsersList(mappedUsers);
      }

      setDataSource("sheets");
      setLoadingData(false);
      return;
    } catch (err) {
      console.error(`Percobaan ${attempt} gagal memuat data dari Google Sheets:`, err);
      if (attempt === maxAttempts) {
        setLoadError("Gagal memuat data dari Google Sheets. Menampilkan data contoh sementara.");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    }
    setLoadingData(false);
  }, []);

  useEffect(() => {
    loadFromSheets();
  }, [loadFromSheets]);

  const isDesktop = device === "desktop";

  const assets = useMemo(() => {
    if (branchView === "Semua Cabang") return assetList;
    return assetList.filter((a) => a.branch === branchView);
  }, [assetList, branchView]);

  const locOptions = useMemo(() => ["Semua", ...new Set(assets.map((a) => a.loc))], [assets]);

  useEffect(() => {
    setLocFilter("Semua");
  }, [branchView]);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchQ = (a.name + a.id).toLowerCase().includes(query.toLowerCase());
      const matchC = catFilter === "Semua" || a.cat === catFilter;
      const matchL = locFilter === "Semua" || a.loc === locFilter;
      return matchQ && matchC && matchL;
    });
  }, [assets, query, catFilter, locFilter]);

  const handleChecklistSubmit = (loc, freq, session, results) => {
    const newDamageEntries = [];
    let updatedAssets = assetList;
    const assetStatusUpdates = [];

    results.forEach((r) => {
      if (r.qty) {
        const found = Number(r.foundQty);
        if (!isNaN(found) && found < r.qty) {
          const entry = {
            id: "L-" + Math.floor(1000 + Math.random() * 9000),
            asset: `${r.id} · ${r.name}`,
            reporter: `${session.name} (Checklist)`,
            date: "Hari ini",
            desc: `Jumlah tidak sesuai saat checklist: seharusnya ${r.qty}, ditemukan ${found}. Catatan: ${r.note}`,
            status: "dilaporkan",
          };
          newDamageEntries.push(entry);
          updatedAssets = updatedAssets.map((a) => (a.id === r.id ? { ...a, status: "hilang" } : a));
          assetStatusUpdates.push({ id: r.id, status: "hilang" });
        }
      } else if (r.condition !== "baik") {
        const entry = {
          id: "L-" + Math.floor(1000 + Math.random() * 9000),
          asset: `${r.id} · ${r.name}`,
          reporter: `${session.name} (Checklist)`,
          date: "Hari ini",
          desc: `Kondisi: ${r.condition === "rusak" ? "Rusak" : "Hilang"} — ${r.note}`,
          status: "dilaporkan",
        };
        newDamageEntries.push(entry);
        updatedAssets = updatedAssets.map((a) => (a.id === r.id ? { ...a, status: r.condition } : a));
        assetStatusUpdates.push({ id: r.id, status: r.condition });
      }
    });

    const todayStr = todayISO();
    setAssetList(updatedAssets);
    if (newDamageEntries.length) setDamageList((prev) => [...newDamageEntries, ...prev]);
    setChecklistStatus((prev) => ({ ...prev, [loc]: { lastDone: todayStr } }));
    setActiveChecklist(null);

    newDamageEntries.forEach((entry) => {
      const assetId = entry.asset.split(" · ")[0];
      createRow("Damage_Reports", {
        id: entry.id, asset_id: assetId, reporter_id: entry.reporter,
        verified_by: "", tanggal_lapor: entry.date, deskripsi: entry.desc,
        foto_url: "", status: entry.status,
      }).catch((err) => console.error("Gagal simpan laporan checklist ke Sheets:", err));
    });
    assetStatusUpdates.forEach((u) => {
      updateRow("Assets", u.id, { status: u.status }).catch((err) => console.error("Gagal update status aset:", err));
    });

    // Catat checklist ini ke Inventory_Checks supaya status "sudah dicek" tersinkron
    // untuk semua staff & device — bukan cuma tersimpan di browser yang mengerjakannya.
    const locBranch = assetList.find((a) => a.loc === loc)?.branch || branchView;
    createRow("Inventory_Checks", {
      id: "IC-" + Math.floor(100000 + Math.random() * 900000),
      location_id: idMaps.locIdByName[`${locBranch}||${loc}`] || "",
      officer_id: session.name,
      tanggal: todayStr,
      frekuensi: freq,
      hasil: newDamageEntries.length ? "tidak_sesuai" : "sesuai",
    }).catch((err) => console.error("Gagal simpan checklist ke Sheets:", err));
  };

  const handleAddUser = (u) => {
    const nextId = "U-" + String(usersList.length + 1).padStart(3, "0");
    const newUserRow = { id: nextId, ...u, aktif: true };
    setUsersList((prev) => [...prev, newUserRow]);
    createRow("Users", {
      id: nextId, nama: u.name, email: u.email, password: u.password,
      role: u.role, branch: u.branch, aktif: true,
    }).catch((err) => console.error("Gagal simpan staff ke Sheets:", err));
  };
  const handleToggleUser = (id) => {
    setUsersList((prev) => prev.map((u) => (u.id === id ? { ...u, aktif: !u.aktif } : u)));
    const target = usersList.find((u) => u.id === id);
    if (target) {
      updateRow("Users", id, { aktif: !target.aktif }).catch((err) => console.error("Gagal update status staff:", err));
    }
  };
  const handleRemoveUser = (id) => {
    setUsersList((prev) => prev.filter((u) => u.id !== id));
    deleteRow("Users", id).catch((err) => console.error("Gagal hapus staff dari Sheets:", err));
  };

  const handleAddLocation = (branch, name) => {
    setBranchLocations((prev) => ({ ...prev, [branch]: [...prev[branch], name] }));
    const newLocId = "LOC-" + String(idMaps.nextLocSeq).padStart(2, "0");
    setIdMaps((prev) => ({
      ...prev,
      nextLocSeq: prev.nextLocSeq + 1,
      locIdByName: { ...prev.locIdByName, [`${branch}||${name}`]: newLocId },
    }));
    createRow("Locations", {
      id: newLocId,
      branch_id: idMaps.branchIdByName[branch] || branch,
      nama_zona: name,
      lantai: name.startsWith("Lt.2") ? "2" : "1",
    }).catch((err) => console.error("Gagal simpan ruangan ke Sheets:", err));
  };
  const handleRemoveLocation = (branch, name) => {
    setBranchLocations((prev) => ({ ...prev, [branch]: prev[branch].filter((l) => l !== name) }));
    const locId = idMaps.locIdByName[`${branch}||${name}`];
    if (locId) deleteRow("Locations", locId).catch((err) => console.error("Gagal hapus ruangan dari Sheets:", err));
  };

  const handleAddCategory = (name) => {
    setCategoriesList((prev) => (prev.includes(name) ? prev : [...prev, name]));
    const newCatId = "CAT-" + String(idMaps.nextCatSeq).padStart(2, "0");
    setIdMaps((prev) => ({
      ...prev,
      nextCatSeq: prev.nextCatSeq + 1,
      catIdByName: { ...prev.catIdByName, [name]: newCatId },
    }));
    createRow("Categories", { id: newCatId, nama: name }).catch((err) => console.error("Gagal simpan jenis alat ke Sheets:", err));
  };
  const handleRemoveCategory = (name) => {
    setCategoriesList((prev) => prev.filter((c) => c !== name));
    const catId = idMaps.catIdByName[name];
    if (catId) deleteRow("Categories", catId).catch((err) => console.error("Gagal hapus jenis alat dari Sheets:", err));
  };

  const handleReportSubmit = async ({ assetId, desc, photoFile }) => {
    const asset = assetList.find((a) => a.id === assetId);
    if (!asset) return;
    const newId = "L-" + Math.floor(1000 + Math.random() * 9000);
    const reporterName = session?.name || "Pengguna";

    let photoUrl = "";
    if (photoFile) {
      const uploaded = await uploadImage(photoFile);
      if (uploaded.success) photoUrl = uploaded.url;
      else console.error("Gagal unggah foto:", uploaded.error);
    }

    setDamageList((prev) => [
      {
        id: newId,
        asset: `${asset.id} · ${asset.name}`,
        reporter: reporterName,
        date: "Hari ini",
        desc,
        status: "dilaporkan",
        photoUrl,
      },
      ...prev,
    ]);
    setAssetList((prev) => prev.map((a) => (a.id === assetId && a.status === "aktif" ? { ...a, status: "rusak" } : a)));
    setShowReport(false);

    createRow("Damage_Reports", {
      id: newId, asset_id: assetId, reporter_id: reporterName,
      verified_by: "", tanggal_lapor: "Hari ini", deskripsi: desc,
      foto_url: photoUrl, status: "dilaporkan",
    }).catch((err) => console.error("Gagal simpan laporan kerusakan ke Sheets:", err));
    if (asset.status === "aktif") {
      updateRow("Assets", assetId, { status: "rusak" }).catch((err) => console.error("Gagal update status aset:", err));
    }
  };

  const handleRepairSubmit = ({ note, cost }) => {
    if (!repairTarget) return;
    const id = repairTarget.id;
    setAssetList((prev) => prev.map((a) => (a.id === id ? { ...a, status: "aktif", lastM: "Hari ini" } : a)));
    const affectedReports = damageList.filter((d) => d.asset.startsWith(id) && d.status !== "diperbaiki");
    setDamageList((prev) =>
      prev.map((d) => (d.asset.startsWith(id) && d.status !== "diperbaiki" ? { ...d, status: "diperbaiki" } : d))
    );
    setRepairTarget(null);

    updateRow("Assets", id, { status: "aktif" }).catch((err) => console.error("Gagal update status aset:", err));
    affectedReports.forEach((r) => {
      updateRow("Damage_Reports", r.id, { status: "diperbaiki" }).catch((err) => console.error("Gagal update laporan kerusakan:", err));
    });
  };

  const handleChangeAssetStatus = (id, status) => {
    setAssetList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setSelected(null);
    updateRow("Assets", id, { status }).catch((err) => console.error("Gagal update status aset:", err));
  };

  const handleDeleteAsset = (id) => {
    setAssetList((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
    deleteRow("Assets", id).catch((err) => console.error("Gagal hapus aset dari Sheets:", err));
  };

  const handleUpdateAssetPhoto = async (id, file) => {
    const uploaded = await uploadImage(file);
    if (!uploaded.success) {
      console.error("Gagal unggah foto:", uploaded.error);
      return;
    }
    setAssetList((prev) => prev.map((a) => (a.id === id ? { ...a, photoUrl: uploaded.url } : a)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, photoUrl: uploaded.url } : prev));
    updateRow("Assets", id, { foto_url: uploaded.url }).catch((err) => console.error("Gagal simpan foto ke Sheets:", err));
  };

  return (
    <div style={{ background: C.frame, height: "100dvh" }} className="w-full overflow-hidden flex flex-col">
      <style>{FONTS}</style>
      <div style={{ background: C.cream }} className="flex-1 overflow-hidden flex">
        {!session ? (
          <LoginScreen isDesktop={isDesktop} usersList={usersList} onLogin={(s) => { setSession(s); setBranchView(s.branch); }} />
        ) : (
          <AppShell
            isDesktop={isDesktop} session={session} setSession={setSession}
            tab={tab} setTab={setTab} query={query} setQuery={setQuery}
            catFilter={catFilter} setCatFilter={setCatFilter}
            locFilter={locFilter} setLocFilter={setLocFilter} locOptions={locOptions}
            selected={selected} setSelected={setSelected}
            showReport={showReport} setShowReport={setShowReport}
            reportPreset={reportPreset} setReportPreset={setReportPreset}
            showAddAsset={showAddAsset} setShowAddAsset={setShowAddAsset}
            assetList={assetList} setAssetList={setAssetList}
            damageList={damageList}
            checklistStatus={checklistStatus}
            activeChecklist={activeChecklist} setActiveChecklist={setActiveChecklist}
            onChecklistSubmit={handleChecklistSubmit}
            repairTarget={repairTarget} setRepairTarget={setRepairTarget}
            onRepairSubmit={handleRepairSubmit}
            onReportSubmit={handleReportSubmit}
            branchView={branchView} setBranchView={setBranchView}
            assets={assets} filtered={filtered}
            usersList={usersList} onAddUser={handleAddUser} onToggleUser={handleToggleUser} onRemoveUser={handleRemoveUser}
            categoriesList={categoriesList} onAddCategory={handleAddCategory} onRemoveCategory={handleRemoveCategory}
            branchLocations={branchLocations} onAddLocation={handleAddLocation} onRemoveLocation={handleRemoveLocation}
            idMaps={idMaps} dataSource={dataSource}
            onChangeAssetStatus={handleChangeAssetStatus} onDeleteAsset={handleDeleteAsset}
            onUpdateAssetPhoto={handleUpdateAssetPhoto}
            onRefreshData={loadFromSheets} loadingData={loadingData} loadError={loadError}
          />
        )}
      </div>
    </div>
  );
}

function NotifPanel({ damageList, checklistLocs, checklistStatus, onClose, onGoTo }) {
  const openDamage = damageList.filter((d) => d.status !== "diperbaiki").slice(0, 5);
  const dueChecklist = checklistLocs.filter((c) => !isChecklistDone(checklistStatus[c.loc]?.lastDone, c.freq));
  const isEmpty = openDamage.length === 0 && dueChecklist.length === 0;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={{ background: C.surface, border: `1px solid ${C.border}`, width: 300 }}
        className="absolute top-full right-0 mt-2 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto"
      >
        <div style={{ borderBottom: `1px solid ${C.border}` }} className="px-4 py-3">
          <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }}>Notifikasi</div>
        </div>

        {isEmpty && (
          <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }} className="px-4 py-6 text-center">
            Tidak ada notifikasi baru 🎉
          </div>
        )}

        {dueChecklist.length > 0 && (
          <div className="px-4 pt-3">
            <div style={{ ...f(BODY), color: C.muted, fontSize: 10, fontWeight: 700 }} className="uppercase mb-2">Checklist Belum Dikerjakan</div>
            {dueChecklist.map((c) => (
              <button key={c.loc} onClick={() => onGoTo("checklist")}
                style={{ borderBottom: `1px solid ${C.border}` }} className="w-full text-left py-2.5 flex items-start gap-2">
                <ClipboardCheck size={14} color={C.accentDeep} className="mt-0.5 shrink-0" />
                <div>
                  <div style={{ ...f(BODY), color: C.ink, fontSize: 12, fontWeight: 600 }}>{c.loc}</div>
                  <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>Checklist {c.freq} belum dikerjakan</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {openDamage.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <div style={{ ...f(BODY), color: C.muted, fontSize: 10, fontWeight: 700 }} className="uppercase mb-2">Laporan Kerusakan</div>
            {openDamage.map((d) => {
              const s = damageStatusStyle[d.status];
              return (
                <button key={d.id} onClick={() => onGoTo("damage")}
                  style={{ borderBottom: `1px solid ${C.border}` }} className="w-full text-left py-2.5 flex items-start gap-2">
                  <AlertTriangle size={14} color={s.fg} className="mt-0.5 shrink-0" />
                  <div>
                    <div style={{ ...f(BODY), color: C.ink, fontSize: 12, fontWeight: 600 }}>{d.asset}</div>
                    <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>{d.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function csvEscape(val) {
  const s = String(val ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function buildReportCSV({ branch, period, assetList, damageList }) {
  const scoped = branch === "Semua Cabang" ? assetList : assetList.filter((a) => a.branch === branch);
  const scopedIds = new Set(scoped.map((a) => a.id));
  const scopedDamage = damageList.filter((d) => scopedIds.has(d.asset.split(" · ")[0]));

  const total = scoped.length;
  const aktif = scoped.filter((a) => a.status === "aktif").length;
  const rusak = scoped.filter((a) => a.status === "rusak").length;
  const perbaikan = scoped.filter((a) => a.status === "perbaikan").length;
  const hilang = scoped.filter((a) => a.status === "hilang").length;

  const lines = [];
  lines.push(csvEscape(`Laporan Monitoring Aset HIGAR - ${period}`));
  lines.push(csvEscape(`Cabang: ${branch}`));
  lines.push(csvEscape(`Dibuat: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`));
  lines.push("");
  lines.push(csvEscape("RINGKASAN"));
  lines.push([csvEscape("Total Aset"), csvEscape("Aktif"), csvEscape("Rusak"), csvEscape("Perbaikan"), csvEscape("Hilang")].join(","));
  lines.push([total, aktif, rusak, perbaikan, hilang].map(csvEscape).join(","));
  lines.push("");
  lines.push(csvEscape("DAFTAR ASET"));
  lines.push(["ID", "Nama", "Kategori", "Cabang", "Lokasi", "Status", "Maintenance Terakhir", "Maintenance Berikutnya", "Nilai"].map(csvEscape).join(","));
  scoped.forEach((a) => {
    lines.push([a.id, a.name, a.cat, a.branch, a.loc, statusStyle[a.status]?.label || a.status, a.lastM, a.nextM, a.value].map(csvEscape).join(","));
  });
  lines.push("");
  lines.push(csvEscape("LAPORAN KERUSAKAN"));
  lines.push(["ID Laporan", "Aset", "Tanggal", "Deskripsi", "Pelapor", "Status"].map(csvEscape).join(","));
  scopedDamage.forEach((d) => {
    lines.push([d.id, d.asset, d.date, d.desc, d.reporter, damageStatusStyle[d.status]?.label || d.status].map(csvEscape).join(","));
  });

  return lines.join("\n");
}

function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DownloadReportSheet({ onClose, isDesktop, defaultBranch, assetList, damageList }) {
  const [branch, setBranch] = useState(defaultBranch);
  const [period, setPeriod] = useState("Mingguan");

  const handleDownload = () => {
    const csv = buildReportCSV({ branch, period, assetList, damageList });
    const safeBranch = branch.replace(/[^a-z0-9]+/gi, "-");
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `HIGAR-Laporan-${period}-${safeBranch}-${dateStr}.csv`);
    onClose();
  };

  return (
    <Sheet title="Unduh Laporan Monitoring" subtitle="Data aset & kerusakan per cabang" onClose={onClose} isDesktop={isDesktop}>
      <div className="space-y-4">
        <Field label="Periode">
          <div className="flex gap-2">
            {["Mingguan", "Bulanan"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ background: period === p ? C.dark : C.surface, color: period === p ? "#fff" : C.ink, border: `1px solid ${period === p ? C.dark : C.border}` }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold">
                {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Cabang">
          <select value={branch} onChange={(e) => setBranch(e.target.value)}
            style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-3 text-sm bg-white">
            <option>Semua Cabang</option>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <div style={{ background: C.accentBg, color: C.accentDeep }} className="rounded-xl p-3 text-xs">
          Laporan berisi ringkasan jumlah aset per status, daftar lengkap aset, dan riwayat laporan kerusakan untuk cabang yang dipilih — dalam format CSV (bisa dibuka di Excel / Google Sheets).
        </div>
        <button onClick={handleDownload} style={{ background: C.dark, color: "#fff" }} className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <Download size={16} /> Unduh Laporan (CSV)
        </button>
      </div>
    </Sheet>
  );
}

function SettingsTab({
  isManager, branchView, branchLocations, onAddLocation, onRemoveLocation,
  categoriesList, onAddCategory, onRemoveCategory,
  usersList, onAddUser, onToggleUser, onRemoveUser,
}) {
  const [sub, setSub] = useState("ruangan");
  const [roomBranch, setRoomBranch] = useState(branchView === "Semua Cabang" ? BRANCHES[0] : branchView);
  const [newRoom, setNewRoom] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff_maintenance", branch: BRANCHES[0] });

  const subTabs = [
    { key: "ruangan", label: "Ruangan" },
    ...(isManager ? [{ key: "kategori", label: "Jenis Alat" }, { key: "staff", label: "Staff" }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {subTabs.map((s) => (
          <button key={s.key} onClick={() => setSub(s.key)}
            style={{ background: sub === s.key ? C.dark : C.surface, color: sub === s.key ? "#fff" : C.ink, border: `1px solid ${sub === s.key ? C.dark : C.border}` }}
            className="text-xs px-3.5 py-2 rounded-full whitespace-nowrap shrink-0 font-semibold">
            {s.label}
          </button>
        ))}
      </div>

      {sub === "ruangan" && (
        <div>
          <Field label="Pilih Cabang">
            <select value={roomBranch} onChange={(e) => setRoomBranch(e.target.value)}
              style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-2.5 text-sm bg-white mb-4">
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <div className="space-y-2 mb-4">
            {branchLocations[roomBranch].map((l) => (
              <div key={l} style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <span style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 500 }} className="flex items-center gap-2"><MapPin size={13} color={C.muted} />{l}</span>
                <button onClick={() => onRemoveLocation(roomBranch, l)} style={{ color: C.red }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Nama ruangan/zona baru"
              style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="flex-1 rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <button onClick={() => { if (newRoom.trim()) { onAddLocation(roomBranch, newRoom.trim()); setNewRoom(""); } }}
              style={{ background: C.dark, color: "#fff" }} className="px-4 py-2.5 rounded-xl text-sm font-bold shrink-0">Tambah</button>
          </div>
        </div>
      )}

      {sub === "kategori" && isManager && (
        <div>
          <div className="space-y-2 mb-4">
            {categoriesList.map((c) => (
              <div key={c} style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <span style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 500 }}>{c}</span>
                <button onClick={() => onRemoveCategory(c)} style={{ color: C.red }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Jenis alat baru, cth: Functional Training"
              style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="flex-1 rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <button onClick={() => { if (newCat.trim()) { onAddCategory(newCat.trim()); setNewCat(""); } }}
              style={{ background: C.dark, color: "#fff" }} className="px-4 py-2.5 rounded-xl text-sm font-bold shrink-0">Tambah</button>
          </div>
        </div>
      )}

      {sub === "staff" && isManager && (
        <div>
          <div className="space-y-2 mb-5">
            {usersList.map((u) => (
              <div key={u.id} style={{ background: C.surface, border: `1px solid ${C.border}`, opacity: u.aktif ? 1 : 0.5 }} className="rounded-xl p-3.5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }}>{u.name}</div>
                    <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>{u.email}</div>
                  </div>
                  <button onClick={() => onRemoveUser(u.id)} style={{ color: C.red }}><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span style={{ background: C.accentBg, color: C.accentDeep, ...f(BODY), fontSize: 10, fontWeight: 700 }} className="px-2 py-0.5 rounded-full">{ROLES[u.role].label}</span>
                  <span style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>{u.branch}</span>
                  <button onClick={() => onToggleUser(u.id)}
                    style={{ background: u.aktif ? C.greenBg : "#ECE9E2", color: u.aktif ? C.green : C.muted, ...f(BODY), fontSize: 10, fontWeight: 700 }}
                    className="ml-auto px-2.5 py-1 rounded-full">
                    {u.aktif ? "Aktif" : "Nonaktif"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 space-y-3">
            <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }}>Tambah Staff Baru</div>
            <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nama"
              style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email"
              style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Sandi awal"
              type="text"
              style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full rounded-xl px-3 py-2.5 text-sm bg-white">
                {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
              </select>
              <select value={newUser.branch} onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })} disabled={newUser.role !== "staff_maintenance"}
                style={{ ...f(BODY), border: `1px solid ${C.border}`, opacity: newUser.role !== "staff_maintenance" ? 0.5 : 1 }} className="w-full rounded-xl px-3 py-2.5 text-sm bg-white">
                {BRANCHES.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <button
              onClick={() => {
                if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return;
                onAddUser({ ...newUser, branch: newUser.role === "staff_maintenance" ? newUser.branch : "Semua Cabang" });
                setNewUser({ name: "", email: "", password: "", role: "staff_maintenance", branch: BRANCHES[0] });
              }}
              style={{ background: C.dark, color: "#fff" }} className="w-full py-2.5 rounded-xl text-sm font-bold"
            >
              Tambah Staff
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppShell({
  isDesktop, session, setSession, tab, setTab, query, setQuery, catFilter, setCatFilter,
  locFilter, setLocFilter, locOptions,
  selected, setSelected, showReport, setShowReport, showAddAsset, setShowAddAsset,
  reportPreset, setReportPreset,
  assetList, setAssetList, damageList, checklistStatus, activeChecklist, setActiveChecklist,
  onChecklistSubmit, repairTarget, setRepairTarget, onRepairSubmit, onReportSubmit,
  branchView, setBranchView, assets, filtered,
  usersList, onAddUser, onToggleUser, onRemoveUser,
  categoriesList, onAddCategory, onRemoveCategory,
  branchLocations, onAddLocation, onRemoveLocation,
  idMaps, dataSource,
  onChangeAssetStatus, onDeleteAsset, onUpdateAssetPhoto,
  onRefreshData, loadingData, loadError,
}) {
  const [showNotif, setShowNotif] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState(null);
  const isManager = session.role === "manager";
  const isSupervisor = session.role === "supervisor";
  const isStaffOnly = session.role === "staff_maintenance";
  const canSwitchBranch = isManager || isSupervisor;
  const damageCount = damageList.filter((d) => d.status === "dilaporkan").length;
  const totalAset = assets.length;
  const perluMaintenance = assets.filter((a) => a.status === "aktif" && a.nextM !== "-").length;
  const rusak = assets.filter((a) => a.status === "rusak" || a.status === "perbaikan").length;
  const hilang = assets.filter((a) => a.status === "hilang").length;
  const attention = assets.filter((a) => ["rusak", "perbaikan", "hilang"].includes(a.status) || a.nextM === "Segera").slice(0, 3);
  const pctAktif = totalAset ? Math.round((assets.filter((a) => a.status === "aktif").length / totalAset) * 100) : 0;

  const uniqueLocs = [...new Set(assets.map((a) => a.loc))];
  const checklistLocs = uniqueLocs.map((loc) => ({ loc, freq: getChecklistFreq(loc) }));
  const checklistDueCount = checklistLocs.filter((c) => !isChecklistDone(checklistStatus[c.loc]?.lastDone, c.freq)).length;

  const headline = {
    home: "Semua alat terpantau?",
    assets: "Kelola daftar aset",
    checklist: "Checklist rutin alat",
    maintenance: "Jadwal servis alat",
    damage: "Laporan kerusakan",
    settings: "Pengaturan",
    profile: "Akun kamu",
  }[tab];

  const gridStat = isDesktop ? "grid-cols-4" : "grid-cols-2";
  const gridAsset = isDesktop ? "grid-cols-3" : "grid-cols-1";
  const gridDamage = isDesktop ? "grid-cols-2" : "grid-cols-1";
  const gridChecklist = isDesktop ? "grid-cols-2" : "grid-cols-1";

  const activeChecklistAssets = activeChecklist ? assets.filter((a) => a.loc === activeChecklist) : [];
  const activeChecklistFreq = activeChecklist ? getChecklistFreq(activeChecklist) : "";

  return (
    <div className="flex w-full h-full">
      {isDesktop && <SideNav tab={tab} setTab={setTab} damageCount={damageCount} session={session} onLogout={() => setSession(null)} canManage={canSwitchBranch} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <div style={{ background: C.dark }} className={isDesktop ? "px-8 pt-7 pb-6 shrink-0" : "rounded-b-[1.75rem] px-5 pt-6 pb-5 shrink-0"}>
          <div className="flex items-center justify-between mb-4">
            {isDesktop ? (
              <div style={{ ...f(BODY), color: "#fff", fontSize: 18, fontWeight: 700 }}>{headline}</div>
            ) : (
              <div style={{ ...f(BODY), color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: "0.18em" }}>HIGAR</div>
            )}
            <div className="relative shrink-0">
              <button onClick={() => setShowNotif((v) => !v)} style={{ background: "rgba(255,255,255,0.1)" }} className="relative w-9 h-9 rounded-full flex items-center justify-center">
                <Bell size={17} color="#fff" />
                {damageCount > 0 && (
                  <span style={{ background: C.red }} className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {damageCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <NotifPanel
                  damageList={damageList}
                  checklistLocs={checklistLocs}
                  checklistStatus={checklistStatus}
                  onClose={() => setShowNotif(false)}
                  onGoTo={(t) => { setTab(t); setShowNotif(false); }}
                />
              )}
            </div>
          </div>
          {isDesktop ? (
            <div style={{ ...f(BODY), color: "#A9A69C", fontSize: 13 }}>{session.name}</div>
          ) : (
            <div style={{ ...f(BODY), color: "#fff", fontSize: 19, fontWeight: 800 }}>{headline}</div>
          )}
        </div>

        <div className={isDesktop ? "flex-1 overflow-y-auto px-8 pt-6 pb-6" : "flex-1 overflow-y-auto px-5 pt-4 pb-3 relative"}>
          <div className={isDesktop ? "max-w-4xl" : ""}>

            {(tab === "home" || tab === "profile") && (
              <div className={`relative ${isDesktop ? "mb-4 max-w-sm" : "mb-3"}`}>
                <button
                  onClick={() => canSwitchBranch && setShowBranchPicker((v) => !v)}
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}
                  className={isDesktop ? "w-full rounded-2xl px-4 py-3.5 flex items-center gap-3" : "w-full rounded-2xl px-4 py-3.5 flex items-center gap-3"}
                >
                  <MapPin size={16} color={C.accentDeep} />
                  <div className="flex-1 text-left">
                    <div style={{ ...f(BODY), color: C.muted, fontSize: 10, fontWeight: 500 }}>CABANG</div>
                    <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }}>{branchView}</div>
                  </div>
                  {canSwitchBranch && <ChevronDown size={16} color={C.muted} />}
                </button>

                {showBranchPicker && canSwitchBranch && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBranchPicker(false)} />
                    <div
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}
                      className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl z-50 p-2 max-h-72 overflow-y-auto"
                    >
                      {["Semua Cabang", ...BRANCHES].map((b) => (
                        <button key={b} onClick={() => { setBranchView(b); setShowBranchPicker(false); }}
                          style={{ background: branchView === b ? C.accentBg : "transparent" }}
                          className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between">
                          <span style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: branchView === b ? 700 : 500 }}>{b}</span>
                          {branchView === b && <CheckCircle2 size={15} color={C.accentDeep} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "home" && (
              <div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ ...f(BODY), color: C.ink, fontSize: 14, fontWeight: 700 }}>Kondisi Alat</div>
                    <span style={{ background: rusak > 0 ? C.redBg : C.greenBg, color: rusak > 0 ? C.red : C.green, ...f(BODY), fontSize: 11, fontWeight: 700 }} className="px-2.5 py-1 rounded-full">
                      {rusak > 0 ? "Perlu Perhatian" : "Semua Baik"}
                    </span>
                  </div>
                  <div style={{ background: C.border }} className="h-1.5 rounded-full overflow-hidden">
                    <div style={{ background: C.accent, width: `${pctAktif}%` }} className="h-full rounded-full" />
                  </div>
                  <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }} className="mt-1.5">{pctAktif}% aset dalam kondisi aktif</div>
                </div>

                {canSwitchBranch && (
                  <button onClick={() => setShowDownload(true)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}
                    className="w-full rounded-2xl p-3.5 flex items-center gap-3 mb-4">
                    <div style={{ background: C.accentBg }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                      <Download size={16} color={C.accentDeep} />
                    </div>
                    <div className="flex-1 text-left">
                      <div style={{ ...f(BODY), fontSize: 13, fontWeight: 700 }}>Unduh Laporan Monitoring</div>
                      <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }}>Mingguan/bulanan per cabang, format CSV</div>
                    </div>
                    <ChevronRight size={16} color={C.muted} />
                  </button>
                )}

                {checklistDueCount > 0 && (
                  <button onClick={() => setTab("checklist")} style={{ background: C.accentBg, border: `1px solid ${C.accent}` }} className="w-full rounded-2xl p-3.5 flex items-center gap-3 mb-4">
                    <ClipboardCheck size={18} color={C.accentDeep} className="shrink-0" />
                    <div className="flex-1 text-left">
                      <div style={{ ...f(BODY), color: C.accentDeep, fontSize: 13, fontWeight: 700 }}>{checklistDueCount} checklist zona belum dikerjakan</div>
                      <div style={{ ...f(BODY), color: C.accentDeep, fontSize: 11, opacity: 0.8 }}>Ketuk untuk mulai checklist harian/mingguan</div>
                    </div>
                    <ChevronRight size={16} color={C.accentDeep} />
                  </button>
                )}

                <div className={`grid ${gridStat} gap-3 mb-5`}>
                  <StatChip label="Total Aset" value={totalAset} />
                  <StatChip label="Perlu Maintenance" value={perluMaintenance} tone="warn" />
                  <StatChip label="Rusak / Perbaikan" value={rusak} tone="bad" />
                  <StatChip label="Dilaporkan Hilang" value={hilang} tone="bad" />
                </div>

                <SectionHeader icon={AlertTriangle} title="Perlu Perhatian" />
                <div className={`grid ${isDesktop ? "grid-cols-2" : "grid-cols-1"} gap-2.5 mb-5`}>
                  {attention.length === 0 && <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }}>Tidak ada alat yang perlu perhatian saat ini.</div>}
                  {attention.map((a) => <AssetRow key={a.id} asset={a} onClick={() => setSelected(a)} />)}
                </div>

                <SectionHeader icon={ClipboardList} title="Laporan Terbaru" />
                <div className={`grid ${isDesktop ? "grid-cols-2" : "grid-cols-1"} gap-2.5`}>
                  {damageList.slice(0, 2).map((d) => {
                    const s = damageStatusStyle[d.status];
                    return (
                      <div key={d.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${s.fg}` }} className="rounded-2xl p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }} className="truncate pr-2">{d.asset}</div>
                          <span style={{ background: s.bg, color: s.fg, ...f(BODY), fontSize: 10, fontWeight: 700 }} className="px-2 py-0.5 rounded-full whitespace-nowrap">{s.label}</span>
                        </div>
                        <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }}>{d.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "assets" && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={15} color={C.muted} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau kode aset..."
                      style={{ ...f(BODY), border: `1px solid ${C.border}` }} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white outline-none" />
                  </div>
                  {!isStaffOnly && isDesktop && (
                    <button onClick={() => { setDuplicateFrom(null); setShowAddAsset(true); }} style={{ background: C.dark, color: "#fff" }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0">
                      <Plus size={16} /> Tambah Aset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Boxes size={13} color={C.muted} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                      style={{ ...f(BODY), border: `1px solid ${C.border}`, color: C.ink }}
                      className="w-full pl-7 pr-3 py-2 rounded-full text-xs bg-white outline-none appearance-none"
                    >
                      {["Semua", ...categoriesList].map((c) => <option key={c} value={c}>{c === "Semua" ? "Semua Kategori" : c}</option>)}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <MapPin size={13} color={C.muted} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={locFilter} onChange={(e) => setLocFilter(e.target.value)}
                      style={{ ...f(BODY), border: `1px solid ${C.border}`, color: C.ink }}
                      className="w-full pl-7 pr-3 py-2 rounded-full text-xs bg-white outline-none appearance-none"
                    >
                      {locOptions.map((l) => <option key={l} value={l}>{l === "Semua" ? "Semua Area" : l}</option>)}
                    </select>
                  </div>
                </div>
                {!isStaffOnly && !isDesktop && (
                  <button onClick={() => { setDuplicateFrom(null); setShowAddAsset(true); }} style={{ border: `1.5px dashed ${C.accent}`, color: C.accentDeep, ...f(BODY) }} className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-bold mb-3">
                    <Plus size={16} /> Tambah Aset
                  </button>
                )}
                <div className={`grid ${gridAsset} gap-2.5 pb-2`}>
                  {filtered.map((a) => <AssetRow key={a.id} asset={a} onClick={() => setSelected(a)} />)}
                </div>
              </div>
            )}

            {tab === "checklist" && (
              <div>
                <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }} className="mb-4">
                  Checklist rutin membantu memastikan kondisi alat sesuai catatan dan mencegah kehilangan peralatan kecil.
                </div>
                <SectionHeader icon={ClipboardCheck} title="Checklist Harian" />
                <div className={`grid ${gridChecklist} gap-2.5 mb-5`}>
                  {checklistLocs.filter((c) => c.freq === "Harian").map((c) => (
                    <ChecklistCard
                      key={c.loc} loc={c.loc} freq={c.freq} status={checklistStatus[c.loc]}
                      count={assets.filter((a) => a.loc === c.loc).length}
                      onStart={() => setActiveChecklist(c.loc)}
                    />
                  ))}
                </div>
                <SectionHeader icon={ClipboardCheck} title="Checklist Mingguan" />
                <div className={`grid ${gridChecklist} gap-2.5`}>
                  {checklistLocs.filter((c) => c.freq === "Mingguan").map((c) => (
                    <ChecklistCard
                      key={c.loc} loc={c.loc} freq={c.freq} status={checklistStatus[c.loc]}
                      count={assets.filter((a) => a.loc === c.loc).length}
                      onStart={() => setActiveChecklist(c.loc)}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === "maintenance" && (
              <div className={`grid ${gridAsset} gap-2.5`}>
                {assets.map((a) => (
                  <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                      <Pill status={a.status} />
                    </div>
                    <div style={{ ...f(BODY), color: a.status !== "aktif" ? C.accentDeep : C.muted, fontSize: 11, fontWeight: a.status !== "aktif" ? 700 : 400 }} className="flex items-center gap-1 mb-2">
                      <MapPin size={11} /> {a.loc} <span style={{ color: C.muted, fontWeight: 400 }}>· {a.branch}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div style={{ ...f(BODY), color: C.muted, fontSize: 11 }} className="flex items-center gap-1"><Clock size={11} /> Terakhir: {a.lastM}</div>
                      <div style={{ ...f(BODY), color: a.nextM === "Segera" ? C.red : C.ink, fontSize: 11, fontWeight: 700 }} className="flex items-center gap-1"><Calendar size={11} /> {a.nextM}</div>
                    </div>
                    {["rusak", "perbaikan", "hilang"].includes(a.status) && (
                      <button onClick={() => setRepairTarget({ id: a.id, name: a.name })}
                        style={{ background: C.greenBg, color: C.green, ...f(BODY) }} className="w-full py-2 rounded-lg text-xs font-bold">
                        Tandai Sudah Diperbaiki
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "damage" && (
              <div>
                <button onClick={() => { setReportPreset(null); setShowReport(true); }} style={{ background: C.dark, color: "#fff" }} className={isDesktop ? "px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold mb-4" : "w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-bold mb-3.5"}>
                  <Plus size={16} /> Lapor Kerusakan Baru
                </button>
                <div className={`grid ${gridDamage} gap-2.5 pb-2`}>
                  {damageList.map((d) => {
                    const s = damageStatusStyle[d.status];
                    return (
                      <div key={d.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${s.fg}` }} className="rounded-2xl p-3.5">
                        {d.photoUrl && (
                          <img
                            src={d.photoUrl} alt="Foto kerusakan"
                            className="w-full h-28 object-cover rounded-xl mb-2.5"
                            style={{ border: `1px solid ${C.border}` }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <div style={{ ...f(BODY), color: C.ink, fontSize: 13, fontWeight: 700 }}>{d.asset}</div>
                          <span style={{ background: s.bg, color: s.fg, ...f(BODY), fontSize: 10, fontWeight: 700 }} className="px-2 py-0.5 rounded-full whitespace-nowrap">{s.label}</span>
                        </div>
                        <div style={{ ...f(BODY), color: C.muted, fontSize: 12 }} className="mb-1.5">{d.desc}</div>
                        <div style={{ ...f(MONO), color: C.muted, fontSize: 10 }} className="mb-2">{d.id} · {d.reporter} · {d.date}</div>
                        {d.status !== "diperbaiki" && (
                          <button
                            onClick={() => {
                              const [id, ...nameParts] = d.asset.split(" · ");
                              setRepairTarget({ id, name: nameParts.join(" · ") });
                            }}
                            style={{ background: C.greenBg, color: C.green, ...f(BODY) }} className="px-3 py-1.5 rounded-full text-xs font-bold"
                          >
                            Tandai Diperbaiki
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "settings" && (
              <SettingsTab
                isManager={isManager}
                branchView={branchView}
                branchLocations={branchLocations}
                onAddLocation={onAddLocation}
                onRemoveLocation={onRemoveLocation}
                categoriesList={categoriesList}
                onAddCategory={onAddCategory}
                onRemoveCategory={onRemoveCategory}
                usersList={usersList}
                onAddUser={onAddUser}
                onToggleUser={onToggleUser}
                onRemoveUser={onRemoveUser}
              />
            )}

            {tab === "profile" && (
              <div className={isDesktop ? "max-w-sm" : ""}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 flex items-center gap-3 mb-3">
                  <div style={{ background: C.accentBg, color: C.accentDeep, ...f(BODY) }} className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ ...f(BODY), color: C.ink, fontSize: 15, fontWeight: 800 }}>{session.name}</div>
                    <div style={{ ...f(BODY), color: C.accentDeep, fontSize: 12, fontWeight: 600 }}>{ROLES[session.role].label}</div>
                  </div>
                </div>

                {loadError && (
                  <div style={{ background: C.redBg, color: C.red, ...f(BODY) }} className="rounded-2xl px-3.5 py-2.5 text-xs font-semibold mb-3">
                    ⚠️ {loadError}
                  </div>
                )}

                <button
                  onClick={onRefreshData}
                  disabled={loadingData}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink, opacity: loadingData ? 0.6 : 1 }}
                  className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-bold mb-3"
                >
                  <RefreshCw size={15} className={loadingData ? "animate-spin" : ""} />
                  {loadingData ? "Memuat ulang..." : "Muat Ulang Data dari Sheets"}
                </button>

                {!isDesktop && (
                  <button onClick={() => setSession(null)} style={{ background: C.redBg, color: C.red }} className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-bold">
                    <LogOut size={15} /> Keluar
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {!isDesktop && <BottomNav tab={tab} setTab={setTab} damageCount={damageCount} canManage={canSwitchBranch} />}
      </div>

      {selected && (
        <AssetDetailSheet
          asset={selected}
          onClose={() => setSelected(null)}
          isDesktop={isDesktop}
          onStartRepair={(a) => { setSelected(null); setRepairTarget({ id: a.id, name: a.name }); }}
          onReportDamage={(a) => { setSelected(null); setReportPreset(a.id); setShowReport(true); }}
          damageList={damageList}
          canSwitchBranch={canSwitchBranch}
          isManager={isManager}
          onChangeStatus={onChangeAssetStatus}
          onDeleteAsset={onDeleteAsset}
          onUpdatePhoto={onUpdateAssetPhoto}
          onDuplicate={(a) => {
            setSelected(null);
            setDuplicateFrom({
              id: a.id, name: a.name, cat: a.cat, branch: a.branch, loc: a.loc,
              rawHarga: a.value && a.value !== "-" ? a.value.replace(/^Rp\s*/, "") : "",
              supplier: "", qty: a.qty,
            });
            setShowAddAsset(true);
          }}
        />
      )}
      {showReport && <ReportDamageSheet onClose={() => setShowReport(false)} assets={assets} isDesktop={isDesktop} onSubmit={onReportSubmit} presetAssetId={reportPreset} canSwitchBranch={canSwitchBranch} />}
      {showDownload && (
        <DownloadReportSheet
          onClose={() => setShowDownload(false)}
          isDesktop={isDesktop}
          defaultBranch={branchView}
          assetList={assetList}
          damageList={damageList}
        />
      )}
      {showAddAsset && (
        <AddAssetSheet
          isManager={canSwitchBranch}
          defaultBranch={branchView}
          isDesktop={isDesktop}
          categoriesList={categoriesList}
          branchLocations={branchLocations}
          duplicateFrom={duplicateFrom}
          onClose={() => { setShowAddAsset(false); setDuplicateFrom(null); }}
          onSave={async (form) => {
            const nextId = "A-" + String(assetList.length + 1).padStart(4, "0");
            const qtyNum = form.qty && !isNaN(Number(form.qty)) && Number(form.qty) > 1 ? Number(form.qty) : undefined;

            let photoUrl = "";
            if (form.photoFile) {
              const uploaded = await uploadImage(form.photoFile);
              if (uploaded.success) photoUrl = uploaded.url;
              else console.error("Gagal unggah foto:", uploaded.error);
            }

            const newAsset = { id: nextId, name: form.name, cat: form.cat, loc: form.loc, branch: form.branch, status: "aktif", lastM: "-", nextM: "-", value: form.harga ? `Rp ${form.harga}` : "-", qty: qtyNum, photoUrl };
            setAssetList([...assetList, newAsset]);
            setShowAddAsset(false);
            setDuplicateFrom(null);
            createRow("Assets", {
              id: nextId,
              kode_aset: nextId,
              nama: form.name,
              category_id: idMaps.catIdByName[form.cat] || form.cat,
              branch_id: idMaps.branchIdByName[form.branch] || form.branch,
              location_id: idMaps.locIdByName[`${form.branch}||${form.loc}`] || form.loc,
              status: "aktif",
              tgl_beli: form.tglBeli || "",
              harga: form.harga || "",
              supplier: form.supplier || "",
              garansi_sampai: form.garansi || "",
              foto_url: photoUrl,
              qty: qtyNum || "",
            }).catch((err) => console.error("Gagal simpan aset ke Sheets:", err));
          }}
        />
      )}
      {activeChecklist && (
        <ChecklistSheet
          loc={activeChecklist}
          freq={activeChecklistFreq}
          assetsHere={activeChecklistAssets}
          isDesktop={isDesktop}
          onClose={() => setActiveChecklist(null)}
          onSubmit={(results) => onChecklistSubmit(activeChecklist, activeChecklistFreq, session, results)}
        />
      )}
      {repairTarget && (
        <RepairSheet
          asset={repairTarget}
          isDesktop={isDesktop}
          onClose={() => setRepairTarget(null)}
          onSubmit={onRepairSubmit}
        />
      )}
    </div>
  );
}
