import { images } from "@/constants/images";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const NAVY = "#001232";
const ORANGE = "#FF6500";

// ── Isometric 3-face cube icon ─────────────────────────────────────
function CubeIcon({ size = 18, color = "#FFFFFF" }: { size?: number; color?: string }) {
  const half = size / 2;
  return (
    <View style={{ width: Math.round(size * 1.25), height: size }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: Math.round(size * 0.12),
          width: size,
          height: size,
          backgroundColor: color,
          opacity: 1.0,
          transform: [{ rotate: "45deg" }, { scaleY: 0.5 }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: Math.round(half * 1.1),
          height: Math.round(size * 0.62),
          backgroundColor: color,
          opacity: 0.6,
          transform: [{ skewY: "-30deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: Math.round(half * 1.1),
          height: Math.round(size * 0.62),
          backgroundColor: color,
          opacity: 0.82,
          transform: [{ skewY: "30deg" }],
        }}
      />
    </View>
  );
}

export default function OnboardingScreen() {
  const [pressed, setPressed] = useState(false);
  const insets = useSafeAreaInsets();

  const circleX = useSharedValue(0);
  const circleOpacity = useSharedValue(1);
  const chevX = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  // Exact max slide measured from button layout; 220 is a safe fallback
  const maxSlide = useSharedValue(220);

  // ── Navigate to the next screen ──────────────────────────────────
  const handleGetStarted = useCallback(() => {
    // TODO: router.replace('/login') once auth screens are built
  }, []);

  // ── Looping hint animation (plays when idle) ──────────────────────
  const startAutoAnim = useCallback(() => {
    const SLIDE_MS = 950;
    const PAUSE_MS = 500;

    circleX.value = withRepeat(
      withSequence(
        // slide to 180dp — fades out well before reaching >>
        withTiming(180, { duration: SLIDE_MS, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),         // invisible snap back
        withTiming(0, { duration: PAUSE_MS }),  // hold at start
      ),
      -1,
      false,
    );

    circleOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: Math.round(SLIDE_MS * 0.55), easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: Math.round(SLIDE_MS * 0.45) }),
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: PAUSE_MS }),
      ),
      -1,
      false,
    );

    chevX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(8, { duration: 650, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: PAUSE_MS }),
      ),
      -1,
      false,
    );
  }, [circleX, circleOpacity, chevX]);

  useEffect(() => {
    startAutoAnim();
    return () => {
      cancelAnimation(circleX);
      cancelAnimation(circleOpacity);
      cancelAnimation(chevX);
    };
  }, [startAutoAnim]);

  // ── Interactive drag gesture ──────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Freeze animation at current position; snap circle to full opacity
      dragStartX.value = circleX.value;
      cancelAnimation(circleX);
      cancelAnimation(circleOpacity);
      cancelAnimation(chevX);
      circleOpacity.value = withTiming(1, { duration: 80 });
    })
    .onUpdate((e) => {
      // Follow finger, clamped between 0 and the right edge
      circleX.value = Math.max(
        0,
        Math.min(dragStartX.value + e.translationX, maxSlide.value),
      );
    })
    .onEnd(() => {
      if (circleX.value >= maxSlide.value * 0.75) {
        // Crossed 75% → complete the slide and navigate
        circleX.value = withTiming(maxSlide.value, { duration: 150 }, () => {
          handleGetStarted();
          // Reset circle and restart idle animation
          circleX.value = withTiming(0, { duration: 400 }, () => {
            startAutoAnim();
          });
          circleOpacity.value = withTiming(1, { duration: 400 });
        });
      } else {
        // Released early → spring back to start, then resume idle animation
        circleX.value = withSpring(0, { damping: 18, stiffness: 250 }, (finished) => {
          if (finished) startAutoAnim();
        });
        circleOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  // Measure button to get exact slide distance
  const onButtonLayout = (e: LayoutChangeEvent) => {
    // button width − paddingLeft(8) − circleWidth(46) − marginRight(4) − paddingRight(20)
    const slide = e.nativeEvent.layout.width - 78;
    maxSlide.value = Math.max(100, slide);
  };

  const animCircle = useAnimatedStyle(() => ({
    transform: [{ translateX: circleX.value }],
    opacity: circleOpacity.value,
  }));

  const animChev = useAnimatedStyle(() => ({
    transform: [{ translateX: chevX.value }],
  }));

  return (
    <>
      <StatusBar style="light" />

      <ImageBackground
        source={images.truckHero}
        style={styles.root}
        resizeMode="cover"
      >
        <View style={styles.overlayBottom} />

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          {/* ── Brand mark ─────────────────────────────────────── */}
          <View style={styles.brand}>
            <Text style={styles.gxs}>GXS</Text>
            <Text style={styles.delivery}>DELIVERY</Text>
            <View style={styles.brandLine} />
          </View>

          {/* ── Hero copy ──────────────────────────────────────── */}
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>
              Internal Delivery{"\n"}Management
            </Text>
            <Text style={styles.heroSub}>
              Manage drivers, deliveries, and daily operations{"\n"}in one
              powerful platform.
            </Text>
          </View>

          <View style={styles.spacer} />

          {/* ── Bottom content ─────────────────────────────────── */}
          <View
            style={[
              styles.bottom,
              { paddingBottom: Math.max(insets.bottom + 12, 32) },
            ]}
          >
            <View style={styles.dots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <Text style={styles.headline}>Smart Delivery{"\n"}Made Simple</Text>

            {/* ── Slide-to-start button ─────────────────────────── */}
            <Pressable
              style={[styles.btn, pressed && styles.btnPressed]}
              onPressIn={() => setPressed(true)}
              onPressOut={() => setPressed(false)}
              onPress={handleGetStarted}
              onLayout={onButtonLayout}
            >
              {/* Draggable circle — also animates as idle hint */}
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.btnIconWrap, animCircle]}>
                  <CubeIcon size={18} color="#FFFFFF" />
                </Animated.View>
              </GestureDetector>

              <Text style={styles.btnLabel}>Get Started</Text>

              <Animated.Text style={[styles.btnChevrons, animChev]}>
                {">>"}
              </Animated.Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVY,
  },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
    backgroundColor: "rgba(0,10,35,0.92)",
  },
  safeArea: { flex: 1 },

  brand: { marginTop: 32, marginLeft: 24 },
  gxs: {
    fontFamily: "Poppins_700Bold",
    fontSize: 38,
    color: "#FFFFFF",
    lineHeight: 42,
    letterSpacing: 1,
  },
  delivery: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
    letterSpacing: 5,
    lineHeight: 18,
    marginTop: 1,
  },
  brandLine: {
    marginTop: 8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: ORANGE,
  },

  heroBody: { marginHorizontal: 24, marginTop: 16, marginBottom: 16 },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    lineHeight: 30,
    marginBottom: 10,
  },
  heroSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
    lineHeight: 22,
  },

  spacer: { flex: 1 },

  bottom: { paddingHorizontal: 24, paddingTop: 16 },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.30)",
  },
  dotActive: {
    width: 22,
    borderRadius: 3,
    backgroundColor: ORANGE,
  },
  headline: {
    fontFamily: "Poppins_700Bold",
    fontSize: 34,
    color: "#FFFFFF",
    lineHeight: 42,
    marginBottom: 28,
  },

  btn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 20,
    overflow: "visible",
  },
  btnPressed: { opacity: 0.88 },
  btnIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  btnLabel: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  btnChevrons: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -1,
  },
});
