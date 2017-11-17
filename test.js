import test from "ava";
import asynciterable from ".";

test("exports a function", t => {
  t.is(typeof asynciterable, "function");
});
