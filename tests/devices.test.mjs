import { getDevice, viewportSize } from "../viewer/devices.js";
import assert from "node:assert/strict";

const phone = getDevice("iphone-15-pro");
const portrait = viewportSize(phone, "portrait");
const landscape = viewportSize(phone, "landscape");

assert.equal(portrait.width, 393);
assert.equal(portrait.height, 852);
assert.equal(landscape.width, 852);
assert.equal(landscape.height, 393);

const ipad = getDevice("ipad-pro");
const ipadLandscape = viewportSize(ipad, "landscape");
assert.equal(ipadLandscape.width, 1366);
assert.equal(ipadLandscape.height, 1024);

console.log("devices.test.mjs ok");
