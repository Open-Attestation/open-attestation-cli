module.exports = {
  coverageDirectory: "coverage",
  watchPathIgnorePatterns: ["<rootDir>/src/__tests__/fixture"],
  testPathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/dist"],
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  testTimeout: 20000,
  testEnvironment: "node",
  moduleNameMapper: {},
};
