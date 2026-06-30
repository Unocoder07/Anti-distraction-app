import { nativeBlockingService } from "@/src/services/nativeBlockingService";
import { useTheme } from "@/src/theme";
import type { ThemeColors } from "@/src/theme";
import { BarChart2, CheckCircle, Circle, Shield } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface NativeBlockingSetupProps {
  onSetupComplete?: () => void;
}

export function NativeBlockingSetup({
  onSetupComplete,
}: NativeBlockingSetupProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [permissions, setPermissions] = useState({
    overlay: true,
    accessibility: false,
    usageStats: false,
  });
  const [checking, setChecking] = useState(true);
  const [setting, setSetting] = useState(false);

  const checkPermissions = useCallback(async () => {
    setChecking(true);
    const perms = await nativeBlockingService.checkPermissions();
    setPermissions(perms);
    setChecking(false);

    if (perms.usageStats) {
      onSetupComplete?.();
    }
  }, [onSetupComplete]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void checkPermissions();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [checkPermissions]);

  const handleSetup = async () => {
    setSetting(true);
    const success =
      await nativeBlockingService.requestPassiveMonitoringPermission();
    setSetting(false);

    if (success) {
      await checkPermissions();
      onSetupComplete?.();
    }
  };

  if (Platform.OS !== "android") {
    return (
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Shield size={32} color={COLORS.textSecondary} />
        </View>
        <Text style={styles.title}>Not Available on iOS</Text>
        <Text style={styles.description}>
          Native Shield monitoring is available on Android devices.
        </Text>
      </View>
    );
  }

  const passiveReady = permissions.usageStats;
  const strictReady = permissions.usageStats && permissions.accessibility;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, passiveReady && styles.iconBoxActive]}>
          {passiveReady ? (
            <BarChart2 size={32} color={COLORS.primary} />
          ) : (
            <Shield size={32} color={COLORS.textSecondary} />
          )}
        </View>
        <Text style={styles.title}>
          {passiveReady
            ? "Shield Monitoring Ready"
            : "Enable Shield Monitoring"}
        </Text>
        <Text style={styles.description}>
          {passiveReady
            ? "Usage Access is enabled for private screen-time insights and recommendations."
            : "Grant Usage Access to power Shield recommendations without Accessibility or overlays."}
        </Text>
      </View>

      {checking ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      ) : (
        <View style={styles.permissionsList}>
          <PermissionItem
            icon={
              permissions.usageStats ? (
                <CheckCircle size={20} color={COLORS.success} />
              ) : (
                <Circle size={20} color={COLORS.textSecondary} />
              )
            }
            title="Usage Access"
            description="Generates analytics and recommended apps to block"
            granted={permissions.usageStats}
          />

          <PermissionItem
            icon={
              permissions.accessibility ? (
                <CheckCircle size={20} color={COLORS.success} />
              ) : (
                <Circle size={20} color={COLORS.textSecondary} />
              )
            }
            title="Focus Protection"
            description="Requested only when you start a strict focus session"
            granted={permissions.accessibility}
          />
        </View>
      )}

      {!passiveReady && !checking && (
        <Pressable
          style={[styles.setupButton, setting && styles.setupButtonDisabled]}
          onPress={handleSetup}
          disabled={setting}
        >
          {setting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>Grant Usage Access</Text>
          )}
        </Pressable>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {strictReady
            ? "Focus Protection is ready for strict sessions. You can disable Accessibility after a session for full privacy."
            : "Accessibility is not needed for normal Shield monitoring. It is requested only for active blocking sessions."}
        </Text>
      </View>

      <Pressable style={styles.refreshButton} onPress={checkPermissions}>
        <Text style={styles.refreshButtonText}>Refresh Status</Text>
      </Pressable>
    </View>
  );
}

interface PermissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  granted: boolean;
}

function PermissionItem({
  icon,
  title,
  description,
  granted,
}: PermissionItemProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <View
      style={[styles.permissionItem, granted && styles.permissionItemGranted]}
    >
      <View style={styles.permissionIcon}>{icon}</View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
      {granted && (
        <View style={styles.grantedBadge}>
          <Text style={styles.grantedText}>Granted</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconBoxActive: {
    backgroundColor: "rgba(20,184,166,0.15)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  permissionItemGranted: {
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContent: {
    flex: 1,
    gap: 2,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  permissionDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  grantedBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  grantedText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.success,
  },
  setupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  setupButtonDisabled: {
    opacity: 0.5,
  },
  setupButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  infoBox: {
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    textAlign: "center",
  },
  refreshButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
