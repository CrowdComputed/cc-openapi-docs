"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { CircleCheck, CircleX, X } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { DynamicCodeBlock } from "./dynamic-codeblock";

// FetchResult 类型定义
type FetchResultType = {
  status: number;
  type: "json" | "html" | "text";
  data: unknown;
};

interface StatusInfo {
  description: string;
  color: string;
  icon: React.ElementType;
}

const statusMap: Record<number, StatusInfo> = {
  400: { description: "Bad Request", color: "text-red-500", icon: CircleX },
  401: {
    description: "Unauthorized",
    color: "text-red-500",
    icon: CircleX,
  },
  403: { description: "Forbidden", color: "text-red-500", icon: CircleX },
  404: {
    description: "Not Found",
    color: "text-fd-muted-foreground",
    icon: CircleX,
  },
  500: {
    description: "Internal Server Error",
    color: "text-red-500",
    icon: CircleX,
  },
};

export function getStatusInfo(status: number): StatusInfo {
  if (status in statusMap) {
    return statusMap[status];
  }

  if (status >= 200 && status < 300) {
    return {
      description: "Successful",
      color: "text-green-500",
      icon: CircleCheck,
    };
  }

  if (status >= 400) {
    return { description: "Error", color: "text-red-500", icon: CircleX };
  }

  return {
    description: "No Description",
    color: "text-fd-muted-foreground",
    icon: CircleX,
  };
}

/**
 * 自定义 ResultDisplay 组件，用于更新请求状态和结果
 */
export function CustomResultDisplay({
  data,
  reset,
}: {
  data: FetchResultType;
  reset?: () => void;
}) {
  const form = useFormContext();
  const body = form.getValues("body");
  console.log(body);

  const statusInfo = useMemo(() => getStatusInfo(data.status), [data.status]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex justify-between items-center">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-fd-foreground">
          <statusInfo.icon className={cn("size-4", statusInfo.color)} />
          {statusInfo.description}
        </div>
        <button
          type="button"
          className={cn(
            buttonVariants({ size: "icon-xs" }),
            "p-0 text-fd-muted-foreground hover:text-fd-accent-foreground [&_svg]:size-3.5",
          )}
          onClick={() => reset?.()}
          aria-label="Dismiss response"
        >
          <X />
        </button>
      </div>
      <p className="text-sm text-fd-muted-foreground">{data.status}</p>
      {data.data !== undefined && (
        <DynamicCodeBlock
          lang={
            typeof data.data === "string" && data.data.length > 50000
              ? "text"
              : data.type
          }
          code={
            typeof data.data === "string"
              ? data.data
              : JSON.stringify(data.data, null, 2)
          }
        />
      )}
    </div>
  );
}
