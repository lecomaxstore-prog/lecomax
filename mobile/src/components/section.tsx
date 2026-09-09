import { msg, useLocale } from "@/i18n";
import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

export function Section({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  useLocale();
  return (
    <View className="mt-9">
      <View className="mb-4 flex-row items-end justify-between px-5">
        <View>
          {subtitle ? <Text className="mb-1 text-[11px] font-bold uppercase tracking-[2px] text-green">{subtitle}</Text> : null}
          <Text className="text-2xl font-black tracking-tight text-ink dark:text-white">{title}</Text>
        </View>
        <Text className="text-xs font-bold text-muted">{msg("section.viewAll")}</Text>
      </View>
      {children}
    </View>
  );
}
