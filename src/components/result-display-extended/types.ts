export interface Root {
  code: "Success" | "Failed";
  message: string;
  data: Data;
}

export interface Data {
  taskId?: string;
  status?: "finished" | "generating" | "failed" | "waiting";
  outputs?: Output[];
  balance: number;
  spend: number;
  websocket?: string;
}

export interface Output {
  outputId: string;
  status: "finished" | "generating" | "failed" | "waiting";
  urls?: string[];
  estimateMs: number;
  queueOrder: number;
  startTime: number;
  endTime: number;
}

export type MediaType = "image" | "video" | "audio" | "other";
