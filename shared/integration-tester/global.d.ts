import { TestManager } from "./src/runtime/testManager.js";
declare global {
  const __TEST_MANAGER__: TestManager;
  const __VM_THREAD__: number;
}
