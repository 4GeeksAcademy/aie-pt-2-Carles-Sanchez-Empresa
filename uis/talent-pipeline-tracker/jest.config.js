/**
 * Jest configuration for TrackFlow Frontend Tests
 */

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Path to the Next.js app
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
};

module.exports = createJestConfig(customJestConfig);