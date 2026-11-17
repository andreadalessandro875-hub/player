import * as Haptics from 'expo-haptics';

// Vibrazioni leggere come nelle app di sistema. Gli errori vengono ignorati (es. simulatore).
export const tap = () => { Haptics.selectionAsync().catch(() => {}); };
export const impact = (strong = false) => {
  Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
export const success = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};
