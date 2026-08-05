import { describe, expect, it } from "vitest";

import { SeededRandom } from "@/src/sim/prng";

describe("SeededRandom", () => {
  it("repeats the same sequence and serialized state", () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);

    const firstValues = Array.from({ length: 5 }, () => first.next());
    const secondValues = Array.from({ length: 5 }, () => second.next());

    expect(firstValues).toEqual(secondValues);
    expect(firstValues.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(first.state).toBe(second.state);
  });
});
