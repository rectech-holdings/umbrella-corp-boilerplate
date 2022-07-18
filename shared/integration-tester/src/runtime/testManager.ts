import { TestFn, Test } from "./types.js";
import _ from "lodash";
import { deferred } from "../utils/deferred.js";

export class TestManager {
  private tests: Test[] = [];
  private allTestsCollectedPromise = deferred<Test[]>();

  addTest(p: Test) {
    this.tests.push(p);
  }

  notifyHasAddedAllTests() {
    this.allTestsCollectedPromise.resolve(this.tests);
  }

  onceHasAddedAllTests() {
    return this.allTestsCollectedPromise;
  }

  // async executeTests() {
  //   if (this.hasExecutedTests) {
  //     throw new Error("Tests may only be executed once!");
  //   }

  //   const results: ResultObj = {};
  //   for (let i = 0; i < this.tests.length; i++) {
  //     const test = this.tests[i]!;
  //     if (test.flag) {
  //       _.set(results, test.description, {
  //         result: test.flag,
  //         time: 0,
  //       });
  //     } else {
  //     }
  //     try {
  //       await test.fn();
  //     } catch (e) {}
  //   }
  // }
}
