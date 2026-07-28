import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";
import { triggerSelectionHaptic } from "@/services/haptics";

export function IconButton({ name, onPress, active, label }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; active?: boolean; label: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => { void triggerSelectionHaptic(); onPress?.(); }}
      className={`h-11 w-11 items-center justify-center rounded-full ${active ? "bg-lime" : "bg-white dark:bg-neutral-800"}`}
    >
      <Ionicons name={name} size={20} color={active ? "#0A0A0A" : "#777C74"} />
    </Pressable>
  );
}
