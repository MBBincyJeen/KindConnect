module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "services/**/*.js",
    "middleware/**/*.js",
    "helpers/**/*.js",
    "!**/node_modules/**",
  ],
  testTimeout: 15000,
  forceExit: true,
  detectOpenHandles: true,
};
