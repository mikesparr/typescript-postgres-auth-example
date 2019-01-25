module.exports = {
	globals: {
		"ts-jest": {
			tsConfig: "tsconfig.json"
		},
		"sharedTestData": {}
	},
	moduleFileExtensions: [
		"ts",
		"js"
	],
	transform: {
		"^.+\\.(ts|tsx)$": "ts-jest"
	},
	testMatch: [
		"**/__tests__/**/*.test.(ts|js)"
	],
	testEnvironment: "node",
  setupTestFrameworkScriptFile: "./src/__tests__/setup.ts",
  verbose: true,
  testURL: "http://localhost:3000/",
};
