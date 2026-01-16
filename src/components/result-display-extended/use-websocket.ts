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
 * WebSocket connection and management hook
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

  // Keep the latest references to taskId and getApiConfig
  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  useEffect(() => {
    getApiConfigRef.current = getApiConfig;
  }, [getApiConfig]);

  // Keep the latest reference to onMessage callback
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !websocketUrl) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Use local variables to capture refs, avoiding lint warnings
    const containerRef = messagesContainerRef;
    const countRef = messagesCountRef;
    const messagesArrayRef = messagesRef;
    const statusElementRef = statusRef;

    // Function to update WebSocket status
    const updateStatus = (
      status: string,
      color: string = "text-fd-foreground",
    ) => {
      if (statusElementRef.current) {
        statusElementRef.current.textContent = status;
        statusElementRef.current.className = `text-xs font-medium ${color}`;
      }
    };

    // HTTP function to query task status (called only once)
    const queryTaskStatus = async () => {
      if (!taskIdRef.current) {
        return;
      }

      // Add HTTP query log
      if (containerRef.current) {
        const logElement = createLogElement(
          "http",
          "Query task status",
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
          countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
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

          // Store message and add log
          const dataWithTimestamp = {
            ...message,
            timestamp: Date.now(),
          };
          messagesArrayRef.current.push(dataWithTimestamp);

          // Add message log
          if (containerRef.current) {
            const messageElement = createMessageLogElement(dataWithTimestamp);
            containerRef.current.insertBefore(
              messageElement,
              containerRef.current.firstChild,
            );

            if (countRef.current) {
              countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
            }
          }

          // Call callback function
          onMessageRef.current(message);
        }
      } catch (error) {
        console.error("Failed to query task status:", error);

        // Add error log
        if (containerRef.current) {
          const logElement = createLogElement(
            "http",
            "Failed to query task status",
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
            countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
          }
        }
      }
    };

    // Function to create log entry (unified format)
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

    // Function to create message log entry
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

      // Format JSON data, escape HTML special characters
      const jsonStr = JSON.stringify(msg, null, 2)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      // Create unique ID for hover card
      const hoverCardId = `hover-card-${msg.timestamp}`;

      // Create icon SVG (using FileText icon)
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
          <span class="text-fd-foreground">Task Status: ${msg.status || "unknown"}</span>
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
        updateStatus("Connecting...", "text-fd-muted-foreground");

        // Add connection start log
        if (containerRef.current) {
          const logElement = createLogElement("WS", "Connecting", Date.now(), {
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
            countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
          }
        }

        const ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");

          if (pingTimer.current) {
            clearInterval(pingTimer.current);
          }

          updateStatus("Connected", "text-green-600");

          // Send ping every 5 seconds
          pingTimer.current = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send("ping");
            }
          }, 5000);

          // Add connection success log
          if (containerRef.current) {
            const logElement = createLogElement(
              "WS",
              "Connection established",
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
              countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as Data;
            // Update last received status
            lastStatusRef.current = message.status;
            // Store message to ref, only store Data part, add timestamp as key
            const dataWithTimestamp = {
              ...message,
              timestamp: Date.now(),
            };
            messagesArrayRef.current.push(dataWithTimestamp);

            // Directly manipulate DOM to add message log
            if (containerRef.current) {
              const messageElement = createMessageLogElement(dataWithTimestamp);
              containerRef.current.insertBefore(
                messageElement,
                containerRef.current.firstChild,
              );

              // Update log count
              if (countRef.current) {
                countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
              }
            }

            // Call callback function (using ref to avoid dependency issues)
            onMessageRef.current(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);

          updateStatus("Connection failed", "text-red-600");

          // Add error log
          if (containerRef.current) {
            const logElement = createLogElement(
              "WS",
              "Connection error",
              Date.now(),
              {
                error: String(error),
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
              countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
            }
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed", event);

          if (pingTimer.current) {
            clearInterval(pingTimer.current);
            pingTimer.current = null;
          }

          updateStatus("Connection closed", "text-fd-muted-foreground");

          // Add close log
          if (containerRef.current) {
            const logElement = createLogElement(
              "WS",
              "Connection closed",
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
              countRef.current.textContent = `Logs (${messagesArrayRef.current.length})`;
            }
          }

          // After WebSocket closes, if task is not completed, call HTTP API once to get task status
          // Only query if status is not "finished" or "failed"
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
  }, [
    enabled,
    websocketUrl,
    messagesContainerRef,
    messagesCountRef,
    messagesRef,
    statusRef,
  ]);
}
