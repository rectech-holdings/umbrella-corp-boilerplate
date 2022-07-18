export type TestFn = (() => void) | (() => Promise<void>);
export type Test = {
  description: string[]; //Ordered from highest suite to the test description itself
  fn: TestFn;
  flag?: Flag;
};
export type Flag = "skip" | "only" | "todo";
