import { COLORS } from '@/src/constants/colors';
import { nativeBlockingService } from '@/src/services/nativeBlockingService';
import { CheckCircle, Circle, Shield } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface NativeBlockingSetupProps {
  onSetupComplete?: () => void;
}

export function NativeBlockingSetup({ onSetupComplete }: NativeBlockingSetupProps) {
  const [permissions, setPermissions] = useState({
    overlay: false,
    accessibility: false,
    usageStats: false,
  });
  const [checking, setChecking] = useState(true);
  const [setting, setSetting] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setChecking(true);
    const perms = await nativeBlockingService.checkPermissions();
    setPermissions(perms);
    setChecking(false);

    // Auto-complete if all granted
    if (perms.overlay && perms.accessibility && perms.usageStats) {
      onSetupComplete?.();
    }
  };

  const handleSetup = async () => {
    setSetting(true);
    const success = await nativeBlockingService.requestPermissions();
    setSetting(false);

    if (success) {
      await checkPermissions();
      onSetupComplete?.();
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Shield size={32} color={COLORS.textSecondary} />
        </View>
        <Text style={styles.title}>Not Available on iOS</Text>
        <Text style={styles.description}>
          Native app blocking is only available on Android devices due to iOS restrictions.
        </Text>
      </View>
    );
  }

  const allGranted = permissions.overlay && permissions.accessibility && permissions.usageStats;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, allGranted && styles.iconBoxActive]}>
          <Shield size={32} color={allGranted ? COLORS.primary : COLORS.textSecondary} />
        </View>
        <Text style={styles.title}>
          {allGranted ? '✅ Native Blocking Active' : '🛡️ Enable Native Blocking'}
        </Text>
        <Text style={styles.description}>
          {allGranted
            ? 'All permissions granted. Blocked apps will be physically prevented from opening.'
            : 'Grant permissions to enable TRUE app blocking. Blocked apps will be physically blocked, not just warned.'}
        </Text>
      </View>

      {/* Permissions List */}
      {checking ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      ) : (
        <View style={styles.permissionsList}>
          <PermissionItem
            icon={permissions.overlay ? <CheckCircle size={20} color={COLORS.success} /> : <Circle size={20} color={COLORS.textSecondary} />}
            title="Display Over Other Apps"
            description="Shows blocking screen on top of other apps"
            granted={permissions.overlay}
          />

          <PermissionItem
            icon={permissions.usageStats ? <CheckCircle size={20} color={COLORS.success} /> : <Circle size={20} color={COLORS.textSecondary} />}
            title="Usage Access"
            description="Detects which app you're currently using"
            granted={permissions.usageStats}
          />

          <PermissionItem
            icon={permissions.accessibility ? <CheckCircle size={20} color={COLORS.success} /> : <Circle size={20} color={COLORS.textSecondary} />}
            title="Accessibility Service"
            description="Monitors app switches in real-time"
            granted={permissions.accessibility}
          />
        </View>
      )}

      {/* Setup Button */}
      {!allGranted && !checking && (
        <Pressable
          style={[styles.setupButton, setting && styles.setupButtonDisabled]}
          onPress={handleSetup}
          disabled={setting}
        >
          {setting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>Grant Permissions</Text>
          )}
        </Pressable>
      )}

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 These permissions are used ONLY for app blocking. Your privacy is protected - no data is collected or shared.
        </Text>
      </View>

      {/* Refresh Button */}
      <Pressable style={styles.refreshButton} onPress={checkPermissions}>
        <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
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

function PermissionItem({ icon, title, description, granted }: PermissionItemProps) {
  return (
    <View style={[styles.permissionItem, granted && styles.permissionItemGranted]}>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(20,184,166,0.15)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Permissions List
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  permissionItemGranted: {
    borderColor: 'rgba(34,197,94,0.3)',
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContent: {
    flex: 1,
    gap: 2,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  permissionDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  grantedBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  grantedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Setup Button
  setupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupButtonDisabled: {
    opacity: 0.5,
  },
  setupButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Info
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
    textAlign: 'center',
  },

  // Refresh Button
  refreshButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
