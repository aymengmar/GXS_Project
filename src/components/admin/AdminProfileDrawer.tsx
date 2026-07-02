import AdminAppearanceModal from "@/components/admin/AdminAppearanceModal";
import AdminChangePasswordModal from "@/components/admin/AdminChangePasswordModal";
import AdminLanguageModal from "@/components/admin/AdminLanguageModal";
import AdminLogoutModal from "@/components/admin/AdminLogoutModal";
import AdminMyProfileModal from "@/components/admin/AdminMyProfileModal";
import AdminNotificationsModal from "@/components/admin/AdminNotificationsModal";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const { width: SW } = Dimensions.get("window");
const DRAWER_W = Math.min(SW * 0.78, 320);

const DRAWER_BG = "#0C1627";
const BORDER    = "rgba(255,255,255,0.09)";
const ORANGE    = "#FF6500";
const GREEN     = "#22C55E";
const RED       = "#EF4444";
const WHITE     = "#FFFFFF";
const DIM       = "rgba(255,255,255,0.55)";
const MUTED     = "rgba(255,255,255,0.30)";

// ─── icons ────────────────────────────────────────────────────────────────────

function IconUser({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconBell({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconAppearance({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconLanguage({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPassword({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 2H3v20l4-4h14V2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 10h.01M12 10h.01M16 10h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function IconLogout({ color = RED }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconChevron({ color = MUTED }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── menu items definition ────────────────────────────────────────────────────

const MENU_ITEMS = [
  { key: "profile",   label: "My Profile",      Icon: IconUser,       badge: null as string | null },
  { key: "notifs",    label: "Notifications",   Icon: IconBell,       badge: "3" },
  { key: "language",  label: "Language",         Icon: IconLanguage,   badge: null as string | null },
  { key: "appear",    label: "Appearance",       Icon: IconAppearance, badge: null as string | null },
  { key: "password",  label: "Change Password",  Icon: IconPassword,   badge: null as string | null },
];

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AdminProfileDrawer({ visible, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notifsModalVisible, setNotifsModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const slideX    = useRef(new Animated.Value(DRAWER_W)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideX.setValue(DRAWER_W);
      bgOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideX,    { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideX,    { toValue: DRAWER_W, duration: 220, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,        duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.container}>
        {/* dim overlay — non-interactive, behind tap catcher */}
        <Animated.View style={[s.backdrop, { opacity: bgOpacity }]} pointerEvents="none" />

        {/* tap-outside area closes drawer */}
        <Pressable style={s.tapOutside} onPress={onClose} />

        {/* ── drawer panel ──────────────────────────────────────────── */}
        <Animated.View style={[s.drawer, { transform: [{ translateX: slideX }] }]}>
          <SafeAreaView edges={["top", "bottom"]} style={s.drawerInner}>

            {/* ── profile section ─────────────────────────────── */}
            <View style={s.profileSection}>
              <View style={s.avatarWrap}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarText}>A</Text>
                </View>
                <View style={s.onlineDot} />
              </View>
              <Text style={s.name}>Admin</Text>
              <Text style={s.roleText}>Super Admin</Text>
              <Text style={s.company}>GXS Delivery</Text>
            </View>

            <View style={s.divider} />

            {/* ── menu items ──────────────────────────────────── */}
            <View style={s.menuSection}>
              {MENU_ITEMS.map((item, idx) => (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    if (item.key === "profile")   setProfileModalVisible(true);
                    if (item.key === "notifs")    setNotifsModalVisible(true);
                    if (item.key === "language")  setLanguageModalVisible(true);
                    if (item.key === "appear")    setAppearanceModalVisible(true);
                    if (item.key === "password")  setChangePasswordModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    s.menuRow,
                    idx < MENU_ITEMS.length - 1 && s.menuBorder,
                    pressed && s.menuRowPressed,
                  ]}
                >
                  <View style={s.menuIconWrap}>
                    <item.Icon color={WHITE} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.badge !== null && (
                    <View style={s.notifBadge}>
                      <Text style={s.notifBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <IconChevron />
                </Pressable>
              ))}
            </View>

            <View style={s.divider} />

            {/* ── logout button ────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [s.logoutRow, pressed && s.logoutPressed]}
              onPress={() => setLogoutModalVisible(true)}
            >
              <IconLogout />
              <Text style={s.logoutLabel}>Logout</Text>
              <IconChevron color={RED} />
            </Pressable>

          </SafeAreaView>
        </Animated.View>
      </View>

      <AdminMyProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      <AdminNotificationsModal
        visible={notifsModalVisible}
        onClose={() => setNotifsModalVisible(false)}
      />

      <AdminLanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

      <AdminAppearanceModal
        visible={appearanceModalVisible}
        onClose={() => setAppearanceModalVisible(false)}
      />

      <AdminChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
      />

      <AdminLogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </Modal>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  tapOutside: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_W,
    backgroundColor: DRAWER_BG,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: "hidden",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  drawerInner: {
    flex: 1,
  },

  // profile
  profileSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#1A3A5C",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 34,
    color: WHITE,
    lineHeight: 40,
  },
  onlineDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
    borderWidth: 2.5,
    borderColor: DRAWER_BG,
  },
  name: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    lineHeight: 24,
    marginBottom: 2,
  },
  roleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    lineHeight: 18,
    marginBottom: 4,
  },
  company: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
  },

  // menu
  menuSection: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuRowPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: WHITE,
  },
  notifBadge: {
    backgroundColor: RED,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  notifBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: WHITE,
    lineHeight: 15,
  },

  // logout
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
    gap: 14,
  },
  logoutPressed: {
    backgroundColor: "rgba(239,68,68,0.20)",
  },
  logoutLabel: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: RED,
  },
});
