import { useEffect, useRef } from "react";
import type { Data } from "./types";

interface UseWebSocketOptions {
  websocketUrl?: string;
  enabled: boolean;
  taskId?: string;
  getApiConfig: () => { baseUrl: string; headers: Record<string, string> };
  onMessage: (message: Data) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesCountRef: React.RefObject<HTMLHeadingElement | null>;
  messagesRef: React.MutableRefObject<Array<Data & { timestamp: number }>>;
  statusRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * WebSocket 连接和管理 hook
 */
export function useWebSocket({
  websocketUrl,
  enabled,
  taskId,
  getApiConfig,
  onMessage,
  messagesContainerRef,
  messagesCountRef,
  messagesRef,
  statusRef,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const onMessageRef = useRef(onMessage);
  const taskIdRef = useRef(taskId);
  const getApiConfigRef = useRef(getApiConfig);
  const pingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStatusRef = useRef<Data["status"] | undefined>(undefined);

  // 保持 taskId 和 getApiConfig 的最新引用
  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  useEffect(() => {
    getApiConfigRef.current = getApiConfig;
  }, [getApiConfig]);

  // 保持 onMessage 回调的最新引用
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !websocketUrl) {
      return;
    }

    // 如果已经有连接，先关闭
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 使用局部变量捕获 ref，避免 lint 警告
    const containerRef = messagesContainerRef;
    const countRef = messagesCountRef;
    const messagesArrayRef = messagesRef;
    const statusElementRef = statusRef;

    // 更新 WebSocket 状态的函数
    const updateStatus = (
      status: string,
      color: string = "text-fd-foreground",
    ) => {
      if (statusElementRef.current) {
        statusElementRef.current.textContent = status;
        statusElementRef.current.className = `text-xs font-medium ${color}`;
      }
    };

    // HTTP 查询任务状态函数（只调用一次）
    const queryTaskStatus = async () => {
      if (!taskIdRef.current) {
        return;
      }

      // 添加 HTTP 查询日志
      if (containerRef.current) {
        const logElement = createLogElement(
          "http",
          "查询任务状态",
          Date.now(),
          { taskId: taskIdRef.current },
        );
        containerRef.current.insertBefore(
          logElement,
          containerRef.current.firstChild,
        );
        messagesArrayRef.current.push({
          timestamp: Date.now(),
        } as Data & { timestamp: number });

        if (countRef.current) {
          countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
        }
      }

      try {
        const { baseUrl, headers } = getApiConfigRef.current();
        const url = `${baseUrl}/api/v1/query/status?taskId=${taskIdRef.current}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rootData = (await response.json()) as {
          code: "Success" | "Failed";
          message: string;
          data: Data;
        };

        if (rootData && rootData.code === "Success") {
          const message = rootData.data;

          // 存储消息并添加日志
          const dataWithTimestamp = {
            ...message,
            timestamp: Date.now(),
          };
          messagesArrayRef.current.push(dataWithTimestamp);

          // 添加消息日志
          if (containerRef.current) {
            const messageElement = createMessageLogElement(dataWithTimestamp);
            containerRef.current.insertBefore(
              messageElement,
              containerRef.current.firstChild,
            );

            if (countRef.current) {
              countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
            }
          }

          // 调用回调函数
          onMessageRef.current(message);
        }
      } catch (error) {
        console.error("Failed to query task status:", error);

        // 添加错误日志
        if (containerRef.current) {
          const logElement = createLogElement(
            "http",
            "查询任务状态失败",
            Date.now(),
            { error: String(error) },
          );
          containerRef.current.insertBefore(
            logElement,
            containerRef.current.firstChild,
          );
          messagesArrayRef.current.push({
            timestamp: Date.now(),
          } as Data & { timestamp: number });

          if (countRef.current) {
            countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
          }
        }
      }
    };

    // 创建日志条目的函数（统一格式）
    const createLogElement = (
      type: "status" | "message" | "http" | "WS",
      content: string,
      timestamp: number,
      metadata?: Record<string, unknown>,
    ): HTMLDivElement => {
      const div = document.createElement("div");
      div.className =
        "text-xs font-mono bg-fd-background p-2 rounded border border-fd-border";
      div.setAttribute("data-timestamp", timestamp.toString());
      div.setAttribute("data-type", type);

      const timeStr = new Date(timestamp).toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      let metadataHtml = "";
      if (metadata && Object.keys(metadata).length > 0) {
        metadataHtml = `
          <div class="mt-1 text-fd-muted-foreground text-[10px]">
            ${Object.entries(metadata)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(" | ")}
          </div>
        `;
      }

      div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-fd-foreground">[${type.toUpperCase()}] ${content}</span>
          <span class="text-fd-muted-foreground">${timeStr}</span>
        </div>
        ${metadataHtml}
      `;

      return div;
    };

    // 创建消息日志条目的函数
    const createMessageLogElement = (
      msg: Data & { timestamp: number },
    ): HTMLDivElement => {
      const div = document.createElement("div");
      div.className =
        "text-xs font-mono bg-fd-background p-2 rounded border border-fd-border flex items-center justify-between";
      div.setAttribute("data-timestamp", msg.timestamp.toString());
      div.setAttribute("data-type", "message");

      const timeStr = new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      });

      // 格式化 JSON 数据，转义 HTML 特殊字符
      const jsonStr = JSON.stringify(msg, null, 2)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      // 创建唯一 ID 用于 hover card
      const hoverCardId = `hover-card-${msg.timestamp}`;

      // 创建图标 SVG（使用 FileText 图标）
      const iconSvg = `
        <svg 
          class="w-4 h-4 text-fd-muted-foreground hover:text-fd-foreground cursor-help transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          data-hover-target="${hoverCardId}"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      `;

      div.innerHTML = `
        <div class="flex items-center gap-2 flex-1">
          <span class="font-semibold text-fd-foreground">[MESSAGE]</span>
          <span class="text-fd-muted-foreground">${timeStr}</span>
          <span class="text-fd-foreground">任务状态: ${msg.status || "unknown"}</span>
        </div>
        <div class="relative group">
          ${iconSvg}
          <div id="${hoverCardId}" class="hidden group-hover:block absolute right-0 top-full mt-1 z-50 w-96 max-h-96 overflow-auto bg-fd-popover border border-fd-border rounded-lg shadow-lg p-3">
            <pre class="text-xs font-mono whitespace-pre-wrap">${jsonStr}</pre>
          </div>
        </div>
      `;

      return div;
    };

    const connectWebSocket = () => {
      try {
        updateStatus("连接中...", "text-fd-muted-foreground");

        // 添加开始连接日志
        if (containerRef.current) {
          const logElement = createLogElement("WS", "开始连接", Date.now(), {
            url: websocketUrl,
          });
          containerRef.current.insertBefore(
            logElement,
            containerRef.current.firstChild,
          );
          messagesArrayRef.current.push({
            timestamp: Date.now(),
          } as Data & { timestamp: number });

          if (countRef.current) {
            countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
          }
        }

        const ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");

          if (pingTimer.current) {
            clearInterval(pingTimer.current);
          }

          updateStatus("已连接", "text-green-600");

          // 每 5 秒发送一次 ping
          pingTimer.current = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send("ping");
            }
          }, 5000);

          // 添加连接成功的日志
          if (containerRef.current) {
            const logElement = createLogElement(
              "WS",
              "连接已建立",
              Date.now(),
              { url: websocketUrl },
            );
            containerRef.current.insertBefore(
              logElement,
              containerRef.current.firstChild,
            );
            messagesArrayRef.current.push({
              timestamp: Date.now(),
            } as Data & { timestamp: number });

            if (countRef.current) {
              countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as Data;
            // 更新最后收到的状态
            lastStatusRef.current = message.status;
            // 存储消息到 ref，只存储 Data 部分，添加时间戳作为 key
            const dataWithTimestamp = {
              ...message,
              timestamp: Date.now(),
            };
            messagesArrayRef.current.push(dataWithTimestamp);

            // 直接操作 DOM 添加消息日志
            if (containerRef.current) {
              const messageElement = createMessageLogElement(dataWithTimestamp);
              containerRef.current.insertBefore(
                messageElement,
                containerRef.current.firstChild,
              );

              // 更新日志计数
              if (countRef.current) {
                countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
              }
            }

            // 调用回调函数（使用 ref 避免依赖问题）
            onMessageRef.current(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);

          updateStatus("连接失败", "text-red-600");

          // 添加错误日志
          if (containerRef.current) {
            const logElement = createLogElement("WS", "连接错误", Date.now(), {
              error: String(error),
            });
            containerRef.current.insertBefore(
              logElement,
              containerRef.current.firstChild,
            );
            messagesArrayRef.current.push({
              timestamp: Date.now(),
            } as Data & { timestamp: number });

            if (countRef.current) {
              countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
            }
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed", event);

          if (pingTimer.current) {
            clearInterval(pingTimer.current);
            pingTimer.current = null;
          }

          updateStatus("连接已关闭", "text-fd-muted-foreground");

          // 添加关闭日志
          if (containerRef.current) {
            const logElement = createLogElement(
              "WS",
              "连接已关闭",
              Date.now(),
              {
                code: event.code,
                reason: event.reason || "N/A",
                wasClean: event.wasClean,
              },
            );
            containerRef.current.insertBefore(
              logElement,
              containerRef.current.firstChild,
            );
            messagesArrayRef.current.push({
              timestamp: Date.now(),
            } as Data & { timestamp: number });

            if (countRef.current) {
              countRef.current.textContent = `日志 (${messagesArrayRef.current.length})`;
            }
          }

          // WebSocket 关闭后，如果任务没有完成，调用一次 HTTP 接口获取任务状态
          // 只有当状态不是 "finished" 或 "failed" 时才需要查询
          if (
            taskIdRef.current &&
            enabled &&
            lastStatusRef.current !== "finished" &&
            lastStatusRef.current !== "failed"
          ) {
            queryTaskStatus();
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // ref 对象本身是稳定的，但为了满足 lint 规则，将它们添加到依赖数组
    // 实际上这些 ref 对象在组件生命周期内不会变化
    // taskId 通过 taskIdRef 访问，不需要作为依赖
  }, [
    enabled,
    websocketUrl,
    messagesContainerRef,
    messagesCountRef,
    messagesRef,
    statusRef,
  ]);
}
