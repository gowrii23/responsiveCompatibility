export const DEVICE_PRESETS = [
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    width: 393,
    height: 852,
    type: "phone",
    pixelRatio: 3
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    width: 430,
    height: 932,
    type: "phone",
    pixelRatio: 3
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    width: 375,
    height: 667,
    type: "phone",
    pixelRatio: 2
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    width: 412,
    height: 915,
    type: "phone",
    pixelRatio: 2.625
  },
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    width: 360,
    height: 780,
    type: "phone",
    pixelRatio: 3
  },
  {
    id: "ipad-mini",
    name: "iPad mini",
    width: 744,
    height: 1133,
    type: "tablet",
    pixelRatio: 2
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11\"",
    width: 834,
    height: 1194,
    type: "tablet",
    pixelRatio: 2
  },
  {
    id: "ipad-pro",
    name: "iPad Pro",
    width: 1024,
    height: 1366,
    type: "tablet",
    pixelRatio: 2
  },
  {
    id: "nest-hub",
    name: "Nest Hub",
    width: 1024,
    height: 600,
    type: "tablet",
    pixelRatio: 2
  },
  {
    id: "laptop",
    name: "Laptop",
    width: 1280,
    height: 800,
    type: "desktop",
    pixelRatio: 1
  },
  {
    id: "desktop",
    name: "Desktop",
    width: 1440,
    height: 900,
    type: "desktop",
    pixelRatio: 1
  },
  {
    id: "full-hd",
    name: "Full HD",
    width: 1920,
    height: 1080,
    type: "desktop",
    pixelRatio: 1
  },
  {
    id: "custom",
    name: "Custom",
    width: 390,
    height: 844,
    type: "phone",
    pixelRatio: 2
  }
];

export const DEFAULT_LEFT = "iphone-15-pro";
export const DEFAULT_RIGHT = "ipad-pro";

export function getDevice(id) {
  return DEVICE_PRESETS.find((d) => d.id === id) || DEVICE_PRESETS[0];
}

export function viewportSize(device, orientation) {
  const portrait = orientation === "portrait";
  const isLandscapeNative = device.width > device.height;
  let width = device.width;
  let height = device.height;
  if (isLandscapeNative) {
    width = Math.max(device.width, device.height);
    height = Math.min(device.width, device.height);
  }
  if (portrait) {
    return {
      width: Math.min(width, height),
      height: Math.max(width, height)
    };
  }
  return {
    width: Math.max(width, height),
    height: Math.min(width, height)
  };
}
