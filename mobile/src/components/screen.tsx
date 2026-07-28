import { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <SafeAreaView
      className={`w-full flex-1 bg-canvas dark:bg-ink ${className}`}
      style={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {children}
    </SafeAreaView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-end px-5 pb-4 pt-3">
      <View className="min-w-0 flex-1">
        {eyebrow ? (
          <Text
            className="mb-1 text-xs font-bold uppercase tracking-[2px] text-green"
            maxFontSizeMultiplier={1.3}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          className="text-[32px] font-black tracking-[-1px] text-ink dark:text-white"
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </Text>
      </View>
      {action ? <View className="ml-3 shrink-0">{action}</View> : null}
    </View>
  );
}
