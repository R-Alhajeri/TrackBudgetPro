module.exports = {
  preset: "react-native",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  testEnvironment: "jsdom",
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation|@testing-library|expo(nent)?|@expo|unimodules|sentry-expo|native-base|react-clone-referenced-element|react-native-svg|react-native-vector-icons)/)",
  ],
};
