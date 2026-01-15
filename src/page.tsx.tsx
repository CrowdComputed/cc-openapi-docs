import { redirect } from "next/navigation";
import { i18n } from "@/lib/i18n";

// 根路径重定向到默认语言
export default function RootPage() {
  redirect(`/${i18n.defaultLanguage}`);
}
