const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "app/api/**/*.ts",
    "components/**/*.{ts,tsx}",
    "lib/**/*.ts",
    "!**/*.d.ts",
  ],
};

module.exports = createJestConfig(config);
