// Tabs are driven by the root _layout.tsx custom bottom nav.
// This file just passes through to the active screen.
import { Slot } from 'expo-router';

export default function TabsLayout() {
  return <Slot />;
}
