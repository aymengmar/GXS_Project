import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminDocumentReviewModal from "@/components/AdminDocumentReviewModal";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG     = "#080F1D";
const CARD   = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN  = "#22C55E";
const RED    = "#EF4444";
const AMBER  = "#F59E0B";
const WHITE  = "#FFFFFF";
const DIM    = "rgba(255,255,255,0.60)";
const MUTED  = "rgba(255,255,255,0.28)";
const FAINT  = "rgba(255,255,255,0.08)";
const TAB_BG = "#060C18";

// ─── avatars ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AVATARS = {
  d1: require("@/assets/images/avatars/driver1.jpg"),
  d2: require("@/assets/images/avatars/driver2.jpg"),
  d3: require("@/assets/images/avatars/driver3.jpg"),
  d4: require("@/assets/images/avatars/driver4.jpg"),
  d5: require("@/assets/images/avatars/driver5.jpg"),
  d6: require("@/assets/images/avatars/driver6.jpg"),
  d7: require("@/assets/images/avatars/driver7.jpg"),
  d8: require("@/assets/images/avatars/driver8.jpg"),
};

// ─── types ────────────────────────────────────────────────────────────────────
type DriverStatus = "Active" | "Pending" | "Blocked";
type DocStatus    = "Approved" | "Pending" | "Rejected";
type IconType     = "passport" | "health" | "bank" | "home";

interface MockDriver {
  id: string;
  name: string;
  extId: string;
  carType: string;
  status: DriverStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photo: any;
  docStats: { total: number; approved: number; pending: number; rejected: number };
}

interface DocItem {
  id: string;
  title: string;
  description: string;
  uploadedDate: string;
  status: DocStatus;
  iconType: IconType;
}

// ─── mock data ────────────────────────────────────────────────────────────────
const MOCK_DRIVERS: MockDriver[] = [
  { id:"1", name:"John Doe",       extId:"DRV-001", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d1, docStats:{total:4,approved:2,pending:1,rejected:1} },
  { id:"2", name:"Michael Smith",  extId:"DRV-002", carType:"Own Car Driver",     status:"Pending", photo:AVATARS.d2, docStats:{total:3,approved:1,pending:2,rejected:0} },
  { id:"3", name:"Sarah Johnson",  extId:"DRV-003", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d3, docStats:{total:4,approved:4,pending:0,rejected:0} },
  { id:"4", name:"David Brown",    extId:"DRV-004", carType:"Own Car Driver",     status:"Blocked", photo:AVATARS.d4, docStats:{total:4,approved:1,pending:0,rejected:3} },
  { id:"5", name:"Lisa Wilson",    extId:"DRV-005", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d5, docStats:{total:4,approved:3,pending:1,rejected:0} },
  { id:"6", name:"Robert Taylor",  extId:"DRV-006", carType:"Own Car Driver",     status:"Pending", photo:AVATARS.d6, docStats:{total:2,approved:0,pending:2,rejected:0} },
  { id:"7", name:"James Anderson", extId:"DRV-007", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d7, docStats:{total:4,approved:4,pending:0,rejected:0} },
  { id:"8", name:"Emma Davis",     extId:"DRV-008", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d8, docStats:{total:4,approved:3,pending:0,rejected:1} },
];

const INITIAL_DOCS: DocItem[] = [
  { id:"1", title:"ID / Passport",      description:"Government issued ID or Passport",              uploadedDate:"May 10, 2025", status:"Approved", iconType:"passport" },
  { id:"2", title:"Health Insurance",   description:"Valid health insurance certificate",             uploadedDate:"May 10, 2025", status:"Pending",  iconType:"health"   },
  { id:"3", title:"IBAN / Bank Account",description:"Bank account details (IBAN)",                   uploadedDate:"May 9, 2025",  status:"Approved", iconType:"bank"     },
  { id:"4", title:"Home Registration",  description:"Registration certificate (Meldebescheinigung)", uploadedDate:"May 8, 2025",  status:"Rejected", iconType:"home"     },
];

// ─── config helpers ───────────────────────────────────────────────────────────
function driverStatusCfg(s: DriverStatus) {
  switch (s) {
    case "Active":  return { dot:GREEN, bg:"rgba(34,197,94,0.15)",  text:"#4ADE80" };
    case "Pending": return { dot:AMBER, bg:"rgba(245,158,11,0.15)", text:"#FCD34D" };
    case "Blocked": return { dot:RED,   bg:"rgba(239,68,68,0.15)",  text:"#FC8181" };
  }
}

function docStatusCfg(s: DocStatus) {
  switch (s) {
    case "Approved": return { badgeBg:"rgba(34,197,94,0.15)",  badgeText:"#4ADE80", badgeBorder:"rgba(34,197,94,0.25)",  btnBorder:"rgba(255,255,255,0.18)", btnText:DIM    };
    case "Pending":  return { badgeBg:"rgba(245,158,11,0.15)", badgeText:"#FCD34D", badgeBorder:"rgba(245,158,11,0.3)",  btnBorder:"rgba(245,158,11,0.6)",   btnText:"#FCD34D" };
    case "Rejected": return { badgeBg:"rgba(239,68,68,0.15)",  badgeText:"#FC8181", badgeBorder:"rgba(239,68,68,0.3)",   btnBorder:"rgba(239,68,68,0.6)",    btnText:"#FC8181" };
  }
}

// ─── header icons ─────────────────────────────────────────────────────────────
function BackArrow() {
  return (
    <View style={{ width:20, height:20, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:11, height:11, borderLeftWidth:2.5, borderBottomWidth:2.5, borderColor:WHITE, transform:[{rotate:"45deg"}], marginLeft:4 }} />
    </View>
  );
}

function FilterFunnelIcon() {
  return (
    <View style={{ width:16, height:14, alignItems:"flex-start", justifyContent:"space-between" }}>
      <View style={{ width:16, height:2, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:11, height:2, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:6,  height:2, backgroundColor:WHITE, borderRadius:1 }} />
    </View>
  );
}

// ─── stat section icons ───────────────────────────────────────────────────────
function DocPageIcon() {
  return (
    <View style={{ width:24, height:30 }}>
      <View style={{ width:24, height:30, borderRadius:4, borderWidth:1.8, borderColor:"#60A5FA" }}>
        <View style={{ position:"absolute", top:7,  left:4, right:4, height:1.5, backgroundColor:"#60A5FA", borderRadius:1 }} />
        <View style={{ position:"absolute", top:13, left:4, right:4, height:1.5, backgroundColor:"#60A5FA", borderRadius:1 }} />
        <View style={{ position:"absolute", top:19, left:4, right:8, height:1.5, backgroundColor:"#60A5FA", borderRadius:1 }} />
        <View style={{ position:"absolute", top:25, left:4, right:11,height:1.5, backgroundColor:"#60A5FA", borderRadius:1 }} />
      </View>
    </View>
  );
}

function ApprovedStatIcon() {
  return (
    <View style={{ width:30, height:30, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:28, height:28, borderRadius:14, borderWidth:2, borderColor:"#22C55E", alignItems:"center", justifyContent:"center" }}>
        <View style={{ width:11, height:7, borderLeftWidth:2, borderBottomWidth:2, borderColor:"#22C55E", transform:[{rotate:"-45deg"}], marginTop:-2 }} />
      </View>
    </View>
  );
}

function PendingStatIcon() {
  return (
    <View style={{ width:30, height:30, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:28, height:28, borderRadius:14, borderWidth:2, borderColor:AMBER, alignItems:"center", justifyContent:"center" }}>
        <View style={{ position:"absolute", width:2, height:9, backgroundColor:AMBER, borderRadius:1, bottom:10.5 }} />
        <View style={{ position:"absolute", width:7, height:2, backgroundColor:AMBER, borderRadius:1, left:14 }} />
      </View>
    </View>
  );
}

function RejectedStatIcon() {
  return (
    <View style={{ width:30, height:30, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:28, height:28, borderRadius:14, borderWidth:2, borderColor:RED, alignItems:"center", justifyContent:"center" }}>
        <View style={{ position:"absolute", width:13, height:2, backgroundColor:RED, borderRadius:1, transform:[{rotate:"45deg"}] }} />
        <View style={{ position:"absolute", width:13, height:2, backgroundColor:RED, borderRadius:1, transform:[{rotate:"-45deg"}] }} />
      </View>
    </View>
  );
}

// ─── doc type icons (inside colored boxes) ────────────────────────────────────
function PassportIcon({ tint }: { tint:string }) {
  return (
    <View style={{ width:28, height:22 }}>
      <View style={{ width:28, height:22, borderRadius:4, borderWidth:1.8, borderColor:tint }}>
        <View style={{ position:"absolute", left:4, top:4, width:9, height:9, borderRadius:4.5, borderWidth:1.5, borderColor:tint }} />
        <View style={{ position:"absolute", right:4, top:5,  width:8, height:1.5, backgroundColor:tint, borderRadius:1 }} />
        <View style={{ position:"absolute", right:4, top:9,  width:8, height:1.5, backgroundColor:tint, borderRadius:1 }} />
        <View style={{ position:"absolute", right:4, top:13, width:6, height:1.5, backgroundColor:tint, borderRadius:1 }} />
      </View>
    </View>
  );
}

function HealthIcon({ tint }: { tint:string }) {
  return (
    <View style={{ width:22, height:26, alignItems:"center" }}>
      <View style={{ width:22, height:26, borderTopLeftRadius:5, borderTopRightRadius:5, borderBottomLeftRadius:11, borderBottomRightRadius:11, borderWidth:1.8, borderColor:tint, alignItems:"center", justifyContent:"center" }}>
        <View style={{ width:11, height:2, backgroundColor:tint, borderRadius:1 }} />
        <View style={{ position:"absolute", width:2, height:11, backgroundColor:tint, borderRadius:1 }} />
      </View>
    </View>
  );
}

function BankIcon({ tint }: { tint:string }) {
  return (
    <View style={{ width:26, height:24, alignItems:"center", justifyContent:"flex-end" }}>
      <View style={{ width:0, height:0, borderLeftWidth:13, borderRightWidth:13, borderBottomWidth:9, borderLeftColor:"transparent", borderRightColor:"transparent", borderBottomColor:tint, marginBottom:1 }} />
      <View style={{ flexDirection:"row", gap:3, marginBottom:1 }}>
        {[0,1,2].map(i => <View key={i} style={{ width:3, height:10, backgroundColor:tint, borderRadius:1 }} />)}
      </View>
      <View style={{ width:24, height:2.5, backgroundColor:tint, borderRadius:1 }} />
    </View>
  );
}

function HomeIcon({ tint }: { tint:string }) {
  return (
    <View style={{ width:26, height:24, alignItems:"center", justifyContent:"flex-end" }}>
      <View style={{ width:0, height:0, borderLeftWidth:15, borderRightWidth:15, borderBottomWidth:11, borderLeftColor:"transparent", borderRightColor:"transparent", borderBottomColor:tint }} />
      <View style={{ width:22, height:13, borderWidth:1.8, borderColor:tint, borderTopWidth:0, alignItems:"center", justifyContent:"flex-end" }}>
        <View style={{ width:7, height:9, borderWidth:1.5, borderColor:tint, borderBottomWidth:0, borderRadius:1 }} />
      </View>
    </View>
  );
}

function ShieldCheckIcon() {
  return (
    <View style={{ width:26, height:30, alignItems:"center" }}>
      <View style={{ width:26, height:30, borderTopLeftRadius:6, borderTopRightRadius:6, borderBottomLeftRadius:13, borderBottomRightRadius:13, borderWidth:1.8, borderColor:"#60A5FA", alignItems:"center", justifyContent:"center" }}>
        <View style={{ width:11, height:7, borderLeftWidth:2, borderBottomWidth:2, borderColor:"#60A5FA", transform:[{rotate:"-45deg"}], marginTop:-2 }} />
      </View>
    </View>
  );
}

// ─── calendar icon ────────────────────────────────────────────────────────────
function CalIcon() {
  return (
    <View style={{ width:13, height:13 }}>
      <View style={{ width:13, height:13, borderRadius:2.5, borderWidth:1, borderColor:MUTED }} />
      <View style={{ position:"absolute", top:3, left:0, right:0, height:1, backgroundColor:MUTED }} />
      <View style={{ position:"absolute", top:-1, left:3,  width:1.5, height:4, backgroundColor:MUTED, borderRadius:1 }} />
      <View style={{ position:"absolute", top:-1, right:3, width:1.5, height:4, backgroundColor:MUTED, borderRadius:1 }} />
    </View>
  );
}

// ─── doc type icon box ────────────────────────────────────────────────────────
const DOC_ICON_CFG: Record<IconType, { bg:string; tint:string; circle:boolean }> = {
  passport: { bg:"rgba(124,58,237,0.22)", tint:"#A78BFA", circle:false },
  health:   { bg:"rgba(14,165,233,0.22)",  tint:"#38BDF8", circle:true  },
  bank:     { bg:"rgba(20,184,166,0.22)",  tint:"#2DD4BF", circle:false },
  home:     { bg:"rgba(245,158,11,0.22)",  tint:"#FCD34D", circle:false },
};

function DocTypeIconBox({ type }: { type:IconType }) {
  const { bg, tint, circle } = DOC_ICON_CFG[type];
  const IconMap = { passport:PassportIcon, health:HealthIcon, bank:BankIcon, home:HomeIcon };
  const Icon = IconMap[type];
  return (
    <View style={[dib.box, { backgroundColor:bg, borderRadius:circle ? 30 : 16 }]}>
      <Icon tint={tint} />
    </View>
  );
}

const dib = StyleSheet.create({
  box: { width:58, height:58, alignItems:"center", justifyContent:"center", flexShrink:0 },
});

// ─── document thumbnails (mock placeholders) ──────────────────────────────────
function PassportThumb() {
  return (
    <View style={[tm.base, { backgroundColor:"#EDE8D8" }]}>
      <View style={[tm.topBar, { backgroundColor:"#1A3A6B" }]}>
        <Text style={[tm.tiny, { color:"#D4AF37", letterSpacing:0.2 }]}>BUNDESREPUBLIK</Text>
        <Text style={[tm.tiny, { color:"#D4AF37", letterSpacing:0.2 }]}>DEUTSCHLAND</Text>
      </View>
      <View style={tm.passBody}>
        <View style={tm.passPhoto}>
          <View style={{ width:"100%", height:"100%", backgroundColor:"#888", borderRadius:2 }} />
        </View>
        <View style={tm.linesCol}>
          {[80,100,60].map((w,i) => (
            <View key={i} style={[tm.line, { width:`${w}%` as any, backgroundColor:"#9A8A70" }]} />
          ))}
        </View>
      </View>
      <View style={[tm.bottomBar, { backgroundColor:"#2A2A2A" }]}>
        <Text style={[tm.tiny, { color:"rgba(255,255,255,0.5)", fontSize:3.5, letterSpacing:0.5 }]}>{"<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"}</Text>
      </View>
    </View>
  );
}

function InsuranceThumb() {
  return (
    <View style={[tm.base, { backgroundColor:"#FFFFFF" }]}>
      <View style={[tm.topBar, { backgroundColor:"#005FA8", height:22, flexDirection:"row", alignItems:"center", gap:3, paddingHorizontal:5 }]}>
        <Text style={{ color:WHITE, fontSize:9, fontWeight:"700", lineHeight:12 }}>TK</Text>
        <View>
          <Text style={[tm.tiny, { color:"rgba(255,255,255,0.95)" }]}>Techniker</Text>
          <Text style={[tm.tiny, { color:"rgba(255,255,255,0.95)" }]}>Krankenkasse</Text>
        </View>
      </View>
      <View style={{ flex:1, padding:4, gap:3 }}>
        {[100,75,90,60].map((w,i) => (
          <View key={i} style={[tm.line, { width:`${w}%` as any, backgroundColor:"#D0D0D0" }]} />
        ))}
      </View>
    </View>
  );
}

function IBANThumb() {
  return (
    <View style={[tm.base, { backgroundColor:"#FFFFFF" }]}>
      <View style={{ paddingHorizontal:5, paddingTop:5, flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
        <Text style={{ color:"#003B7A", fontSize:6, fontWeight:"700", lineHeight:9 }}>Deutsche Bank</Text>
        <View style={{ width:10, height:10, borderRadius:5, borderWidth:1.5, borderColor:"#003B7A" }} />
      </View>
      <View style={{ paddingHorizontal:5, paddingTop:3, gap:2 }}>
        <Text style={[tm.tiny, { color:"#444", fontWeight:"700" }]}>IBAN</Text>
        <Text style={[tm.tiny, { color:"#666", fontSize:4 }]}>DE89 1007 0024 0123 4567 89</Text>
        <Text style={[tm.tiny, { color:"#444", marginTop:2 }]}>JOHN DOE</Text>
        <View style={tm.line} />
        <View style={[tm.line, { width:"70%" }]} />
      </View>
    </View>
  );
}

function RegistrationThumb() {
  return (
    <View style={[tm.base, { backgroundColor:"#F5F5F0" }]}>
      <View style={{ padding:4, paddingTop:5 }}>
        <Text style={[tm.tiny, { color:"#333", textAlign:"center", fontSize:4.5, marginBottom:3 }]}>Meldebescheinigung</Text>
        {Array.from({length:8}).map((_,i) => (
          <View key={i} style={[tm.line, { width:i%3===2?"55%":"100%", backgroundColor:"#C0C0C0", marginBottom:3 }]} />
        ))}
      </View>
    </View>
  );
}

const tm = StyleSheet.create({
  base:     { width:84, height:64, borderRadius:6, overflow:"hidden", borderWidth:1, borderColor:"rgba(0,0,0,0.12)" },
  topBar:   { height:18, justifyContent:"center", paddingHorizontal:4 },
  bottomBar:{ height:12, justifyContent:"center", paddingHorizontal:3 },
  passBody: { flex:1, flexDirection:"row", padding:4, gap:4 },
  passPhoto:{ width:22, alignSelf:"stretch" },
  linesCol: { flex:1, justifyContent:"center", gap:5 },
  line:     { height:1.5, borderRadius:1, backgroundColor:"#BBB" },
  tiny:     { fontSize:4.5, lineHeight:7 },
});

const THUMBS = {
  passport: PassportThumb,
  health:   InsuranceThumb,
  bank:     IBANThumb,
  home:     RegistrationThumb,
};

// ─── doc status badge ─────────────────────────────────────────────────────────
function DocBadgeIcon({ status }: { status:DocStatus }) {
  if (status === "Approved") return (
    <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:"#22C55E", alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:6, height:4, borderLeftWidth:1.5, borderBottomWidth:1.5, borderColor:"#22C55E", transform:[{rotate:"-45deg"}], marginTop:-1 }} />
    </View>
  );
  if (status === "Pending") return (
    <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:AMBER, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:1.5, height:5, backgroundColor:AMBER, borderRadius:1, bottom:4.75 }} />
      <View style={{ position:"absolute", width:3.5, height:1.5, backgroundColor:AMBER, borderRadius:1, left:6.5 }} />
    </View>
  );
  return (
    <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:RED, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:RED, borderRadius:1, transform:[{rotate:"45deg"}] }} />
      <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:RED, borderRadius:1, transform:[{rotate:"-45deg"}] }} />
    </View>
  );
}

// ─── document card ────────────────────────────────────────────────────────────
function DocumentCard({ doc, onReview }: { doc:DocItem; onReview:(doc:DocItem)=>void }) {
  const cfg   = docStatusCfg(doc.status);
  const Thumb = THUMBS[doc.iconType];
  const btnLabel = doc.status === "Pending" ? "Review" : "View";

  return (
    <View style={dc.card}>
      {/* left icon */}
      <DocTypeIconBox type={doc.iconType} />

      {/* center info */}
      <View style={dc.info}>
        <Text style={dc.title}>{doc.title}</Text>
        <Text style={dc.desc} numberOfLines={2}>{doc.description}</Text>
        <View style={dc.dateRow}>
          <CalIcon />
          <Text style={dc.dateText}>{doc.uploadedDate}</Text>
        </View>
      </View>

      {/* right: thumb + badge + button */}
      <View style={dc.right}>
        <Thumb />
        <View style={[dc.badge, { backgroundColor:cfg.badgeBg, borderColor:cfg.badgeBorder }]}>
          <DocBadgeIcon status={doc.status} />
          <Text style={[dc.badgeText, { color:cfg.badgeText }]}>{doc.status}</Text>
        </View>
        <Pressable style={[dc.btn, { borderColor:cfg.btnBorder }]} onPress={() => onReview(doc)}>
          <Text style={[dc.btnText, { color:cfg.btnText }]}>{btnLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  card:      { backgroundColor:CARD, borderRadius:18, borderWidth:1, borderColor:BORDER, padding:14, flexDirection:"row", gap:12, alignItems:"flex-start", marginBottom:12 },
  info:      { flex:1, gap:4, paddingTop:2 },
  title:     { fontFamily:"Poppins_600SemiBold", fontSize:14,   color:WHITE, lineHeight:20 },
  desc:      { fontFamily:"Poppins_400Regular",  fontSize:11.5, color:DIM,   lineHeight:16 },
  dateRow:   { flexDirection:"row", alignItems:"center", gap:5, marginTop:2 },
  dateText:  { fontFamily:"Poppins_400Regular",  fontSize:10,   color:MUTED  },
  right:     { width:88, gap:7, alignItems:"stretch" },
  badge:     { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:7, paddingVertical:5, borderRadius:8, borderWidth:1 },
  badgeText: { fontFamily:"Poppins_600SemiBold", fontSize:11, lineHeight:14 },
  btn:       { borderWidth:1, borderRadius:8, paddingVertical:7, alignItems:"center" },
  btnText:   { fontFamily:"Poppins_600SemiBold", fontSize:12 },
});

// ─── stat column ──────────────────────────────────────────────────────────────
function StatCol({ icon, count, label }: { icon:React.ReactNode; count:number; label:string }) {
  return (
    <View style={sc.col}>
      {icon}
      <Text style={sc.count}>{count}</Text>
      <Text style={sc.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  col:   { flex:1, alignItems:"center", gap:8, paddingHorizontal:4 },
  count: { fontFamily:"Poppins_700Bold", fontSize:30, color:WHITE, lineHeight:36 },
  label: { fontFamily:"Poppins_400Regular", fontSize:11, color:DIM, textAlign:"center" },
});

// ─── bottom tab icons ─────────────────────────────────────────────────────────
function GridIcon({ color }: { color:string }) {
  return (
    <View style={{ width:18, height:18, flexDirection:"row", flexWrap:"wrap", gap:3, padding:1 }}>
      {[0,1,2,3].map(i => <View key={i} style={{ width:5, height:5, backgroundColor:color, borderRadius:1 }} />)}
    </View>
  );
}

function PeopleIcon({ color }: { color:string }) {
  const sz = 20;
  return (
    <View style={{ width:sz, height:sz }}>
      <View style={{ position:"absolute", left:0, top:0, width:sz*0.42, height:sz*0.42, borderRadius:sz*0.21, borderWidth:1.5, borderColor:color, opacity:0.5 }} />
      <View style={{ position:"absolute", left:0, bottom:0, width:sz*0.62, height:sz*0.36, borderTopLeftRadius:sz*0.31, borderTopRightRadius:sz*0.31, borderWidth:1.5, borderColor:color, borderBottomWidth:0, opacity:0.5 }} />
      <View style={{ position:"absolute", right:0, top:sz*0.04, width:sz*0.46, height:sz*0.46, borderRadius:sz*0.23, borderWidth:1.5, borderColor:color }} />
      <View style={{ position:"absolute", right:0, bottom:0, width:sz*0.72, height:sz*0.4, borderTopLeftRadius:sz*0.36, borderTopRightRadius:sz*0.36, borderWidth:1.5, borderColor:color, borderBottomWidth:0 }} />
    </View>
  );
}

function TruckIcon({ color }: { color:string }) {
  return (
    <View style={{ width:22, height:16 }}>
      <View style={{ position:"absolute", left:0, top:0, width:14, height:10, borderWidth:1.5, borderColor:color, borderRadius:2 }} />
      <View style={{ position:"absolute", right:0, top:3, width:8, height:7, borderWidth:1.5, borderColor:color, borderTopRightRadius:2 }} />
      <View style={{ position:"absolute", bottom:0, left:2, width:5, height:5, borderRadius:2.5, borderWidth:1.5, borderColor:color, backgroundColor:TAB_BG }} />
      <View style={{ position:"absolute", bottom:0, right:2, width:5, height:5, borderRadius:2.5, borderWidth:1.5, borderColor:color, backgroundColor:TAB_BG }} />
    </View>
  );
}

function ChartIcon({ color }: { color:string }) {
  return (
    <View style={{ width:20, height:18, flexDirection:"row", alignItems:"flex-end", gap:3 }}>
      {[9,16,7,13].map((h,i) => <View key={i} style={{ width:3, height:h, backgroundColor:color, borderRadius:2 }} />)}
    </View>
  );
}

function MoreDotsIcon({ color }: { color:string }) {
  return (
    <View style={{ width:20, height:20, flexDirection:"row", flexWrap:"wrap", gap:4, padding:1 }}>
      {[0,1,2,3].map(i => <View key={i} style={{ width:6, height:6, borderRadius:2, borderWidth:1.5, borderColor:color }} />)}
    </View>
  );
}

const TABS = [
  { label:"Dashboard",  Icon:GridIcon     },
  { label:"Drivers",    Icon:PeopleIcon   },
  { label:"Deliveries", Icon:TruckIcon    },
  { label:"Reports",    Icon:ChartIcon    },
  { label:"More",       Icon:MoreDotsIcon },
] as const;

function BottomTabs({ onPress }: { onPress:(i:number)=>void }) {
  return (
    <View style={tb.bar}>
      {TABS.map(({ label, Icon }, i) => {
        const active = i === 1;
        const color  = active ? ORANGE : MUTED;
        return (
          <Pressable key={label} style={tb.item} hitSlop={8} onPress={() => onPress(i)}>
            {active && <View style={tb.indicator} />}
            <Icon color={color} />
            <Text style={[tb.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar:       { flexDirection:"row", backgroundColor:TAB_BG, borderTopWidth:1, borderTopColor:BORDER, paddingTop:10, paddingBottom:6 },
  item:      { flex:1, alignItems:"center", gap:4, position:"relative", paddingTop:8 },
  indicator: { position:"absolute", top:0, width:32, height:3, borderRadius:2, backgroundColor:ORANGE },
  label:     { fontFamily:"Poppins_500Medium", fontSize:10, lineHeight:14 },
});

// ─── screen ───────────────────────────────────────────────────────────────────
export default function AdminDriverDocumentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id:string }>();

  const driver = MOCK_DRIVERS.find(d => d.id === id) ?? MOCK_DRIVERS[0];
  const dCfg   = driverStatusCfg(driver.status);

  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [reviewDoc, setReviewDoc] = useState<DocItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const docStats = {
    total:    docs.length,
    approved: docs.filter(d => d.status === "Approved").length,
    pending:  docs.filter(d => d.status === "Pending").length,
    rejected: docs.filter(d => d.status === "Rejected").length,
  };

  function openReview(doc: DocItem) {
    setReviewDoc(doc);
    setModalVisible(true);
  }

  function closeReview() {
    setModalVisible(false);
  }

  function handleDocAction(docId: string, action: "approve" | "reject") {
    const newStatus: DocStatus = action === "approve" ? "Approved" : "Rejected";
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
    closeReview();
  }

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin" as never);
    if (i === 1) router.back();
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <BackArrow />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Driver Documents</Text>
          <Text style={s.headerSub}>Review and approve driver documents</Text>
        </View>
        <Pressable style={s.filterBtn} hitSlop={10}>
          <FilterFunnelIcon />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── driver profile card ── */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <Image source={driver.photo} style={s.avatar} />
            <View style={[s.onlineDot, { backgroundColor:dCfg.dot }]} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.driverName}>{driver.name}</Text>
            <Text style={s.driverExtId}>
              ID: <Text style={{ color:ORANGE }}>{driver.extId}</Text>
            </Text>
            <View style={s.carRow}>
              {/* small car icon */}
              <View style={{ width:15, height:10 }}>
                <View style={{ position:"absolute", left:0, top:0, width:15, height:7, borderRadius:2, borderWidth:1.2, borderColor:MUTED }} />
                <View style={{ position:"absolute", bottom:0, left:1.5, width:4, height:4, borderRadius:2, borderWidth:1.2, borderColor:MUTED, backgroundColor:CARD }} />
                <View style={{ position:"absolute", bottom:0, right:1.5, width:4, height:4, borderRadius:2, borderWidth:1.2, borderColor:MUTED, backgroundColor:CARD }} />
              </View>
              <Text style={s.carType}>{driver.carType}</Text>
            </View>
          </View>
          <View style={[s.statusBadge, { backgroundColor:dCfg.bg }]}>
            <View style={[s.statusDot, { backgroundColor:dCfg.dot }]} />
            <Text style={[s.statusText, { color:dCfg.text }]}>{driver.status}</Text>
          </View>
        </View>

        {/* ── doc stats card ── */}
        <View style={s.statsCard}>
          <StatCol icon={<DocPageIcon />}      count={docStats.total}    label="Total Documents" />
          <View style={s.divider} />
          <StatCol icon={<ApprovedStatIcon />} count={docStats.approved} label="Approved" />
          <View style={s.divider} />
          <StatCol icon={<PendingStatIcon />}  count={docStats.pending}  label="Pending" />
          <View style={s.divider} />
          <StatCol icon={<RejectedStatIcon />} count={docStats.rejected} label="Rejected" />
        </View>

        {/* ── documents section ── */}
        <Text style={s.sectionTitle}>Documents</Text>
        {docs.map(doc => <DocumentCard key={doc.id} doc={doc} onReview={openReview} />)}

        {/* ── security footer ── */}
        <Pressable style={s.secCard}>
          <View style={s.secIconWrap}>
            <ShieldCheckIcon />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.secTitle}>All documents are securely stored</Text>
            <Text style={s.secSub}>We ensure the highest security and compliance standards.</Text>
          </View>
          <View style={{ width:7, height:7, borderRightWidth:1.5, borderTopWidth:1.5, borderColor:MUTED, transform:[{rotate:"45deg"}] }} />
        </Pressable>

        <View style={{ height:20 }} />
      </ScrollView>

      {/* ── bottom tabs ── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor:TAB_BG }}>
        <BottomTabs onPress={handleTabPress} />
      </SafeAreaView>

      {/* ── document review modal ── */}
      <AdminDocumentReviewModal
        visible={modalVisible}
        onClose={closeReview}
        doc={reviewDoc}
        driver={driver}
        onAction={handleDocAction}
      />
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex:1, backgroundColor:BG },

  // header
  header:      { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingTop:8, paddingBottom:16, gap:14 },
  backBtn:     { width:36, height:36, alignItems:"center", justifyContent:"center" },
  headerCenter:{ flex:1 },
  headerTitle: { fontFamily:"Poppins_700Bold",    fontSize:22, color:WHITE,  lineHeight:28 },
  headerSub:   { fontFamily:"Poppins_400Regular", fontSize:12, color:MUTED,  marginTop:-1 },
  filterBtn:   { width:44, height:44, borderRadius:14, backgroundColor:FAINT, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },

  scroll: { paddingHorizontal:16, paddingTop:4 },

  // profile card
  profileCard: { flexDirection:"row", alignItems:"center", backgroundColor:CARD, borderRadius:18, borderWidth:1, borderColor:BORDER, padding:16, marginBottom:14, gap:14 },
  avatarWrap:  { width:62, height:62, position:"relative", flexShrink:0 },
  avatar:      { width:62, height:62, borderRadius:31 },
  onlineDot:   { position:"absolute", bottom:2, left:2, width:15, height:15, borderRadius:7.5, borderWidth:2.5, borderColor:CARD },
  profileInfo: { flex:1, gap:3 },
  driverName:  { fontFamily:"Poppins_700Bold",    fontSize:17, color:WHITE },
  driverExtId: { fontFamily:"Poppins_500Medium",  fontSize:13, color:DIM  },
  carRow:      { flexDirection:"row", alignItems:"center", gap:6, marginTop:1 },
  carType:     { fontFamily:"Poppins_400Regular", fontSize:12, color:MUTED },
  statusBadge: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:12, paddingVertical:5, borderRadius:20, flexShrink:0 },
  statusDot:   { width:7, height:7, borderRadius:3.5 },
  statusText:  { fontFamily:"Poppins_600SemiBold", fontSize:12 },

  // stats card
  statsCard: { flexDirection:"row", alignItems:"center", backgroundColor:CARD, borderRadius:18, borderWidth:1, borderColor:BORDER, paddingVertical:22, marginBottom:22 },
  divider:   { width:1, height:52, backgroundColor:BORDER },

  // section
  sectionTitle: { fontFamily:"Poppins_700Bold", fontSize:18, color:WHITE, marginBottom:14 },

  // security card
  secCard:    { flexDirection:"row", alignItems:"center", backgroundColor:CARD, borderRadius:16, borderWidth:1, borderColor:BORDER, padding:16, gap:14, marginTop:2 },
  secIconWrap:{ width:44, height:44, borderRadius:12, backgroundColor:"rgba(96,165,250,0.1)", alignItems:"center", justifyContent:"center" },
  secTitle:   { fontFamily:"Poppins_600SemiBold", fontSize:13.5, color:WHITE, lineHeight:20 },
  secSub:     { fontFamily:"Poppins_400Regular",  fontSize:11.5, color:MUTED,  lineHeight:17, marginTop:1 },
});
