import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("bizora", {
  platform: process.platform,
});